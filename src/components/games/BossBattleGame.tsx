"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";

interface Topic {
  id: string;
  name: string;
  unit: string;
}

export default function BossBattleGame() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [bossHp, setBossHp] = useState(10);
  const [bossMaxHp] = useState(10);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const XP_PER_CORRECT = 20;
  const XP_BOSS_BONUS = 50;
  const DAMAGE_PER_CORRECT = 1;
  const HEAL_PER_WRONG = 1;

  useEffect(() => { fetchTopics(); }, []);

  useEffect(() => {
    if (topics.length > 0 && !gameOver) generateQuestion();
  }, [currentIndex, topics, gameOver]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      setTopics(data.topics.sort(() => Math.random() - 0.5));
    } catch (error) { console.error("Failed to fetch topics:", error); }
    finally { setLoading(false); }
  };

  const generateQuestion = () => {
    if (topics.length < 2) return;
    const current = topics[currentIndex % topics.length];
    const otherTopics = topics.filter((_, i) => i !== currentIndex % topics.length)
      .sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions([current.name, ...otherTopics.map((t) => t.name)].sort(() => Math.random() - 0.5));
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const current = topics[currentIndex % topics.length];
    const correct = answer === current.name;
    setIsCorrect(correct);
    if (correct) {
      setBossHp((prev) => Math.max(0, prev - DAMAGE_PER_CORRECT));
      setScore((s) => s + 1);
      setXpEarned((x) => x + XP_PER_CORRECT);
      if (bossHp - DAMAGE_PER_CORRECT <= 0) {
        setTimeout(() => endGame(true), 1000);
      }
    } else {
      setBossHp((prev) => Math.min(bossMaxHp, prev + HEAL_PER_WRONG));
      if (bossHp + HEAL_PER_WRONG >= bossMaxHp) {
        setTimeout(() => endGame(false), 1000);
      }
    }
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setCurrentIndex((i) => i + 1);
    }, 1000);
  };

  const endGame = async (playerWon: boolean) => {
    setGameOver(true);
    try {
      const finalXp = playerWon ? xpEarned + XP_BOSS_BONUS : Math.floor(xpEarned * 0.5);
      await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "bossbattle", xp: finalXp }),
      });
    } catch (error) { console.error("Failed to award XP:", error); }
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0); setScore(0); setXpEarned(0); setBossHp(10);
    setSelectedAnswer(null); setIsCorrect(null); setGameOver(false); fetchTopics();
  };

  const bossHpPercent = (bossHp / bossMaxHp) * 100;

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
        totalQuestions={score + (bossMaxHp - bossHp)}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        gameSlug="bossbattle"
      />
    );
  }

  const currentTopic = topics[currentIndex % topics.length];

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader title="Boss Battle" score={score} xpEarned={xpEarned} />

      <motion.div
        className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl"
        animate={isCorrect === false ? { scale: [1, 1.05, 1] } : {}}
      >
        <motion.div
          className="text-6xl"
          animate={isCorrect ? { scale: [1, 0.8, 1], rotate: [0, -10, 10, 0] } : isCorrect === false ? { scale: [1, 1.2, 1] } : {}}
        >
          👹
        </motion.div>
        <h3 className="text-xl font-bold text-red-600">Knowledge Goblin</h3>
        <p className="text-sm text-gray-600 max-w-md">A sneaky creature that loves to confuse learners.</p>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          <div className="w-48 h-4 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500"
              animate={{ width: bossHpPercent + "%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-sm font-bold text-red-600">{bossHp}/{bossMaxHp}</span>
        </div>
      </motion.div>

      <div className="flex justify-center text-sm text-gray-500">Question {currentIndex + 1}</div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div className="w-full max-w-md p-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl shadow-xl text-center">
          <span className="text-sm text-white/80">Identify this topic</span>
          <h2 className="text-xl font-bold text-white mt-2">{currentTopic.name}</h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 w-full max-w-md">
          {options.map((option, index) => (
            <motion.button
              key={option}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleAnswer(option)}
              disabled={!!selectedAnswer}
              className={
                "p-4 rounded-2xl font-bold text-lg transition-all shadow-md hover:shadow-lg transform transition-transform duration-200 " +
                (selectedAnswer === option
                  ? isCorrect
                    ? "bg-emerald-500 text-white"
                    : "bg-red-500 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100")
              }
            >
              {option}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
