import type { Types } from 'mongoose'
import type { ILeaderboardDocument, ILeaderboardEntry, ILeaderboardData } from './leaderboard.model'
import * as leaderboardRepo from './leaderboard.repository'
import * as playerRepo from '../players/player.repository'
import * as guildRepo from '../guilds/guild.repository'
import * as cardRepo from '../cards/card.repository'
import * as guildwarRepo from '../guildwars/guildwar.repository'
import { generateCardStats } from '@/public/data/cards/cardConfig'
import { getCurrentWeek } from './leaderboard.logic'
import { LEADERBOARD } from '@/public/data/economy/economy'

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const TOP_PLAYERS_LIMIT = 100
const DEFAULT_EXPECTED_DAMAGE = 1_000_000
const DEFAULT_PREMIUM_POOL = 1_000
const DEFAULT_GUILD_POINTS_POOL = 10_000
const DEFAULT_EXPECTED_GUILD_WAR_POINTS = 100_000 // Guild pool scales based on total guild war points

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeaderboardEntryWithRank extends ILeaderboardEntry {
  rank: number
  updatedAt?: Date
}

interface ComputedLeaderboardData {
  weekNumber: number
  startDate: string
  endDate: string
  global: {
    pool: number
    reward: number
    ranks: Record<
      number,
      {
        playerId: string
        username: string
        damage: number
        score: number
        gm: number
        reward: number
      }
    >
  }
  guild: {
    pool: number
    reward: number
    totalPoints?: number
    totalDamage?: number
    ranks: Record<
      number,
      {
        guildId: Types.ObjectId
        guildName: string
        damage: number
        points: number
        outpostsCaptured?: number
        strongholdsDestroyed?: number
        reward: number
      }
    >
  }
}

export interface PlayerReward {
  playerId: string
  username: string
  rank: number
  damage: number
  gm: number
  points: number
  shards: number
}

export interface GuildReward {
  guildId: Types.ObjectId
  guildName: string
  rank: number
  damage: number
  totalShards: number
  memberShards: number
}

export interface RewardDistributionResult {
  playerRewards: {
    count: number
    totalShards: number
    distributions: PlayerReward[]
  }
  guildRewards: {
    count: number
    totalShards: number
    distributions: GuildReward[]
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Dynamic Expected Damage System
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute expectedDamage for a new week from a previous week's raid power snapshot.
 *
 * Each boss attack deals ~1.0× raidPower damage on average (range 0.8x–1.2x),
 * so a player making N attacks per week deals ~N × theirRaidPower in damage.
 * Aggregated across the playerbase:
 *   expectedDamage = totalRaidPower × EXPECTED_ATTACKS_PER_WEEK
 *
 * Floored at MIN_EXPECTED_DAMAGE so a tiny playerbase still has a meaningful target.
 */
function computeExpectedDamageFromRP(prevTotalRaidPower: number): number {
  const calculated = prevTotalRaidPower * LEADERBOARD.EXPECTED_ATTACKS_PER_WEEK
  return Math.max(LEADERBOARD.MIN_EXPECTED_DAMAGE, calculated)
}

/**
 * Snapshot the live total raid power across all players (DB aggregation).
 * Only call at week-creation (bootstrap) and finalization (end-of-week snapshot).
 */
async function snapshotTotalRaidPower(): Promise<number> {
  try {
    return await cardRepo.getTotalRaidPowerAggregation()
  } catch (error) {
    console.error('[idleraiders-logs] Error snapshotting raid power:', error)
    return 0
  }
}

/**
 * Ensure an active leaderboard exists for the current week with metadata populated.
 * - Reads previous finalized week's totalRaidPower snapshot
 * - Computes this week's expectedDamage from it
 * - For the very first week (no prior snapshot), takes a live RP snapshot to seed
 * - Returns the active leaderboard document
 *
 * This is idempotent — safe to call on every read/write.
 */
export async function ensureActiveLeaderboard(): Promise<ILeaderboardDocument> {
  const { weekNumber, weekStart, weekEnd } = getCurrentWeek()

  // Fast path: already exists
  let active = await leaderboardRepo.findActiveByWeek(weekNumber)
  if (active) {
    // Backfill expectedDamage if missing (e.g., docs created before this feature)
    if (active.metadata?.expectedDamage === undefined) {
      const prev = await leaderboardRepo.findMostRecentFinalizedBefore(weekNumber)
      const prevRP = prev?.metadata?.totalRaidPower
      const expectedDamage =
        prevRP !== undefined
          ? computeExpectedDamageFromRP(prevRP)
          : computeExpectedDamageFromRP(await snapshotTotalRaidPower())
      await leaderboardRepo.setExpectedDamage(weekNumber, expectedDamage)
      active.metadata = { ...(active.metadata || { totalDataCount: 0 }), expectedDamage }
      console.log(`[idleraiders-logs] Backfilled expectedDamage=${expectedDamage} for week ${weekNumber}`)
    }
    return active
  }

  // Need to create — derive expectedDamage from previous week's snapshot
  const prev = await leaderboardRepo.findMostRecentFinalizedBefore(weekNumber)
  const prevRP = prev?.metadata?.totalRaidPower
  let expectedDamage: number
  if (prevRP !== undefined) {
    expectedDamage = computeExpectedDamageFromRP(prevRP)
    console.log(
      `[idleraiders-logs] Week ${weekNumber} expectedDamage=${expectedDamage} from prev week ${prev?.weekNumber} RP=${prevRP}`
    )
  } else {
    // No prior finalized week (first ever) — take a live snapshot to seed
    const liveRP = await snapshotTotalRaidPower()
    expectedDamage = computeExpectedDamageFromRP(liveRP)
    console.log(
      `[idleraiders-logs] Week ${weekNumber} bootstrap expectedDamage=${expectedDamage} from live RP=${liveRP}`
    )
  }

  return leaderboardRepo.getOrCreateActive(weekNumber, weekStart, weekEnd, expectedDamage)
}

/**
 * Read the expectedDamage and totalRaidPower for the current active week.
 * Used by the API to display dynamic targets without recalculating.
 */
export async function getActiveDamageMetadata(): Promise<{
  expectedDamage: number
  totalRaidPower: number
}> {
  const active = await ensureActiveLeaderboard()
  // For the active leaderboard: expectedDamage is set at creation, totalRaidPower
  // is captured at finalization (so it's the PREVIOUS week's snapshot for display purposes)
  const prev = await leaderboardRepo.findMostRecentFinalizedBefore(active.weekNumber)
  return {
    expectedDamage: active.metadata?.expectedDamage ?? LEADERBOARD.MIN_EXPECTED_DAMAGE,
    totalRaidPower: prev?.metadata?.totalRaidPower ?? 0,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GM Calculation Helper
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate total GM for a player based on their cards
 * GM values by rarity: common=0, uncommon=0, rare=1, epic=3, legendary=6, special=2
 */
async function calculatePlayerGM(playerId: string | Types.ObjectId): Promise<number> {
  try {
    const cards = await cardRepo.findByOwner(playerId)
    let totalGM = 0

    for (const card of cards) {
      const stats = generateCardStats(card.type, card.rarity, card.class)
      totalGM += stats.gm * (card.quantity ?? 1)
    }

    return totalGM
  } catch (error) {
    console.error('[idleraiders-logs] Error calculating player GM:', error)
    return 0
  }
}

/**
 * Calculate leaderboard points based on damage and GM
 * Formula: Points = Damage × (1 + GM_Bonus)
 * GM_Bonus = min(GM / 500, 0.20) - Max 20% bonus at 500 GM
 */
function calculatePoints(damage: number, gm: number): number {
  const gmBonus = Math.min(gm / 500, 0.2) // Max 20% bonus at 500 GM
  return Math.floor(damage * (1 + gmBonus))
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions - Recording Damage
// ═══════════════════════════════════════════════════════════════════════════════

export async function recordDamageForWeek(
  playerId: string | Types.ObjectId,
  damage: number,
  _bossId?: string
): Promise<ILeaderboardDocument> {
  try {
    const player = await playerRepo.findById(playerId)
    if (!player) throw new Error(`Player ${playerId} not found`)

    // Ensure active leaderboard exists with expectedDamage metadata populated
    // (idempotent — also creates the doc on first damage of the week)
    await ensureActiveLeaderboard()

    // Get current week info
    const { weekNumber, weekStart, weekEnd } = getCurrentWeek()

    // Calculate player's current GM from their cards
    const gm = await calculatePlayerGM(playerId)

    // Get current entry to calculate new total damage for points
    const currentEntry = await leaderboardRepo.findEntryByPlayer(playerId)
    const newTotalDamage = (currentEntry?.totalDamage || 0) + damage

    // Calculate points based on new total damage and current GM
    const points = calculatePoints(newTotalDamage, gm)

    // Get player's guild info if they have one
    let guildId: Types.ObjectId | undefined
    let guildName: string | undefined

    if (player.guildId) {
      const guild = await guildRepo.findById(player.guildId.toString())
      if (guild) {
        guildId = guild._id
        guildName = guild.name
      }
    }

    return await leaderboardRepo.upsertPlayerDamage(
      weekNumber,
      weekStart,
      weekEnd,
      playerId,
      player.username,
      damage,
      gm,
      points,
      guildId,
      guildName
    )
  } catch (error) {
    console.error('[idleraiders-logs] Error recording damage for week:', error)
    throw error
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions - Querying Leaderboard
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCurrentWeekLeaderboard(): Promise<LeaderboardEntryWithRank[]> {
  try {
    const entries = await leaderboardRepo.findAllEntriesSortedByPoints(TOP_PLAYERS_LIMIT)

    return entries.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }))
  } catch (error) {
    console.error('[idleraiders-logs] Error getting current week leaderboard:', error)
    throw error
  }
}

export async function getGuildLeaderboard(guildId: string): Promise<LeaderboardEntryWithRank[]> {
  try {
    const guild = await guildRepo.findById(guildId)
    if (!guild) throw new Error('Guild not found')

    const guildMemberIds = guild.members.map((m) => m.playerId)
    const entries = await leaderboardRepo.findEntriesByPlayers(guildMemberIds)

    return entries.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }))
  } catch (error) {
    console.error('[idleraiders-logs] Error getting guild leaderboard:', error)
    throw error
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions - Computing Rewards
// ═══════════════════════════════════════════════════════════════════════════════

export async function getComputedLeaderboardData(
  EXPECTED_DAMAGE = DEFAULT_EXPECTED_DAMAGE,
  PREMIUM_POOL = DEFAULT_PREMIUM_POOL,
  GUILD_POINTS_POOL = DEFAULT_GUILD_POINTS_POOL,
  EXPECTED_GUILD_WAR_POINTS = DEFAULT_EXPECTED_GUILD_WAR_POINTS
): Promise<ComputedLeaderboardData> {
  try {
    const { weekNumber, weekStart, weekEnd } = getCurrentWeek()

    // Get entries sorted by points
    const leaderboardEntries = await leaderboardRepo.findAllEntriesSortedByPoints(TOP_PLAYERS_LIMIT)

    const globalTotalDamage = leaderboardEntries.reduce((sum, entry) => sum + (entry.totalDamage || 0), 0)
    const globalPool = Math.min(PREMIUM_POOL, Math.floor((globalTotalDamage / EXPECTED_DAMAGE) * PREMIUM_POOL))

    const globalTotalPoints = leaderboardEntries.reduce((sum, entry) => sum + (entry.points || 0), 0)

    const globalRanks: Record<number, any> = {}
    leaderboardEntries.forEach((entry, idx) => {
      const rank = idx + 1
      const playerId = entry.player.toString()
      const gm = entry.gm || 0
      const points = entry.points || 0
      const playerReward = globalTotalPoints > 0 ? Math.floor((points / globalTotalPoints) * globalPool) : 0

      globalRanks[rank] = {
        playerId,
        username: entry.username,
        damage: entry.totalDamage,
        gm,
        points,
        score: points,
        reward: playerReward,
      }
    })

    // Calculate guild rankings from Guild War data directly (no GM bonus)
    // This uses the guildwars collection entries which track war-specific valor
    const guildWarEntries = await guildwarRepo.findAllEntriesSortedByValor(500)
    
    // Calculate total guild war valor for pool scaling
    const guildTotalValor = guildWarEntries.reduce((sum, entry) => sum + (entry.valor || 0), 0)
    const guildTotalDamage = guildWarEntries.reduce((sum, entry) => sum + (entry.totalDamageDealt || 0), 0)
    
    // Guild pool scales based on total guild war valor vs target (1M valor = full pool)
    const guildPool = Math.min(
      GUILD_POINTS_POOL,
      Math.floor((guildTotalValor / EXPECTED_GUILD_WAR_POINTS) * GUILD_POINTS_POOL)
    )

    const guildRanks: Record<number, any> = {}
    guildWarEntries.forEach((entry, idx) => {
      const rank = idx + 1
      const valor = entry.valor || 0
      // Reward is proportional to valor (not damage, no GM)
      const guildReward = guildTotalValor > 0 ? Math.floor((valor / guildTotalValor) * guildPool) : 0
      
      guildRanks[rank] = {
        guildId: entry.guildId,
        guildName: entry.guildName,
        damage: entry.totalDamageDealt || 0,
        points: valor, // Keep as "points" for API compatibility
        outpostsCaptured: entry.outpostsCaptured || 0,
        strongholdsDestroyed: entry.strongholdsDestroyed || 0,
        reward: guildReward,
      }
    })

    return {
      weekNumber,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      global: {
        pool: globalPool,
        reward: globalPool,
        ranks: globalRanks,
      },
      guild: {
        pool: guildPool,
        reward: guildPool,
        ranks: guildRanks,
        totalPoints: guildTotalValor, // Renamed internally but keep API field name
        totalDamage: guildTotalDamage,
      },
    }
  } catch (error) {
    console.error('[idleraiders-logs] Error computing leaderboard data:', error)
    throw error
  }
}

/**
 * Get computed leaderboard data for a specific week (used during finalization)
 * This queries the active leaderboard for that specific week number
 */
export async function getComputedLeaderboardDataForWeek(
  targetWeekNumber: number,
  EXPECTED_DAMAGE = DEFAULT_EXPECTED_DAMAGE,
  PREMIUM_POOL = DEFAULT_PREMIUM_POOL,
  GUILD_POINTS_POOL = DEFAULT_GUILD_POINTS_POOL
): Promise<ComputedLeaderboardData> {
  try {
    // Get the active leaderboard for this specific week
    const activeLeaderboard = await leaderboardRepo.findActiveByWeek(targetWeekNumber)
    if (!activeLeaderboard) {
      throw new Error(`No active leaderboard found for week ${targetWeekNumber}`)
    }

    const leaderboardEntries = [...activeLeaderboard.entries]
      .sort((a, b) => b.points - a.points || b.totalDamage - a.totalDamage)
      .slice(0, TOP_PLAYERS_LIMIT)

    const globalTotalDamage = leaderboardEntries.reduce((sum, entry) => sum + (entry.totalDamage || 0), 0)
    const globalPool = Math.min(PREMIUM_POOL, Math.floor((globalTotalDamage / EXPECTED_DAMAGE) * PREMIUM_POOL))

    const globalTotalPoints = leaderboardEntries.reduce((sum, entry) => sum + (entry.points || 0), 0)

    const globalRanks: Record<number, any> = {}
    leaderboardEntries.forEach((entry, idx) => {
      const rank = idx + 1
      const playerId = entry.player.toString()
      const gm = entry.gm || 0
      const points = entry.points || 0
      const playerReward = globalTotalPoints > 0 ? Math.floor((points / globalTotalPoints) * globalPool) : 0

      globalRanks[rank] = {
        playerId,
        username: entry.username,
        damage: entry.totalDamage,
        gm,
        points,
        score: points,
        reward: playerReward,
      }
    })

    // Calculate guild rankings
    const guilds = await guildRepo.findForStats()
    const guildDamageMap: Record<string, any> = {}

    for (const guild of guilds) {
      const guildMemberIds = new Set(guild.members.map((m) => m.playerId.toString()))
      const guildMemberDamage = leaderboardEntries
        .filter((entry) => guildMemberIds.has(entry.player.toString()))
        .reduce((sum, entry) => sum + (entry.totalDamage || 0), 0)

      if (guildMemberDamage > 0) {
        guildDamageMap[guild._id.toString()] = {
          guildId: guild._id,
          guildName: guild.name,
          damage: guildMemberDamage,
        }
      }
    }

    const sortedGuilds = Object.values(guildDamageMap)
      .sort((a, b) => b.damage - a.damage)
      .slice(0, 500)

    const guildTotalDamage = sortedGuilds.reduce((sum, g) => sum + g.damage, 0)
    const guildPool = Math.min(
      GUILD_POINTS_POOL,
      Math.floor((guildTotalDamage / EXPECTED_DAMAGE) * GUILD_POINTS_POOL)
    )

    const guildRanks: Record<number, any> = {}
    sortedGuilds.forEach((guild, idx) => {
      const rank = idx + 1
      const guildReward = guildTotalDamage > 0 ? Math.floor((guild.damage / guildTotalDamage) * guildPool) : 0
      guildRanks[rank] = {
        guildId: guild.guildId,
        guildName: guild.guildName,
        damage: guild.damage,
        reward: guildReward,
      }
    })

    return {
      weekNumber: targetWeekNumber,
      startDate: activeLeaderboard.weekStart.toISOString(),
      endDate: activeLeaderboard.weekEnd.toISOString(),
      global: {
        pool: globalPool,
        reward: globalPool,
        ranks: globalRanks,
      },
      guild: {
        pool: guildPool,
        reward: guildPool,
        ranks: guildRanks,
      },
    }
  } catch (error) {
    console.error('[idleraiders-logs] Error computing leaderboard data for week:', error)
    throw error
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions - Reward Distribution
// ═══════════════════���════════════════════════���══════════════════════════════════

/**
 * Distribute weekly leaderboard rewards to players (shards) and guilds (points)
 */
export async function distributeLeaderboardRewards(
  computedData: ComputedLeaderboardData,
  leaderboardEntries: ILeaderboardEntry[]
): Promise<RewardDistributionResult> {
  const playerRewards: PlayerReward[] = []
  const guildRewards: GuildReward[] = []
  const playerShardUpdates: Array<{ playerId: string | Types.ObjectId; amount: number }> = []

  // 1. Calculate and collect player rewards from global leaderboard
  console.log('[idleraiders-logs] Calculating player rewards from global leaderboard...')

  leaderboardEntries.forEach((entry, idx) => {
    const rank = idx + 1
    const rankData = computedData.global.ranks[rank]

    if (rankData && rankData.reward > 0) {
      const reward: PlayerReward = {
        playerId: entry.player.toString(),
        username: entry.username,
        rank,
        damage: entry.totalDamage,
        gm: entry.gm || 0,
        points: entry.points || entry.totalDamage,
        shards: rankData.reward,
      }
      playerRewards.push(reward)
      playerShardUpdates.push({
        playerId: entry.player,
        amount: rankData.reward,
      })
    }
  })

  // 2. Distribute player shards in bulk
  if (playerShardUpdates.length > 0) {
    console.log(`[idleraiders-logs] Distributing shards to ${playerShardUpdates.length} players...`)
    const result = await playerRepo.bulkIncrementShards(playerShardUpdates)
    console.log(`[idleraiders-logs] Player shards distributed: ${result.modifiedCount} players updated`)
  }

  // 3. Calculate and distribute guild rewards (as guild points, not player shards)
  console.log('[idleraiders-logs] Calculating guild rewards...')

  const guildRanks = Object.entries(computedData.guild.ranks)
  for (const [rankStr, guildData] of guildRanks) {
    const rank = parseInt(rankStr)

    if (guildData.reward > 0) {
      const guild = await guildRepo.findById(guildData.guildId.toString())

      if (guild) {
        await guildRepo.incrementPoints(guildData.guildId, guildData.reward)

        const guildReward: GuildReward = {
          guildId: guildData.guildId,
          guildName: guildData.guildName,
          rank,
          damage: guildData.damage,
          totalShards: guildData.reward,
          memberShards: 0,
        }
        guildRewards.push(guildReward)

        console.log(`[idleraiders-logs] Guild ${guildData.guildName}: ${guildData.reward} points added to guild`)
      }
    }
  }

  const totalPlayerShards = playerRewards.reduce((sum, r) => sum + r.shards, 0)
  const totalGuildShards = guildRewards.reduce((sum, r) => sum + r.totalShards, 0)

  console.log(`[idleraiders-logs] Reward distribution complete:`)
  console.log(`  - Players: ${playerRewards.length} rewarded, ${totalPlayerShards} total shards`)
  console.log(`  - Guilds: ${guildRewards.length} rewarded, ${totalGuildShards} total points`)

  return {
    playerRewards: {
      count: playerRewards.length,
      totalShards: totalPlayerShards,
      distributions: playerRewards,
    },
    guildRewards: {
      count: guildRewards.length,
      totalShards: totalGuildShards,
      distributions: guildRewards,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions - Finalization
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Finalize a week's leaderboard
 * - Computes final rankings and rewards
 * - Distributes rewards
 * - Sets status to 'finalized'
 * 
 * @param weekNumberToFinalize - The week number to finalize. If not provided, finalizes the active leaderboard.
 * @param isManual - Whether this was triggered manually (vs cron)
 */
export async function finalizeWeeklyLeaderboard(
  weekNumberToFinalize?: number,
  isManual: boolean = false
): Promise<{
  weekNumber: number
  rewardsDistributed: RewardDistributionResult
}> {
  // If no week specified, find the active leaderboard
  let weekNumber: number
  let activeLeaderboard: ILeaderboardDocument | null

  if (weekNumberToFinalize !== undefined) {
    weekNumber = weekNumberToFinalize
    activeLeaderboard = await leaderboardRepo.findActiveByWeek(weekNumber)
  } else {
    activeLeaderboard = await leaderboardRepo.findActive()
    if (!activeLeaderboard) {
      throw new Error('No active leaderboard found to finalize')
    }
    weekNumber = activeLeaderboard.weekNumber
  }

  console.log(`[idleraiders-logs] Finalizing leaderboard for week ${weekNumber}...`)

  // Check if already finalized
  const alreadyFinalized = await leaderboardRepo.existsForWeek(weekNumber)
  if (alreadyFinalized) {
    throw new Error(`Leaderboard for week ${weekNumber} already finalized`)
  }

  // Check if there's an active leaderboard for this week
  if (!activeLeaderboard) {
    throw new Error(`No active leaderboard found for week ${weekNumber}`)
  }

  // Check if rewards already distributed
  const alreadyDistributed = await leaderboardRepo.rewardsDistributedForWeek(weekNumber)
  if (alreadyDistributed) {
    throw new Error(`Rewards already distributed for week ${weekNumber}`)
  }

  // Use the expectedDamage that was stored when the week was created.
  // Fallback: if missing (legacy data), derive it from a live raid power snapshot.
  let weekExpectedDamage = activeLeaderboard.metadata?.expectedDamage
  if (weekExpectedDamage === undefined) {
    const liveRP = await snapshotTotalRaidPower()
    weekExpectedDamage = computeExpectedDamageFromRP(liveRP)
    console.log(
      `[idleraiders-logs] Week ${weekNumber} had no stored expectedDamage; using fallback ${weekExpectedDamage}`
    )
  }

  // End-of-week snapshot: capture current total raid power.
  // This snapshot drives the NEXT week's expectedDamage.
  const totalRaidPowerSnapshot = await snapshotTotalRaidPower()
  console.log(
    `[idleraiders-logs] Finalizing week ${weekNumber}: expectedDamage=${weekExpectedDamage}, RP snapshot=${totalRaidPowerSnapshot}`
  )

  // Get computed data for this specific week's active leaderboard
  const computedData = await getComputedLeaderboardDataForWeek(weekNumber, weekExpectedDamage)

  // Get entries for distribution from the active leaderboard
  const entries = [...activeLeaderboard.entries]
    .sort((a, b) => b.points - a.points || b.totalDamage - a.totalDamage)
    .slice(0, TOP_PLAYERS_LIMIT)

  // Distribute rewards
  const distributionResult = await distributeLeaderboardRewards(computedData, entries)

  // Convert computed data to leaderboard data format
  const leaderboardData: ILeaderboardData = {
    global: {
      pool: computedData.global.pool,
      reward: computedData.global.reward,
      ranks: computedData.global.ranks,
    },
    guild: {
      pool: computedData.guild.pool,
      reward: computedData.guild.reward,
      ranks: computedData.guild.ranks,
    },
  }

  // Finalize the leaderboard
  await leaderboardRepo.finalizeLeaderboard(weekNumber, leaderboardData, {
    rewardsDistributed: true,
    rewardsDistributedAt: new Date(),
    rewardsSummary: {
      playerCount: distributionResult.playerRewards.count,
      playerShards: distributionResult.playerRewards.totalShards,
      guildCount: distributionResult.guildRewards.count,
      guildShards: distributionResult.guildRewards.totalShards,
    },
    isManualSnapshot: isManual,
    expectedDamage: weekExpectedDamage,
    totalRaidPower: totalRaidPowerSnapshot,
  })

  console.log(`[idleraiders-logs] Leaderboard for week ${weekNumber} finalized`)

  return {
    weekNumber,
    rewardsDistributed: distributionResult,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Historical Data Functions
// ══════════════════════════��════════════════════════════════════════════════════

/**
 * Get leaderboard by week, finalized or active.
 * Prefers a finalized snapshot; falls back to a live-computed snapshot when
 * the requested week matches the currently-active week.
 */
export async function getLeaderboardByWeek(
  weekNumber: number
): Promise<ILeaderboardDocument | SyntheticActiveSnapshot | null> {
  const finalized = await leaderboardRepo.findByWeek(weekNumber)
  if (finalized) return finalized

  // Only synthesize for the in-progress week; older non-finalized weeks are treated as missing.
  const { weekNumber: currentWeek } = getCurrentWeek()
  if (weekNumber !== currentWeek) return null

  try {
    const computed = await getComputedLeaderboardData()
    return {
      weekNumber: computed.weekNumber,
      weekStart: new Date(computed.startDate),
      weekEnd: new Date(computed.endDate),
      status: 'active',
      data: { global: computed.global, guild: computed.guild },
      entries: [],
      metadata: { isActive: true },
      createdAt: new Date(),
    }
  } catch (err) {
    console.error('[idleraiders-logs] Failed to synthesize active snapshot for week', weekNumber, err)
    return null
  }
}

/**
 * Get list of available historical leaderboards (most recent first).
 *
 * When `includeActive` is true, the currently-active (in-progress) week is
 * prepended as a synthetic snapshot whose `data` is live-computed so that
 * guild + global ranks match what the main Leaderboard page shows.
 */
export async function getLeaderboardHistory(
  limit: number = 10,
  includeActive: boolean = false
): Promise<Array<ILeaderboardDocument | SyntheticActiveSnapshot>> {
  const finalized = await leaderboardRepo.findFinalizedLeaderboards(limit)

  if (!includeActive) return finalized

  try {
    const computed = await getComputedLeaderboardData()
    const alreadyListed = finalized.some((lb) => lb.weekNumber === computed.weekNumber)
    if (alreadyListed) return finalized

    const synthetic: SyntheticActiveSnapshot = {
      weekNumber: computed.weekNumber,
      weekStart: new Date(computed.startDate),
      weekEnd: new Date(computed.endDate),
      status: 'active',
      data: {
        global: computed.global,
        guild: computed.guild,
      },
      entries: [],
      metadata: { isActive: true },
      createdAt: new Date(),
    }

    // If `limit` is tight, trim finalized so the synthetic one can fit at index 0.
    const trimmed = finalized.length >= limit ? finalized.slice(0, Math.max(0, limit - 1)) : finalized
    return [synthetic, ...trimmed]
  } catch (err) {
    console.error('[idleraiders-logs] Failed to synthesize active leaderboard snapshot:', err)
    return finalized
  }
}

/**
 * Shape returned for the in-progress week in history listings. Intentionally
 * loose so it coexists with ILeaderboardDocument in the response array without
 * callers having to depend on Mongoose document internals.
 */
export interface SyntheticActiveSnapshot {
  weekNumber: number
  weekStart: Date
  weekEnd: Date
  status: 'active'
  data: {
    global: { pool: number; reward: number; ranks: Record<string, unknown> }
    guild: { pool: number; reward: number; ranks: Record<string, unknown> }
  }
  entries: []
  metadata: { isActive: true }
  createdAt: Date
}

/**
 * Check if rewards were distributed for a week
 */
export async function rewardsDistributedForWeek(weekNumber: number): Promise<boolean> {
  return leaderboardRepo.rewardsDistributedForWeek(weekNumber)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Admin Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Clear active leaderboard (used after finalization if needed)
 * Note: With new schema, finalization keeps data. This deletes active for fresh start.
 */
export async function clearActiveLeaderboard(): Promise<{ deletedCount?: number }> {
  try {
    const result = await leaderboardRepo.deleteActive()
    console.log(`[idleraiders-logs] Cleared active leaderboard: ${result.deletedCount} entries removed`)
    return result
  } catch (error) {
    console.error('[idleraiders-logs] Error clearing active leaderboard:', error)
    throw error
  }
}
