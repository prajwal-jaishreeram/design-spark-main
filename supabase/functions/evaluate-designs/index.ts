import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";
const MODEL = "claude-opus-4-6";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchImageBase64(url: string): Promise<{ base64: string; mediaType: string }> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
    const buf = await res.arrayBuffer();
    const uint8 = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < uint8.byteLength; i++) {
        binary += String.fromCharCode(uint8[i]);
    }
    const match = res.headers.get("content-type")?.match(/image\/(jpeg|png|webp|gif)/);
    return { base64: btoa(binary), mediaType: match ? match[0] : "image/jpeg" };
}

Deno.serve(async (req: Request) => {
    console.log("Using model:", MODEL);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { designs, designSystem, sectionType, projectDescription } = await req.json();

        if (!designs || designs.length === 0) {
            throw new Error("No designs to evaluate");
        }

        // Build DS context for evaluation
        let dsContext = "No design system provided.";
        if (designSystem) {
            dsContext = `Design System:
Primary color: ${designSystem.primaryColor || "not set"}
Accent color: ${designSystem.accentColor || "not set"}
Typography: ${designSystem.headingFont || "sans-serif"} / ${designSystem.bodyFont || "sans-serif"}
Style: ${designSystem.style || "modern"}
Border radius: ${designSystem.borderRadius || "8px"}`;
        }

        const evaluations = [];

        for (const design of designs) {
            try {
                const { base64, mediaType } = await fetchImageBase64(design.imageUrl);

                const systemPrompt = `You are a senior UI/UX design evaluator. You score website section mockups on quality criteria.

Return ONLY valid JSON with no explanation, no markdown. The JSON must follow this exact structure:
{
  "layout_structure": <number 1-10>,
  "typography_quality": <number 1-10>,
  "spacing_balance": <number 1-10>,
  "ui_clarity": <number 1-10>,
  "aesthetics": <number 1-10>,
  "design_system_consistency": <number 1-10>,
  "implementation_feasibility": <number 1-10>,
  "issues": ["issue1", "issue2"]
}

Scoring guide:
- layout_structure: Is the layout well-organized with clear hierarchy?
- typography_quality: Is text readable, well-sized, not distorted?
- spacing_balance: Is spacing consistent, modern, and balanced?
- ui_clarity: Are UI elements (buttons, cards, icons) clear and functional?
- aesthetics: Does it look premium, modern, dribbble-quality?
- design_system_consistency: Does it match the provided color palette and style?
- implementation_feasibility: Can this be cleanly built with React + Tailwind CSS? (penalize complex custom shapes, unusual overlapping, impossible CSS layouts)

Be strict. Professional designers would score most generic AI designs 4-6. Only truly premium designs get 8+.`;

                const userContent = [
                    {
                        type: "image",
                        source: { type: "base64", media_type: mediaType, data: base64 },
                    },
                    {
                        type: "text",
                        text: `Evaluate this ${sectionType || "website section"} design mockup.

${dsContext}

${projectDescription ? `Project context: ${projectDescription}` : ""}

Score each criterion 1-10 and list any issues. Return ONLY JSON.`,
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
                    console.error("Claude eval error for design", design.id, await res.text());
                    // On API error, give benefit of doubt
                    evaluations.push({ id: design.id, avgScore: 6, passed: false, issues: ["Evaluation API error"] });
                    continue;
                }

                const data = await res.json();
                let raw = data.content?.[0]?.text || "{}";
                // Clean potential markdown wrapping
                raw = raw.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();

                const scores = JSON.parse(raw);
                const scoreValues = [
                    scores.layout_structure || 0,
                    scores.typography_quality || 0,
                    scores.spacing_balance || 0,
                    scores.ui_clarity || 0,
                    scores.aesthetics || 0,
                    scores.design_system_consistency || 0,
                    scores.implementation_feasibility || 0,
                ];
                const avgScore = Math.round((scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length) * 10) / 10;

                console.log(`[evaluate-designs] Design ${design.id}: avg=${avgScore}, scores=`, scores);

                evaluations.push({
                    id: design.id,
                    avgScore,
                    scores,
                    passed: avgScore >= 7,
                    issues: scores.issues || [],
                });
            } catch (evalErr) {
                console.error("Error evaluating design", design.id, evalErr);
                evaluations.push({ id: design.id, avgScore: 5, passed: false, issues: ["Evaluation failed"] });
            }
        }

        return new Response(
            JSON.stringify({ evaluations }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("evaluate-designs error:", error);
        const err = error as Error;
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
