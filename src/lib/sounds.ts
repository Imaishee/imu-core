'use client';

import { Howl } from 'howler';
import { useCallback, useEffect, useRef, useState } from 'react';

// Sound effect mappings
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

// Global sound state
let globalVolume = 0.5; // 50% default volume
let isMuted = false;

// Sound instances cache
const sounds: Record<string, Howl> = {};

function getSound(name: string): Howl {
  if (!sounds[name]) {
    sounds[name] = new Howl({
      src: [soundUrls[name]],
      volume: globalVolume * (isMuted ? 0 : 1),
      preload: true,
    });
  }
  return sounds[name];
}

// Update all sounds when global volume/mute changes
function updateAllSounds() {
  Object.keys(sounds).forEach((name) => {
    sounds[name].volume(globalVolume * (isMuted ? 0 : 1));
  });
}

export function setVolume(volume: number) {
  globalVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
  updateAllSounds();
}

export function setMute(mute: boolean) {
  isMuted = mute;
  updateAllSounds();
}

export function getVolume(): number {
  return globalVolume;
}

export function getMute(): boolean {
  return isMuted;
}

export function playSound(name: string) {
  try {
    const sound = getSound(name);
    sound.play();
  } catch {
    // Sound file not found or blocked - fallback to beep
    playBeep(name);
  }
}

// Fallback beep generator for when sound files aren't available
function playBeep(name: string) {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Different frequencies for different sound types
    const frequencyMap: Record<string, number> = {
      'xp-gain': 523, // C5
      'level-up': 659, // E5
      'correct': 784, // G5
      'wrong': 262, // C4
      'game-complete': 1047, // C6
      'achievement': 880, // A5
      'click': 330, // E4
      'streak': 494, // B4
    };

    const frequency = frequencyMap[name] || 440;

    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(globalVolume * 0.3, audioCtx.currentTime); // Quieter beep

    // Connect and play
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Start and stop
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2); // 200ms beep
  } catch {
    // Audio context not available or blocked
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
    // Initialize sounds with current volume/mute settings
    Object.keys(soundUrls).forEach((name) => {
      try {
        getSound(name);
      } catch {
        // Preload best-effort
      }
    });

    // Load initial volume/mute from localStorage
    const savedVolume = localStorage.getItem('imu_sound_volume');
    const savedMute = localStorage.getItem('imu_sound_mute');

    if (savedVolume !== null) {
      setVolume(parseFloat(savedVolume));
    }
    if (savedMute !== null) {
      setMute(savedMute === 'true');
    }
  }, []);

  return { play };
}