import { motion } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { ArrowRight, Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.png";

const tabs = ["Recently viewed", "My projects"];

const mockProjects = [
  { id: "1", title: "Lovable slides", desc: "Code-powered presentation builder", color: "from-zinc-700 to-zinc-900" },
  { id: "2", title: "Architect Portfolio", desc: "Firm website & showcase", color: "from-zinc-600 to-zinc-800" },
  { id: "3", title: "Ecommerce Store", desc: "Premium design for webstore", color: "from-neutral-700 to-neutral-900" },
  { id: "4", title: "Event Platform", desc: "Find, register, create events", color: "from-stone-700 to-stone-900" },
  { id: "5", title: "Lifestyle Blog", desc: "Sophisticated blog design", color: "from-zinc-600 to-zinc-800" },
  { id: "6", title: "Visual Landing Page", desc: "Showcase your company", color: "from-neutral-600 to-neutral-800" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Recently viewed");
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSend = (message: string, files?: File[]) => {
    navigate("/ai-chat", { state: { prompt: message } });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      {!isMobile && <AppSidebar />}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <AppSidebar />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        {isMobile && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-7 w-7" />
              <span className="text-sm font-bold tracking-wider uppercase">DesignForge</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
              <User className="h-4 w-4 text-foreground" />
            </div>
          </div>
        )}

        {/* Hero section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10" />
          <div className={cn(
            "relative flex flex-col items-center justify-center px-4 md:px-6",
            isMobile ? "py-32 min-h-[65vh]" : "py-40 md:py-56"
          )}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center w-full max-w-2xl"
            >
              <h1 className={cn(
                "font-bold tracking-tight text-foreground mb-6 md:mb-8",
                isMobile ? "text-xl" : "text-2xl md:text-3xl"
              )}>
                What should we build, {user?.name || "there"}?
              </h1>
              <PromptInputBox
                onSend={handleSend}
                placeholder="Describe the website you want to build..."
              />
            </motion.div>
          </div>
        </div>

        {/* Projects section */}
        <div className={cn(
          "py-8 max-w-6xl mx-auto",
          isMobile ? "px-4" : "px-6 md:px-10"
        )}>
          <div className="flex items-center justify-between mb-6">
            <div className={cn(
              "flex items-center gap-1 bg-secondary/50 rounded-lg p-1",
              isMobile && "overflow-x-auto scrollbar-hide"
            )}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs uppercase tracking-wider transition-colors whitespace-nowrap",
                    activeTab === tab
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            {!isMobile && (
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
                Browse all <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          )}>
            {mockProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group cursor-pointer"
                onClick={() => navigate("/ai-chat")}
              >
                <div className={cn(
                  "rounded-lg bg-gradient-to-br relative overflow-hidden mb-2 border border-border transition-all group-hover:border-foreground/20",
                  project.color,
                  isMobile ? "h-28" : "h-40 mb-3"
                )}>
                  <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3">
                    <span className="text-[10px] md:text-xs font-semibold text-foreground/80 uppercase tracking-wider">{project.title}</span>
                  </div>
                </div>
                <h3 className="text-xs md:text-sm font-medium text-foreground">{project.title}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground">{project.desc}</p>
              </motion.div>
            ))}
          </div>

          {mockProjects.length === 0 && (
            <div className="rounded-lg border border-border border-dashed bg-card/50 p-16 text-center">
              <img src={logo} alt="DesignForge" className="h-10 w-10 opacity-30 mx-auto mb-4" />
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">No projects yet</h3>
              <p className="text-xs text-muted-foreground">Start building by typing a prompt above.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
