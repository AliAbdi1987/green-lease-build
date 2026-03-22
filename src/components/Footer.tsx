import { motion } from "framer-motion";

const Footer = () => (
  <footer className="relative border-t border-border py-14 bg-hero-bg overflow-hidden">
    {/* Subtle glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-hero-accent/5 blur-[100px] pointer-events-none" />

    <div className="container px-6 max-w-5xl relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="font-display text-2xl text-hero-foreground"
      >
        Green<span className="italic text-hero-accent">Cycle</span>
      </motion.div>
      <p className="text-sm text-hero-muted font-sans">
        Built at LangChain × Lovable Hackathon Stockholm 2025
      </p>
    </div>
  </footer>
);

export default Footer;
