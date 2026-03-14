import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, pendingPrompt, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    try {
      // Call our auto-signup edge function which creates user with auto-confirm
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/auto-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        let description = result.error || "Signup failed";
        if (description.includes("already") || description.includes("exists") || description.includes("duplicate") || response.status === 409) {
          description = "An account with this email already exists. Try signing in instead.";
        } else if (description.includes("invalid") || description.includes("Invalid")) {
          description = "Please enter a valid email address.";
        }
        toast({ title: "Signup failed", description, variant: "destructive" });
        return;
      }

      // If we got a session back, set it in the Supabase client
      if (result.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        toast({ title: "Account created!", description: "Welcome to CreatorUncle!" });
        if (pendingPrompt) {
          navigate("/ai-chat", { state: { prompt: pendingPrompt.prompt } });
        } else {
          navigate("/dashboard");
        }
      } else {
        // User created but no session — ask them to log in
        toast({ title: "Account created!", description: "Please sign in with your new credentials." });
        navigate("/login");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast({ title: "Signup failed", description: err?.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        if (error.message?.includes("provider") || error.message?.includes("Unsupported")) {
          toast({
            title: "Google signup not available",
            description: "Google OAuth is not configured yet. Please use email and password.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Google signup failed", description: error.message, variant: "destructive" });
        }
      }
    } catch {
      toast({
        title: "Google signup not available",
        description: "Please use email and password to create your account.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logo} alt="CreatorUncle" className="h-8 w-8" />
            <span className="font-bold text-xs uppercase tracking-widest">CreatorUncle</span>
          </Link>
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Create Account</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Start building for free</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <Button
            variant="outline"
            className="w-full mb-4 h-11 text-xs uppercase tracking-wider"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground uppercase tracking-widest">or</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs uppercase tracking-wider">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="mt-1.5 h-11 bg-background" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 h-11 bg-background" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wider">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 h-11 bg-background" disabled={isLoading} />
            </div>
            <Button className="w-full h-11 text-xs uppercase tracking-wider" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-3.5 w-3.5 ml-1" /></>}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 uppercase tracking-wider">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
