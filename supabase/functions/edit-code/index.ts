import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";
const MODEL = "claude-sonnet-4-6";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractCodeFromResponse(text: string): string {
    // Strategy 1: Find fenced code block
    const codeBlockMatch = text.match(/```(?:tsx|jsx|javascript|typescript|react)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
        return codeBlockMatch[1].trim();
    }

    // Strategy 2: Find code by import/export statements
    if (text.includes("export default") || text.includes("import ")) {
        const importIdx = text.indexOf("import ");
        const exportIdx = text.indexOf("export ");
        const codeStart = Math.min(
            importIdx >= 0 ? importIdx : Infinity,
            exportIdx >= 0 ? exportIdx : Infinity
        );
        if (codeStart < Infinity) {
            return text.slice(codeStart).trim();
        }
    }

    // Strategy 3: Return as-is (might be pure code)
    return text.replace(/^```\n?/i, "").replace(/\n?```$/i, "").trim();
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { existingCode, editPrompt, sectionType, projectContext, designSystem, sectionTitle } = await req.json();

        if (!existingCode || !editPrompt) {
            throw new Error("Missing existingCode or editPrompt");
        }

        const systemPrompt = `You are an expert React developer. You will modify an existing React + Tailwind CSS component based on the user's instructions.

RULES:
1. Keep the existing component structure and design unless the user specifically asks to change it
2. Apply the requested changes precisely
3. Maintain all existing styling, animations, and responsiveness
4. Use Tailwind CSS for all styling
5. Use lucide-react for icons
6. Do NOT add "use client" or Next.js-specific code
7. Return the COMPLETE updated component code
8. The component must have a default export
9. Output your response as a code block wrapped in \`\`\`tsx ... \`\`\``;

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
                messages: [{
                    role: "user",
                    content: `Here is the current ${sectionTitle || sectionType || "React"} component:\n\n\`\`\`tsx\n${existingCode}\n\`\`\`\n\nPlease apply this change: ${editPrompt}\n\nReturn the complete updated component wrapped in a \`\`\`tsx code block.`,
                }],
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("[edit-code] Claude API error:", err);
            throw new Error(`Claude API failed: ${res.status}`);
        }

        const data = await res.json();
        const rawResponse = data.content?.[0]?.text || existingCode;

        // Extract ONLY the code from Claude's response
        const code = extractCodeFromResponse(rawResponse);

        console.log(`[edit-code] Edited ${sectionTitle || sectionType} — ${code.length} chars`);

        return new Response(
            JSON.stringify({ code }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[edit-code] Error:", error);
        const err = error as Error;
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
