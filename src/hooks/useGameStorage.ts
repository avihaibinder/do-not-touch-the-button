import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Progress, Settings, Stats } from '../types';

const KEY_PROGRESS = '@dncb:progress';
const KEY_SETTINGS = '@dncb:settings';
const KEY_STATS    = '@dncb:stats';

export const defaultProgress: Progress = {
  highestUnlockedLevel: 1,
  completedLevels: [],
  bestTimes: {},
};

export const defaultSettings: Settings = {
  haptics: true,
  sfx: true,
  music: true,
};

export const defaultStats: Stats = {
  totalAttempts: 0,
  totalWins: 0,
  totalFails: 0,
};

async function readJSON<T extends object>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { ...fallback };
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return { ...fallback };
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const loadProgress = (): Promise<Progress> => readJSON(KEY_PROGRESS, defaultProgress);
export const saveProgress = (p: Progress): Promise<void> => writeJSON(KEY_PROGRESS, p);

export const loadSettings = (): Promise<Settings> => readJSON(KEY_SETTINGS, defaultSettings);
export const saveSettings = (s: Settings): Promise<void> => writeJSON(KEY_SETTINGS, s);

export const loadStats = (): Promise<Stats> => readJSON(KEY_STATS, defaultStats);
export const saveStats = (s: Stats): Promise<void> => writeJSON(KEY_STATS, s);

export async function resetAll(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEY_PROGRESS, KEY_SETTINGS, KEY_STATS]);
  } catch {
    // ignore
  }
}
