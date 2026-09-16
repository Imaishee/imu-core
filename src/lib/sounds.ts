'use client';

import { Howl } from 'howler';
import { useCallback, useEffect, useRef } from 'react';

const soundUrls: Record<string, string> = {
  'xp-gain': '/sounds/xp-gain.mp3',
  'level-up': '/sounds/level-up.mp3',
  'correct': '/sounds/correct.mp3',
  'wrong': '/sounds/wrong.mp3',
  'game-complete': '/sounds/game-complete.mp3',
  'achievement': '/sounds/achievement.mp3',
  'click': '/sounds/click.mp3',
  'streak': '/sounds/streak.mp3',
};

const sounds: Record<string, Howl> = {};

function getSound(name: string): Howl {
  if (!sounds[name]) {
    sounds[name] = new Howl({
      src: [soundUrls[name]],
      volume: 0.5,
      preload: true,
    });
  }
  return sounds[name];
}

export function playSound(name: string) {
  try {
    const sound = getSound(name);
    sound.play();
  } catch {
    // Sound file not found or blocked
  }
}

export function useSound() {
  const lastPlayTime = useRef<Record<string, number>>({});

  const play = useCallback((name: string, cooldown = 100) => {
    const now = Date.now();
    if (lastPlayTime.current[name] && now - lastPlayTime.current[name] < cooldown) {
      return;
    }
    lastPlayTime.current[name] = now;
    playSound(name);
  }, []);

  useEffect(() => {
    Object.keys(soundUrls).forEach((name) => {
      try {
        getSound(name);
      } catch {
        // Preload best-effort
      }
    });
  }, []);

  return { play };
}
