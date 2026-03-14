import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  Info,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  User,
  Link2,
  ExternalLink,
  Copy,
  BoxSelect,
  Check,
  X,
  FolderInput,
  Users2,
  Minus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUserProjects, deleteProject, toggleProjectStar, updateProject } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  is_starred: boolean;
  visibility?: string;
  created_at: string;
  updated_at: string;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Last edited");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [visibility, setVisibility] = useState("Any visibility");
  const [status, setStatus] = useState("Any status");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isStarredView = location.pathname === "/starred";
  const pageTitle = isStarredView ? "Starred" : "Created by me";

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getUserProjects();
      setProjects(data as Project[]);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (id: string, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleProjectStar(id, !currentStarred);
      toast.success(!currentStarred ? "Project starred" : "Project unstarred");
      setProjects(prev => prev.map(p => p.id === id ? { ...p, is_starred: !currentStarred } : p));
    } catch {
      toast.error("Failed to update project");
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete));
      toast.success("Project deleted successfully");
    } catch {
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
      setProjects(prev => prev.map(p => p.id === projectToRename.id ? { ...p, title: newTitle } : p));
      setRenameDialogOpen(false);
    } catch {
      toast.error("Failed to rename project");
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedProjectIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProjectIds(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      const idsToDelete = Array.from(selectedProjectIds);
      await Promise.all(idsToDelete.map(id => deleteProject(id)));
      setProjects(prev => prev.filter(p => !selectedProjectIds.has(p.id)));
      toast.success(`${selectedProjectIds.size} projects deleted`);
      setSelectedProjectIds(new Set());
      setIsSelectionMode(false);
    } catch {
      toast.error("Failed to delete some projects");
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesStarred = !isStarredView || p.is_starred;
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchesVisibility = visibility === "Any visibility" ||
          (visibility === "Public" && p.visibility === "public") ||
          (visibility === "Workspace" && p.visibility === "workspace");
        const matchesStatus = status === "Any status" ||
          (status === "All published" && p.status === "complete") ||
          (status === "Not published" && p.status === "draft");

        return matchesStarred && matchesSearch && matchesVisibility && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === "Last edited") {
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        } else if (sortBy === "Created") {
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortBy === "Name") {
          comparison = a.title.localeCompare(b.title);
        }
        return order === "desc" ? comparison : -comparison;
      });
  }, [projects, search, sortBy, order, visibility, status, isStarredView]);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 min-h-full pb-32">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-8">{pageTitle}</h1>

            {/* Filter Bar */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-full md:w-[480px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Search your projects..."
                    className="pl-10 h-10 bg-[#121212]/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-700 transition-all rounded-xl"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-4 bg-[#121212]/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 rounded-xl gap-2 font-medium">
                      {sortBy}
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#18181b] border-zinc-800 p-1">
                    <DropdownMenuLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1.5">Sort by</DropdownMenuLabel>
                    {["Last edited", "Last viewed", "Created", "Name"].map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => setSortBy(s)}
                        className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-zinc-800 cursor-pointer"
                      >
                        {s}
                        {sortBy === s && <Star className="h-3 w-3 fill-current" />}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1.5">Order</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => setOrder("desc")}
                      className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-zinc-800 cursor-pointer"
                    >
                      Newest first
                      {order === "desc" && <Star className="h-3 w-3 fill-current" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setOrder("asc")}
                      className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-zinc-800 cursor-pointer"
                    >
                      Oldest first
                      {order === "asc" && <Star className="h-3 w-3 fill-current" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Visibility Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-4 bg-[#121212]/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 rounded-xl gap-2 font-medium">
                      {visibility}
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#18181b] border-zinc-800 p-1">
                    <DropdownMenuLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1.5">Visibility</DropdownMenuLabel>
                    {["Any visibility", "Public", "Workspace"].map((v) => (
                      <DropdownMenuItem
                        key={v}
                        onClick={() => setVisibility(v)}
                        className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-zinc-800 cursor-pointer"
                      >
                        {v}
                        {visibility === v && <Star className="h-3 w-3 fill-current" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-4 bg-[#121212]/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 rounded-xl gap-2 font-medium">
                      {status}
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#18181b] border-zinc-800 p-1">
                    <DropdownMenuLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1.5">Publish status</DropdownMenuLabel>
                    {["Any status", "All published", "Internally published", "Externally published", "Not published"].map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => setStatus(s)}
                        className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-zinc-800 cursor-pointer"
                      >
                        {s}
                        {status === s && <Star className="h-3 w-3 fill-current" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Selection Toggle + View Toggles */}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      if (isSelectionMode) setSelectedProjectIds(new Set());
                    }}
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-200",
                      isSelectionMode
                        ? "bg-zinc-200 border-zinc-300 text-zinc-900"
                        : "bg-[#1a1a1a] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                    )}
                    title="Select projects"
                  >
                    <BoxSelect className="h-4 w-4" />
                  </button>

                  <div className="flex items-center bg-[#1a1a1a] border border-zinc-800 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200",
                        viewMode === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200",
                        viewMode === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[1.5/1] rounded-2xl bg-zinc-900/50 animate-pulse border border-zinc-900" />
              ))}
            </div>
          ) : filteredAndSortedProjects.length > 0 ? (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : "space-y-3"
            )}>
              <AnimatePresence mode="popLayout">
                {filteredAndSortedProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className={cn(
                      "group relative transition-all duration-300",
                      viewMode === "list" && "flex items-center gap-4 p-3 rounded-xl border border-transparent hover:bg-[#18181b]/50 hover:border-zinc-800 transition-all cursor-pointer",
                      isSelectionMode && selectedProjectIds.has(project.id) && "ring-2 ring-primary ring-offset-4 ring-offset-background"
                    )}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleSelection(project.id, { stopPropagation: () => { } } as any);
                      } else {
                        navigate(`/ai-chat?project=${project.id}`);
                      }
                    }}
                  >
                    {viewMode === "grid" ? (
                      <div className="space-y-4 cursor-pointer">
                        {/* Thumbnail Container */}
                        <div className="aspect-[1.6/1] rounded-2xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden relative group transition-all duration-300 hover:border-zinc-700 shadow-sm hover:shadow-xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                          {/* Selection Checkbox (always visible in selection mode, or on hover) */}
                          <div className={cn(
                            "absolute top-3 left-3 z-10 transition-all duration-300",
                            isSelectionMode ? "opacity-100 scale-100" : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
                          )}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelectionMode) setIsSelectionMode(true);
                                toggleSelection(project.id, e);
                              }}
                              className={cn(
                                "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shadow-lg backdrop-blur-md",
                                selectedProjectIds.has(project.id)
                                  ? "bg-white border-white text-black scale-105"
                                  : "bg-black/40 border-white/20 text-transparent"
                              )}
                            >
                              <Check className="h-4 w-4 stroke-[3]" />
                            </button>
                          </div>

                          {/* Placeholder/Thumb */}
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900/40">
                            <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-zinc-700 animate-[spin_3s_linear_infinite]" />
                          </div>

                          {/* Hover Star/Actions */}
                          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                            <button
                              onClick={(e) => handleToggleStar(project.id, project.is_starred, e)}
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all",
                                project.is_starred
                                  ? "bg-primary/20 border-primary/30 text-primary shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                                  : "bg-black/60 border-white/10 text-white hover:bg-black/80 hover:scale-110"
                              )}
                            >
                              <Star className={cn("h-4 w-4", project.is_starred && "fill-current")} />
                            </button>
                          </div>
                        </div>

                        {/* Metadata Container */}
                        <div className="flex items-start gap-4 px-2">
                          <div className="h-10 w-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0 overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                            <User className="h-5 w-5 text-zinc-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-[15px] font-bold text-zinc-100 truncate tracking-tight">{project.title}</h3>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <button className="h-7 w-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors text-zinc-500">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-[#18181b] border-zinc-800">
                                  <DropdownMenuItem onClick={(e) => handleRenameClick(project, e)} className="gap-2 py-2.5 rounded-md focus:bg-zinc-800">
                                    <Pencil className="h-4 w-4 text-zinc-400" />
                                    <span>Rename</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success("Copied to clipboard"); }} className="gap-2 py-2.5 rounded-md focus:bg-zinc-800">
                                    <Link2 className="h-4 w-4 text-zinc-400" />
                                    <span>Copy link</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-zinc-800" />
                                  <DropdownMenuItem
                                    onClick={(e) => handleDeleteClick(project.id, e)}
                                    className="gap-2 py-2.5 rounded-md text-red-400 focus:bg-red-400/10 focus:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[12px] text-zinc-500 font-medium">Edited {formatDistanceToNow(new Date(project.updated_at))} ago</p>
                              <span className="w-1 h-1 rounded-full bg-zinc-800" />
                              <Link2 className="h-3 w-3 text-zinc-700" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* List selection checkbox */}
                        <div className="flex items-center pr-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isSelectionMode) setIsSelectionMode(true);
                              toggleSelection(project.id, e);
                            }}
                            className={cn(
                              "w-6 h-6 rounded border transition-all flex items-center justify-center",
                              selectedProjectIds.has(project.id)
                                ? "bg-white border-white text-black"
                                : "bg-transparent border-zinc-800 text-transparent"
                            )}
                          >
                            <Check className="h-3 w-3 stroke-[4]" />
                          </button>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800">
                          <User className="h-6 w-6 text-zinc-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-zinc-200 truncate">{project.title}</h3>
                          <p className="text-[11px] text-zinc-500">Edited {formatDistanceToNow(new Date(project.updated_at))} ago</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleToggleStar(project.id, project.is_starred, e)}
                            className={cn("p-1.5 rounded-lg transition-colors", project.is_starred ? "text-primary bg-primary/10" : "text-zinc-500 hover:text-zinc-200")}
                          >
                            <Star className={cn("h-4 w-4", project.is_starred && "fill-current")} />
                          </button>
                          <button onClick={(e) => handleRenameClick(project, e)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={(e) => handleDeleteClick(project.id, e)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 rounded-3xl border border-dashed border-zinc-800 bg-[#0a0a0a]/50 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
                <Plus className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-200 mb-2">No projects found</h3>
              <p className="text-zinc-500 max-w-sm mb-8">
                {search ? "No projects match your search criteria." : "You haven't created any projects yet. Start building with prompt."}
              </p>
              {!search && (
                <Link to="/ai-chat">
                  <Button className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20">
                    Create your first project
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedProjectIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center"
          >
            <div className="flex items-center gap-1 bg-[#1c1c1c]/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl scale-110 md:scale-100">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5 mr-1">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Minus className="h-4 w-4 text-white" />
                </div>
                <span className="text-[15px] font-bold text-white whitespace-nowrap">{selectedProjectIds.size} selected</span>
              </div>

              <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />

              <div className="flex items-center gap-1 px-1">
                <button
                  onClick={() => toast.info("Move to folder coming soon")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  <FolderInput className="h-4 w-4" />
                  <span className="hidden md:inline">Move to folder</span>
                </button>

                <button
                  onClick={() => toast.info("Transfer functionality coming soon")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  <Users2 className="h-4 w-4" />
                  <span className="hidden md:inline">Transfer</span>
                </button>

                <div className="h-6 w-px bg-white/5 mx-1" />

                <button
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all text-sm font-bold"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>

                <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />

                <button
                  onClick={() => setSelectedProjectIds(new Set())}
                  className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Clear
                </button>

                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedProjectIds(new Set());
                  }}
                  className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1c1c1c] border-zinc-800 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete Project?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete your project and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-xl border-none">Delete Project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1c1c1c] border-zinc-800 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete {selectedProjectIds.size} Projects?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete these projects? This action cannot be undone and will permanently remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-xl border-none">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="bg-[#1c1c1c] border-zinc-800 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Rename Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new project name"
              className="bg-black/20 border-zinc-800 text-zinc-100 focus:ring-zinc-700 rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit} className="bg-white text-black hover:bg-zinc-200 rounded-xl font-bold">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Projects;
