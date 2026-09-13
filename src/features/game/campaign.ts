/**
 * Campaign data + saved progress.
 * ARCOON follows an Archero-style structure: each map holds a chain of stages,
 * and every stage must be cleared before the next one (or the next map) opens.
 * Only map1 has real tilemap content while the game is in test phase.
 */

export interface MapDef {
  id: string;
  name: string;
  blurb: string;
  /** Tilemap cache key loaded by LoaderScene. */
  tilemap: string;
  stages: number;
  /** False while the map has no tilemap content yet. */
  playable: boolean;
}

export const MAPS = [
  {
    id: "meadow",
    name: "Sunny Meadow",
    blurb: "Open grassland. Slow grunts, plenty of room to kite.",
    tilemap: "map1",
    stages: 5,
    playable: true,
  },
  {
    id: "forest",
    name: "Deep Forest",
    blurb: "Tight tree lines and fast runners.",
    tilemap: "map1",
    stages: 5,
    playable: false,
  },
  {
    id: "sewer",
    name: "Sunken Sewer",
    blurb: "Narrow corridors, brutes in the dark.",
    tilemap: "map1",
    stages: 5,
    playable: false,
  },
  {
    id: "desert",
    name: "Scorched Desert",
    blurb: "Nowhere to hide from the swarm.",
    tilemap: "map1",
    stages: 5,
    playable: false,
  },
] as const satisfies readonly MapDef[];

export function getMap(id: string | undefined): MapDef {
  return MAPS.find((m) => m.id === id) ?? MAPS[0];
}

/** Every stage runs the same length: 10 waves, the last one a boss fight. */
export const WAVES_PER_STAGE = 10;

/** Waves needed to clear a stage. */
export function wavesForStage(_stage: number): number {
  return WAVES_PER_STAGE;
}

/** The final wave of every stage is a boss wave. */
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % WAVES_PER_STAGE === 0;
}

export interface Progress {
  /** Highest stage cleared per map id (0 = none cleared). */
  cleared: Record<string, number>;
  gold: number;
  kills: number;
  bestScore: number;
  /** Cumulative account XP earned across runs. */
  xp: number;
}

const KEY = "arcoon:progress:v1";

export const EMPTY_PROGRESS: Progress = { cleared: {}, gold: 0, kills: 0, bestScore: 0, xp: 0 };

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { ...EMPTY_PROGRESS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      cleared: parsed.cleared ?? {},
      gold: parsed.gold ?? 0,
      kills: parsed.kills ?? 0,
      bestScore: parsed.bestScore ?? 0,
      xp: Number.isFinite(parsed.xp) ? Number(parsed.xp) : 0,
    };
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
  const prev = MAPS[index - 1];
  if (!prev) return false;
  return (progress.cleared[prev.id] ?? 0) >= prev.stages;
}

export function isStageUnlocked(progress: Progress, mapId: string, stage: number): boolean {
  if (!isMapUnlocked(progress, mapId)) return false;
  return stage <= (progress.cleared[mapId] ?? 0) + 1;
}

export function isStageCleared(progress: Progress, mapId: string, stage: number): boolean {
  return stage <= (progress.cleared[mapId] ?? 0);
}

/** Records a stage win and folds the run's rewards into the saved profile. */
export function recordStageClear(
  mapId: string,
  stage: number,
  run: { gold: number; kills: number; score: number; xp?: number },
): Progress {
  const progress = loadProgress();
  const next: Progress = {
    cleared: { ...progress.cleared, [mapId]: Math.max(progress.cleared[mapId] ?? 0, stage) },
    gold: progress.gold + run.gold,
    kills: progress.kills + run.kills,
    bestScore: Math.max(progress.bestScore, run.score),
    xp: progress.xp + (Number.isFinite(run.xp) ? Number(run.xp) : 0),
  };
  saveProgress(next);
  return next;
}

/** The next stage in this map, or null when the map is finished. */
export function nextStage(mapId: string, stage: number): number | null {
  const map = getMap(mapId);
  return stage < map.stages ? stage + 1 : null;
}
