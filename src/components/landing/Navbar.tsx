import { Button } from "@/components/ui/button";
import { Menu, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

const navigationItems = [
  { title: "FEATURES", href: "#features" },
  { title: "PRICING", href: "#pricing" },
  { title: "DOCS", href: "#" },
  { title: "ABOUT", href: "#" },
];

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-12 md:h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 md:gap-2">
          <img src={logo} alt="CreatorUncle" className="h-9 w-9 md:h-14 md:w-14" />
          <span className="font-bold text-xs md:text-sm uppercase tracking-widest text-foreground">
            CreatorUncle
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navigationItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.title}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden md:block">
            <Button variant="ghost" size="sm" className="text-xs uppercase tracking-widest">
              Sign In
            </Button>
          </Link>
          <Link to="/signup" className="hidden md:block">
            <Button size="sm" className="text-xs uppercase tracking-wider">
              GET STARTED <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {navigationItems.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    {item.title}
                  </a>
                ))}
                <Link to="/signup">
                  <Button className="w-full mt-4 text-xs uppercase tracking-wider">
                    GET STARTED <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
