import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Search, LayoutGrid, Star, User, Users, FileText,
  ArrowUpCircle, ChevronDown, LogOut, Settings, Zap
} from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { SearchDialog } from "@/components/SearchDialog";

const mainNav = [
  { icon: Home, label: "Home", href: "/dashboard" },
];

const projectNav = [
  { icon: LayoutGrid, label: "All projects", href: "/projects" },
  { icon: Star, label: "Starred", href: "/starred" },
  { icon: User, label: "Created by me", href: "/my-projects" },
  { icon: Users, label: "Shared with me", href: "/shared" },
];

const recentProjects = [
  { icon: FileText, label: "Heroic Integrator" },
  { icon: FileText, label: "Remix of Bold Ambition" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
    <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    <aside className="w-[200px] border-r border-sidebar-border bg-sidebar flex flex-col flex-shrink-0 h-screen sticky top-0">
      <div className="p-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="DesignForge" className="h-11 w-11" />
        </Link>
      </div>

      <div className="px-3 mb-2">
        <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors">
          <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center text-[10px] font-bold text-background">
            {user?.name?.charAt(0).toUpperCase() || "D"}
          </div>
          <span className="truncate flex-1 text-left text-[11px] uppercase tracking-wider">{user?.name || "Demo"}'s Space</span>
          <ChevronDown className="h-3 w-3 text-sidebar-foreground" />
        </button>
      </div>

      <nav className="px-2 space-y-0.5">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] uppercase tracking-wider transition-colors",
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] uppercase tracking-wider transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground w-full"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      </nav>

      <div className="mt-4 px-2">
        <p className="px-2.5 text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-widest mb-1">Projects</p>
        <nav className="space-y-0.5">
          {projectNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] uppercase tracking-wider transition-colors",
                isActive(item.href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-4 px-2">
        <p className="px-2.5 text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-widest mb-1">Recents</p>
        <nav className="space-y-0.5">
          {recentProjects.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full text-left"
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1" />

      <div className="p-3 space-y-2 border-t border-sidebar-border">
        <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-sidebar-accent/50">
          <div>
            <p className="text-[11px] font-medium text-sidebar-accent-foreground uppercase tracking-wider">Share</p>
            <p className="text-[10px] text-sidebar-foreground">100 credits per referral</p>
          </div>
          <LayoutGrid className="h-4 w-4 text-sidebar-foreground" />
        </div>

        <Link to="/billing" className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
          <div>
            <p className="text-[11px] font-medium text-sidebar-accent-foreground uppercase tracking-wider">Upgrade to Pro</p>
            <p className="text-[10px] text-sidebar-foreground">Unlock more benefits</p>
          </div>
          <Zap className="h-4 w-4 text-foreground" />
        </Link>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
              <User className="h-3 w-3 text-background" />
            </div>
            <img src={logo} alt="DesignForge" className="h-4 w-4" />
          </button>
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-card shadow-lg py-1 z-50">
              <button
                onClick={() => { navigate("/settings"); setUserMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors uppercase tracking-wider"
              >
                <Settings className="h-3.5 w-3.5" /> Settings
              </button>
              <button
                onClick={() => { logout(); navigate("/"); setUserMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-muted transition-colors uppercase tracking-wider"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
