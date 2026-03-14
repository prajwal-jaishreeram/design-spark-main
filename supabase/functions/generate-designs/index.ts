import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const IDEOGRAM_API_KEY = Deno.env.get("IDEOGRAM_API_KEY") || "pOSkcWmMEi_VxhZlS4wVnPOuzVptxvWMfRshwFEtbaabgJJkVIvU9EoIBco3-srdwPCAExffk_5MzFRxLgKIcA";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STYLE_KEYWORDS = "dribbble-quality, awwwards-worthy, premium SaaS design, professional UI, pixel-perfect, modern web design 2025, clean aesthetic, high-end product design, complete landing page";

const NEGATIVE_PROMPT = "distorted text, misspelled words, garbled letters, spelling errors, blurry text, illegible typography, amateur design, cluttered layout, low quality, pixelated, watermark, bad composition, unprofessional, stock photo aesthetic, generic template, outdated design, poor contrast, accessibility issues, broken grid, misaligned elements, partial page, incomplete design, cropped sections";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, businessContext, count = 3 } = await req.json();

    // Layout style variations for diverse full-page designs
    const variations = [
      " Style: dark premium theme with glassmorphism cards, neon accents, and deep shadows.",
      " Style: modern gradient theme with smooth color transitions, rounded elements, and light overlays.",
      " Style: clean professional theme with bold typography, structured grid, and vibrant accent colors.",
    ];

    const designPromises = Array.from({ length: count }, (_, i) => {
      const fullPrompt = [
        `Complete full-page website landing page design mockup showing ALL sections from top to bottom in a single scrollable view.`,
        `The page must include: navigation bar, hero section with headline and CTA, features/services section with cards or grid, testimonials or social proof section, FAQ or additional info section, call-to-action banner, and footer with links.`,
        prompt,
        businessContext ? `Business context: ${businessContext}` : "",
        variations[i] || "",
        `Layout: single continuous page design, professional desktop viewport, all sections visible in one tall image.`,
        STYLE_KEYWORDS,
      ]
        .filter(Boolean)
        .join("\n");

      console.log(`[generate-designs] Full-page prompt ${i + 1}:`, fullPrompt.slice(0, 300));

      return fetch("https://api.ideogram.ai/v1/ideogram-v3/generate", {
        method: "POST",
        headers: {
          "Api-Key": IDEOGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          negative_prompt: NEGATIVE_PROMPT,
          aspect_ratio: "2x3",
          model: "V_3",
          magic_prompt_option: "ON",
        }),
      });
    });

    const responses = await Promise.allSettled(designPromises);
    const designs = [];
    let lastError = "Failed to generate designs";

    for (const result of responses) {
      if (result.status === "fulfilled" && result.value.ok) {
        const data = await result.value.json();
        if (data.data && data.data.length > 0) {
          designs.push({
            id: crypto.randomUUID(),
            imageUrl: data.data[0].url,
            prompt: prompt,
          });
        }
      } else if (result.status === "fulfilled" && !result.value.ok) {
        const errText = await result.value.text();
        console.error("Ideogram HTTP error:", errText);
        lastError = errText;
      } else if (result.status === "rejected") {
        console.error("Ideogram request rejected:", result.reason);
        lastError = String(result.reason);
      }
    }

    if (designs.length === 0) {
      throw new Error(`Ideogram API failed: ${lastError}`);
    }

    return new Response(
      JSON.stringify({ designs, prompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-designs error:", error);
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
