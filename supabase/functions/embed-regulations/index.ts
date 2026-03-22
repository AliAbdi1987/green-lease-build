import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RegulationChunk {
  title: string;
  content: string;
  category: string;
  source?: string;
}

const SWEDISH_REGULATIONS: RegulationChunk[] = [
  {
    title: "BBR Energy Requirements – New Buildings",
    content: "According to Boverket's Building Regulations (BBR), new buildings in Sweden must meet specific energy performance requirements. For climate zone I (northernmost), the maximum primary energy number is 95 kWh/m²/year. For zone II, it is 75 kWh/m²/year. For zone III (southernmost), 70 kWh/m²/year. These apply to heated floor area and include heating, cooling, hot water, and building operation electricity.",
    category: "building_standards",
    source: "BBR 29 (BFS 2020:4)",
  },
  {
    title: "Swedish Climate Zones for Building Energy",
    content: "Sweden is divided into three climate zones for energy performance calculations: Zone I (Norrbotten, Västerbotten, Jämtland, Västernorrland counties), Zone II (Gävleborg, Dalarna, Värmland, Örebro, Västmanland, Uppsala, Stockholm, Södermanland, Östergötland, Jönköping counties), Zone III (Kronoberg, Kalmar, Gotland, Blekinge, Skåne, Halland, Västra Götaland counties). Postcodes starting with 1-2 are typically Zone II (Stockholm area), 3-5 Zone II/III, 6-7 Zone II, 8-9 Zone I.",
    category: "climate_zones",
    source: "Boverket BEN 2",
  },
  {
    title: "Energy Declaration Requirements",
    content: "Swedish law requires energy declarations (energideklaration) for buildings being sold, rented, or newly constructed. The declaration must include the building's energy performance, recommendations for improvement, and is valid for 10 years. Buildings with poor energy ratings (F or G) must disclose this in property listings. The declaration must be performed by an independent expert certified by Boverket.",
    category: "energy_declarations",
    source: "Lag (2006:985) om energideklaration",
  },
  {
    title: "District Heating in Sweden",
    content: "District heating (fjärrvärme) supplies about 60% of heating in Swedish multi-family buildings. The average CO₂ emission factor for Swedish district heating is approximately 0.07 kg CO₂/kWh, though this varies by municipality. Stockholm Exergi reports ~0.04 kg/kWh, while some smaller networks using more fossil fuels report up to 0.15 kg/kWh. District heating prices in Sweden average 0.80-1.20 SEK/kWh including VAT.",
    category: "heating_systems",
    source: "Energiföretagen Sverige 2024",
  },
  {
    title: "Green Lease Standards in Sweden",
    content: "A green lease (grönt hyresavtal) in Sweden typically follows the framework developed by Fastighetsägarna (Swedish Property Federation). Key components include: shared energy reduction targets (typically 10-20% over 3 years), data sharing obligations between landlord and tenant, investment agreements for energy efficiency measures, procedures for green electricity procurement, and waste reduction targets. The Swedish Green Building Council (SGBC) provides certification guidance.",
    category: "green_leases",
    source: "Fastighetsägarna Sverige",
  },
  {
    title: "Heat Pump Efficiency Standards",
    content: "Heat pumps in Swedish buildings typically achieve a COP (Coefficient of Performance) of 2.5-4.0 depending on type. Ground-source (bergvärmepump) achieves COP 3.5-4.0, air-water (luft-vattenvärmepump) COP 2.5-3.5, and exhaust air (frånluftsvärmepump) COP 2.5-3.0. Swedish electricity has a very low carbon intensity (~0.045 kg CO₂/kWh), making heat pumps particularly effective for CO₂ reduction. Converting from direct electric heating to a heat pump typically reduces energy consumption by 60-70%.",
    category: "heating_systems",
    source: "Energimyndigheten",
  },
  {
    title: "Swedish Electricity Pricing and Zones",
    content: "Sweden has four electricity price zones (SE1-SE4, north to south). Average electricity prices including grid fees and taxes: SE1 (Luleå) ~1.0-1.5 SEK/kWh, SE2 (Sundsvall) ~1.0-1.5 SEK/kWh, SE3 (Stockholm) ~1.2-2.0 SEK/kWh, SE4 (Malmö) ~1.3-2.2 SEK/kWh. Grid fees add 0.20-0.60 SEK/kWh. Energy tax is 0.392 SEK/kWh (2024). VAT is 25%.",
    category: "electricity",
    source: "Energimarknadsinspektionen",
  },
  {
    title: "Building Renovation Energy Requirements",
    content: "When renovating existing buildings in Sweden, BBR requires that energy performance must not worsen and should be improved where technically and economically feasible. Major renovations (ombyggnad) triggering more than 25% of the building envelope or systems must meet near-new-building energy requirements. The Swedish Energy Agency offers subsidies for energy efficiency improvements in rental buildings through programs like Energisteget.",
    category: "building_standards",
    source: "BBR 29, Energimyndigheten",
  },
  {
    title: "Indoor Temperature and Ventilation Standards",
    content: "Swedish building standards require indoor temperatures of 20-24°C during heating season. Ventilation must provide at least 0.35 l/s per m² of floor area. Many older Swedish buildings have over-ventilation leading to significant heat losses. Installing demand-controlled ventilation (DCV) can reduce heating energy by 15-30%. Ventilation heat recovery (FTX) systems should achieve at least 70% efficiency according to BBR.",
    category: "building_standards",
    source: "Folkhälsomyndighetens allmänna råd FoHMFS 2014:17",
  },
  {
    title: "Solar Energy Potential in Sweden",
    content: "Swedish buildings receive 900-1100 kWh/m² of solar irradiation annually. A typical rooftop solar PV installation in southern Sweden produces 900-1000 kWh per installed kWp per year, while northern Sweden sees 700-800 kWh/kWp. The Swedish government provides a 20% tax deduction for green technology installations including solar panels. Net metering allows surplus electricity to be credited against consumption up to 30,000 kWh annually with a tax reduction of 0.60 SEK/kWh.",
    category: "renewable_energy",
    source: "Skatteverket, Energimyndigheten",
  },
  {
    title: "Water Conservation in Swedish Buildings",
    content: "Average water consumption in Swedish households is 140 liters per person per day. Hot water accounts for about 20% of total energy use in residential buildings. Low-flow fixtures can reduce hot water energy by 30-40%. Modern dishwashers and washing machines use 40-60% less water than models from 10 years ago. Water heating to 60°C from 10°C requires approximately 58 kWh per m³.",
    category: "water_energy",
    source: "Svenskt Vatten",
  },
  {
    title: "Swedish Tenant Rights and Energy Costs",
    content: "In Swedish rental law (hyreslagen), tenants generally cannot be charged separately for heating in apartments with collective heating systems. However, individual metering is allowed and increasingly common in new buildings. Landlords must maintain indoor temperatures of at least 20°C. Tenants can request rent reductions if the landlord fails to maintain adequate heating. Green lease agreements can override some default rules if both parties agree.",
    category: "tenant_rights",
    source: "Jordabalken 12 kap (Hyreslagen)",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // LangChain OpenAI Embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
    });

    // Check if regulations are already embedded
    const { count } = await supabase
      .from("regulation_embeddings")
      .select("*", { count: "exact", head: true });

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ message: `Regulations already embedded (${count} chunks)`, skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { title: string; status: string }[] = [];

    // Use LangChain embeddings.embedDocuments for batch embedding
    const texts = SWEDISH_REGULATIONS.map((r) => `${r.title}\n\n${r.content}`);
    const allEmbeddings = await embeddings.embedDocuments(texts);

    for (let i = 0; i < SWEDISH_REGULATIONS.length; i++) {
      const reg = SWEDISH_REGULATIONS[i];
      try {
        const { error } = await supabase.from("regulation_embeddings").insert({
          title: reg.title,
          content: reg.content,
          category: reg.category,
          source: reg.source,
          embedding: allEmbeddings[i] as any,
        });

        if (error) throw error;
        results.push({ title: reg.title, status: "ok" });
      } catch (e) {
        results.push({ title: reg.title, status: `error: ${e instanceof Error ? e.message : "unknown"}` });
      }
    }

    return new Response(
      JSON.stringify({ message: `Embedded ${results.filter((r) => r.status === "ok").length} regulation chunks`, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("embed-regulations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
