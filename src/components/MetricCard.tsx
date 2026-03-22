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

const colorMap = {
  green: "bg-leaf-light text-metric-green",
  blue: "bg-blue-50 text-metric-blue",
  amber: "bg-warm-light text-metric-amber",
};

const iconColorMap = {
  green: "text-metric-green",
  blue: "text-metric-blue",
  amber: "text-metric-amber",
};

const MetricCard = ({ icon: Icon, label, value, sublabel, color, delay = 0 }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="rounded-xl bg-card border border-border p-6 flex flex-col items-center text-center"
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className={`w-6 h-6 ${iconColorMap[color]}`} />
      </div>
      <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-3xl font-display font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
    </motion.div>
  );
};

export default MetricCard;
