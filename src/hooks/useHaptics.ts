import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useGame } from '../context/GameContext';

export interface HapticsApi {
  light: () => void;
  medium: () => void;
  heavy: () => void;
  success: () => void;
  warning: () => void;
  error: () => void;
  select: () => void;
}

/**
 * Centralised haptics. All calls are guarded so they never throw on web/simulator.
 */
export default function useHaptics(): HapticsApi {
  const { settings } = useGame();
  const enabled = settings.haptics !== false;

  const safe = useCallback(
    (fn: () => unknown) => {
      if (!enabled) return;
      try {
        fn();
      } catch {
        // ignore
      }
    },
    [enabled]
  );

  return {
    light: () =>
      safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
    medium: () =>
      safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
    heavy: () =>
      safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
    success: () =>
      safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
    warning: () =>
      safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
    error: () =>
      safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
    select: () => safe(() => Haptics.selectionAsync()),
  };
}
