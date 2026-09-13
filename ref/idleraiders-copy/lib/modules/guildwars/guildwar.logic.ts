/**
 * GuildWar Logic
 * War mechanics utilities for guild war system
 * 
 * Uses the same week schedule as leaderboard:
 * Week schedule: Monday 00:00 UTC+8 to Sunday 23:59 UTC+8
 */

import { getCurrentWeek, getWeekForDate } from '../leaderboards/leaderboard.logic'

// Re-export week functions for convenience
export { getCurrentWeek, getWeekForDate }

// ═══════════════════════════════════════════════════════════════════════════════
// War Constants
// ═══════════════════════════════════════════════════════════════════════════════

// War mission settings
export const WAR_MISSION_DURATION = 5 * 60 // 5 minutes in seconds
export const WAR_MISSION_ENERGY_COST = 100

// Outpost configurations (HP-based, scaled by outpost tier)
// damageMultiplier: Points multiplier for damage dealt on this outpost
// Example: 50,000 damage on outpost 1 (1x) = 50 points
//          50,000 damage on outpost 5 (3x) = 150 points
export const OUTPOST_CONFIGS: Record<string, { maxGarrison: number; damageMultiplier: number; requiredGuildLevel: number }> = {
  outpost_1: { maxGarrison: 100_000, damageMultiplier: 1.0, requiredGuildLevel: 0 },   // Base
  outpost_2: { maxGarrison: 250_000, damageMultiplier: 1.5, requiredGuildLevel: 3 },   // 50% bonus
  outpost_3: { maxGarrison: 500_000, damageMultiplier: 2.0, requiredGuildLevel: 6 },   // 2x
  outpost_4: { maxGarrison: 750_000, damageMultiplier: 2.5, requiredGuildLevel: 9 },   // 2.5x
  outpost_5: { maxGarrison: 1_000_000, damageMultiplier: 3.0, requiredGuildLevel: 12 }, // Central Keep - 3x
}

// Helper to get outpost config (with fallback)
export function getOutpostConfig(outpostId: string) {
  return OUTPOST_CONFIGS[outpostId] || { maxGarrison: 100_000, damageMultiplier: 1.0, requiredGuildLevel: 0 }
}

/**
 * Check if a guild meets the level requirement for an outpost
 */
export function canGuildAttackOutpostByLevel(
  guildLevel: number,
  outpostId: string
): { canAttack: boolean; requiredLevel: number } {
  const config = getOutpostConfig(outpostId)
  return {
    canAttack: guildLevel >= config.requiredGuildLevel,
    requiredLevel: config.requiredGuildLevel,
  }
}

// Note: Garrison decay has been removed - war is chaos with constant attacks

// Stronghold settings
// Base HP of 100K ensures multiple attacks are needed to destroy a stronghold
// At level 16+ with 10k+ raid power, it takes ~10 attacks to destroy
export const STRONGHOLD_BASE_HP = 100_000
export const STRONGHOLD_HP_PER_LEVEL = 25_000 // Additional HP per guild level (e.g., Lv15 = 100K + 375K = 475K HP)
// Note: Stronghold HP regeneration has been removed - use supplies to repair
// Note: Outpost capture bonus is a flat value (VALOR_OUTPOST_CAPTURE_BONUS)
// applied on top of the outpost's damage multiplier when the outpost is captured.

// Auto-revive: destroyed strongholds automatically rebuild 24h after destroyedAt.
// Triggered lazily on player-facing GET /api/guilds/war, rate-limited by a Redis sweep lock.
// NOTE: keep STRONGHOLD_AUTO_REVIVE_HOURS in WarTab.tsx in sync with this value.
export const STRONGHOLD_AUTO_REVIVE_MS = 24 * 60 * 60 * 1000
export const STRONGHOLD_AUTO_REVIVE_SWEEP_TTL_SEC = 60

// Damage calculation
export const BASE_WAR_DAMAGE = 100 // Base damage per war mission
export const DAMAGE_VARIATION = 0.2 // +/- 20% damage variation

// Reward pool settings
export const WAR_REWARD_POOL = 5000 // Guild points to distribute

// ═══════════════════════════════════════════════════════════════════════════════
// War Economy Constants
// ═══════════════════════════════════════════════════════════════════════════════

// Supply generation rates per hour (by outpost tier)
export const SUPPLY_RATES: Record<string, number> = {
  outpost_1: 10,
  outpost_2: 25,
  outpost_3: 50,
  outpost_4: 100,
  outpost_5: 200,
}

// Outpost limits
export const BASE_OUTPOST_LIMIT = 3
export const WARLORDS_BONUS_OUTPOSTS = 1

// Valor calculation
export const VALOR_PER_DAMAGE = 1 // 1 valor per 1000 damage dealt
export const VALOR_PER_DAMAGE_RECEIVED = 0.3 // 0.3 valor per 1000 damage received
export const VALOR_OUTPOST_CAPTURE_BONUS = 1500
export const VALOR_STRONGHOLD_DESTROY_BONUS = 500

// Supply Stealing (stronghold attacks)
export const SUPPLY_STEAL_BASE_CHANCE = 0.25 // 25% base chance to steal supplies
export const SUPPLY_STEAL_DESTROY_BONUS = 0.25 // +25% chance if stronghold destroyed (total 50%)
export const SUPPLY_STEAL_MAX_PERCENT = 0.05 // Steal up to 5% of target's supplies
export const SUPPLY_STEAL_MIN_AMOUNT = 10 // Minimum steal amount

// Counter-attack (Reinforce buff)
export const REINFORCE_COUNTER_CHANCE = 0.15 // 15% chance to counter-attack
export const REINFORCE_COUNTER_DAMAGE_PERCENT = 0.5 // Counter deals 50% of original damage back
export const VALOR_OUTPOST_MULTIPLIER: Record<string, number> = {
  outpost_1: 1.0,
  outpost_2: 1.5,
  outpost_3: 2.0,
  outpost_4: 2.5,
  outpost_5: 3.0,
}

// Stronghold attacks use a fixed multiplier independent of outpost tuning
export const VALOR_STRONGHOLD_MULTIPLIER = 1.0

/**
 * Get supply generation rate for an outpost
 */
export function getSupplyRate(outpostId: string): number {
  return SUPPLY_RATES[outpostId] ?? 10
}

/**
 * Calculate valor from attack damage dealt
 * Valor = floor(damage / 1000) * outpost multiplier
 */
export function calculateValorFromAttack(
  damage: number,
  outpostId: string,
  captured: boolean = false,
  strongholdDestroyed: boolean = false
): number {
  const multiplier = VALOR_OUTPOST_MULTIPLIER[outpostId] ?? 1.0
  let valor = Math.floor((damage / 1000) * VALOR_PER_DAMAGE * multiplier)
  
  if (captured) valor += VALOR_OUTPOST_CAPTURE_BONUS
  if (strongholdDestroyed) valor += VALOR_STRONGHOLD_DESTROY_BONUS
  
  return valor
}

/**
 * Calculate valor from a stronghold attack
 * Uses the dedicated stronghold multiplier (VALOR_STRONGHOLD_MULTIPLIER)
 * so tuning outpost valor doesn't silently change stronghold valor.
 */
export function calculateValorFromStrongholdAttack(
  damage: number,
  strongholdDestroyed: boolean = false
): number {
  let valor = Math.floor((damage / 1000) * VALOR_PER_DAMAGE * VALOR_STRONGHOLD_MULTIPLIER)

  if (strongholdDestroyed) valor += VALOR_STRONGHOLD_DESTROY_BONUS

  return valor
}

/**
 * Calculate valor from defense (damage received)
 * Defenders earn 0.3x valor per 1000 damage absorbed
 */
export function calculateValorFromDefense(
  damageReceived: number,
  outpostId?: string
): number {
  const multiplier = outpostId ? (VALOR_OUTPOST_MULTIPLIER[outpostId] ?? 1.0) : 1.0
  return Math.floor((damageReceived / 1000) * VALOR_PER_DAMAGE_RECEIVED * multiplier)
}

/**
 * Calculate counter-attack damage from Reinforce buff
 * Returns { triggered: boolean, damage: number }
 */
export function calculateCounterAttack(
  incomingDamage: number,
  hasReinforceBuff: boolean
): { triggered: boolean, damage: number } {
  if (!hasReinforceBuff) return { triggered: false, damage: 0 }
  
  // Roll for counter-attack chance (15%)
  if (Math.random() > REINFORCE_COUNTER_CHANCE) {
    return { triggered: false, damage: 0 }
  }
  
  // Counter deals 50% of incoming damage back
  const counterDamage = Math.floor(incomingDamage * REINFORCE_COUNTER_DAMAGE_PERCENT)
  return { triggered: true, damage: counterDamage }
}

/**
 * Get outpost limit for a guild (base + Warlords perk bonus)
 */
export function getOutpostLimit(hasWarlordsPerk: boolean): number {
  return BASE_OUTPOST_LIMIT + (hasWarlordsPerk ? WARLORDS_BONUS_OUTPOSTS : 0)
}

/**
 * Check if guild can capture another outpost
 */
export function canCaptureMoreOutposts(
  currentOutpostCount: number,
  hasWarlordsPerk: boolean
): boolean {
  return currentOutpostCount < getOutpostLimit(hasWarlordsPerk)
}

/**
 * Calculate the total supplies a guild earns per hour
 * based on all outpost IDs they currently hold.
 * Used by the cron worker and for UI display.
 *
 * Example: holding outpost_1 (10) + outpost_3 (50) = 60 supplies/hr
 */
export function applyOutpostSupplies(heldOutpostIds: string[]): number {
  return heldOutpostIds.reduce((total, id) => total + getSupplyRate(id), 0)
}

/**
 * Get milliseconds until the next top-of-hour supply drop.
 * The cron fires at "0 * * * *", so we calculate the gap from now.
 */
export function msUntilNextSupplyDrop(): number {
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setMinutes(0, 0, 0)
  nextHour.setHours(nextHour.getHours() + 1)
  return nextHour.getTime() - now.getTime()
}

// Note: Stronghold HP regeneration has been removed - use supplies to repair
// Note: Garrison decay has been removed - war is chaos with constant attacks
// Note: Cycle-based updates have been removed - all state changes are event-driven

// ═══════════════════════════════════════════════════════════════════════════════
// Damage Calculation
// ════════════════════════════════════════════════════════════════════════════��══

/**
 * Calculate damage dealt by a player in a war mission
 * Based on their total raid power from all cards
 * 
 * Formula: raidPower with +/- 20% variation
 * Example: 11,497 raid power = 9,197 to 13,796 damage
 */
export function calculateWarDamage(raidPower: number): number {
  // Use full raid power as damage (player's total raid power = their contribution)
  const baseDamage = Math.max(BASE_WAR_DAMAGE, raidPower)
  
  // Add random variation (+/- 20%)
  const variation = 1 + (Math.random() * 2 - 1) * DAMAGE_VARIATION
  
  return Math.floor(baseDamage * variation)
}

/**
 * Calculate stronghold HP based on guild level
 */
export function calculateStrongholdHP(guildLevel: number): number {
  return STRONGHOLD_BASE_HP + guildLevel * STRONGHOLD_HP_PER_LEVEL
}

// Note: Stronghold HP regeneration has been removed - use supplies to repair strongholds

// ═══════════════════════════════════════════════════════════════════════════════
// Supply Stealing
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate supply stealing when attacking a stronghold
 * Returns the amount of supplies stolen (0 if steal fails)
 * 
 * @param defenderSupplies - Target guild's current supply count
 * @param strongholdDestroyed - Whether the stronghold was destroyed in this attack
 */
export function calculateSupplySteal(
  defenderSupplies: number,
  strongholdDestroyed: boolean
): { success: boolean; amount: number } {
  // Calculate steal chance
  let stealChance = SUPPLY_STEAL_BASE_CHANCE
  if (strongholdDestroyed) {
    stealChance += SUPPLY_STEAL_DESTROY_BONUS
  }
  
  // Roll for steal
  const roll = Math.random()
  if (roll > stealChance) {
    return { success: false, amount: 0 }
  }
  
  // Calculate stolen amount (5% of defender's supplies, minimum 10)
  const maxSteal = Math.floor(defenderSupplies * SUPPLY_STEAL_MAX_PERCENT)
  const stealAmount = Math.max(SUPPLY_STEAL_MIN_AMOUNT, maxSteal)
  
  // Can't steal more than they have
  const actualSteal = Math.min(stealAmount, defenderSupplies)
  
  return { success: true, amount: actualSteal }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Reward Calculation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate reward for a guild based on their rank
 * Uses proportional distribution based on points
 */
export function calculateGuildWarReward(
  guildPoints: number,
  totalPoints: number,
  rewardPool: number = WAR_REWARD_POOL
): number {
  if (totalPoints <= 0) return 0
  return Math.floor((guildPoints / totalPoints) * rewardPool)
}

/**
 * Get rank bonus multiplier for top positions
 */
export function getRankBonusMultiplier(rank: number): number {
  switch (rank) {
    case 1: return 1.5 // 50% bonus for 1st
    case 2: return 1.25 // 25% bonus for 2nd
    case 3: return 1.1 // 10% bonus for 3rd
    default: return 1.0
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a guild can attack an outpost
 */
export function canAttackOutpost(
  attackerGuildId: string,
  outpostControlledBy?: string
): { canAttack: boolean; reason?: string } {
  // Can always attack neutral outposts
  if (!outpostControlledBy) {
    return { canAttack: true }
  }
  
  // Cannot attack own outpost
  if (attackerGuildId === outpostControlledBy) {
    return { canAttack: false, reason: 'Cannot attack your own outpost' }
  }
  
  return { canAttack: true }
}

/**
 * Check if a guild can attack another guild's stronghold
 */
export function canAttackStronghold(
  attackerGuildId: string,
  targetGuildId: string,
  isTargetDestroyed: boolean
): { canAttack: boolean; reason?: string } {
  // Cannot attack own stronghold
  if (attackerGuildId === targetGuildId) {
    return { canAttack: false, reason: 'Cannot attack your own stronghold' }
  }
  
  // Cannot attack destroyed stronghold
  if (isTargetDestroyed) {
    return { canAttack: false, reason: 'Stronghold already destroyed' }
  }
  
  return { canAttack: true }
}

/**
 * Check if garrison is depleted (outpost becomes neutral)
 */
export function isGarrisonDepleted(garrison: number): boolean {
  return garrison <= 0
}

/**
 * Check if stronghold is destroyed
 */
export function isStrongholdDestroyed(currentHp: number): boolean {
  return currentHp <= 0
}
