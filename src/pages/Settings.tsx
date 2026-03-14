import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Github, Check, X } from "lucide-react";
import * as api from "@/lib/api";

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [ideogramKey, setIdeogramKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const githubUsername = profile?.api_keys?.github_username;
  const githubConnected = !!githubUsername;

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      await refreshProfile();
    }
  };

  const handleSaveApiKeys = async () => {
    if (!user) return;
    setSavingKeys(true);
    const keys: Record<string, string> = {};
    if (ideogramKey) keys.ideogram = ideogramKey;
    if (claudeKey) keys.claude = claudeKey;

    const { error } = await supabase
      .from("profiles")
      .update({ api_keys: { ...profile?.api_keys, ...keys } })
      .eq("id", user.id);
    setSavingKeys(false);
    if (error) {
      toast({ title: "Failed to save API keys", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "API keys saved" });
      setIdeogramKey("");
      setClaudeKey("");
    }
  };

  const handleConnectGitHub = () => {
    api.connectGitHub();
  };

  const handleDisconnectGitHub = async () => {
    if (!user) return;
    setDisconnecting(true);
    try {
      await api.disconnectGitHub(user.id);
      toast({ title: "GitHub disconnected" });
      await refreshProfile();
    } catch {
      toast({ title: "Failed to disconnect", variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold uppercase tracking-wider mb-6">Settings</h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Profile</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1.5 bg-card"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Email</Label>
                  <Input value={user?.email || ""} className="mt-1.5 bg-card" disabled />
                </div>
                <Button
                  size="sm"
                  className="text-xs uppercase tracking-wider"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2">API Keys</h2>
              <p className="text-xs text-muted-foreground mb-4">Add your own API keys for unlimited usage.</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Ideogram API Key</Label>
                  <Input
                    placeholder={profile?.api_keys?.ideogram ? "••••••••" : "Enter your Ideogram API key"}
                    className="mt-1.5 bg-card"
                    type="password"
                    value={ideogramKey}
                    onChange={(e) => setIdeogramKey(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Claude API Key</Label>
                  <Input
                    placeholder={profile?.api_keys?.claude ? "••••••••" : "Enter your Claude API key"}
                    className="mt-1.5 bg-card"
                    type="password"
                    value={claudeKey}
                    onChange={(e) => setClaudeKey(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs uppercase tracking-wider"
                  onClick={handleSaveApiKeys}
                  disabled={savingKeys || (!ideogramKey && !claudeKey)}
                >
                  {savingKeys ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Save API Keys
                </Button>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2">Connectors</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Connect external accounts to sync your projects.
              </p>
              <div className="space-y-3">
                {/* GitHub */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <Github className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wider">GitHub</span>
                          {githubConnected && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30">
                              Connected
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {githubConnected
                            ? `@${githubUsername}`
                            : "Connect to sync projects to GitHub repositories"}
                        </p>
                      </div>
                    </div>
                    {githubConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs uppercase tracking-wider text-destructive hover:text-destructive"
                        onClick={handleDisconnectGitHub}
                        disabled={disconnecting}
                      >
                        {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Disconnect"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs uppercase tracking-wider"
                        onClick={handleConnectGitHub}
                      >
                        <Github className="h-3.5 w-3.5 mr-1.5" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>

                {/* Vercel (placeholder) */}
                <div className="rounded-lg border border-border bg-card p-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 22.525H0l12-21.05 12 21.05z" /></svg>
                      </div>
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wider">Vercel</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Coming soon</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider" disabled>
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-2">Danger Zone</h2>
              <p className="text-xs text-muted-foreground mb-4">Permanently delete your account and all data.</p>
              <Button variant="destructive" size="sm" className="text-xs uppercase tracking-wider">Delete Account</Button>
            </section>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
