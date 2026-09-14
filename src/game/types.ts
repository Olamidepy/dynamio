import * as THREE from 'three';

export type SphereColor = 'ruby' | 'sapphire' | 'emerald' | 'amber' | 'amethyst';

export interface ColorDef {
  name: SphereColor;
  hex: number;
  css: string;
  glowHex: number;
}

export const SPHERE_COLORS: Record<SphereColor, ColorDef> = {
  ruby: {
    name: 'ruby',
    hex: 0xff2a5f,
    css: '#ff2a5f',
    glowHex: 0xff4d7d,
  },
  sapphire: {
    name: 'sapphire',
    hex: 0x1e88e5,
    css: '#1e88e5',
    glowHex: 0x42a5f5,
  },
  emerald: {
    name: 'emerald',
    hex: 0x10b981,
    css: '#10b981',
    glowHex: 0x34d399,
  },
  amber: {
    name: 'amber',
    hex: 0xe9b213, // Nimiq gold
    css: '#e9b213',
    glowHex: 0xffd54f,
  },
  amethyst: {
    name: 'amethyst',
    hex: 0xa855f7,
    css: '#a855f7',
    glowHex: 0xc084fc,
  },
};

export type BallState =
  | 'SPAWNING'
  | 'ROLLING'
  | 'INSERTING'
  | 'MATCHING'
  | 'EXPLODING'
  | 'DEAD';

export interface BallData {
  id: string;
  color: SphereColor;
  pathDistance: number; // Distance in world units along the curve (0 to totalLength)
  radius: number;
  state: BallState;
  velocity: number;
  mesh?: THREE.Mesh;
  insertProgress?: number; // 0 to 1 when smoothly sliding in
  targetDistance?: number;
  destroyProgress?: number; // 0 to 1 when exploding/scaling down
}

export type GameState =
  | 'BOOT'
  | 'LOADING'
  | 'TITLE'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'REWARD_CALCULATION'
  | 'REWARD_CLAIM';

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  curvePoints: [number, number, number][];
  totalBalls: number;
  speed: number; // units per second
  colorPool: SphereColor[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  targetScore: number;
  baseRewardNim: number;
  baseRewardEnergy: number;
}

export interface GameTelemetry {
  startTime: number;
  endTime?: number;
  durationMs: number;
  shotsFired: number;
  shotsHit: number;
  matchesMade: number;
  cascadeCombos: number;
  highestCombo: number;
  score: number;
  accuracy: number;
  levelId: number;
  won: boolean;
  levelSeed?: string;
  gameplayHash?: string;
}

export interface PlayerStats {
  totalScore: number;
  dynamioEnergy: number;
  starsUnlocked: number;
  completedLevels: number[];
  highestCombo: number;
  dailyChallengeStreak: number;
  lastDailyChallengeDate?: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerAddress: string;
  displayName: string;
  score: number;
  combo: number;
  accuracy: number;
  timeSec: number;
  rewardNim: number;
  isDaily: boolean;
}
