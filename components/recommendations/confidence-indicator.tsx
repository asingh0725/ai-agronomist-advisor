"use client";

import { motion } from "framer-motion";
import {
  formatConfidence,
  getConfidenceLevel,
  getConfidenceColor,
} from "@/lib/utils/format-diagnosis";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface ConfidenceIndicatorProps {
  confidence: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceIndicator({
  confidence,
  size = "md",
  showLabel = true,
  className,
}: ConfidenceIndicatorProps) {
  const level = getConfidenceLevel(confidence);
  const colorClass = getConfidenceColor(confidence);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const Icon =
    level === "high"
      ? CheckCircle2
      : level === "medium"
        ? AlertCircle
        : HelpCircle;

  return (
    <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} ${className || ''}`}>
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${colorClass}`}
      >
        <Icon size={iconSizes[size]} className="shrink-0" />
        <span>{formatConfidence(confidence)}</span>
        {showLabel && <span className="capitalize">{level} Confidence</span>}
      </div>
    </div>
  );
}

interface ConfidenceBarProps {
  confidence: number;
}

export function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const level = getConfidenceLevel(confidence);

  const barColors = {
    low: "text-amber-500",
    medium: "text-blue-500",
    high: "text-lime-400",
  };

  const strokeColors = {
    low: "#f59e0b",
    medium: "#3b82f6",
    high: "#76C043",
  };

  const percentage = confidence * 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      {/* Ring gauge */}
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-gray-200"
          />
          {/* Animated fill ring */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={strokeColors[level]}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-lg font-bold ${barColors[level]}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          >
            {formatConfidence(confidence)}
          </motion.span>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-700">Confidence</div>
        <div className={`text-sm font-semibold capitalize ${barColors[level]}`}>
          {level}
        </div>
      </div>
    </div>
  );
}
