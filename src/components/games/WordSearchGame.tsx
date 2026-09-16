"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";

interface Topic {
  id: string;
  name: string;
}

export default function WordSearchGame() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTopics(); }, []);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      const selected = data.topics.sort(() => Math.random() - 0.5).slice(0, 5);
      const wordList = selected.map((t: Topic) => t.name.toUpperCase().slice(0, 8));
      setWords(wordList);
      generateGrid(wordList);
    } catch (error) { console.error("Failed to fetch topics:", error); }
    finally { setLoading(false); }
  };

  const generateGrid = (wordList: string[]) => {
    const size = 8;
    const newGrid: string[][] = Array(size).fill(null).map(() => Array(size).fill(""));
    wordList.forEach((word) => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * (size - word.length));
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          if (newGrid[row][col + i] !== "" && newGrid[row][col + i] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          for (let i = 0; i < word.length; i++) newGrid[row][col + i] = word[i];
          placed = true;
        }
        attempts++;
      }
    });
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (newGrid[i][j] === "") newGrid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
    setGrid(newGrid);
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameOver) return;
    const isAlreadySelected = selectedCells.some(([r, c]) => r === row && c === col);
    if (isAlreadySelected) setSelectedCells((prev) => prev.filter(([r, c]) => !(r === row && c === col)));
    else setSelectedCells((prev) => [...prev, [row, col]]);
  };

  const checkSelection = () => {
    const selectedWord = selectedCells.map(([r, c]) => grid[r][c]).join("");
    const foundWord = words.find(
      (w) => !foundWords.includes(w) && (selectedWord === w || selectedWord === w.split("").reverse().join(""))
    );
    if (foundWord) {
      setFoundWords((prev) => [...prev, foundWord]);
      setScore((s) => s + 1);
      setXpEarned((x) => x + 25);
      setSelectedCells([]);
      if (foundWords.length + 1 >= words.length) endGame();
    } else {
      setSelectedCells([]);
    }
  };

  const endGame = async () => {
    setGameOver(true);
    try {
      await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "wordsearch", xp: xpEarned }),
      });
    } catch (error) { console.error("Failed to award XP:", error); }
  };

  const handlePlayAgain = () => {
    setGrid([]); setWords([]); setFoundWords([]); setSelectedCells([]);
    setScore(0); setXpEarned(0); setTimer(0); setGameOver(false); fetchTopics();
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
        totalQuestions={words.length}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        gameSlug="wordsearch"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader title="Word Search" timer={timer} score={score} xpEarned={xpEarned} />
      <div className="flex flex-wrap justify-center gap-2">
        {words.map((word) => (
          <span
            key={word}
            className={
              "px-3 py-1 rounded-full text-sm font-bold " +
              (foundWords.includes(word) ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600")
            }
          >
            {word}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1 max-w-sm mx-auto">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSelected = selectedCells.some(([r, c]) => r === rowIndex && c === colIndex);
            return (
              <motion.button
                key={rowIndex + "-" + colIndex}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={
                  "aspect-square rounded-lg font-bold text-sm shadow " +
                  (isSelected ? "bg-purple-500 text-white" : "bg-white text-gray-800")
                }
              >
                {cell}
              </motion.button>
            );
          })
        )}
      </div>
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={checkSelection}
          disabled={selectedCells.length === 0}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50"
        >
          Check Word
        </motion.button>
      </div>
    </div>
  );
}
