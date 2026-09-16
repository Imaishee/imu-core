"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, Star, Zap, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface GameEndScreenProps {
  score: number;
  totalQuestions: number;
  xpEarned: number;
  onPlayAgain: () => void;
  gameSlug: string;
  enhanced?: boolean;
}

export default function GameEndScreen({
  score,
  totalQuestions,
  xpEarned,
  onPlayAgain,
  gameSlug,
  enhanced = false,
}: GameEndScreenProps) {
  const router = useRouter();
  const percentage = Math.round((score / totalQuestions) * 100);
  const stars = percentage >= 90 ? 3 : percentage >= 60 ? 2 : percentage >= 30 ? 1 : 0;

  useEffect(() => {
    if (stars === 3) {
      const end = Date.now() + 5000;
      const colors = ["#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [stars]);

  const containerClass = enhanced
    ? "flex flex-col items-center justify-center min-h-[70vh] gap-6 p-8 bg-gradient-to-br from-gray-50 to-white backdrop-blur-sm"
    : "flex flex-col items-center justify-center min-h-[70vh] gap-6 p-8 bg-white/5 backdrop-blur-sm";

  const titleClass = enhanced
    ? "text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"
    : "text-3xl font-bold text-gray-800";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={containerClass}
    >
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          className="relative h-24 w-24"
        >
          <Trophy className="w-24 h-24 text-amber-400 drop-shadow-2xl" />
          {stars === 3 && (
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center text-xs"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
          )}
        </motion.div>
        <h2 className={titleClass}>
          Game Complete!
        </h2>
        <p className="text-base text-gray-600 max-w-md text-center">
          You scored {score} out of {totalQuestions} ({percentage}%)
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
        className="relative"
      >
        <div className="relative h-20 w-[200px] mx-auto">
          <div className="absolute inset-0 h-full w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-20"></div>
          <div className="relative h-full w-full rounded-2xl bg-white/80 backdrop-blur">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl"
              style={{ width: `${(percentage / 100) * 100}%` }}
              transition={{ delay: 0.5, duration: 1.5 }}
            ></motion.div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-base font-medium">
          <span className="text-gray-600">Completion:</span>
          <span className="text-lg font-bold text-gray-800">{percentage}%</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3"
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5 + i * 0.2, type: "spring", bounce: 0.6 }}
          >
            <motion.div
              className={`relative w-12 h-12 flex items-center justify-center rounded-xl ${i <= stars ? "bg-amber-400/20" : "bg-gray-100"}`}>
              <Star className={`w-10 h-10 ${i <= stars ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />
              {i <= stars && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-white rounded-full flex items-center justify-center text-xs"
                >
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    className="w-2 h-2 bg-white rounded-full"
                  >
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-3 text-xl font-bold text-purple-600"
      >
        <Zap className="w-6 h-6" />
        <span>+{xpEarned} XP Earned!</span>
      </motion.div>

      {stars === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex items-center gap-3 text-base font-medium text-amber-600"
        >
          <Star className="w-5 h-5 text-amber-500" />
          <span>Perfect Score! You've earned a bonus!</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex gap-5 mt-6"
      >
        <button
          onClick={onPlayAgain}
          className={"flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl transform hover:scale-105 transition-all duration-200" + (enhanced ? " ring-2 ring-purple-500/20" : "")}
        >
          <RotateCcw className="w-6 h-6" />
          Play Again
        </button>

        <button
          onClick={() => router.push("/games")}
          className={"flex items-center gap-3 px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl shadow-lg shadow-gray-500/20 hover:shadow-xl transform hover:scale-105 transition-all duration-200" + (enhanced ? " ring-2 ring-gray-500/20" : "")}
        >
          <Home className="w-6 h-6" />
          Back to Games
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="text-sm text-gray-500"
      >
        Keep playing to unlock more games and earn achievements!
      </motion.div>
    </motion.div>
  );
}