import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { Menu, User } from "lucide-react";
import logo from "@/assets/logo.png";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-background">
      {!isMobile && <AppSidebar />}

      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <AppSidebar />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        {isMobile && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background z-40">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-7 w-7" />
              <span className="text-sm font-bold tracking-wider uppercase">CreatorUncle</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
              <User className="h-4 w-4 text-foreground" />
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
