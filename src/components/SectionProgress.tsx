import { motion } from "framer-motion";
import { Check, Loader2, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionItem {
    id: string;
    section_type: string;
    section_title: string;
    sort_order: number;
    status: "pending" | "generating_design" | "awaiting_selection" | "generating_code" | "complete" | "failed";
}

interface SectionProgressProps {
    sections: SectionItem[];
    currentSectionId: string | null;
    onSectionClick?: (section: SectionItem) => void;
}

const statusConfig = {
    pending: { icon: Circle, color: "text-muted-foreground/40", label: "Pending" },
    generating_design: { icon: Loader2, color: "text-yellow-500", label: "Generating design..." },
    awaiting_selection: { icon: ChevronRight, color: "text-blue-400", label: "Pick a design" },
    generating_code: { icon: Loader2, color: "text-purple-400", label: "Writing code..." },
    complete: { icon: Check, color: "text-green-400", label: "Complete" },
    failed: { icon: Circle, color: "text-red-400", label: "Failed" },
};

export function SectionProgress({ sections, currentSectionId, onSectionClick }: SectionProgressProps) {
    if (!sections.length) return null;

    const completedCount = sections.filter((s) => s.status === "complete").length;

    return (
        <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Sections
                </h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {completedCount}/{sections.length}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1 mb-4">
                <motion.div
                    className="bg-foreground h-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / sections.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="space-y-1">
                {sections
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((section) => {
                        const config = statusConfig[section.status];
                        const Icon = config.icon;
                        const isCurrent = section.id === currentSectionId;
                        const isClickable = section.status === "complete" && onSectionClick;

                        return (
                            <button
                                key={section.id}
                                onClick={() => isClickable && onSectionClick?.(section)}
                                disabled={!isClickable}
                                className={cn(
                                    "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-all duration-200",
                                    isCurrent
                                        ? "bg-muted/80 border border-border"
                                        : "hover:bg-muted/40",
                                    isClickable && "cursor-pointer"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-3.5 w-3.5 flex-shrink-0",
                                        config.color,
                                        (section.status === "generating_design" || section.status === "generating_code") && "animate-spin"
                                    )}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-xs font-medium truncate",
                                        section.status === "complete" ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {section.section_title}
                                    </p>
                                    {isCurrent && (
                                        <p className={cn("text-[10px] mt-0.5", config.color)}>
                                            {config.label}
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
            </div>
        </div>
    );
}
