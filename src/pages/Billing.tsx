import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Check, Zap, ArrowRight } from "lucide-react";

const plans = [
  { name: "Free", price: "$0", features: ["3 generations/month", "HTML preview only"], current: true },
  { name: "Pro", price: "$19", features: ["50 generations/month", "Next.js export", "GitHub + Vercel deploy"], current: false, popular: true },
  { name: "Agency", price: "$49", features: ["200 generations/month", "All Pro features", "Priority generation"], current: false },
];

const Billing = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold uppercase tracking-wider mb-6">Billing</h1>

          <div className="rounded-lg border border-border bg-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Current Plan</p>
                <p className="text-lg font-bold uppercase tracking-wider">Free</p>
              </div>
              <Zap className="h-8 w-8 text-foreground" />
            </div>
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider">
              <span className="text-muted-foreground">Credits Used</span>
              <span>0 / 3</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div className="bg-foreground h-1.5 rounded-full" style={{ width: "0%" }} />
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Upgrade Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-lg border p-5 ${plan.popular ? "border-foreground/30" : "border-border"} bg-card`}>
                <h3 className="font-semibold text-xs uppercase tracking-wider mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold mb-3">{plan.price}<span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">/mo</span></p>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-foreground" />{f}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.current ? "outline" : plan.popular ? "default" : "outline"} size="sm" className="w-full text-xs uppercase tracking-wider" disabled={plan.current}>
                  {plan.current ? "Current Plan" : "Upgrade"}
                  {!plan.current && <ArrowRight className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
