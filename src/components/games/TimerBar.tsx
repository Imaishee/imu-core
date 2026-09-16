"use client";

import { motion } from "framer-motion";

interface TimerBarProps {
  timeLeft: number;
  totalTime: number;
}

export default function TimerBar({ timeLeft, totalTime }: TimerBarProps) {
  const percentage = (timeLeft / totalTime) * 100;
  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  const getColor = () => {
    if (percentage > 50) return "bg-emerald-400";
    if (percentage > 25) return "bg-amber-400";
    return "bg-red-500";
  };

  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${getColor()} rounded-full`}
        initial={{ width: "100%" }}
        animate={{
          width: `${percentage}%`,
          scale: isCritical ? [1, 1.05, 1] : 1,
          x: isCritical ? [0, -2, 2, -2, 0] : 0,
        }}
        transition={{
          width: { duration: 0.5, ease: "easeOut" },
          scale: { duration: 0.3, repeat: isCritical ? Infinity : 0 },
          x: { duration: 0.2, repeat: isCritical ? Infinity : 0 },
        }}
      />
    </div>
  );
}
