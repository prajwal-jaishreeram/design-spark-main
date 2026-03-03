import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const recentProjects = [
  { id: "1", title: "Lovable slides", author: "Demo User", time: "30 seconds ago", color: "from-zinc-700 to-zinc-900" },
  { id: "2", title: "Architect Portfolio", author: "Demo User", time: "14 minutes ago", color: "from-zinc-600 to-zinc-800" },
  { id: "3", title: "Ecommerce Store", author: "Demo User", time: "4 days ago", color: "from-neutral-700 to-neutral-900" },
  { id: "4", title: "Event Platform", author: "Demo User", time: "11 days ago", color: "from-stone-700 to-stone-900" },
  { id: "5", title: "Lifestyle Blog", author: "Demo User", time: "15 days ago", color: "from-zinc-600 to-zinc-800" },
];

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const filtered = recentProjects.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (id: string) => {
    onClose();
    navigate("/ai-chat");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: isMobile ? 20 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: isMobile ? 20 : -10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed z-[101] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col",
              isMobile
                ? "inset-x-3 top-3 bottom-3"
                : "left-1/2 top-[15%] -translate-x-1/2 w-full max-w-lg max-h-[70vh]"
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects and folders"
                className="flex-1 bg-transparent text-foreground text-sm md:text-base placeholder:text-muted-foreground outline-none"
              />
              {(query || isMobile) && (
                <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              <p className="px-3 pt-2 pb-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Recent Projects
              </p>
              <div className="space-y-0.5">
                {filtered.map((project, i) => (
                  <motion.button
                    key={project.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => handleSelect(project.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-accent/60 transition-colors group text-left"
                  >
                    <div className={cn(
                      "w-12 h-8 rounded-md bg-gradient-to-br flex-shrink-0",
                      project.color
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-destructive flex-shrink-0" />
                        {project.author}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {project.time}
                    </span>
                  </motion.button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-xs text-muted-foreground">No projects found</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
