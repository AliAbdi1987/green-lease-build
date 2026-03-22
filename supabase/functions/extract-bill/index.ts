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

    // Determine MIME type from file extension
    const ext = (fileName || fileUrl).split(".").pop()?.toLowerCase();
    let mimeType = "application/pdf";
    if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
    else if (ext === "png") mimeType = "image/png";

    const systemPrompt = `You are a utility bill data extraction expert for Swedish energy bills. 
Extract all structured information from the uploaded bill document. Be thorough and precise.
If a field is not found, use null. All monetary values should be in SEK. Energy in kWh.`;

    const userPrompt = `Extract all relevant information from this energy/utility bill. Return structured data using the provided tool.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_bill_data",
                description: "Extract structured data from a Swedish energy/utility bill",
                parameters: {
                  type: "object",
                  properties: {
                    provider_name: {
                      type: "string",
                      description: "Energy company / utility provider name",
                    },
                    bill_date: {
                      type: "string",
                      description: "Bill date or billing period (ISO format or descriptive)",
                    },
                    billing_period_start: {
                      type: "string",
                      description: "Start of billing period (YYYY-MM-DD if available)",
                    },
                    billing_period_end: {
                      type: "string",
                      description: "End of billing period (YYYY-MM-DD if available)",
                    },
                    total_cost_sek: {
                      type: "number",
                      description: "Total cost in SEK including VAT",
                    },
                    energy_kwh: {
                      type: "number",
                      description: "Total energy consumption in kWh",
                    },
                    energy_type: {
                      type: "string",
                      description: "Type of energy: electricity, district_heating, gas, etc.",
                    },
                    cost_per_kwh_sek: {
                      type: "number",
                      description: "Cost per kWh in SEK if shown",
                    },
                    fixed_charges_sek: {
                      type: "number",
                      description: "Fixed/standing charges in SEK",
                    },
                    vat_sek: {
                      type: "number",
                      description: "VAT amount in SEK",
                    },
                    meter_reading_start: {
                      type: "number",
                      description: "Meter reading at start of period",
                    },
                    meter_reading_end: {
                      type: "number",
                      description: "Meter reading at end of period",
                    },
                    customer_address: {
                      type: "string",
                      description: "Customer/property address on the bill",
                    },
                    additional_notes: {
                      type: "string",
                      description: "Any other relevant information from the bill",
                    },
                  },
                  required: [
                    "provider_name",
                    "total_cost_sek",
                    "energy_kwh",
                    "energy_type",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_bill_data" },
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
    if (!toolCall) throw new Error("No tool call in AI response");

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ extracted: extractedData, fileName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-bill error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
