/**
 * 30 unique levels.
 *
 * Mechanic vocabulary (handled by src/levels/MechanicRunner.js):
 *   static     – button is fixed, tap params.taps times
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
 *   boss       – fixed by bossConfigs.js (id matches)
 */

const L = (
  id, name, mechanic, params,
  { timer = 25, isBoss = false, bossId = null, intro = '', tagline = '' } = {}
) => ({
  id, name, mechanic, params, timer, isBoss, bossId, intro, tagline,
});

export const LEVELS = [
  // ── Tier 1: tutorial / intro (1–9) ───────────────────────────────────────
  L(1,  'First Contact',     'static',    { taps: 1 },
    { timer: 30, intro: 'Just tap the button. Easy, right?', tagline: 'Easy' }),
  L(2,  'Triple Trouble',    'static',    { taps: 3 },
    { timer: 20, tagline: 'Easy' }),
  L(3,  'Hop Skip',          'teleport',  { positions: 2, taps: 2 },
    { timer: 25, tagline: 'Easy' }),
  L(4,  'Tiny Tap',          'shrink',    { taps: 3, endScale: 0.55 },
    { timer: 20, tagline: 'Easy' }),
  L(5,  'Slow Spin',         'orbit',     { taps: 4, radius: 0.28, periodMs: 5000 },
    { timer: 30, tagline: 'Medium' }),
  L(6,  'Body Doubles',      'decoys',    { taps: 1, decoys: 2 },
    { timer: 20, tagline: 'Medium' }),
  L(7,  'Personal Space',    'proximity', { taps: 3, threshold: 110, dodge: 70 },
    { timer: 30, tagline: 'Medium' }),
  L(8,  'Now You See Me',    'flash',     { taps: 3, visibleMs: 700, hiddenMs: 700 },
    { timer: 25, tagline: 'Medium' }),
  L(9,  'Hold Tight',        'longpress', { holdMs: 1200 },
    { timer: 15, tagline: 'Medium' }),

  // ── Tier 2: BOSS 1 ───────────────────────────────────────────────────────
  L(10, 'Wobbly McButton',   'boss',      { bossId: 1 },
    { timer: 60, isBoss: true, bossId: 1,
      intro: 'A jiggly menace. Land 8 hits.', tagline: 'BOSS' }),

  // ── Tier 3: medium (11–19) ───────────────────────────────────────────────
  L(11, 'Quad Hop',          'teleport',  { positions: 4, taps: 4 },
    { timer: 25 }),
  L(12, 'Vanishing Act',     'shrink',    { taps: 5, endScale: 0.32 },
    { timer: 22 }),
  L(13, 'Fast Spin',         'orbit',     { taps: 5, radius: 0.32, periodMs: 3000 },
    { timer: 25 }),
  L(14, 'Hall of Mirrors',   'decoys',    { taps: 2, decoys: 4 },
    { timer: 22 }),
  L(15, 'Slippery Devil',    'proximity', { taps: 4, threshold: 140, dodge: 110 },
    { timer: 28 }),
  L(16, 'Strobe',            'flash',     { taps: 4, visibleMs: 380, hiddenMs: 380 },
    { timer: 22 }),
  L(17, 'Drum Roll',         'rhythm',    { taps: 4, windowMs: 700, minGapMs: 220 },
    { timer: 25 }),
  L(18, 'Through the Looking Glass', 'mirror', { taps: 4 },
    { timer: 25 }),
  L(19, 'Lava Floor',        'trap',      { taps: 3, traps: 3, trapRadius: 0.12 },
    { timer: 28 }),

  // ── Tier 4: BOSS 2 ───────────────────────────────────────────────────────
  L(20, 'Glitchzilla',       'boss',      { bossId: 2 },
    { timer: 75, isBoss: true, bossId: 2,
      intro: 'Multi-form. Multi-trouble.', tagline: 'BOSS' }),

  // ── Tier 5: hard (21–29) ─────────────────────────────────────────────────
  L(21, 'Hex Hop',           'teleport',  { positions: 6, taps: 6 },
    { timer: 28 }),
  L(22, 'Spinning Shrink',   'combo',     {
      stages: [
        { mechanic: 'orbit',  params: { taps: 3, radius: 0.30, periodMs: 3500 } },
        { mechanic: 'shrink', params: { taps: 3, endScale: 0.40 } },
      ],
    },
    { timer: 28 }),
  L(23, 'Phantom Twins',     'combo',     {
      stages: [
        { mechanic: 'decoys', params: { taps: 2, decoys: 3 } },
        { mechanic: 'flash',  params: { taps: 2, visibleMs: 450, hiddenMs: 450 } },
      ],
    },
    { timer: 24 }),
  L(24, 'Greased Orbit',     'combo',     {
      stages: [
        { mechanic: 'orbit',     params: { taps: 3, radius: 0.32, periodMs: 3200 } },
        { mechanic: 'proximity', params: { taps: 2, threshold: 130, dodge: 95 } },
      ],
    },
    { timer: 28 }),
  L(25, 'Stubborn Hold',     'combo',     {
      stages: [
        { mechanic: 'proximity', params: { taps: 2, threshold: 120, dodge: 85 } },
        { mechanic: 'longpress', params: { holdMs: 2000 } },
      ],
    },
    { timer: 28 }),
  L(26, 'Bongo Fury',        'rhythm',    { taps: 6, windowMs: 600, minGapMs: 140 },
    { timer: 22 }),
  L(27, 'Mirror Maze',       'combo',     {
      stages: [
        { mechanic: 'mirror', params: { taps: 2 } },
        { mechanic: 'decoys', params: { taps: 2, decoys: 4 } },
      ],
    },
    { timer: 25 }),
  L(28, 'Lava Labyrinth',    'trap',      { taps: 5, traps: 5, trapRadius: 0.11 },
    { timer: 28 }),
  L(29, 'Final Practice',    'combo',     {
      stages: [
        { mechanic: 'mirror', params: { taps: 1 } },
        { mechanic: 'orbit',  params: { taps: 2, radius: 0.30, periodMs: 2800 } },
        { mechanic: 'decoys', params: { taps: 2, decoys: 4 } },
      ],
    },
    { timer: 30 }),

  // ── Tier 6: FINAL BOSS ───────────────────────────────────────────────────
  L(30, 'The Crimson Tyrant','boss',      { bossId: 3 },
    { timer: 90, isBoss: true, bossId: 3,
      intro: 'The original button. Final form.', tagline: 'FINAL BOSS' }),
];

export const TOTAL_LEVELS = LEVELS.length;

export function getLevel(n) {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, n - 1))];
}

export default LEVELS;
