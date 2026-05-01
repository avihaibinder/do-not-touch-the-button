import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PROGRESS = '@dncb:progress';
const KEY_SETTINGS = '@dncb:settings';
const KEY_STATS    = '@dncb:stats';

export const defaultProgress = {
  highestUnlockedLevel: 1,
  completedLevels: [],   // e.g. [1,2,3]
  bestTimes: {},         // { '3': 7.42 }
};

export const defaultSettings = {
  haptics: true,
  sfx: true,
  music: true,
};

export const defaultStats = {
  totalAttempts: 0,
  totalWins: 0,
  totalFails: 0,
};

async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { ...fallback };
    return { ...fallback, ...JSON.parse(raw) };
  } catch (e) {
    return { ...fallback };
  }
}

async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

export async function loadProgress() { return readJSON(KEY_PROGRESS, defaultProgress); }
export async function saveProgress(p) { return writeJSON(KEY_PROGRESS, p); }

export async function loadSettings() { return readJSON(KEY_SETTINGS, defaultSettings); }
export async function saveSettings(s) { return writeJSON(KEY_SETTINGS, s); }

export async function loadStats() { return readJSON(KEY_STATS, defaultStats); }
export async function saveStats(s) { return writeJSON(KEY_STATS, s); }

export async function resetAll() {
  try {
    await AsyncStorage.multiRemove([KEY_PROGRESS, KEY_SETTINGS, KEY_STATS]);
  } catch (e) {}
}
