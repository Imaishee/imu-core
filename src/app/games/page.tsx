'use client';

import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';

const GAMES = [
  { slug: 'flashcard', title: 'Flashcard Master', description: 'Flip cards to memorize key concepts', icon: '🃏', color: 'gradient-violet', minLevel: 2 },
  { slug: 'quiz', title: 'Quick Quiz', description: 'Test your knowledge with MCQs', icon: '❓', color: 'gradient-coral', minLevel: 3 },
  { slug: 'match', title: 'Match Pairs', description: 'Connect related concepts', icon: '🔗', color: 'gradient-amber', minLevel: 4 },
  { slug: 'wordsearch', title: 'Word Explorer', description: 'Find hidden academic terms', icon: '🔍', color: 'gradient-rose', minLevel: 5 },
  { slug: 'puzzle', title: 'Knowledge Puzzle', description: 'Arrange pieces in the right order', icon: '🧩', color: 'gradient-mint', minLevel: 6 },
  { slug: 'speedround', title: 'Speed Round', description: 'Answer as many as you can in time', icon: '⚡', color: 'gradient-coral', minLevel: 7 },
  { slug: 'bossbattle', title: 'Boss Battle', description: 'Face the ultimate challenge', icon: '🐉', color: 'gradient-violet', minLevel: 8 },
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
            <Link key={game.slug} href={`/games/${game.slug}`} className="card-interactive p-4 block group">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${game.color} flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                  {game.icon}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900 group-hover:text-violet-primary transition-colors">{game.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{game.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-violet-primary transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
