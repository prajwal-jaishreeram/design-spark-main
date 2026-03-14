import { useAuth } from "@/contexts/AuthContext";
import { deductCredits } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState } from "react";

export function useCredits() {
    const { profile, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [showCreditsModal, setShowCreditsModal] = useState(false);

    const credits = profile?.credits ?? 0;

    const hasEnoughCredits = useCallback(
        (amount: number) => credits >= amount,
        [credits]
    );

    const useCredit = useCallback(
        async (amount: number, action: string) => {
            if (!hasEnoughCredits(amount)) {
                // Show modal instead of just a toast
                setShowCreditsModal(true);
                return false;
            }

            try {
                await deductCredits(amount);
                await refreshProfile();

                // Check if credits are now at 0 after deduction
                // (profile hasn't updated yet, so check return value)
                return true;
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : "Failed to use credits";

                if (msg.includes("Insufficient credits")) {
                    setShowCreditsModal(true);
                    return false;
                }

                toast({ title: "Credit error", description: msg, variant: "destructive" });
                return false;
            }
        },
        [hasEnoughCredits, refreshProfile, toast]
    );

    return { credits, hasEnoughCredits, useCredit, showCreditsModal, setShowCreditsModal };
}
