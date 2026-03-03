import { motion } from "framer-motion";
import { MessageSquare, Palette, Globe } from "lucide-react";

const steps = [
  { icon: MessageSquare, title: "Describe Your Idea", description: "Tell us about your product, style preferences, and what sections you need." },
  { icon: Palette, title: "Pick Your Design", description: "Review AI-generated variations and select the one that fits your vision." },
  { icon: Globe, title: "Deploy Live", description: "Push to GitHub and deploy to Vercel with a single click." },
];

export function HowItWorksSection() {
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
            How It Works
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-widest">
            Three steps. Zero friction.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-card border border-border flex items-center justify-center mx-auto mb-4 md:mb-5">
                <step.icon className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
              </div>
              <div className="text-[10px] md:text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2 md:mb-3">
                Step {i + 1}
              </div>
              <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider mb-1.5 md:mb-2">
                {step.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
