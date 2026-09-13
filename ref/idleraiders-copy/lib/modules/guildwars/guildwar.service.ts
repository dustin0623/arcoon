import type { Types } from 'mongoose'
import type {
  IGuildWarDocument,
  IGuildWarEntry,
  IWarOutpost,
  IWarStronghold,
  IGuildWarData,
  IGuildWarRank,
  IWarBuff,
} from './guildwar.model'
import * as guildwarRepo from './guildwar.repository'
import * as guildRepo from '../guilds/guild.repository'
import { calculatePerkEffects, type UnlockedPerk } from '../guilds/guild.logic'
import * as playerRepo from '../players/player.repository'
import * as missionRepo from '../missions/mission.repository'
import { TOKEN_MAIN } from '@/lib/config/tokens'
import {
  getCurrentWeek,
  calculateWarDamage,
  calculateGuildWarReward,
  getRankBonusMultiplier,
  canAttackOutpost,
  canAttackStronghold,
  canGuildAttackOutpostByLevel,
  isGarrisonDepleted,
  calculateValorFromAttack,
  calculateValorFromStrongholdAttack,
  calculateValorFromDefense,
  calculateSupplySteal,
  calculateCounterAttack,
  getSupplyRate,
  WAR_MISSION_DURATION,
  WAR_MISSION_ENERGY_COST,
  WAR_REWARD_POOL,
  STRONGHOLD_AUTO_REVIVE_MS,
  STRONGHOLD_AUTO_REVIVE_SWEEP_TTL_SEC,
} from './guildwar.logic'
import { WAR_ECONOMY_CONFIG } from '@/public/data/progression/progression'
import { redis } from '@/lib/redis/client'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface GuildWarEntryWithRank extends IGuildWarEntry {
  rank: number
}

export interface GuildWarReward {
  guildId: Types.ObjectId
  guildName: string
  rank: number
  valor: number
  reward: number
}

export type SupplyActionType = 'repairGarrison' | 'repairOutpost' | 'warCry' | 'reinforce' | 'rally' | 'shieldWall'

export interface SupplySpendResult {
  success: boolean
  suppliesRemaining: number
  message: string
  buff?: IWarBuff
}

export interface WarRewardDistributionResult {
  count: number
  totalPointsDistributed: number
  distributions: GuildWarReward[]
}

export interface OutpostAttackResult {
  success: boolean
  damage: number
  valor: number
  outpostCaptured: boolean
  newGarrison: number
  counterDamage?: number
  message: string
}

export interface StrongholdAttackResult {
  success: boolean
  damage: number
  valor: number
  strongholdDestroyed: boolean
  remainingHp: number
  suppliesStolen?: number
  counterDamage?: number
  message: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions - Guild War Management
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get or create the current week's guild war
 */
export async function getOrCreateCurrentGuildWar(): Promise<IGuildWarDocument> {
  const { weekNumber, weekStart, weekEnd } = getCurrentWeek()
  return guildwarRepo.getOrCreateActive(weekNumber, weekStart, weekEnd)
}

/**
 * Ensure a guild is participating in the current guild war
 */
export async function ensureGuildParticipation(
  guildId: Types.ObjectId,
  guildName: string,
  guildLevel: number
): Promise<IGuildWarDocument> {
  const { weekNumber, weekStart, weekEnd } = getCurrentWeek()
  return guildwarRepo.ensureGuildParticipation(
    weekNumber,
    weekStart,
    weekEnd,
    guildId,
    guildName,
    guildLevel
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Auto-Revive Sweep (lazy, player-triggered)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Lazy sweep that auto-revives strongholds destroyed more than
 * STRONGHOLD_AUTO_REVIVE_MS ago. Called from the player-facing war overview
 * endpoint. Rate-limited by a per-week Redis lock (SET NX EX) so only one
 * request per STRONGHOLD_AUTO_REVIVE_SWEEP_TTL_SEC window actually hits Mongo.
 *
 * Degrades gracefully: if Redis is unreachable, we still run the sweep so
 * correctness is preserved (the Mongo query is cheap — one singleton doc).
 */
export async function runAutoReviveSweepIfDue(
  weekNumber: number
): Promise<{ ran: boolean; revivedCount: number }> {
  const lockKey = `guildwar:auto-revive:sweep:${weekNumber}`

  let acquired = false
  try {
    const result = await redis.set(
      lockKey,
      '1',
      'EX',
      STRONGHOLD_AUTO_REVIVE_SWEEP_TTL_SEC,
      'NX'
    )
    acquired = result === 'OK'
  } catch (err) {
    // Redis unreachable — fall through and run the sweep anyway.
    console.warn('[guildwar] auto-revive redis lock failed, running sweep anyway', err)
    acquired = true
  }

  if (!acquired) {
    return { ran: false, revivedCount: 0 }
  }

  const cutoff = new Date(Date.now() - STRONGHOLD_AUTO_REVIVE_MS)
  const { revivedCount } = await guildwarRepo.autoReviveExpiredStrongholds(cutoff)

  if (revivedCount > 0) {
    console.log(
      `[guildwar] auto-revived ${revivedCount} stronghold(s) for week ${weekNumber}`
    )
  }

  return { ran: true, revivedCount }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions - Querying Guild War
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get current guild war leaderboard (guilds sorted by valor)
 */
export async function getWarLeaderboard(): Promise<GuildWarEntryWithRank[]> {
  const entries = await guildwarRepo.findAllEntriesSortedByValor(100)
  
  return entries.map((entry, idx) => {
    // Convert Mongoose subdocument to plain object if needed
    const entryObj = typeof entry.toObject === 'function' ? entry.toObject() : entry
    return {
      ...entryObj,
      rank: idx + 1,
    }
  })
}

/**
 * Get all outposts with current status
 * Note: Garrison decay has been removed - garrisons only change from attacks
 */
export async function getOutpostsWithCurrentStatus(): Promise<IWarOutpost[]> {
  const outposts = await guildwarRepo.findAllOutposts()
  
  return outposts.map((outpost) => {
    // Convert Mongoose subdocument to plain object if needed
    return typeof outpost.toObject === 'function' ? outpost.toObject() : outpost
  })
}

/**
 * Get a specific guild's stronghold with current HP
 * Stronghold HP does not regenerate - guilds must use supplies to repair
 */
export async function getStrongholdWithCurrentHp(
  guildId: Types.ObjectId
): Promise<IWarStronghold | null> {
  const stronghold = await guildwarRepo.findStrongholdByGuild(guildId)
  
  if (!stronghold) return null
  // Convert Mongoose subdocument to plain object if needed
  return typeof stronghold.toObject === 'function' ? stronghold.toObject() : stronghold
}

/**
 * Get all active strongholds with current HP (excludes destroyed - for attack targets)
 * Stronghold HP does not regenerate - guilds must use supplies to repair
 */
export async function getAllStrongholdsWithCurrentHp(): Promise<IWarStronghold[]> {
  const strongholds = await guildwarRepo.findActiveStrongholds()
  
  return strongholds.map((stronghold) => {
    // Convert Mongoose subdocument to plain object if needed
    return typeof stronghold.toObject === 'function' ? stronghold.toObject() : stronghold
  })
}

/**
 * Get all strongholds including destroyed (for overview display)
 */
export async function getAllStrongholdsIncludingDestroyed(): Promise<IWarStronghold[]> {
  const strongholds = await guildwarRepo.findAllStrongholds()
  
  return strongholds.map((stronghold) => {
    // Convert Mongoose subdocument to plain object if needed
    return typeof stronghold.toObject === 'function' ? stronghold.toObject() : stronghold
  })
}

/**
 * Get guild's war entry
 */
export async function getGuildWarEntry(
  guildId: Types.ObjectId
): Promise<IGuildWarEntry | null> {
  const entry = await guildwarRepo.findEntryByGuild(guildId)
  if (!entry) return null
  // Convert Mongoose subdocument to plain object if needed
  return typeof entry.toObject === 'function' ? entry.toObject() : entry
}

// ══════════════════════════════════════════════════���════════════════════════════
// Core Functions - War Missions (Attacks)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Start an outpost attack mission
 */
export async function startOutpostAttack(
  playerId: Types.ObjectId,
  guildId: Types.ObjectId,
  outpostId: string
): Promise<{ missionId: Types.ObjectId; duration: number; freeAttack?: boolean }> {
  // Validate player has a guild
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  if (!player.guildId || player.guildId.toString() !== guildId.toString()) {
    throw new Error('Player is not in the specified guild')
  }
  
  // Check for active Rally buff (free attacks)
  const guildEntry = await guildwarRepo.findEntryByGuild(guildId)
  const now = new Date()
  const hasRallyBuff = guildEntry?.activeBuffs?.some(
    buff => buff.type === 'rally' && new Date(buff.expiresAt) > now
  ) ?? false
  
  // Check energy (skip if Rally buff is active)
  if (!hasRallyBuff && player.energy < WAR_MISSION_ENERGY_COST) {
    throw new Error(`Not enough energy. Need ${WAR_MISSION_ENERGY_COST}, have ${player.energy}`)
  }
  
  // Check for active mission
  const activeMission = await missionRepo.findActiveByOwner(playerId)
  if (activeMission) {
    throw new Error('Player already has an active mission')
  }
  
  // Validate outpost exists
  const outpost = await guildwarRepo.findOutpostById(outpostId)
  if (!outpost) throw new Error('Outpost not found')
  
  // Check guild level requirement
  const guild = await guildRepo.findById(guildId)
  if (!guild) throw new Error('Guild not found')
  
  const levelCheck = canGuildAttackOutpostByLevel(guild.level, outpostId)
  if (!levelCheck.canAttack) {
    throw new Error(`Guild must be level ${levelCheck.requiredLevel} to attack this outpost`)
  }
  
  // Check if can attack
  const attackCheck = canAttackOutpost(guildId.toString(), outpost.controlledBy?.toString())
  if (!attackCheck.canAttack) {
  throw new Error(attackCheck.reason || 'Cannot attack this outpost')
  }
  
  // Ensure guild participation (guild already fetched above for level check)
  const guildWar = await ensureGuildParticipation(guildId, guild.name, guild.level)
  
  // Deduct energy (only if Rally buff is not active)
  if (!hasRallyBuff) {
    await playerRepo.deductEnergy(playerId, WAR_MISSION_ENERGY_COST)
  }
  
  // Calculate mission duration with guild perks
  const perkEffects = calculatePerkEffects((guild.perks || []) as UnlockedPerk[])
  const durationMultiplier = 1 + perkEffects.warMissionDuration // e.g., 1 + (-0.10) = 0.90
  const adjustedDuration = Math.max(1, Math.floor(WAR_MISSION_DURATION * durationMultiplier))
  
  // Create war mission
  const mission = await missionRepo.create({
    owner: playerId,
    type: 'war_outpost',
    sourceName: outpost.name,
    startTime: new Date(),
    duration: adjustedDuration,
    guildWarId: guildWar._id,
    targetOutpostId: outpostId,
    completedAt: null,
  })
  
  // Set player's active mission
  await playerRepo.setActiveMission(playerId, mission._id)
  
  return { missionId: mission._id, duration: adjustedDuration, freeAttack: hasRallyBuff }
}

/**
 * Start a stronghold attack mission
 */
export async function startStrongholdAttack(
  playerId: Types.ObjectId,
  guildId: Types.ObjectId,
  targetGuildId: Types.ObjectId
): Promise<{ missionId: Types.ObjectId; duration: number; freeAttack?: boolean }> {
  // Validate player has a guild
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  if (!player.guildId || player.guildId.toString() !== guildId.toString()) {
    throw new Error('Player is not in the specified guild')
  }
  
  // Check for active Rally buff (free attacks)
  const guildEntry = await guildwarRepo.findEntryByGuild(guildId)
  const now = new Date()
  const hasRallyBuff = guildEntry?.activeBuffs?.some(
    buff => buff.type === 'rally' && new Date(buff.expiresAt) > now
  ) ?? false
  
  // Check energy (skip if Rally buff is active)
  if (!hasRallyBuff && player.energy < WAR_MISSION_ENERGY_COST) {
    throw new Error(`Not enough energy. Need ${WAR_MISSION_ENERGY_COST}, have ${player.energy}`)
  }
  
  // Check for active mission
  const activeMission = await missionRepo.findActiveByOwner(playerId)
  if (activeMission) {
    throw new Error('Player already has an active mission')
  }
  
  // Get guild info
  const guild = await guildRepo.findById(guildId)
  if (!guild) throw new Error('Guild not found')
  
  const targetGuild = await guildRepo.findById(targetGuildId)
  if (!targetGuild) throw new Error('Target guild not found')
  
  // Ensure both guilds are participating
  await ensureGuildParticipation(guildId, guild.name, guild.level)
  const guildWar = await ensureGuildParticipation(targetGuildId, targetGuild.name, targetGuild.level)
  
  // Get target stronghold
  const stronghold = await guildwarRepo.findStrongholdByGuild(targetGuildId)
  if (!stronghold) throw new Error('Target stronghold not found')
  
  // Check if can attack
  const attackCheck = canAttackStronghold(
    guildId.toString(),
    targetGuildId.toString(),
    stronghold.isDestroyed
  )
  if (!attackCheck.canAttack) {
    throw new Error(attackCheck.reason || 'Cannot attack this stronghold')
  }
  
  // Deduct energy (only if Rally buff is not active)
  if (!hasRallyBuff) {
    await playerRepo.deductEnergy(playerId, WAR_MISSION_ENERGY_COST)
  }
  
  // Calculate mission duration with guild perks
  const perkEffects = calculatePerkEffects((guild.perks || []) as UnlockedPerk[])
  const durationMultiplier = 1 + perkEffects.warMissionDuration // e.g., 1 + (-0.10) = 0.90
  const adjustedDuration = Math.max(1, Math.floor(WAR_MISSION_DURATION * durationMultiplier))
  
  // Create war mission
  const mission = await missionRepo.create({
    owner: playerId,
    type: 'war_stronghold',
    sourceName: `${targetGuild.name}'s Stronghold`,
    startTime: new Date(),
    duration: adjustedDuration,
    guildWarId: guildWar._id,
    targetGuildId,
    completedAt: null,
  })
  
  // Set player's active mission
  await playerRepo.setActiveMission(playerId, mission._id)
  
  return { missionId: mission._id, duration: adjustedDuration, freeAttack: hasRallyBuff }
}

/**
 * Complete an outpost attack mission
 */
export async function completeOutpostAttack(
  missionId: Types.ObjectId,
  playerId: Types.ObjectId,
  raidPower: number
): Promise<OutpostAttackResult> {
  // Get mission
  const mission = await missionRepo.findById(missionId)
  if (!mission) throw new Error('Mission not found')
  if (mission.owner.toString() !== playerId.toString()) {
    throw new Error('Mission does not belong to this player')
  }
  if (mission.type !== 'war_outpost') {
    throw new Error('Not an outpost attack mission')
  }
  if (mission.completedAt) {
    throw new Error('Mission already completed')
  }
  
  // Check if mission time has passed
  const missionEndTime = mission.startTime.getTime() + mission.duration * 1000
  if (Date.now() < missionEndTime) {
    throw new Error('Mission not yet complete')
  }
  
  // Get player and guild
  const player = await playerRepo.findById(playerId)
  if (!player || !player.guildId) throw new Error('Player or guild not found')
  
  const guild = await guildRepo.findById(player.guildId)
  if (!guild) throw new Error('Guild not found')
  
  // Get current outpost status
  const outpost = await guildwarRepo.findOutpostById(mission.targetOutpostId!)
  if (!outpost) throw new Error('Outpost not found')
  
  // Calculate base damage
  let damage = calculateWarDamage(raidPower)
  
  // Check defender buffs (Shield Wall for damage reduction, Reinforce for counter-attack)
  let counterDamage = 0
  if (outpost.controlledBy) {
    const defenderEntry = await guildwarRepo.findEntryByGuild(outpost.controlledBy)
    const now = new Date()
    const hasShieldWall = defenderEntry?.activeBuffs?.some(
      buff => buff.type === 'shieldWall' && new Date(buff.expiresAt) > now
    ) ?? false
    const hasReinforce = defenderEntry?.activeBuffs?.some(
      buff => buff.type === 'reinforce' && new Date(buff.expiresAt) > now
    ) ?? false
    
    if (hasShieldWall) {
      damage = Math.floor(damage * 0.75) // 25% damage reduction
    }
    
    // Check for counter-attack from Reinforce buff (15% chance, 50% damage reflected)
    const counterResult = calculateCounterAttack(damage, hasReinforce)
    if (counterResult.triggered) {
      counterDamage = counterResult.damage
      // Apply counter-damage to attacker's stronghold
      await guildwarRepo.updateStrongholdHp(guild._id, counterDamage, outpost.controlledBy)
    }
  }
  
  // Get current garrison (no decay - war is chaos with constant attacks)
  const currentGarrison = outpost.garrison
  
  // Apply damage to garrison
  const newGarrison = Math.max(0, currentGarrison - damage)
  let outpostCaptured = false
  let message = `Dealt ${damage} damage to ${outpost.name}`
  
  // Check if outpost is captured
  if (isGarrisonDepleted(newGarrison)) {
    // Capture the outpost - garrison starts at max HP for this outpost tier
    await guildwarRepo.updateOutpostControl(
      outpost.outpostId,
      guild._id,
      guild.name,
      outpost.maxGarrison
    )
    outpostCaptured = true
    message = `Captured ${outpost.name}!`
  } else {
    // Just reduce garrison
    await guildwarRepo.updateOutpostGarrison(outpost.outpostId, newGarrison)
  }
  
  // Calculate valor from attack (damage * multiplier + capture bonus)
  const valor = calculateValorFromAttack(damage, outpost.outpostId, outpostCaptured, false)
  
  // Award defender valor if outpost was controlled
  let defenderValor = 0
  if (outpost.controlledBy) {
    defenderValor = calculateValorFromDefense(damage, outpost.outpostId)
    await guildwarRepo.addGuildValor(outpost.controlledBy, defenderValor)
    await guildwarRepo.addDamageReceived(outpost.controlledBy, damage)
    
    // Distribute defender valor equally among members (rounded up)
    const defenderEntry = await guildwarRepo.findEntryByGuild(outpost.controlledBy)
    if (defenderEntry && defenderEntry.memberContributions.length > 0) {
      const valorPerMember = Math.ceil(defenderValor / defenderEntry.memberContributions.length)
      for (const member of defenderEntry.memberContributions) {
        await guildwarRepo.addMemberValor(outpost.controlledBy, member.playerId, valorPerMember)
      }
    }
    
    // Track if outpost survived
    if (!outpostCaptured) {
      await guildwarRepo.incrementAttacksSurvived(outpost.controlledBy)
    }
  }
  
  // Update attacker guild war stats with valor
  await guildwarRepo.updateGuildWarStats(
    guild._id,
    playerId,
    player.username,
    damage,
    valor,
    outpostCaptured,
    false,
    guild.name,
    guild.level
  )
  
  // Mark mission complete and clear player's active mission
  await missionRepo.complete(missionId)
  await playerRepo.clearActiveMission(playerId)
  
  // Send Discord notification (async, non-blocking)
  import('@/lib/config/discord').then(({ notifyGuildWarEvent, notifyTavernEvent }) => {
    if (outpostCaptured) {
      notifyGuildWarEvent({
        eventType: 'outpost_captured',
        guildName: guild.name,
        playerName: player.username,
        targetName: outpost.name,
        defenderGuild: outpost.controlledByName || undefined,
        damage,
        captureBonus: Math.floor(valor - (damage / 1000)),
        valorGained: valor,
        defenderValor: defenderValor > 0 ? defenderValor : undefined,
      }).catch(() => {})
      // Also notify tavern channel for highlight events
      notifyTavernEvent({
        eventType: 'outpost_captured',
        playerName: player.username,
        guildName: guild.name,
        outpostName: outpost.name,
        previousOwner: outpost.controlledByName || undefined,
      }).catch(() => {})
    } else {
      notifyGuildWarEvent({
        eventType: 'outpost_attacked',
        guildName: guild.name,
        playerName: player.username,
        targetName: outpost.name,
        defenderGuild: outpost.controlledByName || undefined,
        damage,
        damageAbsorbed: damage,
        garrisonRemaining: newGarrison,
        garrisonMax: outpost.maxGarrison,
        valorGained: valor,
        defenderValor: defenderValor > 0 ? defenderValor : undefined,
      }).catch(() => {})
    }
  }).catch(() => {})
  
  // Build result message
  let resultMessage = outpostCaptured ? `${message} +${valor} valor` : `${message} (+${valor} valor)`
  if (counterDamage > 0) {
    resultMessage += ` | Counter-attack: ${counterDamage} damage to your stronghold!`
  }
  
  return {
    success: true,
    damage,
    valor,
    outpostCaptured,
    newGarrison: outpostCaptured ? outpost.maxGarrison : newGarrison,
    counterDamage: counterDamage > 0 ? counterDamage : undefined,
    message: resultMessage,
  }
}

/**
 * Complete a stronghold attack mission
 */
export async function completeStrongholdAttack(
  missionId: Types.ObjectId,
  playerId: Types.ObjectId,
  raidPower: number
): Promise<StrongholdAttackResult> {
  // Get mission
  const mission = await missionRepo.findById(missionId)
  if (!mission) throw new Error('Mission not found')
  if (mission.owner.toString() !== playerId.toString()) {
    throw new Error('Mission does not belong to this player')
  }
  if (mission.type !== 'war_stronghold') {
    throw new Error('Not a stronghold attack mission')
  }
  if (mission.completedAt) {
    throw new Error('Mission already completed')
  }
  
  // Check if mission time has passed
  const missionEndTime = mission.startTime.getTime() + mission.duration * 1000
  if (Date.now() < missionEndTime) {
    throw new Error('Mission not yet complete')
  }
  
  // Get player and guild
  const player = await playerRepo.findById(playerId)
  if (!player || !player.guildId) throw new Error('Player or guild not found')
  
  const guild = await guildRepo.findById(player.guildId)
  if (!guild) throw new Error('Guild not found')
  
  // Get current stronghold status
  // Stronghold HP does not regenerate - guilds must use supplies to repair
  const stronghold = await guildwarRepo.findStrongholdByGuild(mission.targetGuildId!)
  if (!stronghold) throw new Error('Stronghold not found')
  
  // If stronghold is already destroyed, complete mission with no rewards
  // Player doesn't get stuck, but also gets no damage/valor/supplies
  if (stronghold.isDestroyed) {
    // Mark mission complete and clear player's active mission
    await missionRepo.complete(missionId)
    await playerRepo.clearActiveMission(playerId)
    
    return {
      success: true,
      damage: 0,
      valor: 0,
      strongholdDestroyed: true,
      remainingHp: 0,
      message: 'The stronghold was already destroyed. Mission completed with no rewards.',
    }
  }
  
  // Calculate base damage
  let damage = calculateWarDamage(raidPower)
  
  // Check defender buffs (Shield Wall for damage reduction, Reinforce for counter-attack)
  const defenderEntry = await guildwarRepo.findEntryByGuild(mission.targetGuildId!)
  const now = new Date()
  const hasShieldWall = defenderEntry?.activeBuffs?.some(
    buff => buff.type === 'shieldWall' && new Date(buff.expiresAt) > now
  ) ?? false
  const hasReinforce = defenderEntry?.activeBuffs?.some(
    buff => buff.type === 'reinforce' && new Date(buff.expiresAt) > now
  ) ?? false
  
  if (hasShieldWall) {
    damage = Math.floor(damage * 0.75) // 25% damage reduction
  }
  
  // Check for counter-attack from Reinforce buff (15% chance, 50% damage reflected)
  let counterDamage = 0
  const counterResult = calculateCounterAttack(damage, hasReinforce)
  if (counterResult.triggered) {
    counterDamage = counterResult.damage
    // Apply counter-damage to attacker's stronghold
    await guildwarRepo.updateStrongholdHp(guild._id, counterDamage, mission.targetGuildId!)
  }
  
  // Apply damage to stronghold
  const { destroyed } = await guildwarRepo.updateStrongholdHp(
    mission.targetGuildId!,
    damage,
    guild._id
  )
  
  const remainingHp = Math.max(0, stronghold.currentHp - damage)
  
  // Calculate valor from stronghold attack (uses dedicated stronghold multiplier)
  const valor = calculateValorFromStrongholdAttack(damage, destroyed)
  
  // Award defender valor
  const defenderValor = calculateValorFromDefense(damage)
  await guildwarRepo.addGuildValor(mission.targetGuildId!, defenderValor)
  await guildwarRepo.addDamageReceived(mission.targetGuildId!, damage)
  
  // Distribute defender valor equally among members (rounded up)
  // Note: defenderEntry was already fetched above for Shield Wall check
  if (defenderEntry && defenderEntry.memberContributions.length > 0) {
    const valorPerMember = Math.ceil(defenderValor / defenderEntry.memberContributions.length)
    for (const member of defenderEntry.memberContributions) {
      await guildwarRepo.addMemberValor(mission.targetGuildId!, member.playerId, valorPerMember)
    }
  }
  
  // Track stronghold defense if not destroyed
  if (!destroyed) {
    await guildwarRepo.incrementStrongholdDefenses(mission.targetGuildId!)
  }
  
  // Attempt to steal supplies from defender
  let suppliesStolen = 0
  if (defenderEntry && defenderEntry.warSupplies > 0) {
    const stealResult = calculateSupplySteal(defenderEntry.warSupplies, destroyed)
    if (stealResult.success && stealResult.amount > 0) {
      const transferResult = await guildwarRepo.transferWarSupplies(
        mission.targetGuildId!,
        guild._id,
        stealResult.amount
      )
      if (transferResult.success) {
        suppliesStolen = stealResult.amount
      }
    }
  }
  
  let message = `Dealt ${damage} damage to stronghold (+${valor} valor)`
  if (suppliesStolen > 0) {
    message += ` | Stole ${suppliesStolen} supplies!`
  }
  if (counterDamage > 0) {
    message += ` | Counter-attack: ${counterDamage} damage to your stronghold!`
  }
  if (destroyed) {
    message = `Destroyed the stronghold! +${valor} valor!`
    if (suppliesStolen > 0) {
      message += ` | Stole ${suppliesStolen} supplies!`
    }
    if (counterDamage > 0) {
      message += ` | Counter-attack: ${counterDamage} damage!`
    }
  }
  
  // Update attacker guild war stats with valor
  await guildwarRepo.updateGuildWarStats(
    guild._id,
    playerId,
    player.username,
    damage,
    valor,
    false,
    destroyed,
    guild.name,
    guild.level
  )
  
  // Mark mission complete and clear player's active mission
  await missionRepo.complete(missionId)
  await playerRepo.clearActiveMission(playerId)
  
  // Get target guild name for notification
  const targetGuild = await guildRepo.findById(mission.targetGuildId!)
  const targetGuildName = targetGuild?.name || 'Unknown Guild'
  
  // Send Discord notification (async, non-blocking)
  import('@/lib/config/discord').then(({ notifyGuildWarEvent, notifyTavernEvent }) => {
    if (destroyed) {
      notifyGuildWarEvent({
        eventType: 'stronghold_destroyed',
        guildName: guild.name,
        playerName: player.username,
        defenderGuild: targetGuildName,
        damage,
        destructionBonus: Math.floor(valor - (damage / 1000)),
        suppliesStolen: suppliesStolen > 0 ? suppliesStolen : undefined,
      }).catch(() => {})
      // Also notify tavern channel for highlight events
      notifyTavernEvent({
        eventType: 'stronghold_destroyed',
        playerName: player.username,
        guildName: guild.name,
        defenderGuild: targetGuildName,
      }).catch(() => {})
    } else {
      notifyGuildWarEvent({
        eventType: 'stronghold_attacked',
        guildName: guild.name,
        playerName: player.username,
        defenderGuild: targetGuildName,
        damage,
        damageAbsorbed: damage,
        strongholdHp: remainingHp,
        strongholdMaxHp: stronghold.maxHp,
        valorGained: valor,
        defenderValor: defenderValor,
        suppliesStolen: suppliesStolen > 0 ? suppliesStolen : undefined,
      }).catch(() => {})
    }
  }).catch(() => {})
  
  return {
    success: true,
    damage,
    valor,
    strongholdDestroyed: destroyed,
    remainingHp,
    suppliesStolen: suppliesStolen > 0 ? suppliesStolen : undefined,
    counterDamage: counterDamage > 0 ? counterDamage : undefined,
    message,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions - Supply Spending
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Spend war supplies on an action
 */
export async function spendWarSupplies(
  guildId: Types.ObjectId,
  playerId: Types.ObjectId,
  action: SupplyActionType,
  targetOutpostId?: string
): Promise<SupplySpendResult> {
  // Validate inputs at runtime
  if (!guildId) {
    throw new Error('guildId is required')
  }
  if (!playerId) {
    throw new Error('playerId is required')
  }
  
  const entry = await guildwarRepo.findEntryByGuild(guildId)
  if (!entry) throw new Error('Guild not participating in war')
  
  const cost = WAR_ECONOMY_CONFIG.SUPPLY_COSTS[action]
  if (!cost) throw new Error('Invalid action type')
  
  if (entry.warSupplies < cost) {
    return {
      success: false,
      suppliesRemaining: entry.warSupplies,
      message: `Not enough supplies. Need ${cost}, have ${entry.warSupplies}`,
    }
  }
  
  // Handle repair actions - do validation BEFORE spending supplies
  if (action === 'repairGarrison') {
    const stronghold = await guildwarRepo.findStrongholdByGuild(guildId)
    if (!stronghold) {
      return {
        success: false,
        suppliesRemaining: entry.warSupplies,
        message: 'Stronghold not found',
      }
    }
    if (stronghold.isDestroyed) {
      return {
        success: false,
        suppliesRemaining: entry.warSupplies,
        message: 'Cannot repair a destroyed stronghold',
      }
    }
    if (stronghold.currentHp >= stronghold.maxHp) {
      return {
        success: false,
        suppliesRemaining: entry.warSupplies,
        message: 'Stronghold is already at full HP',
      }
    }
  }
  
  if (action === 'repairOutpost') {
    if (!targetOutpostId) {
      return {
        success: false,
        suppliesRemaining: entry.warSupplies,
        message: 'Target outpost ID is required',
      }
    }
    const outpost = await guildwarRepo.findOutpostById(targetOutpostId)
    if (!outpost) {
      return {
        success: false,
        suppliesRemaining: entry.warSupplies,
        message: 'Outpost not found',
      }
    }
    // Check if outpost is controlled by the guild - safely handle comparison
    const isControlledByGuild = outpost.controlledBy && guildId && outpost.controlledBy.equals(guildId)
    if (!isControlledByGuild) {
      return {
        success: false,
        suppliesRemaining: entry.warSupplies,
        message: 'Outpost not controlled by your guild',
      }
    }
    if (outpost.garrison >= outpost.maxGarrison) {
      return {
        success: false,
        suppliesRemaining: entry.warSupplies,
        message: 'Outpost is already at full HP',
      }
    }
  }

  // Spend supplies
  const result = await guildwarRepo.spendWarSupplies(guildId, cost)
  if (!result) {
    return {
      success: false,
      suppliesRemaining: entry.warSupplies,
      message: 'Failed to spend supplies',
    }
  }
  
  // Calculate supplies remaining - safely handle the case where entries may not be accessible
  const suppliesRemaining = entry.warSupplies - cost
  
  // Handle buff actions
  if (['warCry', 'reinforce', 'rally', 'shieldWall'].includes(action)) {
    const buffType = action as IWarBuff['type']
    const duration = WAR_ECONOMY_CONFIG.BUFF_DURATIONS[action]
    
    const buff: IWarBuff = {
      type: buffType,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + duration),
      activatedBy: playerId,
    }
    
    await guildwarRepo.addActiveBuff(guildId, buff)
    
    return {
      success: true,
      suppliesRemaining,
      message: `${action} activated! Effect lasts ${duration / (60 * 60 * 1000)} hour(s)`,
      buff,
    }
  }
  
  // Handle repair actions (validation was done above, so we just execute)
  if (action === 'repairGarrison') {
    const stronghold = await guildwarRepo.findStrongholdByGuild(guildId)
    if (stronghold) {
      const repairAmount = Math.floor(stronghold.maxHp * 0.10) // 10% of max HP
      const newHp = Math.min(stronghold.maxHp, stronghold.currentHp + repairAmount)
      // Update stronghold HP
      const guildWar = await guildwarRepo.findActive()
      if (guildWar) {
        const sh = guildWar.strongholds.find(s => s.guildId && guildId && s.guildId.equals(guildId))
        if (sh) {
          sh.currentHp = newHp
          await guildWar.save()
        }
      }
      await guildwarRepo.incrementRepairsCompleted(guildId)
      return {
        success: true,
        suppliesRemaining,
        message: `Repaired garrison for ${repairAmount} HP`,
      }
    }
  }
  
  if (action === 'repairOutpost' && targetOutpostId) {
    const outpost = await guildwarRepo.findOutpostById(targetOutpostId)
    if (outpost) {
      const repairAmount = Math.floor(outpost.maxGarrison * 0.10) // 10% of max
      const newGarrison = Math.min(outpost.maxGarrison, outpost.garrison + repairAmount)
      await guildwarRepo.updateOutpostGarrison(targetOutpostId, newGarrison)
      await guildwarRepo.incrementRepairsCompleted(guildId)
      return {
        success: true,
        suppliesRemaining,
        message: `Repaired ${outpost.name} for ${repairAmount} HP`,
      }
    }
  }
  
  return {
    success: true,
    suppliesRemaining,
    message: `${action} completed`,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Revival - Revive Destroyed Stronghold
// ═══════════════════════════════════════════════════════════════════════════════

const STRONGHOLD_REVIVAL_COST = 2500 // Main token cost to revive

export interface StrongholdRevivalResult {
  success: boolean
  message: string
  newHp?: number
  maxHp?: number
  coinsRemaining?: number
}

/**
 * Revive a destroyed stronghold
 * Costs 2500 Realm Coins from the leader's personal wallet
 * Stronghold revives at 50% HP
 */
export async function reviveStronghold(
  playerId: Types.ObjectId,
  guildId: Types.ObjectId
): Promise<StrongholdRevivalResult> {
  // Check if stronghold is destroyed
  const stronghold = await guildwarRepo.findStrongholdByGuild(guildId)
  if (!stronghold) {
    return {
      success: false,
      message: 'Stronghold not found',
    }
  }

  if (!stronghold.isDestroyed) {
    return {
      success: false,
      message: 'Stronghold is not destroyed - nothing to revive',
    }
  }

  // Check player has enough Realm Coins
  const player = await playerRepo.findById(playerId)
  if (!player) {
    return {
      success: false,
      message: 'Player not found',
    }
  }

  const playerCoins = player.coins ?? 0
  if (playerCoins < STRONGHOLD_REVIVAL_COST) {
    return {
      success: false,
      message: `Not enough Realm Coins. Revival costs ${STRONGHOLD_REVIVAL_COST.toLocaleString()} ${TOKEN_MAIN}, you have ${playerCoins.toLocaleString()}`,
    }
  }

  // Deduct coins from player
  player.coins = playerCoins - STRONGHOLD_REVIVAL_COST
  await player.save()

  // Revive the stronghold
  const { revived, guildWar } = await guildwarRepo.reviveStronghold(guildId)
  
  if (!revived || !guildWar) {
    // Refund if revival failed
    player.coins = playerCoins
    await player.save()
    return {
      success: false,
      message: 'Failed to revive stronghold',
    }
  }

  // Get the updated stronghold
  const revivedStronghold = guildWar.strongholds.find(
    (s) => s.guildId?.toString() === guildId.toString()
  )

  return {
    success: true,
    message: `Stronghold revived! HP restored to 50% (${revivedStronghold?.currentHp?.toLocaleString() ?? '?'} HP)`,
    newHp: revivedStronghold?.currentHp ?? 0,
    maxHp: revivedStronghold?.maxHp ?? 0,
    coinsRemaining: player.coins,
  }
}

/**
 * Generate hourly supplies for all guilds holding outposts
 * Called by cron job every hour
 */
export async function generateHourlySupplies(): Promise<{
  guildsAwarded: number
  totalSupplies: number
}> {
  const guildWar = await guildwarRepo.findActive()
  if (!guildWar) return { guildsAwarded: 0, totalSupplies: 0 }
  
  const suppliesByGuild = new Map<string, number>()
  
  // Calculate supplies for each guild based on outposts held
  for (const outpost of guildWar.outposts) {
    if (outpost.controlledBy) {
      const guildIdStr = outpost.controlledBy.toString()
      const rate = getSupplyRate(outpost.outpostId)
      suppliesByGuild.set(guildIdStr, (suppliesByGuild.get(guildIdStr) || 0) + rate)
    }
  }
  
  let totalSupplies = 0
  
  // Award supplies to each guild
  for (const [guildIdStr, supplies] of suppliesByGuild) {
    const guildId = guildWar.entries.find(e => e.guildId?.toString() === guildIdStr)?.guildId
    if (guildId) {
      await guildwarRepo.addWarSupplies(guildId, supplies)
      totalSupplies += supplies
    }
  }
  
  console.log(`[idleraiders-logs] Hourly supplies: ${totalSupplies} to ${suppliesByGuild.size} guilds`)
  return { guildsAwarded: suppliesByGuild.size, totalSupplies }
}

// ════════════════���══════════════════════════════════════════════════════════════
// Core Functions - Finalization
// ════════════════════════��════════════════════��═════════════════════════════════

/**
 * Get computed guild war data for finalization
 */
export async function getComputedGuildWarData(
  weekNumber: number
): Promise<IGuildWarData> {
  const guildWar = await guildwarRepo.findActiveByWeek(weekNumber)
  if (!guildWar) {
    return { pool: 0, reward: 0, ranks: {} }
  }
  
  // Sort entries by valor
  const sortedEntries = [...guildWar.entries]
    .sort((a, b) => b.valor - a.valor)
  
  // Calculate total valor
  const totalValor = sortedEntries.reduce((sum, entry) => sum + entry.valor, 0)
  
  // Calculate rewards
  const ranks: Record<string, IGuildWarRank> = {}
  let totalReward = 0
  
  sortedEntries.forEach((entry, idx) => {
    const rank = idx + 1
    let reward = calculateGuildWarReward(entry.valor, totalValor, WAR_REWARD_POOL)
    
    // Apply rank bonus for top 3
    reward = Math.floor(reward * getRankBonusMultiplier(rank))
    totalReward += reward
    
    ranks[rank.toString()] = {
      guildId: entry.guildId?.toString() ?? '',
      guildName: entry.guildName,
      valor: entry.valor,
      damageReceived: entry.damageReceived,
      totalDamageDealt: entry.totalDamageDealt,
      outpostsCaptured: entry.outpostsCaptured,
      strongholdsDestroyed: entry.strongholdsDestroyed,
      reward,
    }
  })
  
  return {
    pool: WAR_REWARD_POOL,
    reward: totalReward,
    ranks,
  }
}

/**
 * Distribute guild war rewards to guilds
 */
export async function distributeWarRewards(
  computedData: IGuildWarData,
  entries: IGuildWarEntry[]
): Promise<WarRewardDistributionResult> {
  const distributions: GuildWarReward[] = []
  let totalPointsDistributed = 0
  
  for (const [rankStr, rankData] of Object.entries(computedData.ranks)) {
    const rank = parseInt(rankStr)
    
    if (rankData.reward > 0) {
      // Award points to guild
      const guildId = entries.find((e) => e.guildName === rankData.guildName)?.guildId
      if (guildId) {
        await guildRepo.incrementPoints(guildId, rankData.reward)
        totalPointsDistributed += rankData.reward
        
        distributions.push({
          guildId,
          guildName: rankData.guildName,
          rank,
          valor: rankData.valor,
          reward: rankData.reward,
        })
      }
    }
  }
  
  return {
    count: distributions.length,
    totalPointsDistributed,
    distributions,
  }
}

/**
 * Finalize the guild war
 * - Calculate all pending outpost points
 * - Compute final rankings
 * - Distribute rewards
 * - Set status to 'finalized'
 */
export async function finalizeGuildWar(
  weekNumber: number
): Promise<{
  weekNumber: number
  rewardsDistributed: WarRewardDistributionResult
}> {
  console.log(`[idleraiders-logs] Finalizing guild war for week ${weekNumber}...`)
  
  // Check if already finalized
  const alreadyFinalized = await guildwarRepo.existsForWeek(weekNumber)
  if (alreadyFinalized) {
    throw new Error(`Guild war for week ${weekNumber} already finalized`)
  }
  
  // Get active guild war
  const activeGuildWar = await guildwarRepo.findActiveByWeek(weekNumber)
  if (!activeGuildWar) {
    // No war activity this week - create empty finalized record
    const { weekStart, weekEnd } = getCurrentWeek()
    await guildwarRepo.getOrCreateActive(weekNumber, weekStart, weekEnd)
    
    return {
      weekNumber,
      rewardsDistributed: { count: 0, totalPointsDistributed: 0, distributions: [] },
    }
  }
  
  // Valor is already calculated during attacks - no need for batch calculation
  // Get computed data with all valor calculated
  const computedData = await getComputedGuildWarData(weekNumber)
  
  // Distribute rewards
  const distributionResult = await distributeWarRewards(computedData, activeGuildWar.entries)
  
  // Finalize the guild war
  await guildwarRepo.finalizeGuildWar(weekNumber, computedData, {
    rewardsDistributed: true,
    rewardsDistributedAt: new Date(),
    rewardsSummary: {
      guildCount: distributionResult.count,
      totalPointsDistributed: distributionResult.totalPointsDistributed,
    },
  })
  
  console.log(`[idleraiders-logs] Guild war for week ${weekNumber} finalized`)
  console.log(`  - Guilds: ${distributionResult.count} rewarded`)
  console.log(`  - Total points: ${distributionResult.totalPointsDistributed}`)
  
  return {
    weekNumber,
    rewardsDistributed: distributionResult,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions - Historical Data
// ════════════════════════════════════════════════════��═══════════════════��══════

/**
 * Get finalized guild war by week number
 */
export async function getGuildWarByWeek(
  weekNumber: number
): Promise<IGuildWarDocument | null> {
  return guildwarRepo.findByWeek(weekNumber)
}

/**
 * Get list of finalized guild wars
 */
export async function getFinalizedGuildWars(
  limit: number = 10
): Promise<IGuildWarDocument[]> {
  return guildwarRepo.findFinalizedGuildWars(limit)
}
