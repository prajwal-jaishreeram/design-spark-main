import { ArrowRight } from "lucide-react";
import { motion, useAnimation, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { Navbar } from "@/components/landing/Navbar";
import * as React from "react";

const labels = [
  { label: "AI-Powered Design" },
  { label: "One-Click Deploy" },
  { label: "Production-Ready Code" },
];

export function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, setPendingPrompt } = useAuth();
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  React.useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const titleWords = ["BUILD", "STUNNING", "WEBSITES", "EFFORTLESSLY"];

  const handleSend = (message: string, files?: File[]) => {
    if (isAuthenticated) {
      navigate("/ai-chat", { state: { prompt: message } });
    } else {
      setPendingPrompt({ prompt: message, attachments: files });
      navigate("/login");
    }
  };

  return (
    <section className="relative min-h-[85vh] md:min-h-screen flex flex-col bg-background" ref={ref}>
      <Navbar />

      {/* Hero content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-6 pt-16 md:pt-20">
        <div className="w-full max-w-4xl text-center">
          {/* Animated title */}
          <h1 className="mb-3 md:mb-4 flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
            {titleWords.map((text, index) => (
              <motion.span
                key={index}
                initial="hidden"
                animate={controls}
                variants={{
                  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { duration: 0.5, delay: index * 0.12 },
                  },
                }}
                className="text-foreground"
              >
                {text}
              </motion.span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5 } },
            }}
            className="mb-5 md:mb-6 max-w-sm md:max-w-md mx-auto text-[11px] md:text-sm text-muted-foreground leading-relaxed px-2"
          >
            We empower creators with cutting-edge AI to transform
            ideas into production-ready websites.
          </motion.p>

          {/* Prompt box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.7 } },
            }}
            className="max-w-3xl mx-auto px-1"
          >
            <PromptInputBox onSend={handleSend} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
