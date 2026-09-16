"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";

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

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);

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
          setCards((prev) =>
            prev.map((c) =>
              c.topicId === firstCard.topicId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setScore((s) => s + 1);
          setXpEarned((x) => x + 20);
          setFlippedCards([]);

          const allMatched = cards.every(
            (c) => c.isMatched || c.topicId === firstCard.topicId
          );
          if (allMatched) {
            endGame();
          }
        }, 500);
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  }, [flippedCards, cards, gameOver]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      const selected = data.topics.sort(() => Math.random() - 0.5).slice(0, 6);

      const newCards: Card[] = [];
      selected.forEach((topic: Topic) => {
        newCards.push({
          id: `${topic.id}-term`,
          topicId: topic.id,
          content: topic.name,
          type: "term",
          isFlipped: false,
          isMatched: false,
        });
        newCards.push({
          id: `${topic.id}-def`,
          topicId: topic.id,
          content: topic.description.slice(0, 50) + "...",
          type: "definition",
          isFlipped: false,
          isMatched: false,
        });
      });

      setCards(newCards.sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const endGame = async () => {
    setGameOver(true);
    try {
      await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "match", xp: xpEarned }),
      });
    } catch (error) {
      console.error("Failed to award XP:", error);
    }
  };

  const handleCardClick = (id: string) => {
    if (flippedCards.length >= 2) return;
    if (flippedCards.includes(id)) return;

    const card = cards.find((c) => c.id === id);
    if (!card || card.isMatched) return;

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
    );
    setFlippedCards((prev) => [...prev, id]);
  };

  const handlePlayAgain = () => {
    setCards([]);
    setFlippedCards([]);
    setMoves(0);
    setScore(0);
    setXpEarned(0);
    setTimer(0);
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
        totalQuestions={6}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        gameSlug="match"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader
        title="Match Pairs"
        timer={timer}
        score={score}
        xpEarned={xpEarned}
      />

      <div className="flex justify-center gap-8 text-sm text-gray-500">
        <span>Moves: {moves}</span>
        <span>Pairs: {score}/6</span>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square rounded-2xl cursor-pointer ${
              card.isFlipped || card.isMatched
                ? card.type === "term"
                  ? "bg-gradient-to-br from-purple-500 to-pink-500"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
                : "bg-gradient-to-br from-gray-700 to-gray-900"
            } shadow-lg flex items-center justify-center p-2`}
          >
            <AnimatePresence mode="wait">
              {card.isFlipped || card.isMatched ? (
                <motion.p
                  key="content"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-white text-xs font-bold text-center leading-tight"
                >
                  {card.content}
                </motion.p>
              ) : (
                <motion.span
                  key="hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-3xl"
                >
                  ?
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
