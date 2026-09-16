"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";
import TimerBar from "./TimerBar";

interface Topic {
  id: string;
  name: string;
  unit: string;
  description: string;
}

export default function StrategyQuizGame() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [resources, setResources] = useState(100);
  const [betAmount, setBetAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const BASE_XP_PER_CORRECT = 15;
  const STARTING_RESOURCES = 100;
  const TIME_LIMIT_SECONDS = 60;
  const MIN_BET = 0;
  const MAX_BET_PER_QUESTION = 50;

  useEffect(() => { fetchTopics(); }, []);

  useEffect(() => {
    if (timeLeft <= 0 || gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { endGame(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  useEffect(() => {
    if (topics.length > 0 && !gameOver) generateQuestion();
  }, [currentIndex, topics, gameOver]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      setTopics(data.topics.sort(() => Math.random() - 0.5).slice(0, 20));
    } catch (error) { console.error("Failed to fetch topics:", error); }
    finally { setLoading(false); }
  };

  const generateQuestion = () => {
    if (topics.length < 2) return;
    const current = topics[currentIndex % topics.length];
    const otherTopics = topics.filter((_, i) => i !== currentIndex % topics.length).sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions([current.name, ...otherTopics.map((t) => t.name)].sort(() => Math.random() - 0.5));
  };

  const handleBetChange = (amount: number) => {
    setBetAmount(Math.max(MIN_BET, Math.min(amount, resources, MAX_BET_PER_QUESTION)));
  };

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const current = topics[currentIndex % topics.length];
    const correct = answer === current.name;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      setXpEarned((x) => x + BASE_XP_PER_CORRECT);
      setResources((r) => r + betAmount);
    } else {
      setResources((r) => r - betAmount);
      if (resources - betAmount <= 0) {
        setTimeout(() => endGame(), 1000);
        return;
      }
    }
    setTimeout(() => {
      setSelectedAnswer(null); setIsCorrect(null); setBetAmount(0); setCurrentIndex((i) => i + 1);
    }, 1000);
  };

  const endGame = async () => {
    setGameOver(true);
    try {
      const resourceToXp = Math.floor(resources / 10);
      await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "strategyquiz", xp: xpEarned + resourceToXp }),
      });
    } catch (error) { console.error("Failed to award XP:", error); }
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0); setScore(0); setXpEarned(0); setResources(STARTING_RESOURCES);
    setBetAmount(0); setTimeLeft(TIME_LIMIT_SECONDS); setSelectedAnswer(null); setIsCorrect(null); setGameOver(false);
    fetchTopics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (gameOver) {
    return (
      <GameEndScreen score={score} totalQuestions={currentIndex} xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain} gameSlug="strategyquiz" />
    );
  }

  const currentTopic = topics[currentIndex % topics.length];

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader title="Strategy Quiz" timer={timeLeft} score={score} xpEarned={xpEarned} />
      <TimerBar timeLeft={timeLeft} totalTime={TIME_LIMIT_SECONDS} />

      <div className="flex justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs">💰</div>
          <span>Resources: {resources}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">📊</div>
          <span>Score: {score}</span>
        </div>
      </div>

      <div className="flex justify-center text-sm text-gray-500">Question {currentIndex + 1}</div>

      <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex justify-between text-sm font-medium">
          <span>Place your bet:</span>
          <span>{betAmount} gold</span>
        </div>
        <input
          type="range"
          min={MIN_BET}
          max={Math.min(resources, MAX_BET_PER_QUESTION)}
          value={betAmount}
          onChange={(e) => handleBetChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-500">Bet {betAmount} gold to win {betAmount} gold (double or nothing)</div>
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
            className="w-full max-w-md p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl text-center"
            animate={isCorrect === false ? { scale: [1, 0.95, 1] } : {}}
          >
            <span className="text-sm text-white/80">What is this topic?</span>
            <h2 className="text-2xl font-bold text-white mt-2">{currentTopic.name}</h2>
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
                className={"p-4 rounded-2xl font-bold text-lg transition-all shadow-md hover:shadow-lg transform transition-transform duration-200 " +
                  (selectedAnswer === option
                    ? isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                    : "bg-white text-gray-800 hover:bg-gray-100")}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {isCorrect !== null && (
        <div className="flex justify-center text-sm mt-4">
          {isCorrect ? (
            <div className="flex items-center space-x-2 text-emerald-500">
              <Check className="w-4 h-4" />
              <span>Correct! +{BASE_XP_PER_CORRECT} XP and won {betAmount} gold</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-500">
              <X className="w-4 h-4" />
              <span>Incorrect. Lost {betAmount} gold. The answer was: {currentTopic.name}</span>
            </div>
          )}
        </div>
      )}

      {!gameOver && resources > 0 && (
        <div className="flex justify-center text-sm text-gray-600">
          <span>Tip: Bet more when confident, less when unsure. Manage your resources to last the entire round.</span>
        </div>
      )}
    </div>
  );
}
