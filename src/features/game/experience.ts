/**
 * Experience & levelling for the arena run.
 *
 * XP is cumulative for the whole run and never resets. Each level costs more
 * than the last:  xpForLevel(N) = 60 + (N - 1) * 45
 * so level 2 costs 60, level 3 costs 105, level 4 costs 150, etc.
 * Every level grants 1 skill point to spend in the skill tree.
 */

export const MAX_LEVEL = 30;

/** XP cost of going from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  return 60 + (Math.max(1, level) - 1) * 45;
}

/** Cumulative XP needed to reach `level`. */
export function totalXpForLevel(level: number): number {
  const capped = Math.min(Math.max(1, level), MAX_LEVEL);
  let total = 0;
  for (let l = 1; l < capped; l++) total += xpForLevel(l);
  return total;
}

/** Current level derived from cumulative XP. */
export function getLevel(totalXp: number): number {
  let level = 1;
  let spent = 0;
  while (level < MAX_LEVEL && totalXp >= spent + xpForLevel(level)) {
    spent += xpForLevel(level);
    level += 1;
  }
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP needed to finish the current level. */
  needed: number;
  /** 0–1 fill for the XP bar. */
  ratio: number;
  maxed: boolean;
}

export function getLevelProgress(totalXp: number): LevelProgress {
  const level = getLevel(totalXp);
  if (level >= MAX_LEVEL) {
    return { level, into: 0, needed: 0, ratio: 1, maxed: true };
  }
  const start = totalXpForLevel(level);
  const needed = xpForLevel(level);
  const into = Math.max(0, totalXp - start);
  return { level, into, needed, ratio: Math.min(1, into / needed), maxed: false };
}

/** Base XP an enemy is worth, before the wave multiplier. */
export const ENEMY_XP: Record<string, number> = {
  grunt: 10,
  runner: 14,
  brute: 30,
  boss: 250,
};

export function xpForKill(type: string, wave: number): number {
  const base = ENEMY_XP[type] ?? 10;
  return Math.round(base * (1 + (wave - 1) * 0.12));
}
