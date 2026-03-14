import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";
const MODEL = "claude-sonnet-4-6";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { code, error, sectionType, sectionTitle, projectContext } = await req.json();

        if (!code || !error) {
            throw new Error("Missing code or error");
        }

        const systemPrompt = `You are a React code fixer. You receive broken React + Tailwind CSS code along with the error message. Fix the syntax errors and return ONLY the corrected code. Do not wrap in markdown. Do not explain. Just return the fixed, working code.

Rules:
- Fix the syntax error described in the error message
- Keep the component logic, styling, and structure identical
- Ensure valid JSX syntax
- Ensure all brackets, parentheses, and quotes are properly matched
- Ensure the component has a default export
- Do NOT add "use client"
- Use lucide-react for any icons
- Return ONLY the fixed code, nothing else`;

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
                    content: `Fix this ${sectionTitle || sectionType || "React"} component. It has this error:\n\n${error}\n\nBroken code:\n\`\`\`tsx\n${code}\n\`\`\`\n\nReturn ONLY the fixed code.`,
                }],
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("[fix-code] Claude API error:", err);
            throw new Error(`Claude API failed: ${res.status}`);
        }

        const data = await res.json();
        let fixedCode = data.content?.[0]?.text || code;

        // Extract code — Claude often adds explanation text before/after the code block
        // Strategy: find the code block in the response and extract ONLY the code
        const codeBlockMatch = fixedCode.match(/```(?:tsx|jsx|javascript|typescript|react)?\n?([\s\S]*?)```/);
        if (codeBlockMatch) {
            // Found a fenced code block — extract just the code
            fixedCode = codeBlockMatch[1].trim();
        } else if (fixedCode.includes("export default") || fixedCode.includes("import ")) {
            // No code block but response looks like code — strip any leading text
            const importIdx = fixedCode.indexOf("import ");
            const exportIdx = fixedCode.indexOf("export ");
            const codeStart = Math.min(
                importIdx >= 0 ? importIdx : Infinity,
                exportIdx >= 0 ? exportIdx : Infinity
            );
            if (codeStart < Infinity) {
                fixedCode = fixedCode.slice(codeStart).trim();
            }
        }
        // Final cleanup
        fixedCode = fixedCode
            .replace(/^```(tsx|jsx|javascript|typescript|react)?\n?/i, "")
            .replace(/\n?```$/i, "")
            .trim();

        console.log(`[fix-code] Fixed ${sectionTitle || sectionType} — ${fixedCode.length} chars`);

        return new Response(
            JSON.stringify({ code: fixedCode }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[fix-code] Error:", error);
        const err = error as Error;
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
