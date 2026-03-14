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
    const { prompt, answers } = await req.json();

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const systemPrompt = `You are a world-class Expert UX/UI Designer and Senior Web Product Architect. Based on the user's initial project prompt and their answers to your strategic follow-up questions, design a high-converting, modern, and engaging website structure.
    
Persona Rules:
- Apply modern UX patterns (e.g., social proof, trusted-by banners, bento-grid features, interactive pricing, dynamic FAQs, captivating footers).
- Do not build generic "About Us" and "Contact" pages for every project. Tailor the sections exactly to the user's industry and answers.
- For e-commerce, include "Featured Products", "Benefits/Ingredients", "Reviews". For SaaS, include "How it Works", "Integrations", "Testimonials", "Pricing".

Output exactly a JSON array of objects. Each object must have:
- "section_type": A snake_case identifier reflecting modern components (e.g., "hero", "trusted_by", "bento_features", "video_showcase", "social_proof", "pricing_table", "newsletter_cta", "modern_footer")
- "section_title": A human readable, engaging title (e.g., "Hero Section", "Trusted By", "Why Choose Us", "See it in Action", "What Customers Say", "Pricing", "Get Started", "Footer")

Formatting Rules:
- Generate 5 to 7 highly logical and structured sections.
- Every website must start with a "hero" section.
- You MUST output ONLY the raw JSON array. NO markdown formatting (\`\`\`json) and NO conversation text.
- Example: [{"section_type":"hero","section_title":"Hero Section"}, {"section_type":"social_proof","section_title":"Trusted By"}, {"section_type":"bento_features","section_title":"Core Features"}, {"section_type":"pricing_table","section_title":"Simple Pricing"}, {"section_type":"modern_footer","section_title":"Footer"}]`;

    const userMsg = `Initial prompt: "${prompt}"\nUser answers: ${JSON.stringify(answers || {})}\n\nGenerate the JSON section plan.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 400,
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
    let sections;
    try {
      sections = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
      if (!Array.isArray(sections) || sections.length === 0) {
        throw new Error("Not an array");
      }
    } catch {
      // Fallback layout
      sections = [
        { section_type: "hero", section_title: "Hero" },
        { section_type: "features", section_title: "Features" },
        { section_type: "about", section_title: "About Us" },
        { section_type: "contact", section_title: "Contact" },
        { section_type: "footer", section_title: "Footer" }
      ];
    }

    return new Response(
      JSON.stringify({ sections }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("plan-sections error:", error);
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
