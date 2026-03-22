import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, ChevronRight, Building2, ThermometerSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GreenLeaseResults from "./GreenLeaseResults";

export interface RecommendationAction {
  title: string;
  savings_sek_month: number;
  co2_kg_year: number;
  cost_description: string;
  priority: "low" | "medium" | "high";
  responsible: "tenant" | "landlord" | "shared";
}

export interface GreenLeaseClauses {
  clause: string;
  explanation: string;
}

export interface Recommendations {
  actions: RecommendationAction[];
  total_savings_sek_month: number;
  total_co2_kg_year: number;
  green_lease_clauses: GreenLeaseClauses[];
}

const GreenLeaseCoach = () => {
  const [step, setStep] = useState<"upload" | "results">("upload");
  const [sizeSqm, setSizeSqm] = useState("");
  const [heatingType, setHeatingType] = useState("");
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendations | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!sizeSqm || !heatingType) {
      toast({ title: "Missing info", description: "Please fill in building size and heating type.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-actions", {
        body: { sizeSqm: Number(sizeSqm), heatingType, postcode },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResults(data);
      setStep("results");
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="green-lease" className="py-24 bg-emerald-light/40">
      <div className="container px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Leaf className="w-4 h-4" />
            Green Lease Coach
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Cut energy bills. Reduce emissions.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your building info — get personalized actions with cost estimates,
            fair lease clauses, and ready-to-send emails.
          </p>
        </motion.div>

        {step === "upload" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-sm max-w-2xl mx-auto"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" /> Building Size (m²)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 85"
                    className="bg-background"
                    value={sizeSqm}
                    onChange={(e) => setSizeSqm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <ThermometerSun className="w-4 h-4 inline mr-1" /> Heating Type
                  </label>
                  <Select value={heatingType} onValueChange={setHeatingType}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="district">District Heating</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="heat-pump">Heat Pump</SelectItem>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Postcode / Location</label>
                <Input
                  type="text"
                  placeholder="e.g. 114 28 Stockholm"
                  className="bg-background"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-6 text-lg font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Analyzing with AI…
                  </span>
                ) : (
                  <>
                    Analyze & Get Recommendations
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : results ? (
          <GreenLeaseResults results={results} onReset={() => setStep("upload")} />
        ) : null}
      </div>
    </section>
  );
};

export default GreenLeaseCoach;
