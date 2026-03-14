import { supabase } from "@/lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- Auth Error ---

const TOKEN_REFRESH_BUFFER_MS = 60_000; // Refresh 60s before expiry
const DB_TIMEOUT_MS = 10_000;
const EDGE_FUNCTION_TIMEOUT_MS = 120_000; // AI calls can be slow
const FULLPAGE_CODE_TIMEOUT_MS = 180_000; // Full-page code gen needs more time

export class AuthError extends Error {
    public statusCode: number;
    constructor(message: string, statusCode: number = 401) {
        super(message);
        this.name = "AuthError";
        this.statusCode = statusCode;
    }
}

// --- Session Management ---

async function getFreshSession() {
    let { data: { session } } = await supabase.auth.getSession();

    // Proactive refresh: refresh if token expires within the buffer window
    const isExpiringSoon = session?.expires_at
        && (session.expires_at * 1000 - Date.now()) < TOKEN_REFRESH_BUFFER_MS;

    if (!session || isExpiringSoon) {
        console.log("[auth] Session missing or expiring soon, refreshing...");
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
            console.error("[auth] Token refresh failed:", error.message);
            // If refresh fails and we had no session at all, this is unrecoverable
            if (!session) {
                throw new AuthError("Session expired. Please log in again.", 401);
            }
            // If we had a session but refresh failed, use the existing one (it may still work)
        } else {
            session = data.session;
        }
    }

    return session;
}

async function forceRefreshSession() {
    console.log("[auth] Force-refreshing session after 401...");
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
        throw new AuthError("Session expired. Please log in again.", 401);
    }
    return data.session;
}

function buildHeaders(token: string, includePrefer = false) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
    };
    if (includePrefer) {
        headers['Prefer'] = 'return=representation';
    }
    return headers;
}

// --- Fetch with Timeout ---

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s: ${url}`);
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchWithAuthRetry(
    url: string,
    options: RequestInit,
    timeoutMs: number,
    includePrefer = false
): Promise<Response> {
    const session = await getFreshSession();
    const token = session?.access_token || SUPABASE_ANON_KEY;

    let headers = buildHeaders(token, includePrefer);

    let response: Response;
    try {
        response = await fetchWithTimeout(url, { ...options, headers: { ...headers, ...options?.headers } }, timeoutMs);
    } catch (error: any) {
        // If it's an AbortError from our timeout, throw it immediately
        if (error instanceof Error && error.message.includes("timed out")) throw error;

        // Supabase Edge Functions (and sometimes PostgREST) omit CORS headers on 401 Unauthorized.
        // This causes the browser to throw a TypeError ("Failed to fetch") instead of returning a 401 Response.
        // If we get a TypeError, we safely assume it *might* be an expired token and force a retry.
        if (error.name === "TypeError" || (error.message && error.message.toLowerCase().includes("fetch"))) {
            console.warn(`[fetchWithAuthRetry] CORS/Network TypeError on ${url}. Assumed 401.`);
            response = new Response("CORS Error - Assumed 401", { status: 401 });
        } else {
            throw error;
        }
    }

    if (response.status === 401) {
        let freshSession;
        try {
            freshSession = await forceRefreshSession();
        } catch (refreshErr) {
            console.error(`[fetchWithAuthRetry] forceRefreshSession failed:`, refreshErr);
            throw refreshErr;
        }

        headers = buildHeaders(freshSession.access_token, includePrefer);

        response = await fetchWithTimeout(url, { ...options, headers: { ...headers, ...options?.headers } }, timeoutMs);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                const errorText = await response.text().catch(() => "");
                throw new AuthError(`Authentication failed on retry: ${errorText}`, response.status);
            }
        }
    }

    return response;
}

// --- DB Fetch with Retry-on-401 ---

async function dbFetch(path: string, options?: RequestInit) {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;

    const response = await fetchWithAuthRetry(url, options || {}, DB_TIMEOUT_MS, true);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[dbFetch] ${options?.method || 'GET'} ${path} failed:`, response.status, errorText);
        throw new Error(`Database error: ${response.status} ${errorText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// --- Edge Functions with Retry-on-401 ---

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
    const url = `${SUPABASE_URL}/functions/v1/${name}`;
    console.log(`[callEdgeFunction] Calling ${name}...`);

    const response = await fetchWithAuthRetry(url, {
        method: 'POST',
        body: JSON.stringify(body),
    }, EDGE_FUNCTION_TIMEOUT_MS, false);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge function ${name} failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`[callEdgeFunction] ${name} succeeded`);
    return data;
}

// --- API Functions ---

// --- Full-Page Design Approach ---

export async function enhancePrompt(prompt: string, projectContext?: string, businessName?: string) {
    return callEdgeFunction("enhance-prompt", { prompt, projectContext, businessName });
}

export async function generateDesigns(prompt: string, businessContext?: string, count = 3) {
    return callEdgeFunction("generate-designs", { prompt, businessContext, count });
}

export async function generateFullPageCode(
    designImageUrl: string,
    projectContext?: string,
    businessName?: string,
    businessDescription?: string,
    userAnswers?: Record<string, string>
) {
    // Use longer timeout for full-page code generation
    const url = `${SUPABASE_URL}/functions/v1/generate-fullpage-code`;
    console.log(`[callEdgeFunction] Calling generate-fullpage-code...`);

    const response = await fetchWithAuthRetry(url, {
        method: 'POST',
        body: JSON.stringify({ designImageUrl, projectContext, businessName, businessDescription, userAnswers }),
    }, FULLPAGE_CODE_TIMEOUT_MS, false);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge function generate-fullpage-code failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`[callEdgeFunction] generate-fullpage-code succeeded`);
    return data;
}

export async function fixCode(code: string, error: string, sectionType?: string, sectionTitle?: string, projectContext?: string) {
    return callEdgeFunction("fix-code", { code, error, sectionType, sectionTitle, projectContext });
}

// --- Legacy per-section functions (kept for backward compatibility) ---

export async function generateCode(designImageUrl: string, sectionType: string, projectContext?: string, designSystem?: any, designTokens?: any, previousSections?: any[], sectionTitle?: string) {
    return callEdgeFunction("generate-code", { designImageUrl, sectionType, projectContext, designSystem, designTokens, previousSections, sectionTitle });
}

export async function editCode(existingCode: string, editPrompt: string, sectionType: string, projectContext?: string, designSystem?: any, sectionTitle?: string) {
    return callEdgeFunction("edit-code", { existingCode, editPrompt, sectionType, projectContext, designSystem, sectionTitle });
}

export async function generateDesignSystem(prompt: string, answers: Record<string, string>) {
    return callEdgeFunction("generate-design-system", { prompt, answers });
}

export async function evaluateDesigns(designs: any[], designSystem?: any, sectionType?: string, projectDescription?: string) {
    return callEdgeFunction("evaluate-designs", { designs, designSystem, sectionType, projectDescription });
}

export async function extractDesignTokens(designImageUrl: string, designSystem?: any, existingTokens?: any) {
    return callEdgeFunction("extract-design-tokens", { designImageUrl, designSystem, existingTokens });
}

export async function generateAsset(prompt: string, assetType = "image", hasBackground = true) {
    return callEdgeFunction("generate-asset", { prompt, assetType, hasBackground });
}

export async function generateQuestions(prompt: string) {
    return callEdgeFunction("generate-questions", { prompt });
}

export async function planSections(prompt: string, answers: Record<string, string>) {
    return callEdgeFunction("plan-sections", { prompt, answers });
}

// --- Database Operations ---

export async function createProject(title: string, userId: string, description?: string) {
    console.log("[createProject] Creating project for user:", userId);
    const data = await dbFetch("projects?select=*", {
        method: 'POST',
        body: JSON.stringify({ title, description, status: "planning", user_id: userId }),
    });
    const project = Array.isArray(data) ? data[0] : data;
    console.log("[createProject] Project created successfully:", project.id);
    return project;
}

export async function getUserProjects() {
    return dbFetch("projects?select=id,title,status,description,updated_at,created_at,thumbnail_url,is_starred&order=updated_at.desc");
}

export async function getProject(projectId: string) {
    const data = await dbFetch(
        `projects?select=*,project_sections(*,section_designs(*))&id=eq.${projectId}`
    );
    return Array.isArray(data) ? data[0] : data;
}

export async function deleteProject(projectId: string) {
    await dbFetch(`projects?id=eq.${projectId}`, { method: 'DELETE' });
}

export async function updateProject(projectId: string, updates: Record<string, unknown>) {
    const data = await dbFetch(`projects?id=eq.${projectId}&select=*`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
    return Array.isArray(data) ? data[0] : data;
}

export async function toggleProjectStar(projectId: string, isStarred: boolean) {
    return updateProject(projectId, { is_starred: isStarred });
}

export async function createProjectSections(projectId: string, sections: { section_type: string; section_title: string; sort_order: number }[]) {
    const rows = sections.map((s) => ({ ...s, project_id: projectId }));
    return dbFetch("project_sections?select=*", {
        method: 'POST',
        body: JSON.stringify(rows),
    });
}

export async function updateSection(sectionId: string, updates: Record<string, unknown>) {
    const data = await dbFetch(`project_sections?id=eq.${sectionId}&select=*`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
    return Array.isArray(data) ? data[0] : data;
}

export async function saveSectionDesigns(sectionId: string, designs: { image_url: string; prompt: string }[]) {
    // Clear old designs
    await dbFetch(`section_designs?section_id=eq.${sectionId}`, { method: 'DELETE' });
    // Insert new designs
    const rows = designs.map((d) => ({ ...d, section_id: sectionId }));
    return dbFetch("section_designs?select=*", {
        method: 'POST',
        body: JSON.stringify(rows),
    });
}

export async function selectDesign(designId: string, sectionId: string) {
    // Unselect all for this section
    await dbFetch(`section_designs?section_id=eq.${sectionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_selected: false }),
    });
    // Select the chosen one
    await dbFetch(`section_designs?id=eq.${designId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_selected: true }),
    });
}

export async function addMessage(projectId: string, role: string, content: string, messageType = "chat") {
    const data = await dbFetch("messages?select=*", {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, role, content, message_type: messageType }),
    });
    return Array.isArray(data) ? data[0] : data;
}

export async function getMessages(projectId: string) {
    return dbFetch(`messages?project_id=eq.${projectId}&select=*&order=created_at.asc`);
}

// --- Credits ---

export async function deductCredits(amount: number) {
    const url = `${SUPABASE_URL}/rest/v1/rpc/deduct_credits`;

    const response = await fetchWithAuthRetry(url, {
        method: 'POST',
        body: JSON.stringify({ amount }),
    }, DB_TIMEOUT_MS, true);

    if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes("no rows") || errorText.includes("Insufficient")) {
            throw new Error("Insufficient credits");
        }
        throw new Error(`Credits error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (data === null || data === undefined) {
        throw new Error("Insufficient credits");
    }
    return data as number;
}

// --- GitHub ---

const GITHUB_CLIENT_ID = "Ov23lik1HgZo7pr2gQok";

export function connectGitHub() {
    const redirectUri = `${window.location.origin}/github/callback`;
    const scope = "repo,read:user,user:email";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
}

export async function saveGitHubToken(token: string, username: string, userId: string) {
    // Get current profile
    const profiles = await dbFetch(`profiles?id=eq.${userId}&select=api_keys`);
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;

    await dbFetch(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
            api_keys: { ...profile?.api_keys, github_token: token, github_username: username },
        }),
    });
}

export async function disconnectGitHub(userId: string) {
    const profiles = await dbFetch(`profiles?id=eq.${userId}&select=api_keys`);
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;

    const keys = { ...profile?.api_keys };
    delete keys.github_token;
    delete keys.github_username;

    await dbFetch(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ api_keys: keys }),
    });
}

export async function getGitHubUser() {
    return callEdgeFunction("github-sync", { action: "get-user" });
}

export async function getGitHubOrgs() {
    return callEdgeFunction("github-sync", { action: "get-orgs" });
}

export async function pushToGitHub(projectId: string, repoName: string, isPrivate: boolean, description?: string) {
    return callEdgeFunction("github-sync", {
        action: "create-repo",
        projectId,
        repoName,
        isPrivate,
        description,
    });
}

export async function syncGitHub(projectId: string) {
    return callEdgeFunction("github-sync", { action: "sync", projectId });
}

// Re-export supabase for auth-only usage (login/signup/signout)
export { supabase };
