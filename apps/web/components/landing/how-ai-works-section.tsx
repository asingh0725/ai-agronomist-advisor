"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Globe,
  Scissors,
  Database,
  Search,
  MessageSquare,
} from "lucide-react";
import { MotionDiv } from "./motion-wrapper";

const steps = [
  {
    icon: Globe,
    title: "We Gather Research",
    description:
      "We collect published research, extension guides, and field trial data from university agricultural departments across North America.",
  },
  {
    icon: Scissors,
    title: "We Break It Into Pieces",
    description:
      "Each document is intelligently split into focused chunks — preserving tables, nutrient data, and treatment protocols intact.",
  },
  {
    icon: Database,
    title: "We Make It Searchable",
    description:
      "Every chunk is converted into a mathematical fingerprint and stored in a database that understands meaning, not just keywords.",
  },
  {
    icon: Search,
    title: "We Find What Matters",
    description:
      "When you submit a diagnosis, we search this knowledge base for the most relevant research for your crop, region, and symptoms.",
  },
  {
    icon: MessageSquare,
    title: "AI Writes Your Answer",
    description:
      "Our AI reads the matched research and writes a clear recommendation — always citing which sources it used.",
  },
];

function PipelineStep({
  step,
  index,
  isActive,
}: {
  step: (typeof steps)[0];
  index: number;
  isActive: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`relative flex-shrink-0 w-[280px] lg:w-auto lg:flex-1 p-6 rounded-2xl border transition-all duration-500 ${
        isActive
          ? "bg-lime-400/10 border-lime-400/30 shadow-lg shadow-lime-400/5"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
            isActive
              ? "bg-lime-400/20 border border-lime-400/30"
              : "bg-white/10 border border-white/10"
          }`}
        >
          <step.icon
            className={`w-5 h-5 transition-colors duration-500 ${
              isActive ? "text-lime-400" : "text-white/60"
            }`}
          />
        </div>
        <span
          className={`text-xs font-bold uppercase tracking-wider transition-colors ${
            isActive ? "text-lime-400" : "text-white/30"
          }`}
        >
          Step {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3
        className={`text-lg font-semibold mb-2 transition-colors ${
          isActive ? "text-white" : "text-white/80"
        }`}
      >
        {step.title}
      </h3>
      <p className="text-white/50 text-sm leading-relaxed">
        {step.description}
      </p>
    </motion.div>
  );
}

export function HowAIWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-200px" });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-earth-900 topo-pattern relative overflow-hidden"
    >
      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-earth-950 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionDiv className="text-center mb-16">
          <span className="inline-block glass rounded-full px-4 py-1.5 text-lime-400 text-sm font-medium mb-4">
            Under the Hood
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            How Our AI{" "}
            <span className="font-serif italic text-gradient">Learns</span>{" "}
            Agriculture
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            We don&apos;t just ask AI to guess. We feed it real research from
            real universities — then make it cite its sources.
          </p>
        </MotionDiv>

        {/* Horizontal pipeline — desktop */}
        <div className="hidden lg:block">
          {/* Connecting line */}
          <div className="relative mb-8">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            <div
              className="absolute top-1/2 left-0 h-px bg-lime-400/40 transition-all duration-1000"
              style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            />
            <div className="flex justify-between relative">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                    i <= activeStep
                      ? "bg-lime-400 border-lime-400 shadow-lg shadow-lime-400/30"
                      : "bg-earth-900 border-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <PipelineStep
                key={index}
                step={step}
                index={index}
                isActive={index === activeStep}
              />
            ))}
          </div>
        </div>

        {/* Vertical timeline — mobile */}
        <div className="lg:hidden space-y-4">
          {steps.map((step, index) => (
            <PipelineStep
              key={index}
              step={step}
              index={index}
              isActive={index === activeStep}
            />
          ))}
        </div>

        <MotionDiv delay={0.3} className="text-center mt-12">
          <p className="text-sm text-white/40 max-w-lg mx-auto">
            This approach is called Retrieval-Augmented Generation (RAG). It
            means our AI never makes things up — it always works from real,
            published research.
          </p>
        </MotionDiv>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-earth-950 to-transparent" />
    </section>
  );
}
