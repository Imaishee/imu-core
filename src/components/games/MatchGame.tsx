"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";
import { useSound } from "@/lib/sounds";

interface Topic {
  id: string;
  name: string;
  description: string;
}

interface Card {
  id: string;
  topicId: string;
  content: string;
  type: "term" | "definition";
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MatchGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const { play } = useSound();
  const XP_PER_MATCH = 20;
  const XP_BONUS_PERFECT = 30;
  const PAIRS_PER_SESSION = 6;
  const MISMATCH_RESET_DELAY = 1000;
  const MATCH_ANIMATION_DURATION = 500;

  useEffect(() => { fetchTopics(); }, []);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = flippedCards;
      const firstCard = cards.find((c) => c.id === first);
      const secondCard = cards.find((c) => c.id === second);

      if (firstCard && secondCard && firstCard.topicId === secondCard.topicId) {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => c.topicId === firstCard.topicId ? { ...c, isMatched: true } : c));
          setScore((s) => s + 1);
          setXpEarned((x) => x + XP_PER_MATCH);
          play('correct');
          setFlippedCards([]);
          const allMatched = cards.every((c) => c.isMatched || c.topicId === firstCard.topicId);
          if (allMatched) endGame();
        }, MATCH_ANIMATION_DURATION);
      } else {
        setTimeout(() => { setFlippedCards([]); play('wrong'); }, MISMATCH_RESET_DELAY);
      }
    }
  }, [flippedCards, cards, gameOver]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      const selected = data.topics.sort(() => Math.random() - 0.5).slice(0, PAIRS_PER_SESSION);
      const newCards: Card[] = [];
      selected.forEach((topic: Topic) => {
        newCards.push({ id: topic.id + "-term", topicId: topic.id, content: topic.name, type: "term", isFlipped: false, isMatched: false });
        newCards.push({ id: topic.id + "-def", topicId: topic.id, content: topic.description.slice(0, 50) + "...", type: "definition", isFlipped: false, isMatched: false });
      });
      setCards(newCards.sort(() => Math.random() - 0.5));
    } catch (error) { console.error("Failed to fetch topics:", error); }
    finally { setLoading(false); }
  };

  const endGame = async () => {
    setGameOver(true);
    try {
      const perfectBonus = moves === PAIRS_PER_SESSION ? XP_BONUS_PERFECT : 0;
      await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "match", xp: xpEarned + perfectBonus }),
      });
      if (perfectBonus > 0) play('achievement');
      else play('xp-gain');
    } catch (error) { console.error("Failed to award XP:", error); }
  };

  const handleCardClick = (id: string) => {
    if (flippedCards.length >= 2 || flippedCards.includes(id)) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isMatched) return;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));
    setFlippedCards((prev) => [...prev, id]);
    play('click');
  };

  const handlePlayAgain = () => {
    setCards([]); setFlippedCards([]); setMoves(0); setScore(0); setXpEarned(0); setTimer(0); setGameOver(false);
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
        totalQuestions={PAIRS_PER_SESSION}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        gameSlug="match"
        enhanced={true}
      />
    );
  }

  const matchedPairs = cards.filter((c) => c.isMatched).length / 2;

  return (
    <div className="flex flex-col gap-8 p-8">
      <GameHeader title="Match Pairs" timer={timer} score={score} xpEarned={xpEarned} enhanced={true} />

      <div className="flex justify-center gap-6 text-base text-gray-500">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">🧠</div>
          <span className="font-medium">Memory: {moves}/{PAIRS_PER_SESSION}</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs">🔥</div>
          <span className="font-medium">Pairs: {matchedPairs}/{PAIRS_PER_SESSION}</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">⏱️</div>
          <span className="font-medium">Time: {timer}s</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(card.id)}
            className={"aspect-square rounded-2xl cursor-pointer shadow-2xl flex items-center justify-center p-4 transition-transform duration-200 " +
              (card.isFlipped || card.isMatched
                ? card.type === "term"
                  ? "bg-gradient-to-br from-purple-500 to-pink-500"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
                : "bg-gradient-to-br from-gray-700 to-gray-900")}
          >
            <AnimatePresence mode="wait">
              {card.isFlipped || card.isMatched ? (
                <motion.p
                  key="content"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-white text-sm font-bold text-center leading-none"
                >
                  {card.content}
                </motion.p>
              ) : (
                <motion.span key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl">?</motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {!gameOver && matchedPairs > 0 && (
        <div className="flex justify-center text-sm text-gray-600 bg-gray-50 px-6 py-3 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span>Accuracy: {Math.floor((matchedPairs / (moves || 1)) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
