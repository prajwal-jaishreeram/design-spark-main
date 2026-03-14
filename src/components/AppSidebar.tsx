import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Search, LayoutGrid, Star, User, Users, FileText,
  ArrowUpCircle, ChevronDown, LogOut, Settings, Zap
} from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { SearchDialog } from "@/components/SearchDialog";
import { getUserProjects } from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Check, Settings as SettingsIcon, UserPlus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

const mainNav = [
  { icon: Home, label: "Home", href: "/dashboard" },
];

const projectNav = [
  { icon: LayoutGrid, label: "All projects", href: "/projects" },
  { icon: Star, label: "Starred", href: "/starred" },
  { icon: User, label: "Created by me", href: "/my-projects" },
  { icon: Users, label: "Shared with me", href: "/shared" },
];

// Removed hardcoded `recentProjects`

interface Project {
  id: string;
  title: string;
  is_starred: boolean;
  updated_at?: string;
}

function WorkspaceContent({ profile, user }: { profile: any; user: any }) {
  return (
    <>
      <div className="p-4">
        {/* Workspace Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
            {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "P"}
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white tracking-tight leading-none mb-1.5">{profile?.display_name || "Prajwal"}'s Lovable</h3>
            <p className="text-[11px] text-zinc-500 font-medium">Pro Plan • 1 member</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
            <SettingsIcon className="h-3.5 w-3.5" /> Settings
          </button>
          <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
            <UserPlus className="h-3.5 w-3.5" /> Invite
          </button>
        </div>

        {/* Credits Section */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4 mb-5 group cursor-pointer hover:border-zinc-700/50 transition-all">
          <div className="flex items-center justify-between mb-3 text-[12px]">
            <span className="font-bold text-zinc-200">Credits</span>
            <div className="flex items-center gap-1 text-zinc-400 font-medium group-hover:text-primary transition-colors">
              {profile?.credits ?? 0} left <ArrowUpCircle className="h-3 w-3 rotate-45" />
            </div>
          </div>
          <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              style={{ width: `${Math.min(((profile?.credits ?? 0) / 100) * 100, 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-amber-500/80 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Daily credits used first
          </div>
        </div>

        {/* All Workspaces Section */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">All workspaces</p>
          <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/20 group cursor-pointer hover:bg-zinc-800/40 transition-all">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              P
            </div>
            <div className="flex-1 flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[12px] font-bold text-zinc-200 truncate">Prajwal's Lovable</span>
                <Badge variant="secondary" className="bg-primary/20 text-primary text-[9px] h-4 px-1 border-none font-black">PRO</Badge>
              </div>
              <Check className="h-3.5 w-3.5 text-zinc-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-2">
        <button className="flex items-center gap-3 w-full p-2 rounded-lg text-[12px] font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-left">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </div>
          Create new workspace
        </button>
      </div>
    </>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const isMobile = useIsMobile();

  const isActive = (href: string) => location.pathname === href;
  const [starredProjects, setStarredProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [starredOpen, setStarredOpen] = useState(true);
  const [myProjectsOpen, setMyProjectsOpen] = useState(true);

  const [recentProjects, setRecentProjects] = useState<Project[]>([]);

  useEffect(() => {
    getUserProjects().then((data) => {
      const all = data as Project[];
      setStarredProjects(all.filter(p => p.is_starred));
      setMyProjects(all);
      // Top 3 most recently updated
      setRecentProjects([...all].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()).slice(0, 3));
    });
  }, [location.pathname]); // Refresh when navigating

  return (
    <>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Workspace Overlay */}
      {isMobile && wsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setWsOpen(false)} />
          <div className="relative z-[101] w-[300px] max-h-[85vh] overflow-y-auto bg-[#121212] border border-[#222] rounded-2xl shadow-2xl">
            <WorkspaceContent profile={profile} user={user} />
          </div>
        </div>
      )}

      <aside className="w-[240px] border-r border-sidebar-border bg-sidebar flex flex-col flex-shrink-0 h-screen sticky top-0">
        {/* Fixed Header */}
        <div className="p-4 flex items-center justify-between flex-shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="CreatorUncle" className="h-11 w-11" />
          </Link>
        </div>

        <div className="px-3 mb-4 flex-shrink-0">
          {isMobile ? (
            /* Mobile: use a button that opens the overlay */
            <button
              onClick={() => setWsOpen(true)}
              className="flex items-center gap-2.5 w-full px-2 py-2 rounded-xl text-sm font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent border border-sidebar-border transition-all shadow-sm group"
            >
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shadow-sm shadow-primary/20">
                {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "P"}
              </div>
              <span className="truncate flex-1 text-left text-[12px] font-semibold tracking-tight">{profile?.display_name || "Prajwal"}'s Space</span>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50 group-hover:text-sidebar-foreground transition-colors" />
            </button>
          ) : (
            /* Desktop: use Popover */
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2.5 w-full px-2 py-2 rounded-xl text-sm font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent border border-sidebar-border transition-all shadow-sm group">
                  <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shadow-sm shadow-primary/20">
                    {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "P"}
                  </div>
                  <span className="truncate flex-1 text-left text-[12px] font-semibold tracking-tight">{profile?.display_name || "Prajwal"}'s Space</span>
                  <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50 group-hover:text-sidebar-foreground transition-colors" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 bg-[#121212] border-[#222] shadow-2xl rounded-2xl ml-3 overflow-hidden" side="right" align="start" sideOffset={12}>
                <WorkspaceContent profile={profile} user={user} />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Fixed Nav */}
        <nav className="px-2 space-y-0.5 flex-shrink-0">
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

        {/* Scrollable Projects + Recents */}
        <div className="flex-1 overflow-y-auto min-h-0 sidebar-scroll">
          <div className="mt-4 px-2">
            <p className="px-2.5 text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-widest mb-1">Projects</p>
            <nav className="space-y-0.5">
              {projectNav.map((item) => (
                item.label === "Starred" ? (
                  <div key={item.label} className="space-y-0.5">
                    <button
                      onClick={() => setStarredOpen(!starredOpen)}
                      className={cn(
                        "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[12px] uppercase tracking-wider transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                        starredOpen && "bg-sidebar-accent/30"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !starredOpen && "-rotate-90")} />
                        {item.label}
                      </div>
                      {starredProjects.length > 0 && (
                        <span className="text-[10px] text-primary font-bold">{starredProjects.length}</span>
                      )}
                    </button>

                    {starredOpen && starredProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => navigate(`/ai-chat?project=${project.id}`)}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all w-full text-left pl-8 group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-3 w-3 shrink-0 text-zinc-500" />
                          <span className="truncate">{project.title}</span>
                        </div>
                        <Star className="h-2.5 w-2.5 fill-amber-400/80 text-amber-400/80 shrink-0" />
                      </button>
                    ))}

                    {starredOpen && starredProjects.length === 0 && (
                      <p className="pl-8 py-1.5 text-[10px] text-zinc-600 font-medium italic">No starred projects</p>
                    )}
                  </div>
                ) : item.label === "Created by me" ? (
                  <div key={item.label} className="space-y-0.5">
                    <button
                      onClick={() => setMyProjectsOpen(!myProjectsOpen)}
                      className={cn(
                        "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[12px] uppercase tracking-wider transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                        myProjectsOpen && "bg-sidebar-accent/30"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !myProjectsOpen && "-rotate-90")} />
                        {item.label}
                      </div>
                    </button>

                    {myProjectsOpen && myProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => navigate(`/ai-chat?project=${project.id}`)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all w-full text-left pl-8 group"
                      >
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">{project.title}</span>
                      </button>
                    ))}

                    {myProjectsOpen && myProjects.length === 0 && (
                      <p className="pl-8 py-1.5 text-[10px] text-zinc-600 font-medium italic">No projects yet</p>
                    )}
                  </div>
                ) : (
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
                )
              ))}
            </nav>
          </div>

          <div className="mt-4 px-2 pb-2">
            <p className="px-2.5 text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-widest mb-1">Recents</p>
            <nav className="space-y-0.5">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/ai-chat?project=${project.id}`)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full text-left truncate group"
                >
                  <FileText className="h-3 w-3 shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  <span className="truncate">{project.title}</span>
                </button>
              ))}
              {recentProjects.length === 0 && (
                <p className="px-2.5 py-1.5 text-[10px] text-zinc-600 font-medium italic">No recent projects</p>
              )}
            </nav>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-3 space-y-2 border-t border-sidebar-border flex-shrink-0">
          <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-sidebar-accent/50">
            <div>
              <p className="text-[11px] font-medium text-sidebar-accent-foreground uppercase tracking-wider">Credits</p>
              <p className="text-[10px] text-sidebar-foreground">{profile?.credits ?? 0} remaining</p>
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
              <img src={logo} alt="CreatorUncle" className="h-4 w-4" />
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
                  onClick={() => { signOut(); navigate("/"); setUserMenuOpen(false); }}
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
