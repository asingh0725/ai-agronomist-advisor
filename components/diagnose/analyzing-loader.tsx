"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Leaf } from "lucide-react"

interface AnalyzingLoaderProps {
  stage: "uploading" | "analyzing"
}

const STAGES = {
  uploading: {
    title: "Uploading Image",
    description: "Securely uploading your image...",
    estimatedSeconds: 3,
  },
  analyzing: {
    title: "Analyzing Your Crop",
    description: "Our AI is examining your data and searching our knowledge base for relevant recommendations...",
    estimatedSeconds: 15,
  },
}

export function AnalyzingLoader({ stage }: AnalyzingLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const stageInfo = STAGES[stage]

  useEffect(() => {
    // Reset progress when stage changes
    setProgress(0)
    setElapsedSeconds(0)

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
      setProgress((prev) => {
        // Asymptotic progress - never quite reaches 100%
        const target = 95
        const speed = 100 / stageInfo.estimatedSeconds
        const newProgress = prev + (target - prev) * (speed / 100)
        return Math.min(newProgress, target)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [stage, stageInfo.estimatedSeconds])

  const remainingSeconds = Math.max(0, stageInfo.estimatedSeconds - elapsedSeconds)

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center space-y-8">
        {/* Animated icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Leaf className="w-10 h-10 text-green-600 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
          </div>
        </div>

        {/* Title and description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {stageInfo.title}
          </h2>
          <p className="text-gray-600">
            {stageInfo.description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-3">
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-gray-500">
            {remainingSeconds > 0 ? (
              <>Estimated time remaining: ~{remainingSeconds} seconds</>
            ) : (
              <>Almost done...</>
            )}
          </p>
        </div>

        {/* Tips */}
        <p className="text-xs text-gray-400">
          Please don&apos;t close this page while we process your request
        </p>
      </div>
    </div>
  )
}
