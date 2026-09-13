/**
 * The Book — ARCOON's encyclopedia. Three sections built from existing game
 * data: Bestiary (enemies and bosses, revealed once encountered), Armory
 * (the five bow sets) and Milestones (goals checked against saved progress).
 */
import { ENEMY_CONFIG, type EnemyType } from "@/phaser/config/GameConfig";
import { MAPS, bossKey, type Progress } from "@/features/game/campaign";

export interface BestiaryEntry {
  key: string;
  name: string;
  lore: string;
  hp: number;
  damage: number;
  discovered: boolean;
}

const ENEMY_LORE: Record<EnemyType, string> = {
  grunt: "Slow, dependable fodder. Dangerous only in numbers.",
  runner: "Sprints straight at you and rarely stops to think.",
  brute: "Heavy, armoured and slow enough to kite — if you have room.",
  boss: "The warden of a stage. Hits hard and soaks arrows.",
};

const ENEMY_NAMES: Record<EnemyType, string> = {
  grunt: "Grunt",
  runner: "Runner",
  brute: "Brute",
  boss: "Boss",
};

export function getBestiary(progress: Progress): BestiaryEntry[] {
  const seen = new Set(progress.seen);
  const rank: EnemyType[] = ["grunt", "runner", "brute"];

  const common = rank.map((type) => ({
    key: type,
    name: ENEMY_NAMES[type],
    lore: ENEMY_LORE[type],
    hp: ENEMY_CONFIG[type].hp,
    damage: ENEMY_CONFIG[type].damage,
    discovered: seen.has(type),
  }));

  const bosses = MAPS.map((map) => ({
    key: bossKey(map.id),
    name: map.boss,
    lore: `Warden of ${map.name}. ${ENEMY_LORE.boss}`,
    hp: Math.round(ENEMY_CONFIG.boss.hp * map.hpMult),
    damage: Math.round(ENEMY_CONFIG.boss.damage * map.damageMult),
    discovered: seen.has(bossKey(map.id)),
  }));

  return [...common, ...bosses];
}

export interface Milestone {
  id: string;
  name: string;
  detail: string;
  done: boolean;
}

export function getMilestones(progress: Progress): Milestone[] {
  const clearedStages = MAPS.reduce(
    (sum, m) => sum + Math.min(progress.cleared[m.id] ?? 0, m.stages),
    0,
  );
  const maxStars = Math.max(0, ...Object.values(progress.bows).map((s) => s ?? 0));
  const firstMap = MAPS[0]!;

  return [
    {
      id: "first-boss",
      name: "First Warden",
      detail: "Defeat your first boss.",
      done: progress.bosses >= 1,
    },
    {
      id: "kills-1000",
      name: "Thousand Arrows",
      detail: "Defeat 1,000 enemies.",
      done: progress.kills >= 1000,
    },
    {
      id: "clear-map",
      name: `${firstMap.name} Cleared`,
      detail: `Clear all ${firstMap.stages} stages of ${firstMap.name}.`,
      done: (progress.cleared[firstMap.id] ?? 0) >= firstMap.stages,
    },
    {
      id: "five-star",
      name: "Master Fletcher",
      detail: "Upgrade any bow to 5 stars.",
      done: maxStars >= 5,
    },
    {
      id: "saga",
      name: "Saga Complete",
      detail: `Clear every stage across all ${MAPS.length} maps.`,
      done: clearedStages >= MAPS.reduce((sum, m) => sum + m.stages, 0),
    },
  ];
}
