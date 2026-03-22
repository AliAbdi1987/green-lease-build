import { motion } from "framer-motion";
import { Leaf, Recycle, Zap, TrendingUp } from "lucide-react";
import MetricCard from "./MetricCard";

const Dashboard = () => {
  return (
    <section id="dashboard" className="py-24">
      <div className="container px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Your Impact at a Glance
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Combined savings from energy optimization and materials reuse.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <MetricCard
            icon={Zap}
            label="Energy Saved"
            value="2,280"
            sublabel="SEK / month"
            color="amber"
            delay={0}
          />
          <MetricCard
            icon={Leaf}
            label="CO₂ Avoided"
            value="558"
            sublabel="kg / year"
            color="green"
            delay={0.1}
          />
          <MetricCard
            icon={TrendingUp}
            label="SEK Recovered"
            value="5,550"
            sublabel="from materials"
            color="blue"
            delay={0.2}
          />
          <MetricCard
            icon={Recycle}
            label="Items Diverted"
            value="4"
            sublabel="from landfill"
            color="green"
            delay={0.3}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl border border-border p-8 text-center"
        >
          <p className="text-muted-foreground mb-2">Combined annual impact equivalent to</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div>
              <p className="text-3xl font-display font-bold text-primary">🌳 28</p>
              <p className="text-sm text-muted-foreground">trees planted</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div>
              <p className="text-3xl font-display font-bold text-primary">🚗 2,200 km</p>
              <p className="text-sm text-muted-foreground">driving offset</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div>
              <p className="text-3xl font-display font-bold text-primary">32,910 SEK</p>
              <p className="text-sm text-muted-foreground">total value / year</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Dashboard;
