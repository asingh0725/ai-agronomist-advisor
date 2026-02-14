"use client";

import {
  Zap,
  Shield,
  BarChart3,
  Leaf,
  Cloud,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { MotionDiv, MotionStagger, staggerItem } from "./motion-wrapper";

const features = [
  {
    icon: Zap,
    title: "Instant Analysis",
    description:
      "Get comprehensive soil analysis and recommendations in seconds, not weeks.",
    size: "large" as const,
  },
  {
    icon: Shield,
    title: "Research-Backed",
    description:
      "All recommendations grounded in peer-reviewed university research and proven methodologies.",
    size: "large" as const,
  },
  {
    icon: BarChart3,
    title: "Cited Recommendations",
    description:
      "Every recommendation comes with citations to the university research that backs it up.",
    size: "small" as const,
  },
  {
    icon: Leaf,
    title: "Sustainable Practices",
    description:
      "Optimize nutrient application to reduce environmental impact while maximizing yield.",
    size: "small" as const,
  },
  {
    icon: Cloud,
    title: "Cloud Storage",
    description:
      "All your soil tests and recommendations securely stored and accessible anywhere.",
    size: "small" as const,
  },
  {
    icon: BookOpen,
    title: "Educational Insights",
    description:
      "Learn why each recommendation is made with detailed explanations and sources.",
    size: "small" as const,
  },
];

function AnimatedCounter({ target, label }: { target: number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <motion.span
        className="text-3xl font-bold text-lime-400 block"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        {target.toLocaleString()}+
      </motion.span>
      <span className="text-sm text-earth-700">{label}</span>
    </motion.div>
  );
}

export function FeaturesSection() {
  const largeFeatures = features.filter((f) => f.size === "large");
  const smallFeatures = features.filter((f) => f.size === "small");

  return (
    <section id="features" className="py-20 lg:py-28 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionDiv className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-lime-400/10 text-earth-700 rounded-full text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything You{" "}
            <span className="font-serif italic text-lime-400">Need</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed specifically for modern farmers who want
            data-driven decisions.
          </p>
        </MotionDiv>

        {/* Bento Grid */}
        <MotionStagger className="space-y-4">
          {/* Top row — 2 large cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {largeFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="group relative p-8 lg:p-10 bg-cream-100 rounded-2xl border border-gray-200/60 hover:border-lime-400/30 hover:shadow-xl hover:shadow-lime-400/5 transition-all duration-300 overflow-hidden"
              >
                {/* Accent glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="w-14 h-14 bg-lime-400/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-lime-400/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-lime-400" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed max-w-sm">
                    {feature.description}
                  </p>

                  {/* Mini stats for large cards */}
                  {index === 0 && (
                    <div className="mt-8 flex gap-8">
                      <AnimatedCounter target={30} label="Second analysis" />
                      <AnimatedCounter target={500} label="Research sources" />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="mt-8 flex gap-8">
                      <AnimatedCounter target={15} label="Universities" />
                      <AnimatedCounter target={4000} label="Research chunks" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom row — 4 small cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {smallFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="group p-6 bg-cream-100 rounded-2xl border border-gray-200/60 hover:border-lime-400/30 hover:shadow-lg hover:shadow-lime-400/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-lime-400/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-lime-400/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-lime-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </MotionStagger>
      </div>
    </section>
  );
}
