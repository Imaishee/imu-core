"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GameHeader from "./GameHeader";
import GameEndScreen from "./GameEndScreen";
import TimerBar from "./TimerBar";

interface Topic {
  id: string;
  name: string;
  unit: string;
  description: string;
}

interface Node {
  id: string;
  topic: Topic;
  x: number;
  y: number;
  unlocked: boolean;
  connections: string[];
}

export default function KnowledgeExplorerGame() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [currentQuestionTopic, setCurrentQuestionTopic] = useState<Topic | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [explorationMode, setExplorationMode] = useState(false);
  const NODE_XP_REWARD = 40;
  const MAX_CONNECTIONS_PER_NODE = 4;
  const XP_PER_CORRECT_QUESTION = 10;
  const PENALTY_PER_INCORRECT = 5;

  useEffect(() => { fetchTopics(); }, []);

  useEffect(() => {
    if (topics.length > 0 && nodes.length === 0) initializeNodes();
  }, [topics]);

  useEffect(() => {
    if (explorationMode && currentQuestionTopic) generateQuestion();
  }, [currentQuestionTopic, explorationMode]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      setTopics(data.topics.sort(() => Math.random() - 0.5).slice(0, 15));
    } catch (error) { console.error("Failed to fetch topics:", error); }
    finally { setLoading(false); }
  };

  const initializeNodes = () => {
    if (topics.length === 0) return;
    const newNodes: Node[] = topics.map((topic, index) => {
      const angle = (index * 2 * Math.PI) / topics.length;
      const radius = 200;
      return {
        id: topic.id,
        topic,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        unlocked: false,
        connections: [],
      };
    });
    newNodes.forEach((node, index) => {
      const possibleConnections = newNodes
        .filter((_, i) => i !== index)
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * MAX_CONNECTIONS_PER_NODE) + 1);
      node.connections = possibleConnections.map((n) => n.id);
    });
    if (newNodes.length > 0) newNodes[0].unlocked = true;
    setNodes(newNodes);
    setUnlockedCount(1);
  };

  const generateQuestion = () => {
    if (!currentQuestionTopic) return;
    const otherTopics = topics
      .filter((t) => t.id !== currentQuestionTopic.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const correctAnswer = currentQuestionTopic.unit;
    const wrongAnswers = otherTopics.map((t) => t.unit);
    const allAnswers = [...new Set([correctAnswer, ...wrongAnswers])].slice(0, 4);
    setOptions(allAnswers);
  };

  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.unlocked) return;
    setCurrentQuestionTopic(node.topic);
    setExplorationMode(true);
  };

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const correct = currentQuestionTopic?.unit === answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      setXpEarned((x) => x + XP_PER_CORRECT_QUESTION);
      setTimeout(() => unlockNode(currentQuestionTopic?.id), 1000);
    } else {
      setScore((s) => Math.max(0, s - PENALTY_PER_INCORRECT));
    }
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setCurrentQuestionTopic(null);
      setExplorationMode(false);
    }, 1500);
  };

  const unlockNode = (nodeId: string | undefined) => {
    if (!nodeId) return;
    setNodes((prev) => prev.map((node) => node.id === nodeId ? { ...node, unlocked: true } : node));
    setUnlockedCount((prev) => prev + 1);
    setXpEarned((prev) => prev + NODE_XP_REWARD);
    if (unlockedCount + 1 >= nodes.length) {
      setTimeout(() => endGame(true), 1000);
    }
  };

  const endGame = async (allUnlocked = false) => {
    setGameOver(true);
    try {
      await fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "knowledgeexplorer", xp: xpEarned }),
      });
    } catch (error) { console.error("Failed to award XP:", error); }
  };

  const handlePlayAgain = () => {
    setTopics([]); setNodes([]); setCurrentQuestionTopic(null); setOptions([]);
    setSelectedAnswer(null); setIsCorrect(null); setScore(0); setXpEarned(0);
    setUnlockedCount(0); setGameOver(false); setExplorationMode(false); fetchTopics();
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
        totalQuestions={nodes.length}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        gameSlug="knowledgeexplorer"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <GameHeader title="Knowledge Explorer" score={score} xpEarned={xpEarned} />

      <div className="flex justify-center text-sm text-gray-500">
        <span>Unlocked: {unlockedCount}/{nodes.length}</span>
        <span className="mx-4">|</span>
        <span>Score: {score}</span>
      </div>

      <div className="relative h-96 w-full max-w-4xl mx-auto">
        {nodes.map((node) =>
          node.connections.map((connId) => {
            const connectedNode = nodes.find((n) => n.id === connId);
            if (!connectedNode || node.id > connectedNode.id) return null;
            return (
              <svg key={node.id + "-" + connId} className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1={node.x + 200} y1={node.y + 200}
                  x2={connectedNode.x + 200} y2={connectedNode.y + 200}
                  stroke={node.unlocked && connectedNode.unlocked ? "#10B981" : "#6B7280"}
                  strokeWidth={node.unlocked && connectedNode.unlocked ? 3 : 1}
                  strokeDasharray={node.unlocked && connectedNode.unlocked ? "0" : "4,2"}
                />
              </svg>
            );
          })
        )}

        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNodeClick(node.id)}
            style={{ left: node.x + 200, top: node.y + 200 }}
            className={
              "absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-center font-bold flex items-center justify-center border-2 transition-transform duration-200 cursor-pointer " +
              (node.unlocked ? "bg-green-500 text-white border-emerald-500" : "bg-gray-300 text-gray-600 border-gray-400")
            }
          >
            {node.topic.name.length > 8 ? node.topic.name.slice(0, 8) + "..." : node.topic.name}
          </motion.div>
        ))}
      </div>

      {explorationMode && currentQuestionTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md text-center mx-4">
            <span className="text-2xl font-bold text-gray-800">Unlock this node:</span>
            <h3 className="text-xl font-bold text-gray-800 mt-4">{currentQuestionTopic.name}</h3>
            <p className="mt-2 text-gray-600">{currentQuestionTopic.unit}</p>
            <p className="text-sm text-gray-600 mb-4 mt-6">What is the unit of this topic?</p>
            <div className="grid gap-2">
              {options.map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selectedAnswer}
                  className={
                    "p-3 rounded-lg border-2 font-medium transition-all duration-200 " +
                    (selectedAnswer === option
                      ? isCorrect
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-red-500 bg-red-50 text-red-800"
                      : "border-gray-300 bg-white hover:bg-gray-50")
                  }
                >
                  {option}
                </motion.button>
              ))}
            </div>
            {isCorrect !== null && (
              <div className="mt-4 text-sm">
                {isCorrect ? (
                  <span className="text-emerald-600">Correct! +{XP_PER_CORRECT_QUESTION} XP</span>
                ) : (
                  <span className="text-red-600">Incorrect. -{PENALTY_PER_INCORRECT} points</span>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
