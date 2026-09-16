"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";

interface Topic {
  id: string;
  name: string;
  description: string;
  unit: string;
}

interface PuzzleItem {
  id: string;
  content: string;
  correctOrder: number;
  currentOrder: number;
}

export default function PuzzleGame() {
  const [items, setItems] = useState<PuzzleItem[]>([]);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => { fetchTopics(); }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      const selected = data.topics.sort(() => Math.random() - 0.5).slice(0, 6);
      const puzzleItems: PuzzleItem[] = selected.map((topic: Topic, index: number) => ({
        id: topic.id,
        content: topic.name,
        correctOrder: index,
        currentOrder: index,
      })).sort(() => Math.random() - 0.5);
      puzzleItems.forEach((item, index) => { item.currentOrder = index; });
      setItems(puzzleItems);
    } catch (error) { console.error("Failed to fetch topics:", error); }
    finally { setLoading(false); }
  };

  const handleDragStart = (id: string) => { setDraggedItem(id); };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === id) return;
    setItems((prev) => {
      const newItems = [...prev];
      const draggedIndex = newItems.findIndex((i) => i.id === draggedItem);
      const targetIndex = newItems.findIndex((i) => i.id === id);
      const temp = newItems[draggedIndex].currentOrder;
      newItems[draggedIndex].currentOrder = newItems[targetIndex].currentOrder;
      newItems[targetIndex].currentOrder = temp;
      return newItems.sort((a, b) => a.currentOrder - b.currentOrder);
    });
  };

  const handleDragEnd = () => { setDraggedItem(null); };

  const checkAnswer = async () => {
    const correctCount = items.filter((item) => item.correctOrder === item.currentOrder).length;
    setScore(correctCount);
    setXpEarned(correctCount * 20);
    try {
      await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "puzzle", xp: correctCount * 20 }),
      });
    } catch (error) { console.error("Failed to award XP:", error); }
    setGameOver(true);
  };

  const handlePlayAgain = () => {
    setItems([]); setScore(0); setXpEarned(0); setGameOver(false); fetchTopics();
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
        totalQuestions={items.length}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        gameSlug="puzzle"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader title="Puzzle" score={score} xpEarned={xpEarned} />
      <p className="text-center text-gray-600">Drag to reorder the topics in the correct sequence</p>
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className={
              "flex items-center gap-3 p-4 rounded-2xl cursor-grab active:cursor-grabbing shadow-md " +
              (draggedItem === item.id ? "bg-purple-100 border-2 border-purple-500" : "bg-white")
            }
          >
            <span className="flex-1 font-bold text-gray-800">{item.content}</span>
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
              {index + 1}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={checkAnswer}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg"
        >
          Check Answer
        </motion.button>
      </div>
    </div>
  );
}
