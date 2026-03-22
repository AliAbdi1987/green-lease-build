import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Leaf, FileText, Mail, Scale, Copy, Check, ExternalLink, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
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
  agentSteps?: any[];
}

function generateEmailDraft(results: Recommendations): { subject: string; body: string } {
  const landlordActions = results.actions.filter(
    (a) => a.responsible === "landlord" || a.responsible === "shared"
  );

  const subject = `Energy Efficiency Improvements – Potential ${results.total_savings_sek_month.toLocaleString()} SEK/month Savings`;

  const actionsList = landlordActions.length > 0
    ? landlordActions
        .map(
          (a, i) =>
            `${i + 1}. ${a.title}\n   Estimated savings: ${a.savings_sek_month.toLocaleString()} SEK/month | CO₂ reduction: ${a.co2_kg_year} kg/year\n   Estimated cost: ${a.cost_description}\n   Priority: ${a.priority}`
        )
        .join("\n\n")
    : results.actions
        .slice(0, 5)
        .map(
          (a, i) =>
            `${i + 1}. ${a.title}\n   Estimated savings: ${a.savings_sek_month.toLocaleString()} SEK/month | CO₂ reduction: ${a.co2_kg_year} kg/year\n   Estimated cost: ${a.cost_description}`
        )
        .join("\n\n");

  const clausesSection =
    results.green_lease_clauses.length > 0
      ? `\n\nAs part of this initiative, I would also like to propose incorporating the following green lease clauses into our agreement:\n\n${results.green_lease_clauses
          .map((c, i) => `${i + 1}. "${c.clause}"\n   ${c.explanation}`)
          .join("\n\n")}`
      : "";

  const body = `Dear Landlord,

I hope this message finds you well. I am writing to discuss potential energy efficiency improvements for our building that could benefit both of us.

Based on a recent energy analysis, I have identified several opportunities that could reduce operating costs by up to ${results.total_savings_sek_month.toLocaleString()} SEK per month and cut CO₂ emissions by ${results.total_co2_kg_year.toLocaleString()} kg per year.

Here are the key recommendations that require your involvement:

${actionsList}
${clausesSection}

I believe these improvements would increase the property's value, reduce operating costs, and demonstrate our shared commitment to sustainability. I would welcome the opportunity to discuss these proposals at your convenience.

Thank you for your time and consideration.

Best regards,
[Your Name]`;

  return { subject, body };
}

const GreenLeaseResults = ({ results, onReset, agentSteps = [] }: Props) => {
  const [emailOpen, setEmailOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const { subject, body } = generateEmailDraft(results);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      toast.success("Email draft copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleMailto = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  };

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

      {/* Agent pipeline steps (collapsible) */}
      {agentSteps.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setStepsOpen(!stepsOpen)}
            className="w-full p-5 flex items-center gap-2 hover:bg-accent/30 transition-colors text-left"
          >
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-sans font-medium text-foreground flex-1">
              AI Agent Pipeline — {agentSteps.length} steps
            </span>
            {stepsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {stepsOpen && (
            <div className="border-t border-border divide-y divide-border">
              {agentSteps.map((s: any, i: number) => (
                <div key={i} className="p-4 text-xs font-sans">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">{i + 1}</span>
                    <span className="font-medium text-foreground">{s.step.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground ml-auto">{new Date(s.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-muted-foreground bg-muted/50 rounded-lg p-2 mt-1 overflow-x-auto whitespace-pre-wrap text-[11px]">
                    {JSON.stringify(s.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          className="flex-1 h-12 font-sans rounded-xl"
          onClick={() => setEmailOpen(true)}
        >
          <Mail className="w-4 h-4 mr-2" />
          Draft Email to Landlord
        </Button>
        <Button variant="ghost" className="text-muted-foreground font-sans" onClick={onReset}>
          ← New Analysis
        </Button>
      </div>

      {/* Email Draft Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Email Draft to Landlord</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-1">Subject</p>
              <p className="font-sans text-sm text-foreground bg-muted/50 rounded-lg p-3">{subject}</p>
            </div>
            <div>
              <p className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-1">Body</p>
              <pre className="font-sans text-sm text-foreground bg-muted/50 rounded-lg p-4 whitespace-pre-wrap leading-relaxed">
                {body}
              </pre>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-xl font-sans">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
              <Button onClick={handleMailto} className="flex-1 rounded-xl font-sans">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Email App
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default GreenLeaseResults;
