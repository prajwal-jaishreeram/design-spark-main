import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Github, Loader2, ExternalLink, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface GitHubConnectModalProps {
    open: boolean;
    onClose: () => void;
    projectId: string;
    projectTitle: string;
    githubConnected: boolean;
    githubUsername?: string;
    existingRepoUrl?: string;
    onSynced?: (repoUrl: string) => void;
}

export function GitHubConnectModal({
    open,
    onClose,
    projectId,
    projectTitle,
    githubConnected,
    githubUsername,
    existingRepoUrl,
    onSynced,
}: GitHubConnectModalProps) {
    const { toast } = useToast();
    const [repoName, setRepoName] = useState(
        projectTitle.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 40)
    );
    const [isPrivate, setIsPrivate] = useState(false);
    const [pushing, setPushing] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [successUrl, setSuccessUrl] = useState<string | null>(null);

    const handlePushToGitHub = async () => {
        if (!repoName.trim()) {
            toast({ title: "Please enter a repository name", variant: "destructive" });
            return;
        }
        setPushing(true);
        try {
            const result = await api.pushToGitHub(projectId, repoName.trim(), isPrivate, projectTitle);
            setSuccessUrl(result.repoUrl);
            onSynced?.(result.repoUrl);
            toast({ title: "Project pushed to GitHub!", description: `Repository: ${result.owner}/${result.repoName}` });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to push";
            toast({ title: "GitHub push failed", description: message, variant: "destructive" });
        } finally {
            setPushing(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await api.syncGitHub(projectId);
            toast({ title: "Project synced to GitHub!" });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to sync";
            toast({ title: "Sync failed", description: message, variant: "destructive" });
        } finally {
            setSyncing(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-border">
                        <div className="flex items-center gap-3">
                            <Github className="h-5 w-5" />
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider">GitHub</h2>
                                <p className="text-[10px] text-muted-foreground">
                                    Sync your project 2-way to collaborate at source.
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-5">
                        {!githubConnected ? (
                            /* Not connected */
                            <div className="text-center space-y-4 py-4">
                                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                                    <Github className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Connect your GitHub account</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Connect GitHub to push your generated projects as repositories.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => api.connectGitHub()}
                                    className="text-xs uppercase tracking-wider"
                                >
                                    <Github className="h-3.5 w-3.5 mr-2" />
                                    Connect GitHub
                                </Button>
                            </div>
                        ) : successUrl || existingRepoUrl ? (
                            /* Already synced */
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-green-400">Connected to GitHub</p>
                                        <p className="text-[10px] text-muted-foreground">@{githubUsername}</p>
                                    </div>
                                </div>

                                <a
                                    href={successUrl || existingRepoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 w-full p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                                >
                                    <Github className="h-4 w-4" />
                                    <span className="text-xs flex-1 truncate">{successUrl || existingRepoUrl}</span>
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                </a>

                                <Button
                                    className="w-full text-xs uppercase tracking-wider"
                                    variant="outline"
                                    onClick={handleSync}
                                    disabled={syncing}
                                >
                                    {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                                    Sync Latest Code
                                </Button>
                            </div>
                        ) : (
                            /* Connected but not yet pushed */
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">Connected account</p>
                                        <p className="text-[10px] text-muted-foreground">@{githubUsername}</p>
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4">
                                    <Label className="text-xs uppercase tracking-wider">Repository Name</Label>
                                    <Input
                                        className="mt-1.5 bg-background"
                                        value={repoName}
                                        onChange={(e) => setRepoName(e.target.value.replace(/[^a-zA-Z0-9-_.]/g, "-"))}
                                        placeholder="my-website"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium">Private repository</p>
                                        <p className="text-[10px] text-muted-foreground">Only you can see this repo</p>
                                    </div>
                                    <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                                </div>

                                <Button
                                    className="w-full text-xs uppercase tracking-wider"
                                    onClick={handlePushToGitHub}
                                    disabled={pushing || !repoName.trim()}
                                    variant="destructive"
                                >
                                    {pushing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                    ) : (
                                        <Github className="h-3.5 w-3.5 mr-2" />
                                    )}
                                    {pushing ? "Transferring..." : "Transfer to GitHub"}
                                </Button>

                                <p className="text-[10px] text-muted-foreground text-center">
                                    This will create a new repository and push all generated code.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
