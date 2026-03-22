import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-hero-bg overflow-hidden">
      {/* Grain overlay */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* Animated mesh gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="mesh-gradient-1 absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-hero-accent/8 blur-[120px]" />
        <div className="mesh-gradient-2 absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-metric-blue/5 blur-[100px]" />
        <div className="mesh-gradient-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-hero-accent/6 blur-[150px]" />
      </div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[15%] w-20 h-20 rounded-2xl border border-hero-muted/10 bg-hero-accent/5 backdrop-blur-sm hidden lg:block"
      />
      <motion.div
        animate={{ y: [10, -15, 10], rotate: [0, -3, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[30%] left-[10%] w-16 h-16 rounded-full border border-hero-muted/10 bg-hero-accent/5 backdrop-blur-sm hidden lg:block"
      />
      <motion.div
        animate={{ y: [-5, 12, -5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[35%] left-[20%] w-3 h-3 rounded-full bg-hero-accent/30 hidden lg:block"
      />
      <motion.div
        animate={{ y: [8, -8, 8] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[40%] right-[20%] w-2 h-2 rounded-full bg-metric-amber/30 hidden lg:block"
      />

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
            className="inline-flex items-center gap-2 rounded-full border border-hero-muted/20 bg-hero-muted/10 backdrop-blur-sm px-5 py-2 text-sm text-hero-muted mb-10"
          >
            <Sparkles className="w-3.5 h-3.5 text-hero-accent" />
            Built World Hackathon 2025
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display leading-[0.95] mb-8 text-hero-foreground">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="block"
            >
              Smarter buildings.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="block"
            >
              <span className="italic text-hero-accent relative">
                Circular
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
                  className="absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r from-hero-accent/60 to-transparent"
                />
              </span>{" "}
              materials.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-lg md:text-xl text-hero-muted max-w-xl mx-auto mb-14 leading-relaxed font-sans"
          >
            AI-powered tools that help tenants and landlords cut energy costs,
            reduce emissions, and give renovation waste a second life.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a
              href="#green-lease"
              onClick={(e) => {
                if (window.location.hash === "#green-lease") {
                  e.preventDefault();
                  window.dispatchEvent(new HashChangeEvent("hashchange"));
                  document.getElementById("green-lease")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              whileHover={{ scale: 1.03, boxShadow: "0 0 30px hsla(155, 70%, 45%, 0.2)" }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-hero-foreground to-hero-foreground/90 px-8 py-4 text-hero-bg font-sans font-semibold text-base transition-all shadow-lg shadow-hero-accent/5"
            >
              Green Lease Coach
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
            <motion.a
              href="#circularity"
              onClick={() => window.dispatchEvent(new CustomEvent("reset-circularity"))}
              whileHover={{ scale: 1.03, backgroundColor: "hsla(155, 15%, 55%, 0.15)" }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 rounded-full border border-hero-muted/30 backdrop-blur-sm px-8 py-4 text-hero-foreground font-sans font-semibold text-base transition-all"
            >
              Circularity Assistant
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
          </motion.div>
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
