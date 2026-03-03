import logo from "@/assets/logo.png";

export function FooterSection() {
  return (
    <footer className="border-t border-border py-8 md:py-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-5 md:flex-row md:justify-between md:gap-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="DesignForge" className="h-8 w-8 md:h-10 md:w-10" />
            <span className="font-bold text-xs uppercase tracking-widest">DesignForge</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 md:gap-8 text-[11px] md:text-xs uppercase tracking-widest text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#" className="hover:text-foreground transition-colors">Blog</a>
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
          </div>
          <p className="text-[11px] md:text-xs text-muted-foreground uppercase tracking-wider">
            © 2026 DesignForge
          </p>
        </div>
      </div>
    </footer>
  );
}
