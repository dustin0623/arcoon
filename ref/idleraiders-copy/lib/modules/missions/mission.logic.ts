interface Dungeon {
  requiredLevel: number;
}

// Scout's energy cost is the baseline (15) — every mission's bonus scales linearly with its energy cost.
// This makes tokens-per-energy roughly constant across mission types so longer runs aren't punished.
const ENERGY_BASELINE = 15

export function calculateDungeonReward(
  baseReward: number,
  raidPower: number,
  repeatCount: number,
  fatigue: number,
  mastery: number,
  energyCost: number = ENERGY_BASELINE
): number {
  // Base reward is always guaranteed — fatigue/repeat never affect it
  // Bonus scales with energy spent: a 60-energy mission rolls 4× the bonus of a 15-energy scout
  const energyScale = energyCost / ENERGY_BASELINE
  const bonusReward = raidPower * 0.1 * energyScale

  // Apply repeat penalty to bonus only (15% reduction per repeat, min 10% remaining)
  let repeatMultiplier = 1 - repeatCount * 0.15
  if (repeatMultiplier < 0.1) repeatMultiplier = 0.1

  // Apply fatigue penalty to bonus only (fatigue reduces raid power bonus from cards)
  let fatigueMultiplier = 1
  if (fatigue > 0) {
    fatigueMultiplier = mastery > 0 ? Math.min(1, mastery / Math.max(1, fatigue)) : 0
  }

  const adjustedBonus = bonusReward * repeatMultiplier * fatigueMultiplier

  // Roll between base (guaranteed) and base + adjusted bonus
  const roll = Math.random() * adjustedBonus
  return Math.floor(baseReward + roll)
}

// Roll one random material from a zone pool
export function rollMaterial(pool: string[]): string | null {
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Roll `count` materials from a zone pool (returns array of material IDs)
export function rollMaterialsFromPool(pool: string[], count: number): string[] {
  const drops: string[] = [];
  for (let i = 0; i < count; i++) {
    const mat = rollMaterial(pool);
    if (mat) drops.push(mat);
  }
  return drops;
}

export function rollDamage(raidPower: number): number {
  return Math.max(1, Math.floor(raidPower * (0.8 + Math.random() * 0.4)));
}

// Helper Functions
import { MISSION_LEVEL_OFFSETS, MISSION_TYPES, type MissionTypeId } from '@/public/data/world/dungeons'

export function getMissionRequiredLevel(dungeon: Dungeon, missionId: string): number {
  return dungeon.requiredLevel + (MISSION_LEVEL_OFFSETS[missionId] ?? 0);
}

interface DungeonWithWarReq extends Dungeon {
  requiredWarCampaigns?: { dungeonId: string; count: number } | null
}

export function isDungeonUnlocked(dungeon: Dungeon, playerLevel: number): boolean {
  return playerLevel >= dungeon.requiredLevel;
}

/**
 * Returns dungeon unlock gate state including War Campaign requirement from previous dungeon.
 */
export interface DungeonUnlockGate {
  unlocked: boolean
  levelMet: boolean
  warCampaignMet: boolean
  requiredLevel: number
  warCampaignReq: { dungeonId: string; dungeonName?: string; required: number; current: number } | null
}

export function getDungeonUnlockGate(
  dungeon: DungeonWithWarReq,
  playerLevel: number,
  completions: Record<string, number> | Map<string, number> | undefined,
  dungeonNames?: Record<string, string>,
): DungeonUnlockGate {
  const levelMet = playerLevel >= dungeon.requiredLevel
  const req = dungeon.requiredWarCampaigns

  if (!req) {
    return {
      unlocked: levelMet,
      levelMet,
      warCampaignMet: true,
      requiredLevel: dungeon.requiredLevel,
      warCampaignReq: null,
    }
  }

  const key = `${req.dungeonId}_war`
  const current =
    completions instanceof Map
      ? (completions.get(key) ?? 0)
      : (completions?.[key] ?? 0)
  const warCampaignMet = current >= req.count

  return {
    unlocked: levelMet && warCampaignMet,
    levelMet,
    warCampaignMet,
    requiredLevel: dungeon.requiredLevel,
    warCampaignReq: {
      dungeonId: req.dungeonId,
      dungeonName: dungeonNames?.[req.dungeonId],
      required: req.count,
      current,
    },
  }
}

export function isMissionUnlocked(dungeon: Dungeon, missionId: string, playerLevel: number): boolean {
  return playerLevel >= getMissionRequiredLevel(dungeon, missionId);
}

// ─────────────────────────────────────────────
// Mission Completion Gate
// ─────────────────────────────────────────────
// Level controls whether the mission tier *appears*; completion controls whether it can be *played*.

export interface MissionCompletionGate {
  playable: boolean
  required: number
  current: number
  gateMissionId: MissionTypeId | null
}

/**
 * Returns the completion gate state for a mission tier within a dungeon.
 * Reads from a serialized completion map (object form) so it works in both server and client.
 */
export function getMissionCompletionGate(
  dungeonId: string,
  missionTypeId: string,
  completions: Record<string, number> | Map<string, number> | undefined,
): MissionCompletionGate {
  const template = MISSION_TYPES[missionTypeId as MissionTypeId]
  const req = template?.requiredCompletions

  if (!req) {
    return { playable: true, required: 0, current: 0, gateMissionId: null }
  }

  const key = `${dungeonId}_${req.missionId}`
  const current =
    completions instanceof Map
      ? (completions.get(key) ?? 0)
      : (completions?.[key] ?? 0)

  return {
    playable: current >= req.count,
    required: req.count,
    current,
    gateMissionId: req.missionId,
  }
}

export function isMissionCompletionUnlocked(
  dungeonId: string,
  missionTypeId: string,
  completions: Record<string, number> | Map<string, number> | undefined,
): boolean {
  return getMissionCompletionGate(dungeonId, missionTypeId, completions).playable
}
