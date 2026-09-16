"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";
import TimerBar from "./TimerBar";

interface Topic {
  id: string;
  name: string;
  unit: string;
}

export default function SpeedRoundGame() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [xpEarned, setXpEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  useEffect(() => {
    if (topics.length > 0 && !gameOver) {
      generateQuestion();
    }
  }, [currentIndex, topics, gameOver]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      const shuffled = data.topics.sort(() => Math.random() - 0.5);
      setTopics(shuffled);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuestion = () => {
    if (topics.length < 2) return;

    const current = topics[currentIndex % topics.length];
    const otherUnits = [...new Set(topics.map((t) => t.unit))].filter(
      (u) => u !== current.unit
    );

    if (otherUnits.length === 0) return;

    const wrongUnit = otherUnits[Math.floor(Math.random() * otherUnits.length)];
    const allOptions = [current.unit, wrongUnit].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const current = topics[currentIndex % topics.length];
    const correct = answer === current.unit;
    setIsCorrect(correct);

    if (correct) {
      const points = 10 * multiplier;
      setScore((s) => s + points);
      setXpEarned((x) => x + points);
      setStreak((s) => s + 1);
      setMultiplier((m) => Math.min(m + 0.5, 3));
    } else {
      setStreak(0);
      setMultiplier(1);
    }

    setMaxStreak((m) => Math.max(m, correct ? streak + 1 : streak));

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setCurrentIndex((i) => i + 1);
    }, 300);
  };

  const endGame = async () => {
    setGameOver(true);
    try {
      await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "speedround", xp: xpEarned }),
      });
    } catch (error) {
      console.error("Failed to award XP:", error);
    }
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setMultiplier(1);
    setXpEarned(0);
    setTimeLeft(45);
    setSelectedAnswer(null);
    setIsCorrect(null);
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
        totalQuestions={currentIndex}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        gameSlug="speedround"
      />
    );
  }

  const currentTopic = topics[currentIndex % topics.length];

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader
        title="Speed Round"
        timer={timeLeft}
        score={score}
        xpEarned={xpEarned}
      />

      <TimerBar timeLeft={timeLeft} totalTime={45} />

      <div className="flex justify-center gap-4">
        <div className="px-4 py-2 bg-orange-100 rounded-xl">
          <span className="text-orange-600 font-bold">Streak: {streak}</span>
        </div>
        <div className="px-4 py-2 bg-purple-100 rounded-xl">
          <span className="text-purple-600 font-bold">x{multiplier}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            className="w-full max-w-md p-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl shadow-xl text-center"
            animate={isCorrect === false ? { scale: [1, 0.95, 1] } : {}}
          >
            <span className="text-sm text-white/80">Which unit is this?</span>
            <h2 className="text-2xl font-bold text-white mt-2">
              {currentTopic.name}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {options.map((option, index) => (
              <motion.button
                key={option}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={`p-4 rounded-2xl font-bold text-lg transition-all ${
                  selectedAnswer === option
                    ? isCorrect
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                    : option === currentTopic.unit && selectedAnswer
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                } shadow-md`}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
