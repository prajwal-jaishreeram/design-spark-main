import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Rocket } from "lucide-react";

const Deployments = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold uppercase tracking-wider mb-6">Deployments</h1>

          <div className="rounded-lg border border-border border-dashed bg-card/50 p-16 text-center">
            <Rocket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">No deployments yet</h3>
            <p className="text-xs text-muted-foreground">Deploy a project to see it here.</p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Deployments;
