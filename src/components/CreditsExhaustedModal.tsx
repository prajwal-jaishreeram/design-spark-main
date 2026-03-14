import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Crown, X } from "lucide-react";

interface CreditsExhaustedModalProps {
    open: boolean;
    onClose: () => void;
    credits: number;
    plan?: string;
}

export function CreditsExhaustedModal({ open, onClose, credits, plan = "free" }: CreditsExhaustedModalProps) {
    const navigate = useNavigate();

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent
                className="sm:max-w-[440px] p-0 overflow-hidden border-0 rounded-2xl shadow-2xl bg-transparent"
                aria-describedby="credits-exhausted-description"
            >
                <DialogTitle className="sr-only">Credits Exhausted</DialogTitle>
                {/* Gradient header */}
                <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 px-6 pt-8 pb-10 text-center">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {/* Credit coin */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 ring-2 ring-white/30">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-1">Credits Exhausted</h2>
                    <p className="text-white/80 text-sm">
                        You've used all your available credits
                    </p>
                </div>

                {/* Body */}
                <div id="credits-exhausted-description" className="bg-card px-6 py-6 space-y-4">
                    {/* Current status */}
                    <div className="flex items-center justify-between rounded-xl bg-muted/50 border border-border px-4 py-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Current Balance</p>
                            <p className="text-lg font-bold text-foreground">{credits} credits</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Current Plan</p>
                            <p className="text-sm font-semibold text-foreground capitalize">{plan}</p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        Upgrade your plan or purchase additional credits to continue building amazing websites with AI.
                    </p>

                    {/* CTAs */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-12 rounded-xl border-border hover:bg-muted/60 transition-all"
                            onClick={() => {
                                onClose();
                                navigate("/pricing");
                            }}
                        >
                            <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                            <span className="text-sm font-medium">Buy Credits</span>
                        </Button>
                        <Button
                            className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 transition-all"
                            onClick={() => {
                                onClose();
                                navigate("/pricing");
                            }}
                        >
                            <Crown className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Upgrade Plan</span>
                        </Button>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={onClose}
                        className="block w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors pt-1"
                    >
                        Maybe later
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
