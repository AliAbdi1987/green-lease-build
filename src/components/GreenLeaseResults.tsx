import { motion } from "framer-motion";
import { Zap, Leaf, FileText, Mail, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recommendations } from "./GreenLeaseCoach";

const priorityStyles = {
  low: "bg-tag-green-bg text-tag-green-text",
  medium: "bg-tag-amber-bg text-tag-amber-text",
  high: "bg-tag-red-bg text-tag-red-text",
};

const responsibleLabels = {
  tenant: "You",
  landlord: "Landlord",
  shared: "Shared",
};

interface Props {
  results: Recommendations;
  onReset: () => void;
}

const GreenLeaseResults = ({ results, onReset }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-tag-amber-bg flex items-center justify-center mx-auto mb-3">
            <Zap className="w-5 h-5 text-metric-amber" />
          </div>
          <p className="text-2xl font-display text-foreground">
            {results.total_savings_sek_month.toLocaleString()} SEK
          </p>
          <p className="text-sm text-muted-foreground font-sans">Potential monthly savings</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-tag-green-bg flex items-center justify-center mx-auto mb-3">
            <Leaf className="w-5 h-5 text-metric-green" />
          </div>
          <p className="text-2xl font-display text-foreground">
            {results.total_co2_kg_year.toLocaleString()} kg
          </p>
          <p className="text-sm text-muted-foreground font-sans">CO₂ reduction per year</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 text-metric-blue" />
          </div>
          <p className="text-2xl font-display text-foreground">{results.actions.length}</p>
          <p className="text-sm text-muted-foreground font-sans">Recommended actions</p>
        </div>
      </div>

      {/* Actions list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-display text-foreground">Top Actions</h3>
          <p className="text-sm text-muted-foreground font-sans mt-1">Sorted by lowest cost first</p>
        </div>
        <div className="divide-y divide-border">
          {results.actions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 flex items-center gap-4 hover:bg-accent/30 transition-colors"
            >
              <span className="text-base font-sans font-semibold text-muted-foreground w-8">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-foreground">{action.title}</p>
                <p className="text-sm text-muted-foreground font-sans">
                  Cost: {action.cost_description} · {responsibleLabels[action.responsible]}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-sans font-semibold text-metric-green">
                  {action.savings_sek_month.toLocaleString()} SEK/mo
                </p>
                <p className="text-xs text-muted-foreground font-sans">
                  -{action.co2_kg_year} kg CO₂/yr
                </p>
              </div>
              <span className={`text-xs font-sans font-semibold px-2.5 py-1 rounded-full shrink-0 ${priorityStyles[action.priority]}`}>
                {action.priority}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Green lease clauses */}
      {results.green_lease_clauses.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-display text-foreground">Suggested Green Lease Clauses</h3>
          </div>
          <div className="divide-y divide-border">
            {results.green_lease_clauses.map((clause, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="p-5"
              >
                <p className="font-sans font-medium text-foreground mb-1">"{clause.clause}"</p>
                <p className="text-sm text-muted-foreground font-sans">{clause.explanation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" className="flex-1 h-12 font-sans rounded-xl">
          <Mail className="w-4 h-4 mr-2" />
          Draft Email to Landlord
        </Button>
        <Button variant="ghost" className="text-muted-foreground font-sans" onClick={onReset}>
          ← New Analysis
        </Button>
      </div>
    </motion.div>
  );
};

export default GreenLeaseResults;
