import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for trying things out",
    features: ["3 generations/month", "HTML preview only", "Community support"],
    cta: "GET STARTED",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For serious builders",
    features: ["50 generations/month", "Next.js export", "GitHub + Vercel deploy", "Priority generation", "Code download"],
    cta: "START PRO TRIAL",
    popular: true,
  },
  {
    name: "Agency",
    price: "$49",
    period: "/month",
    description: "For teams and agencies",
    features: ["200 generations/month", "All Pro features", "Priority generation", "Custom branding", "Team collaboration"],
    cta: "CONTACT SALES",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-14 md:py-24 border-t border-border">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-lg md:text-3xl font-bold uppercase tracking-wider mb-3 md:mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-widest">
            Start free. Upgrade when you're ready.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-lg border p-6 md:p-8 flex flex-col ${
                plan.popular
                  ? "border-foreground/30 bg-card relative"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider mb-1">{plan.name}</h3>
              <p className="text-[11px] md:text-xs text-muted-foreground mb-3 md:mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1 mb-4 md:mb-6">
                <span className="text-3xl md:text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">{plan.period}</span>
              </div>
              <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 md:h-4 md:w-4 text-foreground flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full text-xs uppercase tracking-wider"
                >
                  {plan.cta} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
