import { LevelDefinition } from '@/types';

export const XP_TABLE: LevelDefinition[] = [
  { level: 1, title: 'Newcomer', xpRequired: 0, color: '#94A3B8', icon: '🌱', unlocks: ['flashcards'] },
  { level: 2, title: 'Apprentice', xpRequired: 100, color: '#60A5FA', icon: '📗', unlocks: ['quiz'] },
  { level: 3, title: 'Scholar', xpRequired: 300, color: '#34D399', icon: '🎓', unlocks: ['timed-challenge'] },
  { level: 4, title: 'Expert', xpRequired: 600, color: '#A78BFA', icon: '🔬', unlocks: ['matching'] },
  { level: 5, title: 'Master', xpRequired: 1000, color: '#F472B6', icon: '🏆', unlocks: ['speed-round'] },
  { level: 6, title: 'Champion', xpRequired: 1500, color: '#F59E0B', icon: '👑', unlocks: ['boss-battle'] },
  { level: 7, title: 'Legend', xpRequired: 2200, color: '#EF4444', icon: '🔥', unlocks: ['marathon'] },
  { level: 8, title: 'Mythic', xpRequired: 3000, color: '#8B5CF6', icon: '⚡', unlocks: [] },
  { level: 9, title: 'Divine', xpRequired: 4000, color: '#2ABFBF', icon: '💎', unlocks: [] },
  { level: 10, title: 'Transcendent', xpRequired: 5500, color: '#F97316', icon: '🌟', unlocks: [] },
];

export function calculateLevel(xp: number) {
  let level = 1;
  let title = XP_TABLE[0].title;
  let color = XP_TABLE[0].color;
  let xpInLevel = xp;
  let xpForNext = XP_TABLE[1].xpRequired;

  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i].xpRequired) {
      level = XP_TABLE[i].level;
      title = XP_TABLE[i].title;
      color = XP_TABLE[i].color;
      xpInLevel = xp - XP_TABLE[i].xpRequired;
      xpForNext =
        i < XP_TABLE.length - 1
          ? XP_TABLE[i + 1].xpRequired - XP_TABLE[i].xpRequired
          : 1000;
      break;
    }
  }

  const progress = Math.min((xpInLevel / xpForNext) * 100, 100);

  return { level, title, xpInLevel, xpForNext, progress, color };
}

export function getXPForActivity(type: string): number {
  const xpMap: Record<string, number> = {
    study: 10,
    task: 15,
    game: 20,
    perfect: 30,
    streak: 25,
    achievement: 50,
    daily: 35,
    bonus: 40,
  };
  return xpMap[type] || 10;
}

export const LEVEL_UNLOCK_MAP: Record<number, string[]> = XP_TABLE.reduce(
  (acc, def) => {
    acc[def.level] = def.unlocks;
    return acc;
  },
  {} as Record<number, string[]>
);
