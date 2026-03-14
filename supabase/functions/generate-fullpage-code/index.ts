import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";
const MODEL = "claude-sonnet-4-6";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    console.log("[generate-fullpage-code] Using model:", MODEL);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { designImageUrl, projectContext, businessName, businessDescription, userAnswers } = await req.json();

        if (!designImageUrl) {
            throw new Error("Missing designImageUrl");
        }

        // Build user answers context
        let answersContext = "";
        if (userAnswers && Object.keys(userAnswers).length > 0) {
            answersContext = `\nUser's preferences:\n${Object.values(userAnswers).map((a, i) => `${i + 1}. ${a}`).join("\n")}`;
        }

        const brandName = businessName || projectContext?.split(" ")[0] || "the brand";

        const systemPrompt = `You are an elite web developer. Analyze a full-page website design image and generate React + Tailwind CSS code for every section.

RULES:
1. TEXT: Write your own professional copy. Business: "${brandName}" — ${businessDescription || projectContext || "a modern digital business"}${answersContext}
2. DESIGN: Match colors (use Tailwind arbitrary values like bg-[#hex]), layout, typography, and spacing from the image exactly.
3. ANIMATIONS: Add hover effects, smooth transitions, and subtle scroll animations using CSS.
4. CODE: Each section = separate React component with default export. Use lucide-react for icons. Mobile-first responsive. No "use client".

5. OUTPUT FORMAT — USE DELIMITERS (NOT JSON):
For each section, output it like this:

===SECTION_START===
type: hero
title: Hero Section
===CODE===
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="bg-[#1a1a2e] min-h-screen">
      <h1 className="text-5xl font-bold">Welcome</h1>
    </section>
  );
}
===SECTION_END===

===SECTION_START===
type: features
title: Features Section
===CODE===
export default function FeaturesSection() {
  return (
    <section className="py-20 px-6">
      <h2>Features</h2>
    </section>
  );
}
===SECTION_END===

Include 5-7 sections. First = hero/navbar, last = footer.
After ALL sections, add design tokens:

===DESIGN_TOKENS===
primaryColor: #hex
accentColor: #hex
backgroundColor: #hex
textColor: #hex
===END===`;

        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": CLAUDE_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 12000,
                system: systemPrompt,
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: { type: "url", url: designImageUrl },
                        },
                        {
                            type: "text",
                            text: "Analyze this full-page website design and generate React + Tailwind code for ALL sections. Write your own text content. Match colors and layout exactly. Use the delimiter format specified in the system prompt.",
                        },
                    ],
                }],
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("[generate-fullpage-code] Claude API error:", err);
            throw new Error(`Claude API failed: ${res.status}`);
        }

        const data = await res.json();
        const raw = data.content?.[0]?.text || "";

        console.log("[generate-fullpage-code] Raw response length:", raw.length);

        // Parse delimiter-based format
        const sections: { section_type: string; section_title: string; code: string }[] = [];
        const sectionBlocks = raw.split("===SECTION_START===").filter((b: string) => b.trim());

        for (const block of sectionBlocks) {
            const endIdx = block.indexOf("===SECTION_END===");
            const content = endIdx >= 0 ? block.slice(0, endIdx) : block;

            // Extract type
            const typeMatch = content.match(/type:\s*(.+)/i);
            const titleMatch = content.match(/title:\s*(.+)/i);
            const codeIdx = content.indexOf("===CODE===");

            if (codeIdx >= 0) {
                let code = content.slice(codeIdx + "===CODE===".length).trim();
                // Clean any markdown wrapping
                code = code
                    .replace(/^```(tsx|jsx|javascript|typescript|react)\n?/i, "")
                    .replace(/^```\n?/i, "")
                    .replace(/\n?```$/i, "")
                    .trim();

                sections.push({
                    section_type: typeMatch?.[1]?.trim() || "section",
                    section_title: titleMatch?.[1]?.trim() || `Section ${sections.length + 1}`,
                    code,
                });
            }
        }

        // Parse design tokens
        let designTokens: Record<string, string> = {};
        const tokensMatch = raw.match(/===DESIGN_TOKENS===([\s\S]*?)===END===/);
        if (tokensMatch) {
            const tokenLines = tokensMatch[1].trim().split("\n");
            for (const line of tokenLines) {
                const [key, ...valueParts] = line.split(":");
                if (key && valueParts.length) {
                    designTokens[key.trim()] = valueParts.join(":").trim();
                }
            }
        }

        if (sections.length === 0) {
            throw new Error("Claude returned no parseable sections");
        }

        console.log(`[generate-fullpage-code] Parsed ${sections.length} sections:`,
            sections.map(s => s.section_type).join(", "));

        return new Response(
            JSON.stringify({ sections, designTokens, designImageUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[generate-fullpage-code] Error:", error);
        const err = error as Error;
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
