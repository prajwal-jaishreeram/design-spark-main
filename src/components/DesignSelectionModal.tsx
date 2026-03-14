import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Design {
    id: string;
    imageUrl: string;
    prompt: string;
}

interface DesignSelectionModalProps {
    isOpen: boolean;
    designs: Design[];
    sectionTitle: string;
    credits: number;
    isRegenerating: boolean;
    onSelect: (design: Design) => void;
    onRegenerate: () => void;
    onClose: () => void;
}

export function DesignSelectionModal({
    isOpen,
    designs,
    sectionTitle,
    credits,
    isRegenerating,
    onSelect,
    onRegenerate,
    onClose,
}: DesignSelectionModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full max-w-6xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wider">
                                    Choose Your Website Design
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {sectionTitle} — AI will build all sections from your chosen design
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground px-2 py-1 rounded-lg bg-muted">
                                {credits} credits left
                            </span>
                            <button
                                onClick={onClose}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Design Grid */}
                    <div className="p-6 overflow-y-auto min-h-0">
                        <div className="grid grid-cols-3 gap-4">
                            {designs.map((design, i) => (
                                <motion.div
                                    key={design.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group relative rounded-xl border border-border overflow-hidden cursor-pointer hover:border-foreground/30 transition-all duration-300"
                                    onClick={() => onSelect(design)}
                                >
                                    {/* Design Image */}
                                    <div className="aspect-[2/3] bg-muted relative overflow-hidden">
                                        <img
                                            src={design.imageUrl}
                                            alt={`Design option ${i + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://placehold.co/600x900/1a1a2e/e0e0e0?text=Design+${i + 1}`;
                                            }}
                                        />
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                whileHover={{ opacity: 1, scale: 1 }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            >
                                                <Button size="sm" className="text-xs uppercase tracking-wider gap-1.5">
                                                    <Check className="h-3.5 w-3.5" />
                                                    Select This Design
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </div>
                                    {/* Label */}
                                    <div className="px-3 py-2.5 bg-card">
                                        <p className="text-xs font-medium text-foreground">Option {i + 1}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground">
                            Not satisfied? Regenerate costs 1 credit.
                        </p>
                        <Button
                            variant="secondary"
                            className="text-sm font-medium gap-2"
                            onClick={onRegenerate}
                            disabled={isRegenerating || credits < 1}
                        >
                            {isRegenerating ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Regenerate All
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
