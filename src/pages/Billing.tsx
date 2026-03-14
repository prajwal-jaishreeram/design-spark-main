import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Check, Zap, ArrowRight, CreditCard, Sparkles, Layout, Globe, Headphones } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for exploring the platform",
    credits: 5,
    features: [
      { text: "5 credits", icon: Sparkles },
      { text: "HTML preview only", icon: Layout },
      { text: "Community support", icon: Headphones },
    ],
    key: "free",
  },
  {
    name: "Starter",
    price: "$25",
    description: "For creators starting their journey",
    credits: 100,
    features: [
      { text: "100 credits/month", icon: Sparkles },
      { text: "All export formats", icon: Layout },
      { text: "Email support", icon: Headphones },
    ],
    key: "starter",
    popular: true,
  },
  {
    name: "Pro",
    price: "$49",
    description: "Ultimate power for serious builders",
    credits: 300,
    features: [
      { text: "300 credits/month", icon: Sparkles },
      { text: "Priority generation", icon: Sparkles },
      { text: "GitHub deploy", icon: Globe },
      { text: "Premium support", icon: Headphones },
    ],
    key: "pro",
  },
];

const Billing = () => {
  const { profile } = useAuth();
  const currentPlan = profile?.plan || "free";
  const currentCredits = profile?.credits ?? 0;
  const planConfig = plans.find((p) => p.key === currentPlan) || plans[0];
  const maxCredits = planConfig.credits;
  const usedPercent = Math.min(((maxCredits - currentCredits) / maxCredits) * 100, 100);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-10"
        >
          {/* Header Section */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Billing & Subscription</h1>
            <p className="text-muted-foreground text-sm">Manage your plan, credits, and subscription details.</p>
          </div>

          {/* Current Plan Status Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <CreditCard className="w-48 h-48 rotate-12" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Active Plan</h2>
                    <p className="text-2xl font-bold tracking-tight">{planConfig.name} Tier</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold tracking-tighter">{currentCredits}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Credits Available</p>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Limit: {maxCredits}</p>
                  </div>

                  <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - usedPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full transition-colors duration-500",
                        currentCredits <= 2 ? "bg-red-500" : currentCredits <= 10 ? "bg-amber-500" : "bg-primary"
                      )}
                    />
                  </div>
                  {currentCredits <= 2 && (
                    <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                      <Zap className="h-3 w-3 fill-current" />
                      Low credits — upgrade now to avoid interruptions!
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-4 items-center justify-between relative z-10">
                <p className="text-xs text-muted-foreground">
                  Credits refresh on your next billing cycle.
                </p>
                <Button variant="outline" size="sm" className="h-9 text-xs">
                  View Billing History
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-primary/5 p-8 flex flex-col justify-center items-center text-center gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mb-2 shadow-lg shadow-primary/20 relative z-10">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold tracking-tight relative z-10">Get more credits</h3>
              <p className="text-sm text-muted-foreground mb-2 relative z-10">Scale your design process with high-volume credit packs.</p>
              <Button className="w-full relative z-10 shadow-lg shadow-primary/20">
                Upgrade Now
              </Button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold tracking-tight">Upgrade Your Plan</h2>
              <p className="text-muted-foreground text-sm">Choose the best plan for your design needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, i) => {
                const isCurrent = plan.key === currentPlan;
                const Icon = plan.popular ? Sparkles : plan.key === "free" ? CreditCard : Zap;

                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "rounded-2xl border flex flex-col p-8 transition-all relative overflow-hidden",
                      plan.popular
                        ? "border-primary bg-primary/[0.03] shadow-xl shadow-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card/30 hover:border-border/80"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm">
                          Most Popular
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                        plan.popular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 min-h-[16px]">{plan.description}</p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tighter">{plan.price}</span>
                        <span className="text-sm font-medium text-muted-foreground">/month</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 mb-8">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">What's included</p>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="mt-0.5 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Check className="h-2.5 w-2.5 text-primary" />
                            </div>
                            <span className="text-xs text-muted-foreground leading-relaxed">{feature.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                      className={cn(
                        "w-full rounded-xl py-6 font-semibold transition-all",
                        plan.popular && !isCurrent ? "shadow-lg shadow-primary/20" : ""
                      )}
                      disabled={isCurrent}
                    >
                      {isCurrent ? (
                        <span className="flex items-center gap-2">
                          <Check className="h-4 w-4" /> Current Plan
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {plan.key === "free" ? "Select Free" : "Upgrade to " + plan.name}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
