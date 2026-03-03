import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
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
                  <Input defaultValue="Demo User" className="mt-1.5 bg-card" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Email</Label>
                  <Input defaultValue="demo@example.com" className="mt-1.5 bg-card" disabled />
                </div>
                <Button size="sm" className="text-xs uppercase tracking-wider">Save Changes</Button>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2">API Keys</h2>
              <p className="text-xs text-muted-foreground mb-4">Add your own API keys for unlimited usage.</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Ideogram API Key</Label>
                  <Input placeholder="Enter your Ideogram API key" className="mt-1.5 bg-card" type="password" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Claude API Key</Label>
                  <Input placeholder="Enter your Claude API key" className="mt-1.5 bg-card" type="password" />
                </div>
                <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider">Save API Keys</Button>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2">Connected Accounts</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    <span className="text-xs uppercase tracking-wider">GitHub</span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider">Connect</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>
                    <span className="text-xs uppercase tracking-wider">Vercel</span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider">Connect</Button>
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
