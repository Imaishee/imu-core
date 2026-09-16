"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Timer, Star, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface GameHeaderProps {
  title: string;
  timer?: number;
  score: number;
  xpEarned: number;
  enhanced?: boolean;
}

export default function GameHeader({
  title,
  timer,
  score,
  xpEarned,
  enhanced = false,
}: GameHeaderProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`flex items-center justify-between w-full p-6 bg-white/85 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 ${
        enhanced
          ? "bg-gradient-to-tl from-indigo-50 to-purple-50"
          : ""
      }`}
    >
      <button
        onClick={() => router.push("/games")}
        className={`flex items-center gap-3 p-3 bg-white/70 backdrop-blur rounded-xl hover:bg-white/80 transition-all duration-200 ${
          enhanced ? "shadow-lg" : ""
        }`}
      >
        <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-800" />
        <span className="text-base font-medium text-gray-700 hover:text-gray-900">Back to Games</span>
      </button>

      <h1 className={`text-xl font-bold text-gray-800 ${
        enhanced ? "bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent" : ""
      }`}>
        {title}
      </h1>

      <div className="flex items-center gap-5">
        {timer !== undefined && (
          <motion.div
            className="flex items-center gap-2 p-3 bg-white/70 backdrop-blur rounded-xl border border-white/20"
            animate={timer <= 10 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: timer <= 10 ? Infinity : 0 }}
          >
            <Timer className="w-6 h-6 text-orange-500" />
            <span className="text-lg font-bold text-orange-600">{timer}s</span>
          </motion.div>
        )}

        <div className="flex items-center gap-2 p-3 bg-white/70 backdrop-blur rounded-xl border border-white/20">
          <Star className="w-6 h-6 text-blue-500" />
          <span className="text-lg font-bold text-blue-600">{score}</span>
        </div>

        <div className="flex items-center gap-2 p-3 bg-white/70 backdrop-blur rounded-xl border border-white/20">
          <Zap className="w-6 h-6 text-purple-500" />
          <span className="text-lg font-bold text-purple-600">+{xpEarned}</span>
        </div>
      </div>
    </motion.div>
  );
}