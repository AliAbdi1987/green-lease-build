import { useState } from "react";
import { motion } from "framer-motion";
import { Recycle, Camera, Package, TrendingUp, Truck, ChevronRight, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MaterialItem {
  name: string;
  condition: string;
  resaleValue: string;
  co2Saved: string;
  status: "listed" | "pending" | "picked-up";
  image: string;
}

const mockItems: MaterialItem[] = [
  { name: "Solid Oak Interior Door (2x)", condition: "Good – minor scratches", resaleValue: "1,800 SEK", co2Saved: "45 kg", status: "listed", image: "🚪" },
  { name: "IKEA PAX Wardrobe Frame", condition: "Good – needs reassembly", resaleValue: "900 SEK", co2Saved: "32 kg", status: "pending", image: "🗄️" },
  { name: "Porcelain Sink + Faucet", condition: "Excellent", resaleValue: "650 SEK", co2Saved: "18 kg", status: "listed", image: "🚰" },
  { name: "Kitchen Cabinet Set (8 units)", condition: "Fair – paint chips", resaleValue: "2,200 SEK", co2Saved: "85 kg", status: "picked-up", image: "🗃️" },
];

const statusStyles = {
  listed: "bg-tag-green-bg text-tag-green-text",
  pending: "bg-tag-amber-bg text-tag-amber-text",
  "picked-up": "bg-muted text-muted-foreground",
};

const statusLabels = {
  listed: "Listed",
  pending: "Pickup scheduled",
  "picked-up": "Picked up ✓",
};

const MaterialsCircularity = () => {
  const [step, setStep] = useState<"upload" | "results">("upload");
  const [photoCount, setPhotoCount] = useState(0);

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
                    {photoCount > 0 ? `${photoCount} photo(s) selected` : "Upload photos of doors, fixtures, cabinets…"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setPhotoCount(e.target.files?.length || 0)}
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
                />
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-foreground mb-2">Location</label>
                <Input type="text" placeholder="e.g. Södermalm, Stockholm" className="bg-background h-11" />
              </div>

              <Button
                onClick={() => setStep("results")}
                className="w-full h-12 text-base font-sans font-semibold rounded-xl bg-metric-amber text-white hover:bg-metric-amber/90"
              >
                Identify & Estimate Value
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Summary metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-tag-green-bg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-metric-green" />
                </div>
                <p className="text-2xl font-display text-foreground">5,550 SEK</p>
                <p className="text-sm text-muted-foreground font-sans">Total resale value</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Recycle className="w-5 h-5 text-metric-blue" />
                </div>
                <p className="text-2xl font-display text-foreground">180 kg</p>
                <p className="text-sm text-muted-foreground font-sans">CO₂ saved from landfill</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-tag-amber-bg flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-5 h-5 text-metric-amber" />
                </div>
                <p className="text-2xl font-display text-foreground">4</p>
                <p className="text-sm text-muted-foreground font-sans">Items identified</p>
              </div>
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl border border-border p-5 flex gap-4 hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                    {item.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-sans font-semibold text-foreground text-sm">{item.name}</h4>
                      <span className={`text-xs font-sans font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusStyles[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-sans mb-2">{item.condition}</p>
                    <div className="flex gap-4 text-sm font-sans">
                      <span className="font-semibold text-metric-green">{item.resaleValue}</span>
                      <span className="text-muted-foreground">-{item.co2Saved} CO₂</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1 h-12 font-sans rounded-xl">
                <ImagePlus className="w-4 h-4 mr-2" />
                Generate Marketplace Listings
              </Button>
              <Button variant="outline" className="flex-1 h-12 font-sans rounded-xl">
                <Truck className="w-4 h-4 mr-2" />
                Schedule Pickups
              </Button>
              <Button variant="ghost" className="text-muted-foreground font-sans" onClick={() => setStep("upload")}>
                ← New Scan
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default MaterialsCircularity;
