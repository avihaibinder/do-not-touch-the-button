import type { BossConfig, BossWithHp } from '../types';

/**
 * 3 boss configs. Each appears every 10 levels (10, 20, 30).
 *
 * A boss is a sequence of phases. Each phase requires `hits` taps on the real
 * button while running its `mechanic`. Total HP = sum of hits.
 */
export const BOSSES: Record<number, BossConfig> = {
  1: {
    id: 1,
    name: 'Wobbly McButton',
    title: 'Boss 1 / 3',
    color: '#FF3B47',
    accent: '#FFD93D',
    face: 'happy',
    intro: 'A jiggly bouncing menace. Land 8 hits!',
    phases: [
      { hits: 3, mechanic: 'orbit',     params: { taps: 999, radius: 0.28, periodMs: 4200 } },
      { hits: 3, mechanic: 'teleport',  params: { taps: 999, positions: 4 } },
      { hits: 2, mechanic: 'proximity', params: { taps: 999, threshold: 140, dodge: 100 } },
    ],
  },

  2: {
    id: 2,
    name: 'Glitchzilla',
    title: 'Boss 2 / 3',
    color: '#7C5CFC',
    accent: '#4ECDC4',
    face: 'evil',
    intro: 'Multi-form. Multi-trouble. 12 hits to crack the glitch.',
    phases: [
      { hits: 4, mechanic: 'flash',     params: { taps: 999, visibleMs: 520, hiddenMs: 380 } },
      { hits: 4, mechanic: 'decoys',    params: { taps: 999, decoys: 3 } },
      { hits: 3, mechanic: 'proximity', params: { taps: 999, threshold: 150, dodge: 120 } },
      { hits: 1, mechanic: 'orbit',     params: { taps: 999, radius: 0.34, periodMs: 2400 } },
    ],
  },

  3: {
    id: 3,
    name: 'The Crimson Tyrant',
    title: 'Final Boss',
    color: '#C81E2B',
    accent: '#FF8C42',
    face: 'evil',
    intro: 'The original button. Its final form. 18 hits between you and victory.',
    phases: [
      { hits: 4, mechanic: 'orbit',     params: { taps: 999, radius: 0.30, periodMs: 3200 } },
      { hits: 4, mechanic: 'decoys',    params: { taps: 999, decoys: 4 } },
      { hits: 4, mechanic: 'flash',     params: { taps: 999, visibleMs: 320, hiddenMs: 320 } },
      { hits: 4, mechanic: 'proximity', params: { taps: 999, threshold: 150, dodge: 130 } },
      { hits: 2, mechanic: 'teleport',  params: { taps: 999, positions: 6 } },
    ],
  },
};

export function getBoss(id: number | null | undefined): BossWithHp | null {
  if (id == null) return null;
  const b = BOSSES[id];
  if (!b) return null;
  const totalHp = b.phases.reduce((s, p) => s + (p.hits || 0), 0);
  return { ...b, hp: totalHp };
}

export default BOSSES;
