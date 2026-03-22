import { Leaf } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12 bg-card">
    <div className="container px-6 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 font-display font-bold text-lg">
        <Leaf className="w-5 h-5 text-primary" />
        <span className="text-primary">Green</span>
        <span className="text-foreground">Cycle</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Built at LangChain × Lovable Hackathon Stockholm 2025
      </p>
    </div>
  </footer>
);

export default Footer;
