import { useCallback, useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useGame } from '../context/GameContext';
import type { SoundName } from '../types';

/**
 * Sound manager backed by expo-audio.
 *
 * Players are created once at module scope so we don't churn through
 * AVAudioPlayer instances on every render. To "fire-and-forget" a SFX we
 * seek the cached player back to 0 and call play() — quick enough for taps.
 *
 * If expo-audio fails to initialise for any reason (e.g. unsupported web
 * platform), every call here turns into a silent no-op.
 */

type SoundSources = Record<SoundName, number>;
type PlayerPool = Record<SoundName, AudioPlayer>;

const SOURCES: SoundSources = {
  tap:     require('../../assets/sounds/tap.wav'),
  pop:     require('../../assets/sounds/pop.wav'),
  success: require('../../assets/sounds/success.wav'),
  fail:    require('../../assets/sounds/fail.wav'),
  bossHit: require('../../assets/sounds/bossHit.wav'),
  bossWin: require('../../assets/sounds/bossWin.wav'),
  whoosh:  require('../../assets/sounds/whoosh.wav'),
};

let players: PlayerPool | null = null;
let initFailed = false;

function getPlayers(): PlayerPool | null {
  if (initFailed) return null;
  if (players) return players;
  try {
    const map = {} as PlayerPool;
    (Object.keys(SOURCES) as SoundName[]).forEach((key) => {
      map[key] = createAudioPlayer(SOURCES[key]);
    });
    players = map;
    // Allow SFX to play even when the device is in silent mode (iOS).
    if (typeof setAudioModeAsync === 'function') {
      try {
        Promise.resolve(setAudioModeAsync({ playsInSilentMode: true })).catch(() => {});
      } catch {
        // ignore
      }
    }
    return players;
  } catch {
    initFailed = true;
    return null;
  }
}

export interface SoundsApi {
  play: (name: SoundName) => Promise<void>;
  startMusic: () => Promise<void>;
  stopMusic: () => Promise<void>;
}

export default function useSounds(): SoundsApi {
  const { settings } = useGame();
  const sfxEnabled = settings.sfx !== false;
  const sfxRef = useRef(sfxEnabled);

  useEffect(() => {
    sfxRef.current = sfxEnabled;
  }, [sfxEnabled]);

  // Warm the player pool on first mount.
  useEffect(() => {
    getPlayers();
  }, []);

  const play = useCallback(async (name: SoundName) => {
    if (!sfxRef.current) return;
    const pool = getPlayers();
    const player = pool?.[name];
    if (!player) return;
    try {
      // Rewind synchronously before play() so tight repeat taps don't no-op
      // when the previous instance is still at the tail of the clip.
      try { player.currentTime = 0; } catch { /* ignore */ }
      player.play();
    } catch {
      // ignore
    }
  }, []);

  const startMusic = useCallback(async () => {}, []);
  const stopMusic = useCallback(async () => {}, []);

  return { play, startMusic, stopMusic };
}
