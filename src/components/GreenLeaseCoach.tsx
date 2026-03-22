import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Building2, ThermometerSun, Receipt, Upload, X, FileText } from "lucide-react";
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
  const [step, setStep] = useState<"bills" | "building" | "results">("bills");
  const [avgBillSek, setAvgBillSek] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sizeSqm, setSizeSqm] = useState("");
  const [heatingType, setHeatingType] = useState("");
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendations | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedFiles.length + files.length > 6) {
      toast({ title: "Too many files", description: "Maximum 6 bills allowed.", variant: "destructive" });
      return;
    }
    setUploadedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBillsNext = () => {
    if (!avgBillSek && uploadedFiles.length === 0) {
      toast({ title: "Missing bill info", description: "Please enter your average bill amount or upload bills.", variant: "destructive" });
      return;
    }
    setStep("building");
  };

  const handleAnalyze = async () => {
    if (!sizeSqm || !heatingType) {
      toast({ title: "Missing info", description: "Please fill in building size and heating type.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const fileUrls: string[] = [];
      for (const file of uploadedFiles) {
        const filePath = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("bills").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("bills").getPublicUrl(filePath);
        fileUrls.push(urlData.publicUrl);
      }

      const { data, error } = await supabase.functions.invoke("recommend-actions", {
        body: {
          sizeSqm: Number(sizeSqm),
          heatingType,
          postcode,
          avgBillSek: avgBillSek ? Number(avgBillSek) : undefined,
          billFileUrls: fileUrls.length > 0 ? fileUrls : undefined,
        },
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

  const handleReset = () => {
    setStep("bills");
    setAvgBillSek("");
    setUploadedFiles([]);
    setSizeSqm("");
    setHeatingType("");
    setPostcode("");
    setResults(null);
  };

  const steps = ["Energy Bills", "Building Info", "Results"];
  const currentIndex = step === "bills" ? 0 : step === "building" ? 1 : 2;

  return (
    <section id="green-lease" className="py-28 bg-section-alt">
      <div className="container px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-sans font-medium text-primary uppercase tracking-wider mb-3">Green Lease Coach</p>
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            Cut energy bills. <span className="italic text-primary">Reduce emissions.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            Start with your energy bills — we'll predict savings and recommend actions
            with cost estimates, fair lease clauses, and ready-to-send emails.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {steps.map((label, i) => {
            const isActive = i <= currentIndex;
            return (
              <div key={label} className="flex items-center gap-3">
                {i > 0 && <div className={`w-10 h-px transition-colors ${isActive ? "bg-primary" : "bg-border"}`} />}
                <div className={`flex items-center gap-2 text-sm font-sans font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === "bills" && (
            <motion.div
              key="bills"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-sm max-w-2xl mx-auto"
            >
              <div className="space-y-6">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 rounded-xl bg-tag-amber-bg flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-6 h-6 text-metric-amber" />
                  </div>
                  <h3 className="text-2xl font-display text-foreground">Your Energy Bills</h3>
                  <p className="text-sm text-muted-foreground mt-2 font-sans">
                    Upload recent bills or enter your average monthly amount
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium text-foreground mb-2">
                    Average monthly bill (last 6 months, SEK)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 2500"
                    className="bg-background text-lg h-12"
                    value={avgBillSek}
                    onChange={(e) => setAvgBillSek(e.target.value)}
                  />
                </div>

                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-sans font-medium uppercase tracking-wider">or upload bills</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/50 transition-all"
                >
                  <Upload className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-sans font-medium text-foreground">Click to upload energy bills</p>
                  <p className="text-xs text-muted-foreground mt-1 font-sans">PDF, JPG, PNG — up to 6 files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 bg-accent/50 rounded-lg px-4 py-2.5">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground truncate flex-1 font-sans">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0 font-sans">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={handleBillsNext} className="w-full h-12 text-base font-sans font-semibold rounded-xl">
                  Next: Building Details
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "building" && (
            <motion.div
              key="building"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-sm max-w-2xl mx-auto"
            >
              <div className="space-y-6">
                <div className="bg-accent/50 rounded-xl p-4 flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans font-medium text-foreground">
                      {avgBillSek ? `~${Number(avgBillSek).toLocaleString()} SEK/month` : ""}
                      {avgBillSek && uploadedFiles.length > 0 ? " + " : ""}
                      {uploadedFiles.length > 0 ? `${uploadedFiles.length} bill(s) uploaded` : ""}
                    </p>
                  </div>
                  <button onClick={() => setStep("bills")} className="text-xs font-sans text-primary hover:underline shrink-0">
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-sans font-medium text-foreground mb-2">
                      <Building2 className="w-4 h-4 inline mr-1.5" /> Building Size (m²)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 85"
                      className="bg-background h-11"
                      value={sizeSqm}
                      onChange={(e) => setSizeSqm(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-sans font-medium text-foreground mb-2">
                      <ThermometerSun className="w-4 h-4 inline mr-1.5" /> Heating Type
                    </label>
                    <Select value={heatingType} onValueChange={setHeatingType}>
                      <SelectTrigger className="bg-background h-11">
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
                  <label className="block text-sm font-sans font-medium text-foreground mb-2">Postcode / Location</label>
                  <Input
                    type="text"
                    placeholder="e.g. 114 28 Stockholm"
                    className="bg-background h-11"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full h-12 text-base font-sans font-semibold rounded-xl"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Analyzing with AI…
                    </span>
                  ) : (
                    <>
                      Analyze & Get Recommendations
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "results" && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <GreenLeaseResults results={results} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default GreenLeaseCoach;
