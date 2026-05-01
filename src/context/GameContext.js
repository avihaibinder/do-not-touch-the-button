import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';

import {
  loadProgress, saveProgress, defaultProgress,
  loadSettings, saveSettings, defaultSettings,
  loadStats,    saveStats,    defaultStats,
  resetAll,
} from '../hooks/useGameStorage';

import { LEVELS, TOTAL_LEVELS } from '../levels/levelConfigs';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [progress, setProgress] = useState(defaultProgress);
  const [settings, setSettings] = useState(defaultSettings);
  const [stats, setStats]       = useState(defaultStats);
  const [hydrated, setHydrated] = useState(false);

  // Routing state (very small, no react-navigation needed for this UX).
  // route: 'level' | 'success' | 'fail' | 'menu'
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    (async () => {
      const [p, s, st] = await Promise.all([
        loadProgress(),
        loadSettings(),
        loadStats(),
      ]);
      setProgress(p);
      setSettings(s);
      setStats(st);
      setCurrentLevel(p.highestUnlockedLevel || 1);
      setHydrated(true);
    })();
  }, []);

  const persistProgress = useCallback(async (next) => {
    setProgress(next);
    await saveProgress(next);
  }, []);

  const persistSettings = useCallback(async (next) => {
    setSettings(next);
    await saveSettings(next);
  }, []);

  const persistStats = useCallback(async (next) => {
    setStats(next);
    await saveStats(next);
  }, []);

  const completeLevel = useCallback(
    async (levelNumber, timeSeconds) => {
      const completed = Array.from(
        new Set([...(progress.completedLevels || []), levelNumber])
      );
      const bestTimes = { ...(progress.bestTimes || {}) };
      const prevBest = bestTimes[levelNumber];
      if (prevBest === undefined || timeSeconds < prevBest) {
        bestTimes[levelNumber] = Number(timeSeconds.toFixed(2));
      }
      const highestUnlockedLevel = Math.max(
        progress.highestUnlockedLevel || 1,
        Math.min(TOTAL_LEVELS, levelNumber + 1)
      );
      await persistProgress({
        highestUnlockedLevel,
        completedLevels: completed,
        bestTimes,
      });
      await persistStats({
        ...stats,
        totalAttempts: stats.totalAttempts + 1,
        totalWins: stats.totalWins + 1,
      });
    },
    [progress, stats, persistProgress, persistStats]
  );

  const failLevel = useCallback(async () => {
    await persistStats({
      ...stats,
      totalAttempts: stats.totalAttempts + 1,
      totalFails: stats.totalFails + 1,
    });
  }, [stats, persistStats]);

  const goToLevel = useCallback((n) => {
    setCurrentLevel(Math.max(1, Math.min(TOTAL_LEVELS, n)));
  }, []);

  const goToNextLevel = useCallback(() => {
    setCurrentLevel((n) => Math.min(TOTAL_LEVELS, n + 1));
  }, []);

  const restartLevel = useCallback(() => {
    // No-op state change; LevelScreen listens to a key bump via setCurrentLevel hack:
    setCurrentLevel((n) => n);
  }, []);

  const updateSettings = useCallback(
    (patch) => {
      persistSettings({ ...settings, ...patch });
    },
    [settings, persistSettings]
  );

  const resetEverything = useCallback(async () => {
    await resetAll();
    setProgress(defaultProgress);
    setSettings(defaultSettings);
    setStats(defaultStats);
    setCurrentLevel(1);
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      progress,
      settings,
      stats,
      currentLevel,
      level: LEVELS[currentLevel - 1],
      goToLevel,
      goToNextLevel,
      restartLevel,
      completeLevel,
      failLevel,
      updateSettings,
      resetEverything,
    }),
    [
      hydrated, progress, settings, stats, currentLevel,
      goToLevel, goToNextLevel, restartLevel,
      completeLevel, failLevel, updateSettings, resetEverything,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
