import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, ChevronRight, Building2, ThermometerSun, Receipt, Upload, X, FileText } from "lucide-react";
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
      // Upload files if any
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
            Start with your energy bills — we'll predict savings and recommend actions
            with cost estimates, fair lease clauses, and ready-to-send emails.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Energy Bills", "Building Info", "Results"].map((label, i) => {
            const stepIndex = i === 0 ? "bills" : i === 1 ? "building" : "results";
            const currentIndex = step === "bills" ? 0 : step === "building" ? 1 : 2;
            const isActive = i <= currentIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-0.5 ${isActive ? "bg-primary" : "bg-border"}`} />}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-sm max-w-2xl mx-auto"
            >
              <div className="space-y-6">
                <div className="text-center mb-2">
                  <Receipt className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-display font-semibold text-foreground">
                    Your Energy Bills
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload recent bills or enter your average monthly amount
                  </p>
                </div>

                {/* Average bill input */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Average monthly bill (last 6 months, SEK)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 2500"
                    className="bg-background text-lg"
                    value={avgBillSek}
                    onChange={(e) => setAvgBillSek(e.target.value)}
                  />
                </div>

                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">OR UPLOAD BILLS</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* File upload area */}
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      Click to upload energy bills
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG — up to 6 files
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleBillsNext}
                  className="w-full py-6 text-lg font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next: Building Details
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "building" && (
            <motion.div
              key="building"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-sm max-w-2xl mx-auto"
            >
              <div className="space-y-6">
                {/* Summary of bill info */}
                <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {avgBillSek ? `~${Number(avgBillSek).toLocaleString()} SEK/month` : ""}
                      {avgBillSek && uploadedFiles.length > 0 ? " + " : ""}
                      {uploadedFiles.length > 0 ? `${uploadedFiles.length} bill(s) uploaded` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("bills")}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Edit
                  </button>
                </div>

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
          )}

          {step === "results" && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
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
