export type Mechanic =
  | 'static'
  | 'teleport'
  | 'shrink'
  | 'orbit'
  | 'decoys'
  | 'proximity'
  | 'flash'
  | 'longpress'
  | 'rhythm'
  | 'mirror'
  | 'trap'
  | 'multi'
  | 'combo'
  | 'boss';

export type Expression =
  | 'grin'
  | 'wink'
  | 'happy'
  | 'shock'
  | 'evil'
  | 'hurt'
  | 'sleeping';

export type FailReason =
  | 'timeout'
  | 'trap'
  | 'decoy'
  | 'rhythm'
  | 'proximity'
  | 'default';

export type SoundName =
  | 'tap'
  | 'pop'
  | 'success'
  | 'fail'
  | 'bossHit'
  | 'bossWin'
  | 'whoosh';

export interface ComboStage {
  mechanic: Mechanic;
  params: MechanicParams;
}

export interface MechanicParams {
  taps?: number;
  wakeup?: boolean;
  positions?: number;
  endScale?: number;
  radius?: number;
  periodMs?: number;
  decoys?: number;
  threshold?: number;
  dodge?: number;
  visibleMs?: number;
  hiddenMs?: number;
  holdMs?: number;
  windowMs?: number;
  minGapMs?: number;
  traps?: number;
  trapRadius?: number;
  bossId?: number;
  stages?: ComboStage[];
}

export interface LevelConfig {
  id: number;
  name: string;
  mechanic: Mechanic;
  params: MechanicParams;
  timer: number;
  isBoss: boolean;
  bossId: number | null;
  intro: string;
  tagline: string;
  noTimer: boolean;
  autoAdvance: boolean;
}

export interface BossPhase {
  hits: number;
  mechanic: Mechanic;
  params: MechanicParams;
}

export interface BossConfig {
  id: number;
  name: string;
  title: string;
  color: string;
  accent: string;
  face: Expression;
  intro: string;
  phases: BossPhase[];
}

export interface BossWithHp extends BossConfig {
  hp: number;
}

export interface PlayArea {
  width: number;
  height: number;
}

export interface Progress {
  highestUnlockedLevel: number;
  completedLevels: number[];
  bestTimes: Record<string, number>;
}

export interface Settings {
  haptics: boolean;
  sfx: boolean;
  music: boolean;
}

export interface Stats {
  totalAttempts: number;
  totalWins: number;
  totalFails: number;
}
