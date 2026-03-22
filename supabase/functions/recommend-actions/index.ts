import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { sizeSqm, heatingType, postcode, avgBillSek, billFileUrls } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const billContext = avgBillSek
      ? `Current average monthly energy bill: ${avgBillSek} SEK.`
      : "No bill amount provided.";

    const fileContext = billFileUrls?.length
      ? `The tenant also uploaded ${billFileUrls.length} bill file(s) for reference.`
      : "";

    const systemPrompt = `You are a Green Lease Coach AI for Swedish buildings. Given building data and energy bill costs, produce energy-saving recommendations.

RULES:
- All monetary values in SEK
- CO₂ factors: district heating = 0.07 kg/kWh, electric = 0.045 kg/kWh, heat pump COP~3 so 0.015 kg/kWh, gas = 0.2 kg/kWh
- Sort by cost (cheapest first)
- Include both tenant actions and landlord requests
- Be specific and actionable
- Consider Swedish climate and building standards
- IMPORTANT: Use the provided monthly bill amount to ground your savings estimates. Savings should be realistic percentages of the actual bill.
- If the average bill is provided, total_savings_sek_month should not exceed 40% of it unless extraordinary measures are recommended.`;

    const userPrompt = `Building: ${sizeSqm} m², heating: ${heatingType}, location: ${postcode || "Sweden"}.
${billContext}
${fileContext}

Based on this energy cost data, return realistic energy-saving recommendations with savings grounded in the actual bill amount. Return a JSON object using this exact tool schema.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "recommend_actions",
                description:
                  "Return energy-saving recommendations for a building based on actual bill data",
                parameters: {
                  type: "object",
                  properties: {
                    actions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          savings_sek_month: { type: "number" },
                          co2_kg_year: { type: "number" },
                          cost_description: { type: "string" },
                          priority: {
                            type: "string",
                            enum: ["low", "medium", "high"],
                          },
                          responsible: {
                            type: "string",
                            enum: ["tenant", "landlord", "shared"],
                          },
                        },
                        required: [
                          "title",
                          "savings_sek_month",
                          "co2_kg_year",
                          "cost_description",
                          "priority",
                          "responsible",
                        ],
                        additionalProperties: false,
                      },
                    },
                    total_savings_sek_month: { type: "number" },
                    total_co2_kg_year: { type: "number" },
                    green_lease_clauses: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          clause: { type: "string" },
                          explanation: { type: "string" },
                        },
                        required: ["clause", "explanation"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "actions",
                    "total_savings_sek_month",
                    "total_co2_kg_year",
                    "green_lease_clauses",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "recommend_actions" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

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

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const recommendations = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-actions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
