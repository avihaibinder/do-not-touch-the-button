import { useCallback } from 'react';

/**
 * Sound manager — stubbed.
 *
 * No audio files are bundled by default, so this hook returns no-ops.
 * To enable audio, install `expo-audio` (Expo SDK 53+ replacement for expo-av),
 * drop your CC0/royalty-free files into /assets/sounds/, and wire up
 * useAudioPlayer here.
 *
 * Recommended sources for free SFX:
 *   - https://freesound.org   (filter to CC0)
 *   - https://kenney.nl/assets  (CC0, lots of UI/game sets)
 *   - https://opengameart.org (CC0 / CC-BY)
 */
export default function useSounds() {
  const play = useCallback(async () => {}, []);
  const startMusic = useCallback(async () => {}, []);
  const stopMusic = useCallback(async () => {}, []);
  return { play, startMusic, stopMusic };
}
