import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useSound } from "@/lib/sounds";
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
  const { play } = useSound();
  // [PLACEHOLDER] Tuning values - adjust based on playtesting
  const XP_PER_CORRECT = 15; // Base XP for correct answer
  const XP_BONUS_PERFECT = 25; // Bonus for perfect session
  const QUESTIONS_PER_SESSION = 10; // Number of questions per game
  const TIME_LIMIT_SECONDS = 60; // Time limit in seconds
  const OPTIONS_PER_QUESTION = 4; // Number of options per question

  useEffect(() => { fetchTopics(); }, []);

  useEffect(() => {
    if (timeLeft <= 0 || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setGameOver(true); return 0; }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  useEffect(() => {
    if (topics.length > 0 && !gameOver) generateOptions();
  }, [currentIndex, topics, gameOver]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      const shuffled = data.topics.sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_SESSION);
      setTopics(shuffled);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateOptions = useCallback(() => {
    const current = topics[currentIndex];
    const otherTopics = topics.filter((_, i) => i !== currentIndex);
    const distractors = otherTopics
      .sort(() => Math.random() - 0.5)
      .slice(0, OPTIONS_PER_QUESTION - 1)
      .map((t) => t.name);

    const allOptions = [current.name, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  }, [topics, currentIndex]);

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const correct = answer === topics[currentIndex].name;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
      setXpEarned((x) => x + XP_PER_CORRECT);
      play('correct');
    } else {
      play('wrong');
    }

    setTimeout(async () => {
      setSelectedAnswer(null);
      setIsCorrect(null);

      if (currentIndex + 1 >= topics.length) {
        const finalXp = correct ? xpEarned + XP_BONUS_PERFECT : xpEarned;
        try {
          await fetch("/api/xp/award", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game: "quiz", xp: finalXp }),
          });
          if (correct) {
            play('xp-gain');
          }
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
    setTimeLeft(TIME_LIMIT_SECONDS);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGameOver(false);
    play('click');
    fetchTopics();
  };

  const currentTopic = topics[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin-slow"
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
        enhanced={true}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <GameHeader
        title="Quiz"
        timer={timeLeft}
        score={score}
        xpEarned={xpEarned}
        enhanced={true}
      />

      <TimerBar timeLeft={timeLeft} totalTime={TIME_LIMIT_SECONDS} />

      <div className="flex justify-center text-base text-gray-500">
        Question {currentIndex + 1} of {topics.length}
      </div>

      <div className="flex justify-center text-lg text-gray-600 mb-6">
        <span className="me-4">Unit: <span className="font-semibold text-gray-800">{currentTopic.unit}</span></span>
        <span>Topic: <span className="font-semibold text-gray-800">{currentTopic.name}</span></span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="flex flex-col items-center gap-8"
        >
          <motion.div
            className={`w-full max-w-[400px] p-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl text-center ${
              isCorrect === false
                ? "animate-pulse bg-red-500/20"
                : ""
            }`}
          >
            <span className="text-lg text-white/80 mb-2">What is this topic?</span>
            <h2 className="text-3xl font-bold text-white mb-4">
              {currentTopic.name}
            </h2>
          </motion.div>

          <div className="grid gap-4">
            {options.map((option, index) => (
              <motion.button
                key={option}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={`flex items-center gap-3 px-8 py-6 w-full text-lg font-bold transition-all ${
                  selectedAnswer === option
                    ? isCorrect
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                    : option === currentTopic.name && selectedAnswer
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                } hover:shadow-md transform transition-transform duration-200`}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {isCorrect !== null && (
        <div className="flex justify-center text-base mt-6">
          {isCorrect ? (
            <div className="flex items-center space-x-4 p-4 bg-emerald-500/20 rounded-xl border-l-4 border-emerald-500">
              <Check className="w-5 h-5 text-emerald-500" />
              <div className="flex flex-col space-y-1">
                <span className="text-base font-semibold text-emerald-600">Correct!</span>
                <span className="text-sm text-emerald-500">+{XP_PER_CORRECT} XP awarded</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4 p-4 bg-red-500/20 rounded-xl border-l-4 border-red-500">
              <X className="w-5 h-5 text-red-500" />
              <div className="flex flex-col space-y-1">
                <span className="text-base font-semibold text-red-600">Incorrect!</span>
                <span className="text-sm text-red-500">The answer was: {currentTopic.name}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}