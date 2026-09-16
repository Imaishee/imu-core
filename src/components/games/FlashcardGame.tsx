"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Check, X } from "lucide-react";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";

interface Topic {
  id: string;
  name: string;
  description: string;
  unit: string;
}

export default function FlashcardGame() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      const shuffled = data.topics.sort(() => Math.random() - 0.5).slice(0, 10);
      setTopics(shuffled);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    if (correct) {
      setScore((s) => s + 1);
      setXpEarned((x) => x + 10);
    }

    setIsFlipped(false);

    if (currentIndex + 1 >= topics.length) {
      const finalXp = correct ? xpEarned + 10 : xpEarned;
      try {
        await fetch("/api/xp/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: "flashcard", xp: finalXp }),
        });
      } catch (error) {
        console.error("Failed to award XP:", error);
      }
      setGameOver(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0);
    setScore(0);
    setXpEarned(0);
    setIsFlipped(false);
    setGameOver(false);
    fetchTopics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (gameOver) {
    return (
      <GameEndScreen
        score={score}
        totalQuestions={topics.length}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        gameSlug="flashcard"
      />
    );
  }

  const currentTopic = topics[currentIndex];

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader
        title="Flashcards"
        score={score}
        xpEarned={xpEarned}
      />

      <div className="flex justify-center text-sm text-gray-500">
        Card {currentIndex + 1} of {topics.length}
      </div>

      <div className="flex justify-center perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: isFlipped ? 180 : 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-md h-64 cursor-pointer"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className={`absolute inset-0 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 ${
                isFlipped
                  ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                  : "bg-gradient-to-br from-purple-500 to-pink-500"
              }`}
              style={{ backfaceVisibility: "hidden" }}
            >
              {!isFlipped ? (
                <>
                  <span className="text-sm text-white/80 mb-2">{currentTopic.unit}</span>
                  <h3 className="text-2xl font-bold text-white text-center">
                    {currentTopic.name}
                  </h3>
                  <span className="text-sm text-white/60 mt-4">Tap to reveal</span>
                </>
              ) : (
                <>
                  <span className="text-sm text-white/80 mb-2">Definition</span>
                  <p className="text-lg text-white text-center">
                    {currentTopic.description}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleAnswer(false)}
          className="flex items-center gap-2 px-8 py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg"
        >
          <X className="w-5 h-5" />
          Again
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleAnswer(true)}
          className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg"
        >
          <Check className="w-5 h-5" />
          Got it!
        </motion.button>
      </div>
    </div>
  );
}
