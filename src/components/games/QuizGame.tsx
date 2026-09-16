"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";
import TimerBar from "./TimerBar";

interface Topic {
  id: string;
  name: string;
  description: string;
  unit: string;
}

export default function QuizGame() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
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
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  useEffect(() => {
    if (topics.length > 0 && !gameOver) {
      generateOptions();
    }
  }, [currentIndex, topics, gameOver]);

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

  const generateOptions = () => {
    const current = topics[currentIndex];
    const otherTopics = topics.filter((_, i) => i !== currentIndex);
    const distractors = otherTopics
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((t) => t.name);

    const allOptions = [current.name, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  };

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const correct = answer === topics[currentIndex].name;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
      setXpEarned((x) => x + 15);
    }

    setTimeout(async () => {
      setSelectedAnswer(null);
      setIsCorrect(null);

      if (currentIndex + 1 >= topics.length) {
        const finalXp = correct ? xpEarned + 15 : xpEarned;
        try {
          await fetch("/api/xp/award", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game: "quiz", xp: finalXp }),
          });
        } catch (error) {
          console.error("Failed to award XP:", error);
        }
        setGameOver(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 1000);
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0);
    setScore(0);
    setXpEarned(0);
    setTimeLeft(60);
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
        totalQuestions={topics.length}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        gameSlug="quiz"
      />
    );
  }

  const currentTopic = topics[currentIndex];

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader
        title="Quiz"
        timer={timeLeft}
        score={score}
        xpEarned={xpEarned}
      />

      <TimerBar timeLeft={timeLeft} totalTime={60} />

      <div className="flex justify-center text-sm text-gray-500">
        Question {currentIndex + 1} of {topics.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            className="w-full max-w-md p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl text-center"
            animate={isCorrect === false ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <span className="text-sm text-white/80">What is this topic?</span>
            <h2 className="text-2xl font-bold text-white mt-2">
              {currentTopic.name}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 w-full max-w-md">
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
                    : option === currentTopic.name && selectedAnswer
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
