"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, Star, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface GameEndScreenProps {
  score: number;
  totalQuestions: number;
  xpEarned: number;
  onPlayAgain: () => void;
  gameSlug: string;
}

export default function GameEndScreen({
  score,
  totalQuestions,
  xpEarned,
  onPlayAgain,
  gameSlug,
}: GameEndScreenProps) {
  const router = useRouter();
  const percentage = Math.round((score / totalQuestions) * 100);
  const stars = percentage >= 90 ? 3 : percentage >= 60 ? 2 : percentage >= 30 ? 1 : 0;

  useEffect(() => {
    if (stars === 3) {
      const end = Date.now() + 3000;
      const colors = ["#a855f7", "#ec4899", "#f59e0b"];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-8"
    >
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <Trophy className="w-20 h-20 text-amber-400" />
        <h2 className="text-3xl font-bold text-gray-800">Game Complete!</h2>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
        className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500"
      >
        {score}/{totalQuestions}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-2"
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5 + i * 0.2, type: "spring", bounce: 0.6 }}
          >
            <Star
              className={`w-12 h-12 ${
                i <= stars
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex items-center gap-2 text-xl font-bold text-purple-600"
      >
        <Zap className="w-6 h-6" />
        <span>+{xpEarned} XP Earned!</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex gap-4 mt-4"
      >
        <button
          onClick={onPlayAgain}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>

        <button
          onClick={() => router.push("/games")}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <Home className="w-5 h-5" />
          Back to Games
        </button>
      </motion.div>
    </motion.div>
  );
}
