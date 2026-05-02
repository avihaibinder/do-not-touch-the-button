import type { LevelConfig, Mechanic, MechanicParams } from '../types';

/**
 * 30 unique levels.
 *
 * Mechanic vocabulary (handled by src/levels/MechanicRunner.tsx):
 *   static     – button is fixed, tap params.taps times. With params.wakeup the
 *                button starts asleep (closed eyes + Z's) and the first tap
 *                plays a wake-up animation before completing.
 *   teleport   – button jumps to next of params.positions on each tap; show
 *                a translucent "next-spot" hint dot so the player can plan
 *   shrink     – button shrinks each tap; finish in params.taps taps
 *   orbit      – button moves on a circular path at params.speed; tap params.taps times
 *   decoys     – render params.decoys fake buttons; only the real one counts
 *   proximity  – button dodges the finger when within params.threshold px
 *   flash      – button visible for params.visibleMs, hidden params.hiddenMs
 *   longpress  – hold the button for params.holdMs
 *   rhythm     – tap params.taps times with at-most params.windowMs between
 *   mirror     – x-axis is mirrored (drag/tap reflected)
 *   trap       – walk-through traps render around the button; touching them fails
 *   multi      – tap as fast as possible — params.taps in params.windowMs
 *   combo      – run a sequence of stages, params.stages = [{mechanic, params}, …]
 *   boss       – fixed by bossConfigs.ts (id matches)
 *
 * Special flags:
 *   noTimer     – disables the countdown timer for that level
 *   autoAdvance – on completion, skip the SuccessModal and go straight to the
 *                 next level. Used by level 1 (the "Main Page").
 */

interface LevelOptions {
  timer?: number;
  isBoss?: boolean;
  bossId?: number | null;
  intro?: string;
  tagline?: string;
  noTimer?: boolean;
  autoAdvance?: boolean;
}

const L = (
  id: number,
  name: string,
  mechanic: Mechanic,
  params: MechanicParams,
  options: LevelOptions = {}
): LevelConfig => ({
  id,
  name,
  mechanic,
  params,
  timer: options.timer ?? 25,
  isBoss: options.isBoss ?? false,
  bossId: options.bossId ?? null,
  intro: options.intro ?? '',
  tagline: options.tagline ?? '',
  noTimer: options.noTimer ?? false,
  autoAdvance: options.autoAdvance ?? false,
});

export const LEVELS: LevelConfig[] = [
  // ── Tier 1: tutorial / intro (1–9) ───────────────────────────────────────
  // Level 1 doubles as the Main Page — no timer, auto-advances on tap.
  L(1,  'First Contact',     'static',    { taps: 1, wakeup: true },
    { noTimer: true, autoAdvance: true,
      intro: 'Just tap the button. Easy, right?', tagline: 'Tap to start' }),
  L(2,  'Triple Trouble',    'static',    { taps: 5 },
    { timer: 10, tagline: 'Easy' }),
  L(3,  'Hop Skip',          'teleport',  { positions: 3, taps: 4 },
    { timer: 14, tagline: 'Easy' }),
  L(4,  'Tiny Tap',          'shrink',    { taps: 5, endScale: 0.32 },
    { timer: 12, tagline: 'Easy' }),
  L(5,  'Slow Spin',         'orbit',     { taps: 6, radius: 0.30, periodMs: 2400 },
    { timer: 18, tagline: 'Medium' }),
  L(6,  'Body Doubles',      'decoys',    { taps: 2, decoys: 5 },
    { timer: 12, tagline: 'Medium' }),
  L(7,  'Personal Space',    'proximity', { taps: 5, threshold: 130, dodge: 95 },
    { timer: 18, tagline: 'Medium' }),
  L(8,  'Now You See Me',    'flash',     { taps: 5, visibleMs: 480, hiddenMs: 520 },
    { timer: 16, tagline: 'Medium' }),
  L(9,  'Hold Tight',        'longpress', { holdMs: 1800 },
    { timer: 9, tagline: 'Medium' }),

  // ── Tier 2: BOSS 1 ───────────────────────────────────────────────────────
  L(10, 'Wobbly McButton',   'boss',      { bossId: 1 },
    { timer: 40, isBoss: true, bossId: 1,
      intro: 'A jiggly menace. Land 8 hits.', tagline: 'BOSS' }),

  // ── Tier 3: medium (11–19) ───────────────────────────────────────────────
  L(11, 'Quad Hop',          'teleport',  { positions: 5, taps: 7 },
    { timer: 16 }),
  L(12, 'Vanishing Act',     'shrink',    { taps: 7, endScale: 0.20 },
    { timer: 14 }),
  L(13, 'Fast Spin',         'orbit',     { taps: 8, radius: 0.34, periodMs: 1900 },
    { timer: 16 }),
  L(14, 'Hall of Mirrors',   'decoys',    { taps: 3, decoys: 6 },
    { timer: 14 }),
  L(15, 'Slippery Devil',    'proximity', { taps: 6, threshold: 160, dodge: 130 },
    { timer: 18 }),
  L(16, 'Strobe',            'flash',     { taps: 6, visibleMs: 260, hiddenMs: 320 },
    { timer: 14 }),
  L(17, 'Drum Roll',         'rhythm',    { taps: 6, windowMs: 480, minGapMs: 230 },
    { timer: 16 }),
  L(18, 'Through the Looking Glass', 'mirror', { taps: 6 },
    { timer: 16 }),
  L(19, 'Lava Floor',        'trap',      { taps: 4, traps: 5, trapRadius: 0.13 },
    { timer: 18 }),

  // ── Tier 4: BOSS 2 ───────────────────────────────────────────────────────
  L(20, 'Glitchzilla',       'boss',      { bossId: 2 },
    { timer: 50, isBoss: true, bossId: 2,
      intro: 'Multi-form. Multi-trouble.', tagline: 'BOSS' }),

  // ── Tier 5: hard (21–29) ─────────────────────────────────────────────────
  L(21, 'Hex Hop',           'teleport',  { positions: 8, taps: 10 },
    { timer: 18 }),
  L(22, 'Spinning Shrink',   'combo',     {
      stages: [
        { mechanic: 'orbit',  params: { taps: 5, radius: 0.32, periodMs: 2200 } },
        { mechanic: 'shrink', params: { taps: 5, endScale: 0.25 } },
      ],
    },
    { timer: 20 }),
  L(23, 'Phantom Twins',     'combo',     {
      stages: [
        { mechanic: 'decoys', params: { taps: 3, decoys: 5 } },
        { mechanic: 'flash',  params: { taps: 3, visibleMs: 280, hiddenMs: 340 } },
      ],
    },
    { timer: 16 }),
  L(24, 'Greased Orbit',     'combo',     {
      stages: [
        { mechanic: 'orbit',     params: { taps: 5, radius: 0.34, periodMs: 2000 } },
        { mechanic: 'proximity', params: { taps: 4, threshold: 150, dodge: 115 } },
      ],
    },
    { timer: 20 }),
  L(25, 'Stubborn Hold',     'combo',     {
      stages: [
        { mechanic: 'proximity', params: { taps: 3, threshold: 140, dodge: 105 } },
        { mechanic: 'longpress', params: { holdMs: 2800 } },
      ],
    },
    { timer: 18 }),
  L(26, 'Bongo Fury',        'rhythm',    { taps: 9, windowMs: 380, minGapMs: 110 },
    { timer: 14 }),
  L(27, 'Mirror Maze',       'combo',     {
      stages: [
        { mechanic: 'mirror', params: { taps: 3 } },
        { mechanic: 'decoys', params: { taps: 3, decoys: 6 } },
      ],
    },
    { timer: 16 }),
  L(28, 'Lava Labyrinth',    'trap',      { taps: 7, traps: 7, trapRadius: 0.12 },
    { timer: 18 }),
  L(29, 'Final Practice',    'combo',     {
      stages: [
        { mechanic: 'mirror', params: { taps: 2 } },
        { mechanic: 'orbit',  params: { taps: 4, radius: 0.32, periodMs: 1700 } },
        { mechanic: 'decoys', params: { taps: 3, decoys: 6 } },
      ],
    },
    { timer: 22 }),

  // ── Tier 6: FINAL BOSS ───────────────────────────────────────────────────
  L(30, 'The Crimson Tyrant','boss',      { bossId: 3 },
    { timer: 60, isBoss: true, bossId: 3,
      intro: 'The original button. Final form.', tagline: 'FINAL BOSS' }),
];

export const TOTAL_LEVELS = LEVELS.length;

export function getLevel(n: number): LevelConfig {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, n - 1))];
}

export default LEVELS;
