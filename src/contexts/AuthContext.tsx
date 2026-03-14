import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import * as api from "@/lib/api";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  credits: number;
  plan: "free" | "starter" | "pro" | "agency";
  api_keys: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  pendingPrompt: { prompt: string; attachments?: File[] } | null;
  setPendingPrompt: (p: { prompt: string; attachments?: File[] } | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPrompt, setPendingPrompt] = useState<{ prompt: string; attachments?: File[] } | null>(null);
  const initializedRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
        return;
      }

      // Profile doesn't exist — auto-create it
      console.log("No profile found, auto-creating for user:", userId);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const name = authUser?.user_metadata?.full_name
        || authUser?.user_metadata?.name
        || authUser?.email?.split("@")[0]
        || "User";

      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          display_name: name,
          avatar_url: authUser?.user_metadata?.avatar_url || null,
          // Removed `credits: 10` and `plan: "free"` from upsert to prevent overwriting existing users
          // The database schema default handles new users accurately
        }, { onConflict: "id" })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create profile:", insertError);
      }

      if (newProfile) {
        console.log("Profile created:", newProfile);
        setProfile(newProfile as Profile);
      }
    } catch (err) {
      console.error("fetchProfile error:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(s);
        setUser(s?.user ?? null);
        // Token is managed internally by api.ts, no need to pass it

        if (s?.user) {
          await fetchProfile(s.user.id);
        }
      } catch (err) {
        console.error("getSession error:", err);
      } finally {
        if (mounted) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!mounted) return;

        setSession(s);
        setUser(s?.user ?? null);
        // Token is managed internally by api.ts, no need to pass it

        if (s?.user) {
          // Only fetch profile if initial load is done to avoid race condition
          if (initializedRef.current) {
            await fetchProfile(s.user.id);
          }
        } else {
          setProfile(null);
        }

        // Always ensure loading is false after any auth event
        if (initializedRef.current) {
          setLoading(false);
        }
      }
    );

    // Safety timeout — never stay loading for more than 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth loading safety timeout triggered");
        initializedRef.current = true;
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated: !!user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
        pendingPrompt,
        setPendingPrompt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
