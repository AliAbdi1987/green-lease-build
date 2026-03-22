import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Schemas ──────────────────────────────────────────────────────────────

const BillClassificationSchema = z.object({
  primary_energy_type: z.string().describe("Main energy source (electricity, district_heating, gas, heat_pump)"),
  estimated_annual_kwh: z.number().describe("Estimated annual energy consumption in kWh"),
  estimated_annual_cost_sek: z.number().describe("Estimated annual cost in SEK"),
  cost_per_kwh: z.number().optional().describe("Effective cost per kWh in SEK"),
  billing_pattern: z.string().optional().describe("Seasonal pattern or billing notes"),
  efficiency_assessment: z.enum(["poor", "below_average", "average", "above_average", "good"]),
  climate_zone_estimate: z.enum(["zone_1", "zone_2", "zone_3"]).describe("Estimated Swedish climate zone"),
});

const RecommendationSchema = z.object({
  actions: z.array(z.object({
    title: z.string(),
    savings_sek_month: z.number(),
    co2_kg_year: z.number(),
    cost_description: z.string(),
    priority: z.enum(["low", "medium", "high"]),
    responsible: z.enum(["tenant", "landlord", "shared"]),
    regulation_reference: z.string().optional().describe("Reference to relevant Swedish regulation"),
  })),
  total_savings_sek_month: z.number(),
  total_co2_kg_year: z.number(),
  green_lease_clauses: z.array(z.object({
    clause: z.string(),
    explanation: z.string(),
  })),
  climate_zone: z.string().optional(),
  building_efficiency_rating: z.string().optional(),
});

// ── Pipeline Steps ───────────────────────────────────────────────────────

function createClassifyStep(model: ChatOpenAI) {
  const classifyModel = model.withStructuredOutput(BillClassificationSchema, {
    name: "classify_bills",
  });

  return new RunnableLambda({
    func: async (input: Record<string, any>) => {
      if (!input.extractedBills?.length) {
        return { ...input, billClassification: null, steps: [...(input.steps || []), { step: "classify_bills", result: { skipped: true }, timestamp: new Date().toISOString() }] };
      }

      const result = await classifyModel.invoke([
        new SystemMessage("You are an energy bill classifier for Swedish buildings. Classify the bill data and determine the building's energy profile."),
        new HumanMessage(`Classify these energy bills:\n${JSON.stringify(input.extractedBills, null, 2)}`),
      ]);

      return {
        ...input,
        billClassification: result,
        steps: [...(input.steps || []), { step: "classify_bills", result, timestamp: new Date().toISOString() }],
      };
    },
  });
}

function createRAGStep(embeddings: OpenAIEmbeddings | null, supabaseUrl: string | null, supabaseKey: string | null) {
  return new RunnableLambda({
    func: async (input: Record<string, any>) => {
      if (!embeddings || !supabaseUrl || !supabaseKey) {
        return {
          ...input,
          regulationContext: "",
          steps: [...(input.steps || []), { step: "rag_retrieval", result: { skipped: true, reason: "OpenAI API key or Supabase credentials not available" }, timestamp: new Date().toISOString() }],
        };
      }

      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const ragQuery = `Energy efficiency recommendations for ${input.sizeSqm}m² ${input.heatingType} building in ${input.postcode || "Sweden"} climate zone ${input.billClassification?.climate_zone_estimate || "unknown"}`;

        const queryEmbedding = await embeddings.embedQuery(ragQuery);

        const { data: regulations, error } = await supabase.rpc("match_regulations", {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: 5,
        });

        let regulationContext = "";
        if (!error && regulations?.length) {
          regulationContext = `\n\nRELEVANT SWEDISH REGULATIONS AND STANDARDS:\n${regulations
            .map((r: any) => `[${r.category}] ${r.title} (source: ${r.source})\n${r.content}\n(relevance: ${(r.similarity * 100).toFixed(0)}%)`)
            .join("\n\n")}`;
        }

        return {
          ...input,
          regulationContext,
          steps: [...(input.steps || []), {
            step: "rag_retrieval",
            result: {
              query: ragQuery,
              matches: regulations?.map((r: any) => ({ title: r.title, category: r.category, similarity: r.similarity })) || [],
              note: error?.message || undefined,
            },
            timestamp: new Date().toISOString(),
          }],
        };
      } catch (ragErr) {
        return {
          ...input,
          regulationContext: "",
          steps: [...(input.steps || []), { step: "rag_retrieval", result: { error: ragErr instanceof Error ? ragErr.message : "RAG failed" }, timestamp: new Date().toISOString() }],
        };
      }
    },
  });
}

function createRecommendStep(model: ChatOpenAI) {
  const recModel = model.withStructuredOutput(RecommendationSchema, {
    name: "recommend_actions",
  });

  return new RunnableLambda({
    func: async (input: Record<string, any>) => {
      let billContext = "";
      if (input.extractedBills?.length) {
        const totalCost = input.extractedBills.reduce((sum: number, b: any) => sum + (b.total_cost_sek || 0), 0);
        const totalKwh = input.extractedBills.reduce((sum: number, b: any) => sum + (b.energy_kwh || 0), 0);
        const avgCost = totalCost / input.extractedBills.length;
        billContext = `EXTRACTED BILL DATA (from ${input.extractedBills.length} uploaded bills):
- Total cost: ${totalCost} SEK
- Total energy: ${totalKwh} kWh
- Average cost per bill: ${avgCost.toFixed(0)} SEK
- Energy types: ${[...new Set(input.extractedBills.map((b: any) => b.energy_type))].join(", ")}

Individual bills:
${input.extractedBills.map((b: any, i: number) => `  Bill ${i + 1}: ${b.provider_name} — ${b.total_cost_sek} SEK, ${b.energy_kwh} kWh (${b.energy_type})${b.billing_period_start ? ` [${b.billing_period_start} to ${b.billing_period_end}]` : ""}`).join("\n")}

Average monthly bill: ~${avgCost.toFixed(0)} SEK`;
      } else if (input.avgBillSek) {
        billContext = `User-reported average monthly energy bill: ${input.avgBillSek} SEK.`;
      }

      const classificationContext = input.billClassification
        ? `\n\nBILL CLASSIFICATION (from Step 1):
- Primary energy: ${input.billClassification.primary_energy_type}
- Est. annual consumption: ${input.billClassification.estimated_annual_kwh} kWh
- Est. annual cost: ${input.billClassification.estimated_annual_cost_sek} SEK
- Efficiency: ${input.billClassification.efficiency_assessment}
- Climate zone: ${input.billClassification.climate_zone_estimate}`
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

      const userPrompt = `Building: ${input.sizeSqm} m², heating: ${input.heatingType}, location: ${input.postcode || "Sweden"}.

${billContext}
${classificationContext}
${input.regulationContext || ""}

Based on all this data (actual bills, classification, and relevant Swedish regulations), return realistic energy-saving recommendations.`;

      const result = await recModel.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      return {
        ...input,
        recommendations: result,
        steps: [...(input.steps || []), {
          step: "generate_recommendations",
          result: {
            action_count: result.actions?.length,
            total_savings: result.total_savings_sek_month,
            climate_zone: result.climate_zone,
          },
          timestamp: new Date().toISOString(),
        }],
      };
    },
  });
}

function createSaveStep(supabaseUrl: string | null, supabaseKey: string | null) {
  return new RunnableLambda({
    func: async (input: Record<string, any>) => {
      if (!supabaseUrl || !supabaseKey || !input.projectId) {
        return input;
      }

      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("analysis_sessions").insert({
          project_id: input.projectId,
          building_profile: { sizeSqm: input.sizeSqm, heatingType: input.heatingType, postcode: input.postcode },
          bill_summary: { avgBillSek: input.avgBillSek, billCount: input.extractedBills?.length || 0, classification: input.billClassification },
          recommendations: input.recommendations,
          agent_steps: input.steps,
        });
        input.steps.push({ step: "save_session", result: { saved: true }, timestamp: new Date().toISOString() });
      } catch (saveErr) {
        input.steps.push({ step: "save_session", result: { error: saveErr instanceof Error ? saveErr.message : "Save failed" }, timestamp: new Date().toISOString() });
      }
      return input;
    },
  });
}

// ── Main Handler ─────────────────────────────────────────────────────────

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

    // LangChain ChatOpenAI pointed at Lovable AI Gateway
    const model = new ChatOpenAI({
      openAIApiKey: LOVABLE_API_KEY,
      configuration: { baseURL: "https://ai.gateway.lovable.dev/v1" },
      modelName: "google/gemini-3-flash-preview",
      temperature: 0.3,
    });

    // OpenAI Embeddings (separate from gateway)
    const embeddings = OPENAI_API_KEY
      ? new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY, modelName: "text-embedding-3-small" })
      : null;

    // Build the LangChain pipeline as a RunnableSequence
    const pipeline = RunnableSequence.from([
      createClassifyStep(model),
      createRAGStep(embeddings, SUPABASE_URL ?? null, SUPABASE_SERVICE_ROLE_KEY ?? null),
      createRecommendStep(model),
      createSaveStep(SUPABASE_URL ?? null, SUPABASE_SERVICE_ROLE_KEY ?? null),
    ]);

    // Execute the full chain
    const result = await pipeline.invoke({
      sizeSqm,
      heatingType,
      postcode,
      avgBillSek,
      extractedBills,
      projectId,
      steps: [],
    });

    return new Response(
      JSON.stringify({ ...result.recommendations, agent_steps: result.steps }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("recommend-actions error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";

    if (message === "RATE_LIMITED" || message.includes("429")) {
      return new Response(
        JSON.stringify({ error: "Rate limited, please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (message === "CREDITS_EXHAUSTED" || message.includes("402")) {
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
