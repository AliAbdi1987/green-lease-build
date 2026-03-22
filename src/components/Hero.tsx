import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-hero-bg overflow-hidden">
      {/* Grain overlay */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" />
      
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-hero-accent/5 blur-3xl pointer-events-none" />

      <div className="container relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-hero-muted/20 bg-hero-muted/10 px-5 py-2 text-sm text-hero-muted mb-10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-hero-accent animate-pulse" />
            Built World Hackathon 2025
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display leading-[0.95] mb-8 text-hero-foreground">
            Smarter buildings.
            <br />
            <span className="italic text-hero-accent">Circular</span> materials.
          </h1>

          <p className="text-lg md:text-xl text-hero-muted max-w-xl mx-auto mb-14 leading-relaxed font-sans">
            AI-powered tools that help tenants and landlords cut energy costs,
            reduce emissions, and give renovation waste a second life.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="#green-lease"
              onClick={(e) => {
                if (window.location.hash === "#green-lease") {
                  e.preventDefault();
                  window.dispatchEvent(new HashChangeEvent("hashchange"));
                  document.getElementById("green-lease")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 rounded-full bg-hero-foreground px-8 py-4 text-hero-bg font-sans font-semibold text-base transition-all hover:shadow-2xl hover:shadow-hero-accent/10"
            >
              Green Lease Coach
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
            <motion.a
              href="#circularity"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 rounded-full border border-hero-muted/30 px-8 py-4 text-hero-foreground font-sans font-semibold text-base transition-all hover:bg-hero-muted/10"
            >
              Circularity Assistant
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <a href="#green-lease" className="text-hero-muted/50 hover:text-hero-muted transition-colors">
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
