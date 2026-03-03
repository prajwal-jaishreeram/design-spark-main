import { motion } from "framer-motion";
import { BarChart, Zap, Activity } from "lucide-react";

const features = [
  {
    icon: BarChart,
    title: "Advanced Analytics",
    description: "Gain deeper insights from your designs with our cutting-edge AI models.",
  },
  {
    icon: Zap,
    title: "Intelligent Automation",
    description: "Streamline your workflow with AI-powered design generation.",
  },
  {
    icon: Activity,
    title: "Real-time Preview",
    description: "See your changes instantly with live preview and hot reloading.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-14 md:py-24 border-t border-border">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-lg md:text-3xl font-bold uppercase tracking-wider mb-4">
            Unlock the Power of AI
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-lg border border-border bg-card p-5 md:p-8 hover:border-foreground/20 transition-all duration-300"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-foreground flex items-center justify-center mb-4 md:mb-6">
                <feature.icon className="h-4 w-4 md:h-5 md:w-5 text-background" />
              </div>
              <h3 className="text-sm md:text-base font-semibold uppercase tracking-wider mb-2 md:mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
