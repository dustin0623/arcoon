/**
 * Campaign data + saved profile ("The Forest Saga").
 * Four maps, five stages each, ten waves per stage with a boss on wave 10.
 * Everything the player keeps between runs — gold, bows, stars, cleared
 * stages, encyclopedia discoveries — lives in one localStorage record.
 */
import { BOW_RARITIES, type BowRarity } from "@/features/game/bow";
import type { EnemyType } from "@/phaser/config/GameConfig";

export interface MapDef {
  id: string;
  name: string;
  blurb: string;
  /** Tilemap cache key loaded by LoaderScene. */
  tilemap: string;
  stages: number;
  /** Enemy types that make up this map's waves. */
  family: EnemyType[];
  /** Boss that closes every stage of the map. */
  boss: string;
  /** Enemy health and damage scaling for this map. */
  hpMult: number;
  damageMult: number;
}

export const MAPS: MapDef[] = [
  {
    id: "whisperwood",
    name: "Whisperwood",
    blurb: "Open grassland. Slow grunts, plenty of room to kite.",
    tilemap: "map1",
    stages: 5,
    family: ["grunt", "runner"],
    boss: "Bog Troll",
    hpMult: 1,
    damageMult: 1,
  },
  {
    id: "dunes",
    name: "Sunken Dunes",
    blurb: "Faster spawns and swarms that never stop coming.",
    tilemap: "map1",
    stages: 5,
    family: ["runner", "grunt", "brute"],
    boss: "Sand Wurm",
    hpMult: 1.45,
    damageMult: 1.2,
  },
  {
    id: "sewers",
    name: "Murkwater Sewers",
    blurb: "Tight corridors packed with brutes in the dark.",
    tilemap: "map1",
    stages: 5,
    family: ["brute", "grunt", "runner"],
    boss: "Rat King",
    hpMult: 2.1,
    damageMult: 1.45,
  },
  {
    id: "city",
    name: "Neon City",
    blurb: "Dense waves and an elite mix of everything you have faced.",
    tilemap: "map1",
    stages: 5,
    family: ["runner", "brute", "grunt"],
    boss: "Shadow Knight",
    hpMult: 3,
    damageMult: 1.75,
  },
];

export function getMap(id: string | undefined): MapDef {
  return MAPS.find((m) => m.id === id) ?? MAPS[0]!;
}

/** Every stage runs the same length: 10 waves, the last one a boss fight. */
export const WAVES_PER_STAGE = 10;

/** The final wave of every stage is a boss wave. */
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % WAVES_PER_STAGE === 0;
}

/** Bestiary key for a map's boss, so each boss is its own encyclopedia entry. */
export function bossKey(mapId: string): string {
  return `boss:${mapId}`;
}

export interface Progress {
  /** Highest stage cleared per map id (0 = none cleared). */
  cleared: Record<string, number>;
  gold: number;
  kills: number;
  bestScore: number;
  /** Cumulative account XP earned across runs. */
  xp: number;
  /** Bosses defeated across all runs. */
  bosses: number;
  /** Owned bows mapped to their star level (1–5). */
  bows: Partial<Record<BowRarity, number>>;
  equipped: BowRarity;
  /** Bestiary keys the player has encountered. */
  seen: string[];
}

const KEY = "arcoon:progress:v2";

export const EMPTY_PROGRESS: Progress = {
  cleared: {},
  gold: 0,
  kills: 0,
  bestScore: 0,
  xp: 0,
  bosses: 0,
  bows: { Common: 1 },
  equipped: "Common",
  seen: [],
};

function sanitize(raw: Partial<Progress>): Progress {
  const bows: Partial<Record<BowRarity, number>> = {};
  for (const rarity of BOW_RARITIES) {
    const stars = Number(raw.bows?.[rarity]);
    if (Number.isFinite(stars) && stars > 0) bows[rarity] = Math.min(5, Math.round(stars));
  }
  if (!bows.Common) bows.Common = 1;
  const equipped = raw.equipped && bows[raw.equipped] ? raw.equipped : "Common";
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return {
    cleared: raw.cleared ?? {},
    gold: num(raw.gold),
    kills: num(raw.kills),
    bestScore: num(raw.bestScore),
    xp: num(raw.xp),
    bosses: num(raw.bosses),
    bows,
    equipped,
    seen: Array.isArray(raw.seen) ? raw.seen.filter((s) => typeof s === "string") : [],
  };
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { ...EMPTY_PROGRESS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    return sanitize(JSON.parse(raw) as Partial<Progress>);
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable — progress stays in memory for this session */
  }
}

/** A map opens once the previous map is fully cleared (the first is always open). */
export function isMapUnlocked(progress: Progress, mapId: string): boolean {
  const index = MAPS.findIndex((m) => m.id === mapId);
  if (index <= 0) return index === 0;
  const prev = MAPS[index - 1]!;
  return (progress.cleared[prev.id] ?? 0) >= prev.stages;
}

export function isStageUnlocked(progress: Progress, mapId: string, stage: number): boolean {
  if (!isMapUnlocked(progress, mapId)) return false;
  return stage <= (progress.cleared[mapId] ?? 0) + 1;
}

export function isStageCleared(progress: Progress, mapId: string, stage: number): boolean {
  return stage <= (progress.cleared[mapId] ?? 0);
}

export interface RunResult {
  mapId: string;
  stage: number;
  victory: boolean;
  gold: number;
  kills: number;
  score: number;
  xp: number;
  bosses: number;
  /** Bestiary keys encountered during the run. */
  seen: string[];
}

/**
 * Folds a finished run into the saved profile. A win banks the full haul and
 * unlocks the next stage; a defeat keeps half the gold earned that run.
 */
export function recordRun(run: RunResult): Progress {
  const progress = loadProgress();
  const gold = run.victory ? run.gold : Math.floor(run.gold / 2);
  const next: Progress = {
    ...progress,
    cleared: run.victory
      ? { ...progress.cleared, [run.mapId]: Math.max(progress.cleared[run.mapId] ?? 0, run.stage) }
      : progress.cleared,
    gold: progress.gold + gold,
    kills: progress.kills + run.kills,
    bestScore: Math.max(progress.bestScore, run.score),
    xp: progress.xp + run.xp,
    bosses: progress.bosses + run.bosses,
    seen: [...new Set([...progress.seen, ...run.seen])],
  };
  saveProgress(next);
  return next;
}

/** The next stage in this map, or null when the map is finished. */
export function nextStage(mapId: string, stage: number): number | null {
  const map = getMap(mapId);
  return stage < map.stages ? stage + 1 : null;
}
