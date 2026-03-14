import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo.png";

const ResetPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setError("");

        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        });

        setLoading(false);

        if (err) {
            setError(err.message);
        } else {
            setSent(true);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <img src={logo} alt="CreatorUncle" className="h-6 w-6" />
                        <span className="text-sm font-semibold uppercase tracking-[0.2em]">CreatorUncle</span>
                    </div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Reset Password</h1>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {sent ? "Check your inbox" : "Enter your email to receive a reset link"}
                    </p>
                </div>

                {sent ? (
                    <div className="bg-card/80 p-8 rounded-2xl border border-border text-center">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                            <Mail className="h-5 w-5 text-green-400" />
                        </div>
                        <h2 className="text-sm font-semibold uppercase tracking-wider mb-2">Email Sent!</h2>
                        <p className="text-xs text-muted-foreground mb-6">
                            We sent a password reset link to <strong>{email}</strong>. Check your inbox and spam folder.
                        </p>
                        <Link to="/login">
                            <Button variant="outline" className="w-full text-xs uppercase tracking-wider">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-card/80 p-8 rounded-2xl border border-border space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                                {error}
                            </div>
                        )}

                        <div>
                            <Label className="text-xs uppercase tracking-wider font-semibold">Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="mt-1.5 bg-background"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full text-xs uppercase tracking-wider"
                            disabled={loading || !email.trim()}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Send Reset Link
                        </Button>

                        <div className="text-center">
                            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
                                <ArrowLeft className="h-3 w-3 inline mr-1" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
