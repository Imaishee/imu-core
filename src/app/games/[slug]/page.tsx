"use client";

import { useParams } from "next/navigation";
import FlashcardGame from "../../../components/games/FlashcardGame";
import QuizGame from "../../../components/games/QuizGame";
import MatchGame from "../../../components/games/MatchGame";
import WordSearchGame from "../../../components/games/WordSearchGame";
import PuzzleGame from "../../../components/games/PuzzleGame";
import SpeedRoundGame from "../../../components/games/SpeedRoundGame";
import BossBattleGame from "../../../components/games/BossBattleGame";
import ReflexChallengeGame from "../../../components/games/ReflexChallengeGame";
import StrategyQuizGame from "../../../components/games/StrategyQuizGame";
import KnowledgeExplorerGame from "../../../components/games/KnowledgeExplorerGame";

const gameComponents: Record<string, React.ComponentType> = {
  flashcard: FlashcardGame,
  quiz: QuizGame,
  match: MatchGame,
  wordsearch: WordSearchGame,
  puzzle: PuzzleGame,
  speedround: SpeedRoundGame,
  bossbattle: BossBattleGame,
  reflexchallenge: ReflexChallengeGame,
  strategyquiz: StrategyQuizGame,
  knowledgeexplorer: KnowledgeExplorerGame,
};

export default function GamePage() {
  const params = useParams();
  const slug = params.slug as string;
  const GameComponent = gameComponents[slug];

  if (!GameComponent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Game Not Found</h1>
          <p className="text-gray-600">The game you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <GameComponent />
      </div>
    </div>
  );
}
