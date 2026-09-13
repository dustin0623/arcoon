import GAME_DATA from '@/public/data'
import type { GameData } from '../../types'

const SYSTEM = (GAME_DATA as GameData).SYSTEM ?? { PLAYER: { MAX_LEVEL: 150 }, ENERGY: { MAX: 100, REGEN_INTERVAL: 180 }, FATIGUE: { MAX: 100 } }
const PLAYER = SYSTEM.PLAYER ?? { MAX_LEVEL: 150 }

const LEADERBOARD = (GAME_DATA as GameData).ECONOMY?.leaderboard ?? {
  EXPECTED_DAMAGE: 1000000,
  PREMIUM_POOL: 1000,
}

// ═══════════════════════════════════════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════════════════════════════════════

export function validateString(val: unknown, minLen: number = 1, maxLen: number = 255): boolean {
  return typeof val === 'string' && val.length >= minLen && val.length <= maxLen
}

export function validateNumber(val: unknown, min: number = 0, max: number = Infinity): boolean {
  return typeof val === 'number' && !isNaN(val) && val >= min && val <= max
}

export function validateEnum<T>(val: unknown, allowed: T[]): val is T {
  return (allowed as unknown[]).includes(val)
}

// ═══════════════════════════════════════════════════════════════════════════════
// XP Progression
// ═══════════════════════════════════════════════════════════════════════════════

export function getXPForLevel(level: number): number {
  // 1.03× curve: L150 achievable in ~1 year of active play (balanced progression)
  return Math.round(230 * Math.pow(1.03, level - 1))
}

export function xpToNextLevel(level: number): number {
  if (level >= PLAYER.MAX_LEVEL) return Infinity
  return getXPForLevel(level)
}

export function calculateLevel(totalXp: number): { level: number; xp: number } {
  let level = 1
  let remaining = totalXp
  while (level < PLAYER.MAX_LEVEL && remaining >= getXPForLevel(level)) {
    remaining -= getXPForLevel(level)
    level++
  }
  return { level, xp: remaining }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Leaderboard Calculations
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateRewardPool(totalBossDamage: number): number {
  const pool = (totalBossDamage / LEADERBOARD.EXPECTED_DAMAGE) * LEADERBOARD.PREMIUM_POOL
  return Math.min(pool, LEADERBOARD.PREMIUM_POOL)
}

export function calculatePlayerReward(playerDamage: number, totalBossDamage: number, revisedPool: number): number {
  if (totalBossDamage === 0) return 0
  return Math.floor((playerDamage / totalBossDamage) * revisedPool)
}

// ═══════════════════════════════════════════════════════════════════════════════
// GM Modifier
// ═══════════════════════════════════════════════════════════════════════════════

export function getGMModifier(gm: number): number {
  return 1 + (gm || 0) * 0.02
}
