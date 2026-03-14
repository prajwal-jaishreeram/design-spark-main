import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowUpCircle } from "lucide-react";
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
            initial={{ opacity: 0, scale: 0.98, x: isMobile ? 0 : "-50%", y: isMobile ? 20 : "-45%" }}
            animate={{ opacity: 1, scale: 1, x: isMobile ? 0 : "-50%", y: isMobile ? 0 : "-50%" }}
            exit={{ opacity: 0, scale: 0.98, x: isMobile ? 0 : "-50%", y: isMobile ? 20 : "-45%" }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "fixed z-[101] bg-[#121212]/90 backdrop-blur-2xl border border-zinc-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col",
              isMobile
                ? "inset-x-3 top-3 bottom-3 rounded-2xl"
                : "left-1/2 top-1/2 w-full max-w-xl max-h-[60vh] rounded-2xl"
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-zinc-800/50">
              <Search className="h-5 w-5 text-zinc-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, pages, and components..."
                className="flex-1 bg-transparent text-white text-base md:text-lg placeholder:text-zinc-500 outline-none font-medium tracking-tight"
              />
              <div className="flex items-center gap-2">
                {!query && !isMobile && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded border border-zinc-800 bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Esc
                  </div>
                )}
                {(query || isMobile) && (
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                    <X className="h-4 w-4 text-zinc-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
              <div className="flex items-center justify-between px-3 pt-2 pb-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Recent Projects
                </p>
                {query && (
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {filtered.length} Results
                  </p>
                )}
              </div>
              <div className="space-y-1">
                {filtered.map((project, i) => (
                  <motion.button
                    key={project.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    onClick={() => handleSelect(project.id)}
                    className="flex items-center gap-4 w-full px-3 py-3 rounded-xl hover:bg-zinc-800/60 border border-transparent hover:border-zinc-800/50 transition-all group text-left"
                  >
                    <div className={cn(
                      "w-14 h-9 rounded-lg bg-gradient-to-br flex-shrink-0 border border-zinc-700/30 group-hover:border-zinc-500/50 transition-colors shadow-lg",
                      project.color
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-zinc-100 truncate tracking-tight">{project.title}</p>
                        {i < 2 && (
                          <span className="text-[8px] font-black bg-primary/10 text-primary px-1 py-0.5 rounded border border-primary/20 uppercase tracking-tighter">New</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
                        <span className="truncate">{project.author}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className="whitespace-nowrap">{project.time}</span>
                      </div>
                    </div>
                    <ArrowUpCircle className="h-4 w-4 text-zinc-700 group-hover:text-primary group-hover:rotate-45 transition-all opacity-0 group-hover:opacity-100" />
                  </motion.button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-16 px-6">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                    <Search className="h-6 w-6 text-zinc-700" />
                  </div>
                  <p className="text-sm font-bold text-zinc-300 mb-1">No results found</p>
                  <p className="text-xs text-zinc-500 font-medium">Try searching for something else or check your spelling.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
