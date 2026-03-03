import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Search, Filter } from "lucide-react";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Projects = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wider">My Projects</h1>
            <Link to="/ai-chat">
              <Button size="sm" className="text-xs uppercase tracking-wider">New Project</Button>
            </Link>
          </div>

          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects..." className="pl-9 bg-card" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>

          <div className="flex gap-2 mb-6">
            {["All", "Deployed", "Drafts"].map((tab) => (
              <button key={tab} className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-colors ${tab === "All" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border border-dashed bg-card/50 p-16 text-center">
            <img src={logo} alt="DesignForge" className="h-10 w-10 opacity-30 mx-auto mb-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">No projects yet</h3>
            <p className="text-xs text-muted-foreground mb-6">Create your first AI-generated design.</p>
            <Link to="/ai-chat">
              <Button className="text-xs uppercase tracking-wider">Create Your First Project</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Projects;
