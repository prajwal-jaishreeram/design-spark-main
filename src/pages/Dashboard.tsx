import { motion } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { ArrowRight, Menu, User, MoreHorizontal, MousePointer2, ExternalLink, BarChart2, Star, Folder, Copy, Pencil, Settings as SettingsIcon, Trash2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.png";
import { getUserProjects, deleteProject, updateProject, toggleProjectStar } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const tabs = ["Recently viewed", "My projects"];

const gradients = [
  "from-zinc-700 to-zinc-900",
  "from-zinc-600 to-zinc-800",
  "from-neutral-700 to-neutral-900",
  "from-stone-700 to-stone-900",
  "from-neutral-600 to-neutral-800",
  "from-zinc-700 to-zinc-900",
];

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  is_starred: boolean;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("My projects");
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const fetchProjects = () => {
    setLoadingProjects(true);
    getUserProjects()
      .then((data) => setProjects(data as Project[]))
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
      })
      .finally(() => setLoadingProjects(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete);
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (err) {
      toast.error("Failed to delete project");
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleRenameClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToRename(project);
    setNewTitle(project.title);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!projectToRename || !newTitle.trim()) return;
    try {
      await updateProject(projectToRename.id, { title: newTitle });
      toast.success("Project renamed successfully");
      setRenameDialogOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error("Failed to rename project");
    }
  };

  const handleSend = (message: string, files?: File[]) => {
    navigate("/ai-chat", { state: { prompt: message } });
  };

  const handleToggleStar = async (id: string, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleProjectStar(id, !currentStarred);
      toast.success(!currentStarred ? "Project starred" : "Project unstarred");
      fetchProjects();
    } catch (err) {
      toast.error("Failed to update project");
    }
  };

  const filteredProjects = activeTab === "Recently viewed"
    ? [...projects].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 3)
    : projects;

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
              <span className="text-sm font-bold tracking-wider uppercase">CreatorUncle</span>
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
            isMobile ? "pt-24 pb-32 min-h-[70vh]" : "py-40 md:py-56"
          )}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center w-full max-w-2xl"
            >
              <h1 className={cn(
                "font-bold tracking-tight text-foreground",
                isMobile ? "text-2xl mb-6 px-4" : "text-2xl md:text-3xl mb-8"
              )}>
                What should we build, {profile?.display_name || "there"}?
              </h1>
              <div className="px-2">
                <PromptInputBox
                  onSend={handleSend}
                  placeholder="Describe the website you want to build..."
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Projects section */}
        <div className={cn(
          "relative z-10",
          isMobile && "bg-[#0A0A0A] rounded-t-[40px] pt-10 -mt-12"
        )}>
          <div className={cn(
            "max-w-6xl mx-auto font-sans",
            isMobile ? "px-4 pb-12" : "px-6 md:px-10 py-8"
          )}>
            <div className={cn("flex items-center justify-between", isMobile ? "mb-4" : "mb-6")}>
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
              "grid gap-6",
              isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {loadingProjects ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className={cn(
                        "rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden mb-3",
                        isMobile ? "aspect-[16/10]" : "aspect-video"
                      )}>
                        <div className="w-full h-full bg-gradient-to-br from-white/[0.02] to-transparent" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-white/[0.06] rounded-md w-3/4" />
                        <div className="h-3 bg-white/[0.04] rounded-md w-1/2" />
                      </div>
                    </div>
                  ))}
                </>
              ) : filteredProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/ai-chat?project=${project.id}`)}
                >
                  {/* Project Thumbnail */}
                  <div className={cn(
                    "rounded-xl bg-gradient-to-br relative overflow-hidden mb-3 border border-border/50 transition-all group-hover:border-primary/30",
                    !project.thumbnail_url && gradients[i % gradients.length],
                    isMobile ? "h-32" : "h-48"
                  )}>
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                    )}

                    {/* Dark gradient overlay for text readability at bottom if there's an image */}
                    {project.thumbnail_url && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    )}

                    {/* Star icon — always visible top-right */}
                    <button
                      onClick={(e) => handleToggleStar(project.id, project.is_starred, e)}
                      className={cn(
                        "absolute top-2.5 right-2.5 z-20 h-7 w-7 rounded-full flex items-center justify-center transition-all",
                        project.is_starred
                          ? "bg-amber-500/20 backdrop-blur-md border border-amber-400/30"
                          : "bg-black/30 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <Star className={cn(
                        "h-3.5 w-3.5 transition-colors",
                        project.is_starred ? "fill-amber-400 text-amber-400" : "text-white/70"
                      )} />
                    </button>

                    {/* Status badge — bottom-left */}
                    <div className="absolute bottom-2.5 left-2.5 z-20">
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold backdrop-blur-md",
                        project.status === "complete" ? "bg-green-500/20 text-green-400 border border-green-500/20" :
                          project.status === "generating" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20" :
                            "bg-black/40 text-white/50 border border-white/10"
                      )}>
                        {project.status}
                      </span>
                    </div>
                  </div>

                  {/* Project Info Area (Mockup Style) */}
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Project Avatar/Icon */}
                      <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${project.id}`}
                          alt=""
                          className="h-6 w-6 opacity-80"
                        />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <h3 className="text-sm font-medium text-foreground truncate">{project.title}</h3>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Viewed {formatDistanceToNow(new Date(project.updated_at))} ago
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Link Icon */}
                      <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                        <Link2 className="h-4 w-4" />
                      </button>

                      {/* Context Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 bg-[#1a1a1a] border-[#333] text-zinc-300 shadow-2xl">
                          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer py-2.5">
                            <MousePointer2 className="h-4 w-4" /> Select
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer py-2.5 opacity-50">
                            <ExternalLink className="h-4 w-4" /> View published site
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer py-2.5 opacity-50">
                            <BarChart2 className="h-4 w-4" /> Analytics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#333]" />
                          <DropdownMenuItem
                            className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer py-2.5"
                            onClick={(e) => handleToggleStar(project.id, project.is_starred, e)}
                          >
                            <Star className={cn("h-4 w-4", project.is_starred && "fill-current text-primary")} />
                            {project.is_starred ? "Unstar" : "Star"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer py-2.5">
                            <Folder className="h-4 w-4" /> Move to folder
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer py-2.5">
                            <Copy className="h-4 w-4" /> Remix
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer py-2.5"
                            onClick={(e) => handleRenameClick(project, e)}
                          >
                            <Pencil className="h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer py-2.5">
                            <SettingsIcon className="h-4 w-4" /> Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#333]" />
                          <DropdownMenuItem
                            className="gap-2 focus:bg-red-500/20 focus:text-red-400 text-red-500 cursor-pointer py-2.5"
                            onClick={(e) => handleDeleteClick(project.id, e)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
              <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#333] text-white">
                <DialogHeader>
                  <DialogTitle>Rename Project</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-[#2a2a2a] border-[#444] text-white"
                    placeholder="Project title"
                    onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setRenameDialogOpen(false)} className="text-zinc-400 hover:text-white hover:bg-white/5">
                    Cancel
                  </Button>
                  <Button onClick={handleRenameSubmit} className="bg-primary text-primary-foreground">
                    Update Title
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    This action cannot be undone. This will permanently delete your
                    project and remove all generated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-[#444] text-zinc-400 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 text-white hover:bg-red-700">Delete Project</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {!loadingProjects && projects.length === 0 && (
              <div className="rounded-lg border border-border border-dashed bg-card/50 p-16 text-center">
                <img src={logo} alt="CreatorUncle" className="h-10 w-10 opacity-30 mx-auto mb-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">No projects yet</h3>
                <p className="text-xs text-muted-foreground">Start building by typing a prompt above.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
