import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Recycle, Camera, Package, TrendingUp, Truck, ChevronRight, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SchedulePickup from "@/components/SchedulePickup";

interface IdentifiedItem {
  name: string;
  disposition: "reuse" | "recycle";
  disposition_reason: string;
  condition_rating: string;
  condition_notes: string;
  estimated_value_sek: number;
  co2_saved_kg: number;
  description: string;
  listing_text?: string;
  recycling_suggestion?: string;
}

interface IdentifyResult {
  items: IdentifiedItem[];
  total_reuse_value_sek: number;
  total_co2_saved_kg: number;
  reuse_count: number;
  recycle_count: number;
  summary?: string;
}

const dispositionStyles = {
  reuse: "bg-tag-green-bg text-tag-green-text",
  recycle: "bg-tag-amber-bg text-tag-amber-text",
};

const itemEmojis: Record<string, string> = {
  door: "🚪", cabinet: "🗃️", sink: "🚰", faucet: "🚰", wardrobe: "🗄️",
  window: "🪟", radiator: "🔲", floor: "🪵", light: "💡", toilet: "🚽",
};

function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(itemEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return "📦";
}

const MaterialsCircularity = () => {
  const [step, setStep] = useState<"upload" | "loading" | "results">("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<IdentifyResult | null>(null);

  const resetScan = useCallback(() => {
    setStep("upload");
    setFiles([]);
    setResult(null);
    setDescription("");
    setLocation("");
  }, []);

  useEffect(() => {
    const onReset = () => resetScan();
    window.addEventListener("reset-circularity", onReset);
    return () => window.removeEventListener("reset-circularity", onReset);
  }, [resetScan]);
  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one photo.");
      return;
    }

    setStep("loading");

    try {
      // 1. Create a project for this scan
      const { data: project, error: projErr } = await supabase
        .from("projects")
        .insert({ name: location || "Salvage Scan" })
        .select("id")
        .single();
      if (projErr) throw projErr;

      // 2. Upload photos to storage
      const photoUrls: string[] = [];
      for (const file of files) {
        const path = `${project.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("salvage-photos")
          .upload(path, file);
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("salvage-photos")
          .getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }

      // 3. Call identify-salvage edge function
      const { data, error } = await supabase.functions.invoke("identify-salvage", {
        body: { photoUrls, description, location, projectId: project.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.identified);
      setStep("results");
      toast.success(`Identified ${data.identified.items.length} items!`);
    } catch (e: any) {
      console.error("Identification error:", e);
      toast.error(e.message || "Failed to identify items. Please try again.");
      setStep("upload");
    }
  };

  return (
    <section id="circularity" className="py-28 bg-background">
      <div className="container px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-sans font-medium text-metric-amber uppercase tracking-wider mb-3">Circularity Assistant</p>
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            Renovation waste → <span className="italic text-primary">value recovered.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            Photograph salvageable materials — AI identifies items, estimates resale value,
            generates listings, and coordinates pickups.
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
              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-2">Photos of materials</label>
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-accent/50 transition-all cursor-pointer p-10 bg-background">
                  <Camera className="w-7 h-7 text-muted-foreground mb-3" />
                  <span className="text-sm text-muted-foreground font-sans">
                    {files.length > 0 ? `${files.length} photo(s) selected` : "Upload photos of doors, fixtures, cabinets…"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-2">
                  <Package className="w-4 h-4 inline mr-1.5" /> Short description
                </label>
                <Textarea
                  placeholder="e.g. Kitchen renovation — removing oak cabinets, porcelain sink, 2 interior doors."
                  className="bg-background min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-2">Location</label>
                <Input
                  type="text"
                  placeholder="e.g. Södermalm, Stockholm"
                  className="bg-background h-11"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full h-12 text-base font-sans font-semibold rounded-xl bg-metric-amber text-white hover:bg-metric-amber/90"
              >
                Identify & Estimate Value
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        ) : step === "loading" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="w-10 h-10 text-metric-amber animate-spin mb-4" />
            <p className="text-lg font-sans text-muted-foreground">Analyzing photos with AI…</p>
            <p className="text-sm font-sans text-muted-foreground mt-1">Identifying items & estimating Swedish market prices</p>
          </motion.div>
        ) : result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Summary metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-tag-green-bg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-metric-green" />
                </div>
                <p className="text-2xl font-display text-foreground">
                  {(result.total_reuse_value_sek ?? 0).toLocaleString("sv-SE")} SEK
                </p>
                <p className="text-sm text-muted-foreground font-sans">Resale value (reuse)</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Recycle className="w-5 h-5 text-metric-blue" />
                </div>
                <p className="text-2xl font-display text-foreground">
                  {result.total_co2_saved_kg ?? 0} kg
                </p>
                <p className="text-sm text-muted-foreground font-sans">CO₂ saved</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-tag-green-bg flex items-center justify-center mx-auto mb-3">
                  <Package className="w-5 h-5 text-metric-green" />
                </div>
                <p className="text-2xl font-display text-foreground">{result.reuse_count ?? 0}</p>
                <p className="text-sm text-muted-foreground font-sans">Reusable items</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-tag-amber-bg flex items-center justify-center mx-auto mb-3">
                  <Recycle className="w-5 h-5 text-metric-amber" />
                </div>
                <p className="text-2xl font-display text-foreground">{result.recycle_count ?? 0}</p>
                <p className="text-sm text-muted-foreground font-sans">Recycle only</p>
              </div>
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl border border-border p-5 flex gap-4 hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                    {getEmoji(item.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-sans font-semibold text-foreground text-sm">{item.name}</h4>
                      <span className={`text-xs font-sans font-semibold px-2.5 py-1 rounded-full shrink-0 ${dispositionStyles[item.disposition]}`}>
                        {item.disposition === "reuse" ? "♻️ Reuse" : "🗑️ Recycle"}
                      </span>
                    </div>
                    <p className="text-xs text-primary font-sans font-medium mb-1">{item.disposition_reason}</p>
                    <p className="text-sm text-muted-foreground font-sans mb-2">{item.condition_notes}</p>
                    <div className="flex gap-4 text-sm font-sans">
                      {item.disposition === "reuse" ? (
                        <span className="font-semibold text-metric-green">
                          {(item.estimated_value_sek ?? 0).toLocaleString("sv-SE")} SEK
                        </span>
                      ) : (
                        <span className="font-semibold text-metric-amber">No resale value</span>
                      )}
                      <span className="text-muted-foreground">-{item.co2_saved_kg} kg CO₂</span>
                    </div>
                    {item.listing_text && item.disposition === "reuse" && (
                      <p className="text-xs text-muted-foreground font-sans mt-2 line-clamp-2 italic">
                        "{item.listing_text}"
                      </p>
                    )}
                    {item.recycling_suggestion && item.disposition === "recycle" && (
                      <p className="text-xs text-muted-foreground font-sans mt-2">
                        💡 {item.recycling_suggestion}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <SchedulePickup
                itemCount={result?.reuse_count ?? 0}
                location={location}
              />
              <Button
                variant="ghost"
                className="text-muted-foreground font-sans"
                onClick={resetScan}
              >
                ← New Scan
              </Button>
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
};

export default MaterialsCircularity;
