import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold uppercase tracking-wider">404</h1>
        <p className="mb-4 text-sm text-muted-foreground uppercase tracking-widest">Page not found</p>
        <a href="/" className="text-xs text-foreground underline uppercase tracking-widest hover:text-muted-foreground">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
