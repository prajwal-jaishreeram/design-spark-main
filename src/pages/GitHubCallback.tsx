import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const GitHubCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [status, setStatus] = useState("Connecting to GitHub...");

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) {
            toast({ title: "GitHub connection failed", description: "No authorization code received.", variant: "destructive" });
            navigate("/settings");
            return;
        }

        const exchangeCode = async () => {
            try {
                setStatus("Exchanging authorization code...");

                const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("Not authenticated");

                const res = await fetch(`${SUPABASE_URL}/functions/v1/github-connect`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ code }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to connect GitHub");
                }

                const data = await res.json();
                setStatus(`Connected as ${data.username}!`);

                toast({ title: "GitHub connected!", description: `Connected as @${data.username}` });
                setTimeout(() => navigate("/settings"), 1500);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                toast({ title: "GitHub connection failed", description: message, variant: "destructive" });
                navigate("/settings");
            }
        };

        exchangeCode();
    }, [searchParams, navigate, toast]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground uppercase tracking-wider">{status}</p>
            </div>
        </div>
    );
};

export default GitHubCallback;
