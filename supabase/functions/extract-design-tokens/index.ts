import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";
const MODEL = "claude-opus-4-6";

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
        const { designImageUrl, designSystem, existingTokens } = await req.json();

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

        const isRefinement = existingTokens && Object.keys(existingTokens).length > 0;

        let systemPrompt: string;
        let userText: string;

        if (isRefinement) {
            // Refinement mode: add missing tokens, only update if higher confidence
            systemPrompt = `You are a design system analyst. You analyze website mockup images to extract visual design properties.

You are REFINING an existing design token set. Rules:
- KEEP all existing token values unless you can see a clearly better/more accurate value in this new image
- ADD new properties you can identify: cardStyle, iconStyle, sectionSpacing, gridStyle
- For each property, include a confidence score (0.0-1.0)
- Only override an existing value if your confidence is > 0.85

Return ONLY valid JSON, no explanation, no markdown blocks:
{
  "primaryColor": { "value": "#hex", "confidence": 0.9 },
  "accentColor": { "value": "#hex", "confidence": 0.9 },
  "gradientStyle": { "value": "description", "confidence": 0.8 },
  "backgroundStyle": { "value": "description", "confidence": 0.8 },
  "borderRadius": { "value": "Xpx", "confidence": 0.9 },
  "spacingScale": { "value": "description", "confidence": 0.7 },
  "buttonStyle": { "value": "description", "confidence": 0.9 },
  "fontStyle": { "value": "description", "confidence": 0.8 },
  "containerWidth": { "value": "Xpx", "confidence": 0.7 },
  "cardStyle": { "value": "description or null", "confidence": 0.7 },
  "iconStyle": { "value": "description or null", "confidence": 0.6 },
  "sectionSpacing": { "value": "description or null", "confidence": 0.7 },
  "gridStyle": { "value": "description or null", "confidence": 0.6 }
}`;

            userText = `Analyze this design image and extract/refine design tokens.

Existing tokens (keep unless you are more confident):
${JSON.stringify(existingTokens, null, 2)}

${designSystem ? `Original design system: ${JSON.stringify(designSystem)}` : ""}

Extract any NEW visual properties (cardStyle, iconStyle, sectionSpacing, gridStyle) that you can identify. Return ONLY JSON.`;
        } else {
            // First extraction: full token extraction
            systemPrompt = `You are a design system analyst. You analyze website mockup images to extract visual design properties.

Analyze the image carefully and extract the actual visual design tokens used.

Return ONLY valid JSON, no explanation, no markdown blocks:
{
  "primaryColor": "#hex value of the main brand color",
  "accentColor": "#hex value of the secondary/accent color",
  "gradientStyle": "description of any gradient used (e.g. 'purple-to-pink diagonal') or 'none'",
  "backgroundStyle": "description (e.g. 'dark with subtle grain', 'white clean', 'gradient overlay')",
  "borderRadius": "estimated border radius (e.g. '12px', '8px', 'rounded-full')",
  "spacingScale": "description of spacing pattern (e.g. 'large modern SaaS', 'tight compact', 'generous')",
  "buttonStyle": "description (e.g. 'rounded pill gradient fill', 'square solid', 'outlined with hover fill')",
  "fontStyle": "description (e.g. 'bold geometric headings, clean body', 'serif elegant headings')",
  "containerWidth": "estimated max container width (e.g. '1200px', '1400px')"
}`;

            userText = `Analyze this website section design image and extract the actual visual design tokens used.

${designSystem ? `The intended design system was: ${JSON.stringify(designSystem)}. Compare what's actually in the image vs the intent.` : ""}

Return ONLY the JSON with the extracted tokens.`;
        }

        const userContent = [
            {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64Image },
            },
            { type: "text", text: userText },
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
        let raw = data.content?.[0]?.text || "{}";
        raw = raw.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();

        const parsed = JSON.parse(raw);

        // For refinement mode: merge with existing tokens
        let tokens: Record<string, string>;
        if (isRefinement) {
            tokens = { ...existingTokens };
            for (const [key, val] of Object.entries(parsed)) {
                const entry = val as { value: string; confidence: number };
                if (!entry.value || entry.value === "null") continue;

                if (!(key in tokens)) {
                    // New property — add it
                    tokens[key] = entry.value;
                } else if (entry.confidence > 0.85) {
                    // Higher confidence — override
                    tokens[key] = entry.value;
                }
            }
        } else {
            // First extraction — use values directly
            tokens = parsed;
        }

        console.log("[extract-design-tokens] Result:", tokens);

        return new Response(
            JSON.stringify({ tokens, isRefinement }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("extract-design-tokens error:", error);
        const err = error as Error;
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
