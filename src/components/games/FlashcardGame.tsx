"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useSound } from "@/lib/sounds";
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
  const { play } = useSound();
  const XP_PER_CORRECT = 10;
  const XP_BONUS_PERFECT = 20;
  const CARDS_PER_SESSION = 10;
  const FLIP_ANIMATION_DURATION = 0.4;

  useEffect(() => { fetchTopics(); }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      const shuffled = data.topics.sort(() => Math.random() - 0.5).slice(0, CARDS_PER_SESSION);
      setTopics(shuffled);
    } catch (error) { console.error("Failed to fetch topics:", error); }
    finally { setLoading(false); }
  };

  const handleAnswer = async (correct: boolean) => {
    if (correct) {
      setScore((s) => s + 1);
      setXpEarned((x) => x + XP_PER_CORRECT);
      play('correct');
    } else {
      play('wrong');
    }
    setIsFlipped(false);
    if (currentIndex + 1 >= topics.length) {
      const finalXp = correct ? xpEarned + XP_BONUS_PERFECT : xpEarned;
      try {
        await fetch("/api/xp/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: "flashcard", xp: finalXp }),
        });
        if (correct) play('xp-gain');
      } catch (error) { console.error("Failed to award XP:", error); }
      setGameOver(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0); setScore(0); setXpEarned(0); setIsFlipped(false); setGameOver(false);
    play('click');
    fetchTopics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
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
        enhanced={true}
      />
    );
  }

  const currentTopic = topics[currentIndex];

  return (
    <div className="flex flex-col gap-8 p-8">
      <GameHeader title="Flashcards" score={score} xpEarned={xpEarned} enhanced={true} />
      <div className="flex justify-center text-base text-gray-500">
        Card {currentIndex + 1} of {topics.length}
      </div>
      <div className="flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: isFlipped ? 180 : 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: FLIP_ANIMATION_DURATION, type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-[400px] h-[320px] cursor-pointer"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className={"absolute inset-0 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 " +
                (isFlipped
                  ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                  : "bg-gradient-to-br from-purple-500 to-pink-500")}
              style={{ backfaceVisibility: "hidden" }}
            >
              {!isFlipped ? (
                <>
                  <span className="text-lg text-white/80 mb-4">{currentTopic.unit}</span>
                  <h2 className="text-3xl font-bold text-white text-center mb-6">{currentTopic.name}</h2>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-sm text-white/60">
                    Tap to reveal definition
                  </motion.div>
                </>
              ) : (
                <>
                  <span className="text-lg text-white/80 mb-4">Definition</span>
                  <p className="text-xl text-white text-center text-[18px] leading-relaxed mb-8">{currentTopic.description}</p>
                  <div className="flex flex-col gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(false)}
                      className="flex items-center gap-3 px-10 py-5 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transform transition-all duration-200"
                    >
                      <X className="w-6 h-6" />
                      Again
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(true)}
                      className="flex items-center gap-3 px-10 py-5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transform transition-all duration-200"
                    >
                      <Check className="w-6 h-6" />
                      Got it!
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {!isFlipped && score > 0 && (
        <div className="flex justify-center text-sm text-gray-600 bg-gray-50 px-6 py-3 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span>Correct: {score}/{currentIndex + 1} ({(score / (currentIndex + 1) * 100).toFixed(0)}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}
