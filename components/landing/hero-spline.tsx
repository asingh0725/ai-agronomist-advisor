"use client";

import { Suspense, lazy, useState } from "react";
import { motion } from "framer-motion";

const Spline = lazy(() => import("@splinetool/react-spline"));

function SplineFallback() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Animated gradient orb as fallback */}
      <motion.div
        className="w-[280px] h-[280px] lg:w-[380px] lg:h-[380px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(118,192,67,0.3) 0%, rgba(35,77,46,0.2) 50%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 5, -3, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Inner glow */}
      <motion.div
        className="absolute w-[180px] h-[180px] lg:w-[240px] lg:h-[240px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(157,213,101,0.2) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export function HeroSpline() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <SplineFallback />;
  }

  return (
    <Suspense fallback={<SplineFallback />}>
      <div className="w-full h-full">
        <Spline
          scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </Suspense>
  );
}
