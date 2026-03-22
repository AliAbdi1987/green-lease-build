import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BillDataSchema = z.object({
  provider_name: z.string().describe("Energy company / utility provider name"),
  bill_date: z.string().optional().describe("Bill date or billing period"),
  billing_period_start: z.string().optional().describe("Start of billing period (YYYY-MM-DD)"),
  billing_period_end: z.string().optional().describe("End of billing period (YYYY-MM-DD)"),
  total_cost_sek: z.number().describe("Total cost in SEK including VAT"),
  energy_kwh: z.number().describe("Total energy consumption in kWh"),
  energy_type: z.string().describe("Type of energy: electricity, district_heating, gas, etc."),
  cost_per_kwh_sek: z.number().optional().describe("Cost per kWh in SEK"),
  fixed_charges_sek: z.number().optional().describe("Fixed/standing charges in SEK"),
  vat_sek: z.number().optional().describe("VAT amount in SEK"),
  meter_reading_start: z.number().optional().describe("Meter reading at start of period"),
  meter_reading_end: z.number().optional().describe("Meter reading at end of period"),
  customer_address: z.string().optional().describe("Customer/property address on the bill"),
  additional_notes: z.string().optional().describe("Any other relevant information"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();
    if (!fileUrl) throw new Error("fileUrl is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Download the file from storage
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) throw new Error(`Failed to download file: ${fileResponse.status}`);

    const fileBuffer = await fileResponse.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const ext = (fileName || fileUrl).split(".").pop()?.toLowerCase();
    let mimeType = "application/pdf";
    if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
    else if (ext === "png") mimeType = "image/png";

    // LangChain ChatOpenAI with structured output via Lovable AI Gateway
    const model = new ChatOpenAI({
      openAIApiKey: LOVABLE_API_KEY,
      configuration: { baseURL: "https://ai.gateway.lovable.dev/v1" },
      modelName: "google/gemini-2.5-flash",
      temperature: 0,
    });

    const structuredModel = model.withStructuredOutput(BillDataSchema, {
      name: "extract_bill_data",
    });

    const result = await structuredModel.invoke([
      new SystemMessage(
        "You are a utility bill data extraction expert for Swedish energy bills. Extract all structured information from the uploaded bill document. Be thorough and precise. All monetary values should be in SEK. Energy in kWh."
      ),
      new HumanMessage({
        content: [
          { type: "text", text: "Extract all relevant information from this energy/utility bill." },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
        ],
      }),
    ]);

    return new Response(
      JSON.stringify({ extracted: result, fileName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-bill error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";

    if (message.includes("429")) {
      return new Response(
        JSON.stringify({ error: "Rate limited, please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (message.includes("402")) {
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
