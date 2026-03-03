import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
  pendingPrompt: { prompt: string; attachments?: File[] } | null;
  setPendingPrompt: (p: { prompt: string; attachments?: File[] } | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<{ prompt: string; attachments?: File[] } | null>(null);

  const login = (email: string, _password: string) => {
    setUser({ name: email.split("@")[0], email });
  };

  const signup = (name: string, email: string, _password: string) => {
    setUser({ name, email });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, signup, logout, pendingPrompt, setPendingPrompt }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
