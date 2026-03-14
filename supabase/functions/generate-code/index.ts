import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";
const MODEL = "claude-sonnet-4-6";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    console.log("Using model:", MODEL);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { designImageUrl, sectionType, projectContext, designSystem, designTokens, previousSections, sectionTitle } = await req.json();

        if (!designImageUrl) {
            throw new Error("Missing designImageUrl");
        }

        // Fetch image and convert to base64
        const imageResponse = await fetch(designImageUrl);
        if (!imageResponse.ok) throw new Error("Failed to fetch design image");

        const imageBuffer = await imageResponse.arrayBuffer();
        const uint8 = new Uint8Array(imageBuffer);
        let binary = "";
        for (let i = 0; i < uint8.byteLength; i++) {
            binary += String.fromCharCode(uint8[i]);
        }
        const base64Image = btoa(binary);
        const match = imageResponse.headers.get("content-type")?.match(/image\/(jpeg|png|webp|gif)/);
        const mediaType = match ? match[0] : "image/jpeg";

        // Build design tokens context
        const tk = designTokens || {};
        const ds = designSystem || {};
        let tokenBlock = "";
        if (Object.keys(tk).length > 0 || Object.keys(ds).length > 0) {
            tokenBlock = `
DESIGN SYSTEM TOKENS (use these exact values):
- Primary color: ${tk.primaryColor || ds.primaryColor || "use from image"}
- Accent color: ${tk.accentColor || ds.accentColor || "use from image"}
- Background: ${tk.backgroundStyle || "dark"}
- Gradient: ${tk.gradientStyle || "none"}
- Border radius: ${tk.borderRadius || ds.borderRadius || "8px"}
- Button style: ${tk.buttonStyle || "rounded primary"}
- Font style: ${tk.fontStyle || ds.headingFont || "modern sans-serif"}
- Spacing: ${tk.spacingScale || "generous modern SaaS"}
- Container width: ${tk.containerWidth || ds.containerWidth || "1200px"}
${tk.cardStyle ? `- Card style: ${tk.cardStyle}` : ""}
${tk.iconStyle ? `- Icon style: ${tk.iconStyle}` : ""}
${tk.gridStyle ? `- Grid style: ${tk.gridStyle}` : ""}`;
        }

        // Build previous sections context
        let prevBlock = "";
        if (previousSections && previousSections.length > 0) {
            const summaries = previousSections.map(
                (s: any) => `- ${s.sectionName}: ${s.componentSummary || "completed"}${s.primaryColorUsed ? `, uses ${s.primaryColorUsed}` : ""}${s.buttonStyleUsed ? `, buttons: ${s.buttonStyleUsed}` : ""}`
            );
            prevBlock = `
PREVIOUSLY GENERATED SECTIONS (match their visual style):
${summaries.join("\n")}`;
        }

        // Extract brand name from project context
        const brandName = projectContext?.split(" ")[0] || "the brand";

        const systemPrompt = `CRITICAL TEXT RULES — FOLLOW WITHOUT EXCEPTION:

1. NEVER copy any text directly from the design image
2. ALL text in the design image may be AI-generated gibberish — treat it as layout reference ONLY
3. Write your own real, meaningful UI copy based on:
   - The project description: ${projectContext || "not provided"}
   - The section type: ${sectionType || "general"}
   - The brand name: ${brandName}
4. Common corrections to make:
   - Random letters → Proper headlines
   - Gibberish button text → Clear CTAs like "Get Started", "Learn More", "View Projects"
   - Fake company names → Use actual brand name: ${brandName}
   - Nonsense nav items → Real navigation like "Home", "About", "Projects", "Contact"
5. Typography hierarchy must be meaningful:
   - H1: Main value proposition (clear and compelling)
   - H2: Section headline (descriptive)
   - P: Real descriptive body text (2-3 sentences minimum)
   - Button: Action-oriented CTA text
6. If you see text in the image that looks wrong, it IS wrong. Fix it with professional UI copy.

---

You are an expert frontend developer. Recreate this website section design as a clean, production-ready React component.

Rules:
- Output ONLY the raw JSX code, no markdown blocks, no explanation.
- Use Tailwind CSS for ALL styling. Use arbitrary values if needed (e.g. bg-[#1a1a1a]).
- Standard functional React component with default export.
- Do NOT use Next.js components. Use standard <img> and <a> tags.
- Use lucide-react for icons. ONLY valid names: ArrowRight, ChevronDown, Check, Star, Mail, Shield, etc.
- NEVER use prefixes Hi, Ai, Fa, Bs, Io.
- Include hover effects and smooth transitions.
- Use semantic HTML.
- For placeholder images use <img> with placehold.co URLs.
- Do NOT include "use client" directive.
- Root element: section or div, never html/body.

RESPONSIVE DESIGN (REQUIRED):
- Mobile-first approach
- Use sm: for 640px+, md: for 768px+, lg: for 1024px+, xl: for 1280px+
- Stack layouts vertically on mobile, side-by-side on desktop
- Adjust font sizes: text-2xl sm:text-3xl lg:text-5xl for headings
- Adjust padding: px-4 sm:px-6 lg:px-8
- Grid columns: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
${tokenBlock}
${prevBlock}`;

        const userContent = [
            {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64Image },
            },
            {
                type: "text",
                text: `Convert this ${sectionTitle || sectionType || "website section"} design into a React component using Tailwind CSS.${projectContext ? ` Project: ${projectContext}` : ""}

REMEMBER: Do NOT copy text from the image. Write real, meaningful UI copy. Use the brand name "${brandName}".

Match the layout, colors, typography, and spacing. Use the design tokens above for exact colors and styles. Output ONLY the raw JSX component code.`,
            },
        ];

        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": CLAUDE_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: "user", content: userContent }],
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("Claude API error:", err);
            throw new Error(`Claude API failed: ${res.status}`);
        }

        const data = await res.json();
        let code = data.content?.[0]?.text || "";
        code = code.replace(/^```(tsx|jsx|javascript|typescript|react)\n?/i, "").replace(/^```\n?/i, "").replace(/\n?```$/i, "").trim();

        // --- CONTINUITY CHECK ---
        if (previousSections && previousSections.length > 0 && (designTokens || designSystem)) {
            console.log("[generate-code] Running continuity check...");

            try {
                const continuityPrompt = `You are a senior UI consistency reviewer. Review this React component for design system consistency.

ESTABLISHED DESIGN SYSTEM:
Primary color: ${tk.primaryColor || ds.primaryColor || "not set"}
Accent color: ${tk.accentColor || ds.accentColor || "not set"}
Background: ${tk.backgroundStyle || "dark"}
Border radius: ${tk.borderRadius || ds.borderRadius || "8px"}
Button style: ${tk.buttonStyle || "rounded primary"}
Font style: ${tk.fontStyle || ds.headingFont || "sans-serif"}
Spacing scale: ${tk.spacingScale || "generous"}
Container width: ${tk.containerWidth || ds.containerWidth || "1200px"}

PREVIOUSLY GENERATED SECTIONS:
${previousSections.map((s: any) => s.componentSummary || s.sectionName).join("\n")}

COMPONENT TO REVIEW:
${code}

Check for: COLOR_MISMATCH, BUTTON_INCONSISTENCY, FONT_MISMATCH, SPACING_DRIFT, BORDER_RADIUS_MISMATCH, LAYOUT_DISCONNECT.

Return ONLY JSON:
{
  "hasIssues": true/false,
  "issues": [{"type": "...", "description": "...", "originalCode": "...", "fixedCode": "..."}],
  "correctedComponent": "full corrected code if hasIssues, null otherwise"
}`;

                const continuityRes = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": CLAUDE_API_KEY,
                        "anthropic-version": "2023-06-01",
                    },
                    body: JSON.stringify({
                        model: MODEL,
                        max_tokens: 4096,
                        system: "You are a senior UI consistency reviewer. Return ONLY valid JSON, no explanation.",
                        messages: [{ role: "user", content: continuityPrompt }],
                    }),
                });

                if (continuityRes.ok) {
                    const cData = await continuityRes.json();
                    let cRaw = cData.content?.[0]?.text || "{}";
                    cRaw = cRaw.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();

                    const review = JSON.parse(cRaw);

                    if (review.hasIssues && review.correctedComponent) {
                        console.log("[generate-code] Continuity issues found and fixed:", review.issues?.length);
                        // Clean the corrected code
                        let corrected = review.correctedComponent;
                        corrected = corrected.replace(/^```(tsx|jsx|javascript|typescript|react)\n?/i, "").replace(/^```\n?/i, "").replace(/\n?```$/i, "").trim();
                        code = corrected;
                    } else if (review.hasIssues) {
                        console.log("[generate-code] Continuity issues found but no corrected code provided");
                    } else {
                        console.log("[generate-code] Continuity check passed — no issues");
                    }
                }
            } catch (continuityErr) {
                console.error("[generate-code] Continuity check failed (using original code):", continuityErr);
                // Failsafe: return original code
            }
        }

        return new Response(
            JSON.stringify({ code, sectionType, designImageUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("generate-code error:", error);
        const err = error as Error;
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
