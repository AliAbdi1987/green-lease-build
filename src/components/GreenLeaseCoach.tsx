import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Leaf, Zap, FileText, Mail, ChevronRight, Building2, ThermometerSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Action {
  title: string;
  savings: string;
  co2: string;
  cost: string;
  priority: "low" | "medium" | "high";
}

const mockActions: Action[] = [
  { title: "Switch to LED lighting throughout", savings: "320 SEK/mo", co2: "45 kg/yr", cost: "Free – 2,000 SEK", priority: "low" },
  { title: "Install thermostatic radiator valves", savings: "480 SEK/mo", co2: "85 kg/yr", cost: "1,500 SEK", priority: "low" },
  { title: "Seal window drafts with weatherstripping", savings: "250 SEK/mo", co2: "35 kg/yr", cost: "500 SEK", priority: "low" },
  { title: "Request landlord attic insulation upgrade", savings: "650 SEK/mo", co2: "120 kg/yr", cost: "Landlord responsibility", priority: "medium" },
  { title: "Optimize ventilation schedule", savings: "180 SEK/mo", co2: "28 kg/yr", cost: "Free", priority: "low" },
  { title: "Install smart thermostat", savings: "400 SEK/mo", co2: "65 kg/yr", cost: "2,500 SEK", priority: "medium" },
];

const priorityStyles = {
  low: "bg-leaf-light text-metric-green",
  medium: "bg-warm-light text-metric-amber",
  high: "bg-red-50 text-destructive",
};

const GreenLeaseCoach = () => {
  const [step, setStep] = useState<"upload" | "results">("upload");
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files[0].name);
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
            Upload your energy bill and building info — get personalized actions with cost estimates, 
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
              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Energy Bill (PDF)</label>
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer p-8 bg-background">
                  <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                  <span className="text-sm text-muted-foreground">
                    {fileName || "Drop your energy bill here or click to browse"}
                  </span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {/* Building info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" /> Building Size (m²)
                  </label>
                  <Input type="number" placeholder="e.g. 85" className="bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <ThermometerSun className="w-4 h-4 inline mr-1" /> Heating Type
                  </label>
                  <Select>
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
                <label className="block text-sm font-medium text-foreground mb-2">Postcode / Climate Zone</label>
                <Input type="text" placeholder="e.g. 114 28 Stockholm" className="bg-background" />
              </div>

              <Button
                onClick={() => setStep("results")}
                className="w-full py-6 text-lg font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Analyze & Get Recommendations
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <Zap className="w-8 h-8 text-metric-amber mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">2,280 SEK</p>
                <p className="text-sm text-muted-foreground">Potential monthly savings</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <Leaf className="w-8 h-8 text-metric-green mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">378 kg</p>
                <p className="text-sm text-muted-foreground">CO₂ reduction per year</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <FileText className="w-8 h-8 text-metric-blue mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">6</p>
                <p className="text-sm text-muted-foreground">Recommended actions</p>
              </div>
            </div>

            {/* Actions list */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-display font-semibold">Top Actions (lowest cost first)</h3>
              </div>
              <div className="divide-y divide-border">
                {mockActions.map((action, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-lg font-display font-bold text-muted-foreground w-8">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{action.title}</p>
                      <p className="text-sm text-muted-foreground">Cost: {action.cost}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-semibold text-metric-green">{action.savings}</p>
                      <p className="text-xs text-muted-foreground">-{action.co2} CO₂</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${priorityStyles[action.priority]}`}>
                      {action.priority}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1 py-5 font-display">
                <FileText className="w-4 h-4 mr-2" />
                Generate Green Lease Clauses
              </Button>
              <Button variant="outline" className="flex-1 py-5 font-display">
                <Mail className="w-4 h-4 mr-2" />
                Draft Email to Landlord
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setStep("upload")}
              >
                ← New Analysis
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default GreenLeaseCoach;
