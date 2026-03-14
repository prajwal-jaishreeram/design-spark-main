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
    const { prompt, projectContext, businessName } = await req.json();

    const systemPrompt = `You are an expert web designer and UX specialist who creates Ideogram-optimized design prompts for FULL-PAGE website designs.

Your job is to take a user's brief description and enhance it into a detailed, structured prompt for generating a COMPLETE full-page website design mockup.

Rules:
- Output ONLY the enhanced prompt text, nothing else
- The prompt must describe a COMPLETE landing page from top to bottom (not just one section)
- Include these sections in the description: navigation, hero, features/services, testimonials or social proof, FAQ or info, CTA, footer
- Be specific about: overall color scheme, typography style, card styles, layout patterns, spacing
- Mention the design should show ALL sections in one continuous tall image (2:3 aspect ratio)
- Include responsive desktop viewport framing
- Keep the enhanced prompt under 300 words
- End with these quality keywords: "dribbble-quality, awwwards-worthy, premium SaaS design, professional UI, pixel-perfect, modern web design 2025, clean aesthetic, high-end product design, complete full-page design"
- Do NOT include any placeholder text in the prompt — focus on visual/layout description only`;

    const userMsg = `Business: ${businessName || "a modern digital business"}
User's description: ${prompt}
${projectContext ? `Additional context: ${projectContext}` : ""}

Enhance this into a detailed visual design prompt for generating a COMPLETE full-page website landing page design with Ideogram. The design should show ALL sections from navigation to footer in one tall continuous image.`;

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
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Claude API error:", err);
      throw new Error(`Claude API failed: ${res.status}`);
    }

    const data = await res.json();
    const enhancedPrompt = data.content?.[0]?.text || prompt;

    return new Response(
      JSON.stringify({ enhancedPrompt, original: prompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("enhance-prompt error:", error);
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
