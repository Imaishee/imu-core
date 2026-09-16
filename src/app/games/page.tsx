'use client';

import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';

const GAMES = [
  { slug: 'flashcard', title: 'Flashcard Master', description: 'Flip cards to memorize key concepts', icon: '🃏', color: 'gradient-violet' },
  { slug: 'quiz', title: 'Quick Quiz', description: 'Test your knowledge with MCQs', icon: '❓', color: 'gradient-coral' },
  { slug: 'match', title: 'Match Pairs', description: 'Connect related concepts', icon: '🔗', color: 'gradient-amber' },
  { slug: 'wordsearch', title: 'Word Explorer', description: 'Find hidden academic terms', icon: '🔍', color: 'gradient-rose' },
  { slug: 'puzzle', title: 'Knowledge Puzzle', description: 'Arrange pieces in the right order', icon: '🧩', color: 'gradient-mint' },
  { slug: 'speedround', title: 'Speed Round', description: 'Answer as many as you can in time', icon: '⚡', color: 'gradient-coral' },
  { slug: 'bossbattle', title: 'Boss Battle', description: 'Face the ultimate challenge', icon: '🐉', color: 'gradient-violet' },
  { slug: 'reflexchallenge', title: 'Reflex Challenge', description: 'Test your reaction speed', icon: '🎯', color: 'gradient-sky' },
  { slug: 'strategyquiz', title: 'Strategy Quiz', description: 'Bet resources on your answers', icon: '📈', color: 'gradient-amber' },
  { slug: 'knowledgeexplorer', title: 'Knowledge Explorer', description: 'Unlock a constellation of topics', icon: '🗺️', color: 'gradient-mint' },
];

export default function GamesPage() {
  return (
    <AppShell>
      <div className="px-4 pb-24 pt-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Games</h1>
          <p className="text-sm text-gray-500">Learn while playing</p>
        </div>

        <div className="space-y-3">
          {GAMES.map((game) => (
            <Link key={game.slug} href={'/games/' + game.slug} className="card-interactive p-4 block group">
              <div className="flex items-center gap-4">
                <div className={'w-14 h-14 rounded-2xl ' + game.color + ' flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform'}>
                  {game.icon}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900 group-hover:text-violet-primary transition-colors">{game.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{game.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-violet-primary transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
