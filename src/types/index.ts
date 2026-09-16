export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  xp: number;
  level: number;
  streak: number;
  longest_streak: number;
  last_active: string;
  created_at: string;
  game_profile: GameProfile;
}

export interface GameProfile {
  total_games_played: number;
  perfect_games: number;
  total_time_played: number;
  favorite_game: string;
  achievements: Achievement[];
  high_scores: Record<string, number>;
}

export interface LevelDefinition {
  level: number;
  title: string;
  xpRequired: number;
  color: string;
  icon: string;
  unlocks: string[];
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'study' | 'task' | 'game' | 'streak' | 'achievement' | 'bonus';
  description: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  xpReward: number;
  requirement: number;
  progress: number;
  earned: boolean;
  earnedAt?: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_type: string;
  score: number;
  perfect: boolean;
  time_played: number;
  xp_earned: number;
  completed_at: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  game_type: string;
  target: number;
  xpReward: number;
  completed: boolean;
  progress: number;
  expires_at: string;
}

export interface GameType {
  slug: string;
  title: string;
  description: string;
  icon: string;
  minLevel: number;
  xpPerPlay: number;
  xpBonusPerfect: number;
  isTimed: boolean;
  timeLimitSec: number;
  color: string;
}
