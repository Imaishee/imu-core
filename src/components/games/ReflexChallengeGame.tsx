"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

export default function ReflexChallengeGame() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [correctOption, setCorrectOption] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number>(0);
  const BASE_POINTS_PER_CORRECT = 10;
  const MAX_REACTION_TIME_BONUS = 20;
  const REACTION_TIME_THRESHOLD = 1000;
  const XP_PER_CORRECT = 15;
  const PENALTY_PER_INCORRECT = 5;
  const TIME_LIMIT_SECONDS = 30;
  const OPTIONS_COUNT = 4;

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
    const allUnits = [...new Set(topics.map((t) => t.unit))];
    const currentUnitIndex = allUnits.indexOf(current.unit);
    const otherUnits = allUnits.filter((_, i) => i !== currentUnitIndex);
    const selectedUnits = [...new Set([current.unit, ...otherUnits.sort(() => 0.5 - Math.random()).slice(0, OPTIONS_COUNT - 1)])].sort(() => 0.5 - Math.random());
    setOptions(selectedUnits);
    setCorrectOption(current.unit);
    setQuestionStartTime(Date.now());
    setSelectedOption(null);
    setIsCorrect(null);
    setReactionTime(0);
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const reaction = Date.now() - questionStartTime;
    setReactionTime(reaction);
    const correct = option === correctOption;
    setIsCorrect(correct);
    if (correct) {
      let reactionBonus = 0;
      if (reaction < REACTION_TIME_THRESHOLD) reactionBonus = MAX_REACTION_TIME_BONUS * (1 - reaction / REACTION_TIME_THRESHOLD);
      setScore((s) => s + Math.floor(BASE_POINTS_PER_CORRECT + reactionBonus));
      setXpEarned((x) => x + XP_PER_CORRECT);
    } else {
      setScore((s) => Math.max(0, s - PENALTY_PER_INCORRECT));
    }
    setTimeout(() => { setCurrentIndex((i) => i + 1); }, 1500);
  };

  const endGame = async () => {
    setGameOver(true);
    try {
      await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "reflexchallenge", xp: xpEarned }),
      });
    } catch (error) { console.error("Failed to award XP:", error); }
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0); setScore(0); setXpEarned(0); setTimeLeft(TIME_LIMIT_SECONDS);
    setSelectedOption(null); setIsCorrect(null); setGameOver(false); setQuestionStartTime(0); setReactionTime(0);
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
        onPlayAgain={handlePlayAgain} gameSlug="reflexchallenge" />
    );
  }

  const currentTopic = topics[currentIndex % topics.length];

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader title="Reflex Challenge" timer={timeLeft} score={score} xpEarned={xpEarned} />
      <TimerBar timeLeft={timeLeft} totalTime={TIME_LIMIT_SECONDS} />
      <div className="flex justify-center text-sm text-gray-500">Question {currentIndex + 1}</div>

      <div className="flex justify-center">
        <motion.div key={currentIndex} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white text-xl font-bold text-center shadow-lg">
          {currentTopic.name}
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
        {options.map((option, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleOptionSelect(option)}
            disabled={!!selectedOption}
            className={"p-4 rounded-2xl font-bold text-lg transition-all shadow-md hover:shadow-lg " +
              (selectedOption === option
                ? isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                : option === correctOption && selectedOption
                ? "bg-emerald-500 text-white"
                : "bg-white text-gray-800 hover:bg-gray-100")}
          >
            {option}
          </motion.button>
        ))}
      </div>

      {selectedOption && (
        <div className="flex justify-center gap-4 text-sm mt-4">
          <div className="flex items-center space-x-2">
            {isCorrect ? (
              <div className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs">
                <Check className="w-3 h-3" />
              </div>
            ) : (
              <div className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                <X className="w-3 h-3" />
              </div>
            )}
            <span>{isCorrect ? "Correct!" : "Incorrect!"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">⏱️</div>
            <span>Reaction: {reactionTime}ms</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">💯</div>
            <span>Score: {score}</span>
          </div>
        </div>
      )}

      {!selectedOption && (
        <div className="flex justify-center text-sm text-gray-600">
          <span>Click the correct unit for the topic above as fast as you can!</span>
        </div>
      )}
    </div>
  );
}
