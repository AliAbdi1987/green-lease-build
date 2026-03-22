import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel: string;
  color: "green" | "blue" | "amber";
  delay?: number;
}

const iconColorMap = {
  green: "text-metric-green",
  blue: "text-metric-blue",
  amber: "text-metric-amber",
};

const bgMap = {
  green: "bg-tag-green-bg",
  blue: "bg-secondary",
  amber: "bg-tag-amber-bg",
};

const MetricCard = ({ icon: Icon, label, value, sublabel, color, delay = 0 }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="rounded-2xl bg-card border border-border p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${bgMap[color]}`}>
        <Icon className={`w-5 h-5 ${iconColorMap[color]}`} />
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-sans font-medium mb-2">{label}</p>
      <p className="text-3xl font-display text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-sans">{sublabel}</p>
    </motion.div>
  );
};

export default MetricCard;
