import { motion } from "framer-motion";
import { Leaf, Recycle, ArrowDown } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-light px-4 py-1.5 text-sm font-medium text-primary">
              <Leaf className="w-4 h-4" />
              Built World Hackathon 2025
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-primary">Green</span>
            <span className="text-foreground">Cycle</span>
            <span className="text-muted-foreground font-normal text-3xl md:text-4xl block mt-2">
              Smarter buildings. Circular materials.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-powered tools that help tenants and landlords cut energy costs, reduce emissions,
            and give renovation waste a second life.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="#green-lease"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 rounded-lg bg-primary px-8 py-4 text-primary-foreground font-display font-semibold text-lg shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/30"
            >
              <Leaf className="w-5 h-5" />
              Green Lease Coach
            </motion.a>
            <motion.a
              href="#circularity"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 rounded-lg bg-warm px-8 py-4 text-primary-foreground font-display font-semibold text-lg shadow-lg shadow-warm/20 transition-shadow hover:shadow-xl hover:shadow-warm/30"
            >
              <Recycle className="w-5 h-5" />
              Circularity Assistant
            </motion.a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ArrowDown className="w-6 h-6 text-muted-foreground animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
