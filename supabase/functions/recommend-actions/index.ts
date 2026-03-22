import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──────────────────────────────────────────────────────────────

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) throw new Error(`Embedding error: ${res.status}`);
  const data = await res.json();
  return data.data[0].embedding;
}

async function aiCall(
  lovableKey: string,
  messages: { role: string; content: string }[],
  tools?: any[],
  toolChoice?: any
) {
  const body: any = { messages };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("RATE_LIMITED");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`AI gateway error: ${res.status} ${errText}`);
  }

  return res.json();
}

// ── Multi-step agent pipeline ────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sizeSqm, heatingType, postcode, avgBillSek, extractedBills, projectId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const hasRAG = !!OPENAI_API_KEY && !!SUPABASE_URL && !!SUPABASE_SERVICE_ROLE_KEY;

    const agentSteps: { step: string; result: any; timestamp: string }[] = [];
    const addStep = (step: string, result: any) => {
      agentSteps.push({ step, result, timestamp: new Date().toISOString() });
    };

    // ── STEP 1: Classify bills ────────────────────────────────────────────

    let billClassification: any = null;
    if (extractedBills?.length) {
      const classifyData = await aiCall(
        LOVABLE_API_KEY,
        [
          {
            role: "system",
            content: "You are an energy bill classifier for Swedish buildings. Classify the bill data and determine the building's energy profile.",
          },
          {
            role: "user",
            content: `Classify these energy bills:\n${JSON.stringify(extractedBills, null, 2)}`,
          },
        ],
        [
          {
            type: "function",
            function: {
              name: "classify_bills",
              description: "Classify energy bills and determine building energy profile",
              parameters: {
                type: "object",
                properties: {
                  primary_energy_type: { type: "string", description: "Main energy source (electricity, district_heating, gas, heat_pump)" },
                  estimated_annual_kwh: { type: "number", description: "Estimated annual energy consumption in kWh" },
                  estimated_annual_cost_sek: { type: "number", description: "Estimated annual cost in SEK" },
                  cost_per_kwh: { type: "number", description: "Effective cost per kWh in SEK" },
                  billing_pattern: { type: "string", description: "Seasonal pattern or billing notes" },
                  efficiency_assessment: { type: "string", enum: ["poor", "below_average", "average", "above_average", "good"] },
                  climate_zone_estimate: { type: "string", enum: ["zone_1", "zone_2", "zone_3"], description: "Estimated Swedish climate zone based on costs and location" },
                },
                required: ["primary_energy_type", "estimated_annual_kwh", "estimated_annual_cost_sek", "efficiency_assessment", "climate_zone_estimate"],
                additionalProperties: false,
              },
            },
          },
        ],
        { type: "function", function: { name: "classify_bills" } }
      );

      const tc = classifyData.choices?.[0]?.message?.tool_calls?.[0];
      if (tc) {
        billClassification = JSON.parse(tc.function.arguments);
        addStep("classify_bills", billClassification);
      }
    }

    // ── STEP 2: RAG – retrieve relevant Swedish regulations ──────────────

    let regulationContext = "";
    if (hasRAG) {
      try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // Build a query from the building context
        const ragQuery = `Energy efficiency recommendations for ${sizeSqm}m² ${heatingType} building in ${postcode || "Sweden"} climate zone ${billClassification?.climate_zone_estimate || "unknown"}`;

        const queryEmbedding = await getEmbedding(ragQuery, OPENAI_API_KEY!);

        const { data: regulations, error: ragError } = await supabase.rpc("match_regulations", {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: 5,
        });

        if (!ragError && regulations?.length) {
          regulationContext = `\n\nRELEVANT SWEDISH REGULATIONS AND STANDARDS:\n${regulations
            .map((r: any) => `[${r.category}] ${r.title} (source: ${r.source})\n${r.content}\n(relevance: ${(r.similarity * 100).toFixed(0)}%)`)
            .join("\n\n")}`;
          addStep("rag_retrieval", {
            query: ragQuery,
            matches: regulations.map((r: any) => ({ title: r.title, category: r.category, similarity: r.similarity })),
          });
        } else {
          addStep("rag_retrieval", { query: ragQuery, matches: [], note: ragError?.message || "No matches above threshold" });
        }
      } catch (ragErr) {
        addStep("rag_retrieval", { error: ragErr instanceof Error ? ragErr.message : "RAG failed" });
      }
    } else {
      addStep("rag_retrieval", { skipped: true, reason: "OpenAI API key or Supabase credentials not available" });
    }

    // ── STEP 3: Generate recommendations (with classification + RAG context) ──

    let billContext = "";
    if (extractedBills?.length) {
      const totalCost = extractedBills.reduce((sum: number, b: any) => sum + (b.total_cost_sek || 0), 0);
      const totalKwh = extractedBills.reduce((sum: number, b: any) => sum + (b.energy_kwh || 0), 0);
      const avgCost = totalCost / extractedBills.length;

      billContext = `EXTRACTED BILL DATA (from ${extractedBills.length} uploaded bills):
- Total cost: ${totalCost} SEK
- Total energy: ${totalKwh} kWh
- Average cost per bill: ${avgCost.toFixed(0)} SEK
- Energy types: ${[...new Set(extractedBills.map((b: any) => b.energy_type))].join(", ")}

Individual bills:
${extractedBills.map((b: any, i: number) => `  Bill ${i + 1}: ${b.provider_name} — ${b.total_cost_sek} SEK, ${b.energy_kwh} kWh (${b.energy_type})${b.billing_period_start ? ` [${b.billing_period_start} to ${b.billing_period_end}]` : ""}`).join("\n")}

Average monthly bill: ~${avgCost.toFixed(0)} SEK`;
    } else if (avgBillSek) {
      billContext = `User-reported average monthly energy bill: ${avgBillSek} SEK.`;
    }

    const classificationContext = billClassification
      ? `\n\nBILL CLASSIFICATION (from Step 1):
- Primary energy: ${billClassification.primary_energy_type}
- Est. annual consumption: ${billClassification.estimated_annual_kwh} kWh
- Est. annual cost: ${billClassification.estimated_annual_cost_sek} SEK
- Efficiency: ${billClassification.efficiency_assessment}
- Climate zone: ${billClassification.climate_zone_estimate}`
      : "";

    const systemPrompt = `You are a Green Lease Coach AI for Swedish buildings. You have access to Swedish energy regulations and building standards to ground your recommendations.

RULES:
- All monetary values in SEK
- CO₂ factors: district heating = 0.07 kg/kWh, electric = 0.045 kg/kWh, heat pump COP~3 so 0.015 kg/kWh, gas = 0.2 kg/kWh
- Sort actions by cost (cheapest first)
- Include both tenant actions and landlord requests
- Be specific and actionable with reference to Swedish standards where applicable
- IMPORTANT: Use bill data to ground savings estimates. Savings should not exceed 40% of average monthly bill.
- Reference specific Swedish regulations/standards when relevant.`;

    const userPrompt = `Building: ${sizeSqm} m², heating: ${heatingType}, location: ${postcode || "Sweden"}.

${billContext}
${classificationContext}
${regulationContext}

Based on all this data (actual bills, classification, and relevant Swedish regulations), return realistic energy-saving recommendations.`;

    const recData = await aiCall(
      LOVABLE_API_KEY,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      [
        {
          type: "function",
          function: {
            name: "recommend_actions",
            description: "Return energy-saving recommendations grounded in regulations and actual bill data",
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
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                      responsible: { type: "string", enum: ["tenant", "landlord", "shared"] },
                      regulation_reference: { type: "string", description: "Reference to relevant Swedish regulation or standard, if applicable" },
                    },
                    required: ["title", "savings_sek_month", "co2_kg_year", "cost_description", "priority", "responsible"],
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
                climate_zone: { type: "string", description: "Determined Swedish climate zone" },
                building_efficiency_rating: { type: "string", description: "Overall efficiency assessment" },
              },
              required: ["actions", "total_savings_sek_month", "total_co2_kg_year", "green_lease_clauses"],
              additionalProperties: false,
            },
          },
        },
      ],
      { type: "function", function: { name: "recommend_actions" } }
    );

    const recToolCall = recData.choices?.[0]?.message?.tool_calls?.[0];
    if (!recToolCall) throw new Error("No tool call in recommendation response");

    const recommendations = JSON.parse(recToolCall.function.arguments);
    addStep("generate_recommendations", {
      action_count: recommendations.actions?.length,
      total_savings: recommendations.total_savings_sek_month,
      climate_zone: recommendations.climate_zone,
    });

    // ── STEP 4: Save analysis session for memory ─────────────────────────

    if (hasRAG && projectId) {
      try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
        await supabase.from("analysis_sessions").insert({
          project_id: projectId,
          building_profile: { sizeSqm, heatingType, postcode },
          bill_summary: { avgBillSek, billCount: extractedBills?.length || 0, classification: billClassification },
          recommendations,
          agent_steps: agentSteps,
        });
        addStep("save_session", { saved: true });
      } catch (saveErr) {
        addStep("save_session", { error: saveErr instanceof Error ? saveErr.message : "Save failed" });
      }
    }

    return new Response(
      JSON.stringify({ ...recommendations, agent_steps: agentSteps }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("recommend-actions error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";

    if (message === "RATE_LIMITED") {
      return new Response(
        JSON.stringify({ error: "Rate limited, please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (message === "CREDITS_EXHAUSTED") {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
