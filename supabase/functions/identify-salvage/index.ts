import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photoUrls, description, location, projectId } = await req.json();
    if (!photoUrls?.length) throw new Error("At least one photo URL is required");
    if (!projectId) throw new Error("projectId is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Download photos and convert to base64 for vision
    const imageContents = await Promise.all(
      photoUrls.map(async (url: string) => {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to download image: ${resp.status}`);
        const buf = await resp.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buf).reduce((d, b) => d + String.fromCharCode(b), "")
        );
        const ext = url.split(".").pop()?.toLowerCase()?.split("?")[0] || "jpeg";
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        return { type: "image_url" as const, image_url: { url: `data:${mime};base64,${base64}` } };
      })
    );

    // Call Lovable AI Gateway with vision + structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a Swedish building materials expert, circular economy specialist, and certified waste assessor.

STEP 1 — TRIAGE (do this first for every item):
Carefully examine each item's visual condition. Classify it as one of:
- "reuse": Item is structurally sound and can be resold/reused as-is or with minor refurbishment.
  Examples: doors with intact frames, working faucets, cabinets with solid joints, radiators without rust-through.
- "recycle": Item is damaged beyond practical reuse — cracked porcelain, warped/rotted wood, corroded metal,
  broken glass, missing critical parts. It should be sent for material recycling (wood → chipboard, metal → smelter, etc.).

Be honest and conservative. If an item looks marginal, classify as "recycle" and explain why.

STEP 2 — VALUATION (only for "reuse" items):
For each reusable item, provide:
- name: Clear item name in English
- condition: Assessment (Excellent / Good / Fair) with brief note
- estimated_value_sek: Resale value estimate in SEK based on Swedish market prices (Blocket.se, Tradera, CCBuild)
- co2_saved_kg: Estimated CO₂ saved by reusing instead of manufacturing new (kg)
- description: Brief description for a marketplace listing
- listing_text: Ready-to-post Swedish marketplace listing text (in Swedish)

For "recycle" items, set estimated_value_sek to 0 and provide:
- name, condition notes explaining why it's not reusable, co2_saved_kg from recycling (lower than reuse), and recycling_suggestion.

Base reuse price estimates on typical Swedish secondhand market values:
- Interior doors: 400-1200 SEK each depending on material and condition
- Kitchen cabinets: 200-500 SEK per unit, full sets 1500-4000 SEK
- Porcelain sinks: 300-800 SEK
- Faucets: 200-600 SEK
- Radiators: 300-1500 SEK depending on size
- Windows: 500-2000 SEK depending on size and glazing
- Hardwood flooring: 100-300 SEK per sqm
- Light fixtures: 100-800 SEK
- Wardrobes/storage: 500-2000 SEK

Adjust based on visible condition, brand quality, and age.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Examine these photos carefully. For each item: (1) decide if it is reusable or should be recycled, (2) then estimate value for reusable items.${description ? ` Context: ${description}` : ""}${location ? ` Location: ${location}` : ""}`,
              },
              ...imageContents,
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_salvage_items",
              description: "Return triaged salvageable building materials with reuse/recycle classification and pricing",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        disposition: { type: "string", enum: ["reuse", "recycle"], description: "Whether the item can be reused/resold or should be recycled" },
                        disposition_reason: { type: "string", description: "Brief explanation of why the item is classified as reuse or recycle" },
                        condition_rating: { type: "string", enum: ["excellent", "good", "fair", "poor"], description: "Overall condition rating" },
                        condition_notes: { type: "string", description: "Detailed condition description based on visual inspection" },
                        estimated_value_sek: { type: "number", description: "Resale value for reuse items, 0 for recycle items" },
                        co2_saved_kg: { type: "number", description: "CO2 saved — higher for reuse, lower for material recycling" },
                        description: { type: "string" },
                        listing_text: { type: "string", description: "Swedish marketplace listing text, only for reuse items" },
                        recycling_suggestion: { type: "string", description: "How/where to recycle, only for recycle items" },
                      },
                      required: ["name", "disposition", "disposition_reason", "condition_rating", "condition_notes", "estimated_value_sek", "co2_saved_kg", "description"],
                    },
                  },
                  total_reuse_value_sek: { type: "number", description: "Sum of resale values for reuse items only" },
                  total_co2_saved_kg: { type: "number", description: "Total CO2 saved across all items (reuse + recycling)" },
                  reuse_count: { type: "number" },
                  recycle_count: { type: "number" },
                  summary: { type: "string", description: "Overall assessment of the materials" },
                },
                required: ["items", "total_reuse_value_sek", "total_co2_saved_kg", "reuse_count", "recycle_count"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "identify_salvage_items" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const identified = JSON.parse(toolCall.function.arguments);

    // Save items to salvage_items table
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const itemsToInsert = identified.items.map((item: any) => ({
      project_id: projectId,
      name: item.name,
      condition: item.condition_rating,
      estimated_value_sek: item.estimated_value_sek,
      co2_saved_kg: item.co2_saved_kg,
      description: `[${item.disposition.toUpperCase()}] ${item.disposition_reason}. ${item.condition_notes || ""}. ${item.description || ""}`.trim(),
      listing_text: item.listing_text || item.recycling_suggestion || null,
      status: item.disposition === "reuse" ? "listed" : "recycle",
    }));

    const { error: insertError } = await supabase
      .from("salvage_items")
      .insert(itemsToInsert);

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    return new Response(
      JSON.stringify({ identified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("identify-salvage error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
