"use client";

import { Clock, DollarSign, FileQuestion, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { MotionDiv, MotionStagger, staggerItem } from "./motion-wrapper";

const stats = [
  { value: "2-3", suffix: "weeks", label: "Average wait for soil results" },
  { value: "$200-500", suffix: "", label: "Per agronomist consultation" },
  { value: "40%", suffix: "", label: "Of fertilizer is misapplied" },
];

const problems = [
  {
    icon: Clock,
    title: "Weeks of Waiting",
    description:
      "Traditional soil analysis takes 2-3 weeks to get results back from the lab.",
  },
  {
    icon: DollarSign,
    title: "Expensive Consultations",
    description:
      "Professional agronomist consultations can cost $200-500 per visit.",
  },
  {
    icon: FileQuestion,
    title: "Confusing Reports",
    description:
      "Lab results come with numbers but no clear action plan for your specific crops.",
  },
  {
    icon: TrendingDown,
    title: "Yield Uncertainty",
    description:
      "Without expert guidance, farmers often over or under-apply fertilizers.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 lg:py-28 bg-cream-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionDiv className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
            The Problem
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            The Old Way{" "}
            <span className="font-serif italic text-red-500">Doesn&apos;t</span>{" "}
            Work
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Traditional soil analysis is slow, expensive, and leaves farmers
            guessing about the best course of action.
          </p>
        </MotionDiv>

        {/* Stats counters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-16"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
                className="text-2xl sm:text-3xl font-bold text-red-500"
              >
                {stat.value}
                {stat.suffix && (
                  <span className="text-lg font-normal text-red-400 ml-1">
                    {stat.suffix}
                  </span>
                )}
              </motion.div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <MotionStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group p-6 bg-cream-100 rounded-2xl border border-gray-200/60 hover:border-red-200 hover:bg-red-50/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <problem.icon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {problem.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}
