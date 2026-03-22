const Footer = () => (
  <footer className="border-t border-border py-10 bg-card">
    <div className="container px-6 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="font-display text-xl text-foreground">
        Green<span className="italic text-primary">Cycle</span>
      </div>
      <p className="text-sm text-muted-foreground font-sans">
        Built at LangChain × Lovable Hackathon Stockholm 2025
      </p>
    </div>
  </footer>
);

export default Footer;
