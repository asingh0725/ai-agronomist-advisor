"use client";

import Link from "next/link";
import { Camera, ClipboardList, History } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  {
    title: "New Diagnosis",
    description: "Upload a photo or enter lab data",
    icon: Camera,
    href: "/diagnose",
    primary: true,
  },
  {
    title: "View Results",
    description: "See your recommendations",
    icon: ClipboardList,
    href: "/recommendations",
    primary: false,
  },
  {
    title: "History",
    description: "Browse past diagnoses",
    icon: History,
    href: "/history",
    primary: false,
  },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={action.href}>
              <div
                className={`group h-full rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  action.primary
                    ? "bg-lime-400/10 border border-lime-400/20 hover:border-lime-400/40 hover:shadow-lime-400/10"
                    : "bg-cream-100 border border-gray-200/60 hover:border-gray-300 hover:shadow-gray-200/50"
                }`}
              >
                <div
                  className={`inline-flex p-2.5 rounded-xl mb-3 transition-colors ${
                    action.primary
                      ? "bg-lime-400/20 group-hover:bg-lime-400/30"
                      : "bg-gray-100 group-hover:bg-gray-200"
                  }`}
                >
                  <action.icon
                    className={`w-5 h-5 ${
                      action.primary ? "text-lime-400" : "text-gray-600"
                    }`}
                  />
                </div>
                <h3
                  className={`font-medium mb-1 ${
                    action.primary ? "text-earth-900" : "text-gray-900"
                  }`}
                >
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
