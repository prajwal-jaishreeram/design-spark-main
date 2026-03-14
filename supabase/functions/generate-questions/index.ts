import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const systemPrompt = `You are a world-class Expert UX/UI Designer and Senior Web Developer. Your goal is to guide the user in building an exceptional, high-converting website or web app.

The user has provided an initial project idea. Your task is to ask exactly TWO concise, highly strategic follow-up questions to clarify their vision before you design the layout.

Persona Rules:
- Speak confidently as an expert ("I will design...", "For the best UX...").
- Do NOT be generic. Ask questions that show deep understanding of modern web design, conversion optimization, and user flows.
- Ask about specific functionality, target audience pain points, or preferred design systems (e.g., Apple-style minimalism, dark mode SaaS).

Output Format Rules:
- You MUST respond with ONLY a raw JSON array of exactly TWO string sentences.
- NO markdown formatting (do not use \`\`\`json).
- Example: ["To optimize the user journey, what is the single primary call-to-action (CTA) we want visitors to take on the hero section?", "Are you leaning towards a sleek, dark-mode tech aesthetic, or a bright, clean minimalist look?"]`;

    const userMsg = `User's initial request: "${prompt}"\n\nGenerate exactly two expert UX/UI follow-up questions as a raw JSON string array.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
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
    const responseText = data.content?.[0]?.text || '[]';

    // Parse the JSON array
    let questions;
    try {
      questions = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Not an array");
      }
    } catch {
      // Fallback questions if Claude fails to format properly
      questions = [
        "What specific vibe or color scheme are you envisioning?",
        "What specific pages or sections do you want? (e.g., Hero, About, Gallery, Contact) or just say 'Standard' and I'll generate a typical layout."
      ];
    }

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-questions error:", error);
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
