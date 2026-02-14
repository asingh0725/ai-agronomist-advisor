"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, Database, Sparkles, Upload } from "lucide-react"

interface AnalyzingLoaderProps {
  stage: "uploading" | "analyzing"
}

const STEPS = [
  {
    key: "upload",
    icon: Upload,
    title: "Uploading image",
    description: "Securely uploading your image...",
    duration: 3000,
  },
  {
    key: "analyze",
    icon: Eye,
    title: "Analyzing crop",
    description: "Examining visual symptoms and patterns...",
    duration: 5000,
  },
  {
    key: "search",
    icon: Database,
    title: "Searching knowledge base",
    description: "Finding relevant university research...",
    duration: 5000,
  },
  {
    key: "generate",
    icon: Sparkles,
    title: "Generating recommendation",
    description: "Writing your personalized diagnosis...",
    duration: 10000,
  },
]

export function AnalyzingLoader({ stage }: AnalyzingLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (stage === "uploading") {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    // In analyzing stage, cycle through steps 1-3
    setCurrentStep(1)
    setProgress(25)

    const stepTimers = [
      setTimeout(() => { setCurrentStep(2); setProgress(50); }, 5000),
      setTimeout(() => { setCurrentStep(3); setProgress(75); }, 10000),
    ]

    // Asymptotic progress after reaching step 3
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev
        return prev + (95 - prev) * 0.05
      })
    }, 1000)

    return () => {
      stepTimers.forEach(clearTimeout)
      clearInterval(progressInterval)
    }
  }, [stage])

  const step = STEPS[currentStep]
  const StepIcon = step.icon

  return (
    <div className="fixed inset-0 bg-earth-950/95 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center space-y-8">
        {/* Animated icon */}
        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-2xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepIcon className="w-9 h-9 text-lime-400" />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Orbiting dot */}
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-lime-400 shadow-lg shadow-lime-400/50"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ top: -4, left: "50%", marginLeft: -4, transformOrigin: "4px 44px" }}
            />
          </div>
        </div>

        {/* Title and description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-bold text-white">
              {step.title}
            </h2>
            <p className="text-white/50">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Multi-step progress */}
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-lime-400 to-lime-300 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between px-1">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className="flex items-center gap-1.5"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                    i <= currentStep
                      ? "bg-lime-400"
                      : "bg-white/20"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors duration-500 ${
                    i === currentStep
                      ? "text-lime-400"
                      : i < currentStep
                      ? "text-white/40"
                      : "text-white/20"
                  }`}
                >
                  {s.title.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30">
          Please don&apos;t close this page while we process your request
        </p>
      </div>
    </div>
  )
}
