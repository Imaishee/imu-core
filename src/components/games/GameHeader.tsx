"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Timer, Star, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface GameHeaderProps {
  title: string;
  timer?: number;
  score: number;
  xpEarned: number;
}

export default function GameHeader({
  title,
  timer,
  score,
  xpEarned,
}: GameHeaderProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between w-full p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg"
    >
      <button
        onClick={() => router.push("/games")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <h1 className="text-lg font-bold text-gray-800">{title}</h1>

      <div className="flex items-center gap-4">
        {timer !== undefined && (
          <motion.div
            className="flex items-center gap-1 text-orange-500"
            animate={timer <= 10 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: timer <= 10 ? Infinity : 0 }}
          >
            <Timer className="w-5 h-5" />
            <span className="font-bold">{timer}s</span>
          </motion.div>
        )}

        <div className="flex items-center gap-1 text-blue-500">
          <Star className="w-5 h-5" />
          <span className="font-bold">{score}</span>
        </div>

        <div className="flex items-center gap-1 text-purple-500">
          <Zap className="w-5 h-5" />
          <span className="font-bold">+{xpEarned}</span>
        </div>
      </div>
    </motion.div>
  );
}
