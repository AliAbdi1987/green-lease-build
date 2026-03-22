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
  "listed": "bg-leaf-light text-metric-green",
  "pending": "bg-warm-light text-metric-amber",
  "picked-up": "bg-muted text-muted-foreground",
};

const statusLabels = {
  "listed": "Listed",
  "pending": "Pickup scheduled",
  "picked-up": "Picked up ✓",
};

const MaterialsCircularity = () => {
  const [step, setStep] = useState<"upload" | "results">("upload");
  const [photoCount, setPhotoCount] = useState(0);

  return (
    <section id="circularity" className="py-24 bg-warm-light/40">
      <div className="container px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-warm/10 px-4 py-1.5 text-sm font-medium text-warm mb-4">
            <Recycle className="w-4 h-4" />
            Materials Circularity Assistant
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Renovation waste → value recovered.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Photos of materials
                </label>
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-warm/40 transition-colors cursor-pointer p-8 bg-background">
                  <Camera className="w-8 h-8 text-muted-foreground mb-3" />
                  <span className="text-sm text-muted-foreground">
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Package className="w-4 h-4 inline mr-1" /> Short description
                </label>
                <Textarea
                  placeholder="e.g. Kitchen renovation — removing oak cabinets, porcelain sink, 2 interior doors. All in good condition."
                  className="bg-background min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                <Input type="text" placeholder="e.g. Södermalm, Stockholm" className="bg-background" />
              </div>

              <Button
                onClick={() => setStep("results")}
                className="w-full py-6 text-lg font-display font-semibold bg-warm text-primary-foreground hover:bg-warm/90"
              >
                Identify & Estimate Value
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
            {/* Summary metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <TrendingUp className="w-8 h-8 text-metric-green mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">5,550 SEK</p>
                <p className="text-sm text-muted-foreground">Total resale value</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <Recycle className="w-8 h-8 text-metric-blue mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">180 kg</p>
                <p className="text-sm text-muted-foreground">CO₂ saved from landfill</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <Truck className="w-8 h-8 text-metric-amber mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">4</p>
                <p className="text-sm text-muted-foreground">Items identified</p>
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
                  className="bg-card rounded-xl border border-border p-5 flex gap-4"
                >
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-3xl shrink-0">
                    {item.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-display font-semibold text-foreground">{item.name}</h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${statusStyles[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.condition}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="font-medium text-metric-green">{item.resaleValue}</span>
                      <span className="text-muted-foreground">-{item.co2Saved} CO₂</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1 py-5 font-display">
                <ImagePlus className="w-4 h-4 mr-2" />
                Generate Marketplace Listings
              </Button>
              <Button variant="outline" className="flex-1 py-5 font-display">
                <Truck className="w-4 h-4 mr-2" />
                Schedule Pickups
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setStep("upload")}
              >
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
