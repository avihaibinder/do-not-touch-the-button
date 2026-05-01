import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useGame } from '../context/GameContext';

/**
 * Sound manager.
 *
 * The map below is INTENTIONALLY EMPTY by default so the project bundles
 * without any audio files committed. Drop your own (CC0 / royalty-free)
 * sounds into /assets/sounds/ and uncomment the lines you need:
 *
 *   const SOUND_FILES = {
 *     tap:     require('../../assets/sounds/tap.mp3'),
 *     pop:     require('../../assets/sounds/pop.mp3'),
 *     success: require('../../assets/sounds/success.mp3'),
 *     fail:    require('../../assets/sounds/fail.mp3'),
 *     bossHit: require('../../assets/sounds/boss_hit.mp3'),
 *     bossWin: require('../../assets/sounds/boss_win.mp3'),
 *     whoosh:  require('../../assets/sounds/whoosh.mp3'),
 *     bgm:     require('../../assets/sounds/bgm.mp3'),
 *   };
 *
 * Recommended sources for free SFX:
 *   - https://freesound.org   (filter to CC0)
 *   - https://kenney.nl/assets  (CC0, lots of UI/game sets)
 *   - https://opengameart.org (CC0 / CC-BY)
 */
const SOUND_FILES = {
  // empty by default — see comment block above
};

export default function useSounds() {
  const { settings } = useGame();
  const sfxEnabled = settings?.sfx !== false;
  const musicEnabled = settings?.music !== false;

  const cache = useRef({});
  const bgmRef = useRef(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  const play = useCallback(
    async (key) => {
      if (!sfxEnabled) return;
      const asset = SOUND_FILES[key];
      if (!asset) return; // graceful: no sound configured for this key
      try {
        let sound = cache.current[key];
        if (!sound) {
          const created = await Audio.Sound.createAsync(asset, {
            volume: 0.85,
            shouldPlay: false,
          });
          sound = created.sound;
          cache.current[key] = sound;
        }
        await sound.replayAsync();
      } catch (e) {
        // swallow
      }
    },
    [sfxEnabled]
  );

  const startMusic = useCallback(async () => {
    if (!musicEnabled) return;
    const asset = SOUND_FILES.bgm;
    if (!asset) return;
    try {
      if (!bgmRef.current) {
        const { sound } = await Audio.Sound.createAsync(asset, {
          volume: 0.35,
          isLooping: true,
          shouldPlay: true,
        });
        bgmRef.current = sound;
      } else {
        await bgmRef.current.playAsync();
      }
    } catch (e) {
      // ignore
    }
  }, [musicEnabled]);

  const stopMusic = useCallback(async () => {
    try {
      if (bgmRef.current) await bgmRef.current.pauseAsync();
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (musicEnabled) startMusic();
    else stopMusic();
  }, [musicEnabled, startMusic, stopMusic]);

  useEffect(() => {
    return () => {
      Object.values(cache.current).forEach((s) => {
        try { s.unloadAsync(); } catch (e) {}
      });
      if (bgmRef.current) {
        try { bgmRef.current.unloadAsync(); } catch (e) {}
      }
    };
  }, []);

  return { play, startMusic, stopMusic };
}
