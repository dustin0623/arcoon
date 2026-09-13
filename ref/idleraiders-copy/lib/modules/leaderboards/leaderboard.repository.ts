import type { Types } from 'mongoose'
import Leaderboard, {
  type ILeaderboardDocument,
  type ILeaderboardEntry,
  type ILeaderboardData,
  type ILeaderboardMetadata,
} from './leaderboard.model'
import { connectDB } from '@/lib/config/database'

// ═══════════════════════════════════════════════════════════════════════════════
// Query Functions - Active Leaderboard
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Find the currently active leaderboard
 */
export async function findActive(): Promise<ILeaderboardDocument | null> {
  await connectDB()
  return Leaderboard.findOne({ status: 'active' })
}

/**
 * Find active leaderboard by week number
 */
export async function findActiveByWeek(weekNumber: number): Promise<ILeaderboardDocument | null> {
  await connectDB()
  return Leaderboard.findOne({ weekNumber, status: 'active' })
}

/**
 * Get all entries from active leaderboard sorted by points
 */
export async function findAllEntriesSortedByPoints(limit: number = 100): Promise<ILeaderboardEntry[]> {
  await connectDB()
  const leaderboard = await Leaderboard.findOne({ status: 'active' })
  if (!leaderboard) return []

  return [...leaderboard.entries]
    .sort((a, b) => b.points - a.points || b.totalDamage - a.totalDamage)
    .slice(0, limit)
}

/**
 * Get all entries from active leaderboard sorted by damage
 */
export async function findAllEntriesSortedByDamage(limit: number = 100): Promise<ILeaderboardEntry[]> {
  await connectDB()
  const leaderboard = await Leaderboard.findOne({ status: 'active' })
  if (!leaderboard) return []

  return [...leaderboard.entries]
    .sort((a, b) => b.totalDamage - a.totalDamage)
    .slice(0, limit)
}

/**
 * Find entry for a specific player in active leaderboard
 */
export async function findEntryByPlayer(
  playerId: string | Types.ObjectId
): Promise<ILeaderboardEntry | null> {
  await connectDB()
  const leaderboard = await Leaderboard.findOne({ status: 'active' })
  if (!leaderboard) return null

  return (
    leaderboard.entries.find((e) => e.player.toString() === playerId.toString()) || null
  )
}

/**
 * Find entries for multiple players in active leaderboard
 */
export async function findEntriesByPlayers(
  playerIds: Types.ObjectId[]
): Promise<ILeaderboardEntry[]> {
  await connectDB()
  const leaderboard = await Leaderboard.findOne({ status: 'active' })
  if (!leaderboard) return []

  const playerIdStrings = playerIds.map((id) => id.toString())
  return leaderboard.entries
    .filter((e) => playerIdStrings.includes(e.player.toString()))
    .sort((a, b) => b.totalDamage - a.totalDamage)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Query Functions - Historical Leaderboards
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Find finalized leaderboard by week number
 */
export async function findByWeek(weekNumber: number): Promise<ILeaderboardDocument | null> {
  await connectDB()
  return Leaderboard.findOne({ weekNumber, status: 'finalized' })
}

/**
 * Get list of finalized leaderboards (most recent first)
 */
export async function findFinalizedLeaderboards(
  limit: number = 10
): Promise<ILeaderboardDocument[]> {
  await connectDB()
  return Leaderboard.find({ status: 'finalized' })
    .sort({ weekNumber: -1 })
    .limit(limit)
}

/**
 * Check if a finalized leaderboard exists for a week
 */
export async function existsForWeek(weekNumber: number): Promise<boolean> {
  await connectDB()
  const count = await Leaderboard.countDocuments({ weekNumber, status: 'finalized' })
  return count > 0
}

/**
 * Check if rewards were distributed for a week
 */
export async function rewardsDistributedForWeek(weekNumber: number): Promise<boolean> {
  await connectDB()
  const leaderboard = await Leaderboard.findOne({
    weekNumber,
    'metadata.rewardsDistributed': true,
  })
  return !!leaderboard
}

// ═══════════════════════════════════════════════════════════════════════════════
// Create / Update Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create or get active leaderboard for a week
 * If creating, computes expectedDamage from the previous week's totalRaidPower snapshot.
 */
export async function getOrCreateActive(
  weekNumber: number,
  weekStart: Date,
  weekEnd: Date,
  expectedDamage?: number
): Promise<ILeaderboardDocument> {
  await connectDB()

  let leaderboard = await Leaderboard.findOne({ weekNumber, status: 'active' })

  if (!leaderboard) {
    leaderboard = await Leaderboard.create({
      weekNumber,
      weekStart,
      weekEnd,
      status: 'active',
      data: { global: { pool: 0, reward: 0, ranks: {} }, guild: { pool: 0, reward: 0, ranks: {} } },
      entries: [],
      metadata: {
        totalDataCount: 0,
        expectedDamage: expectedDamage ?? undefined,
      },
    })
  }

  return leaderboard
}

/**
 * Get the most recent finalized leaderboard before the given week.
 * Used to read the previous week's totalRaidPower snapshot.
 */
export async function findMostRecentFinalizedBefore(
  weekNumber: number
): Promise<ILeaderboardDocument | null> {
  await connectDB()
  return Leaderboard.findOne({
    status: 'finalized',
    weekNumber: { $lt: weekNumber },
  })
    .sort({ weekNumber: -1 })
    .limit(1)
}

/**
 * Snapshot the total raid power onto the active leaderboard (called at finalization).
 */
export async function setRaidPowerSnapshot(
  weekNumber: number,
  totalRaidPower: number
): Promise<void> {
  await connectDB()
  await Leaderboard.updateOne(
    { weekNumber, status: 'active' },
    { $set: { 'metadata.totalRaidPower': totalRaidPower } }
  )
}

/**
 * Set the expectedDamage on the active leaderboard.
 */
export async function setExpectedDamage(
  weekNumber: number,
  expectedDamage: number
): Promise<void> {
  await connectDB()
  await Leaderboard.updateOne(
    { weekNumber, status: 'active' },
    { $set: { 'metadata.expectedDamage': expectedDamage } }
  )
}

/**
 * Upsert player damage in active leaderboard
 * Creates leaderboard if not exists, adds or updates player entry
 */
export async function upsertPlayerDamage(
  weekNumber: number,
  weekStart: Date,
  weekEnd: Date,
  playerId: string | Types.ObjectId,
  username: string,
  damage: number,
  gm: number,
  points: number,
  guildId?: Types.ObjectId,
  guildName?: string
): Promise<ILeaderboardDocument> {
  await connectDB()

  // Try to update existing entry
  const updateResult = await Leaderboard.findOneAndUpdate(
    {
      weekNumber,
      status: 'active',
      'entries.player': playerId,
    },
    {
      $inc: { 'entries.$.totalDamage': damage },
      $set: {
        'entries.$.username': username,
        'entries.$.gm': gm,
        'entries.$.points': points,
        'entries.$.guildId': guildId,
        'entries.$.guildName': guildName,
      },
    },
    { returnDocument: 'after' }
  )

  if (updateResult) {
    // Recalculate total count
    await Leaderboard.updateOne(
      { _id: updateResult._id },
      { $set: { 'metadata.totalDataCount': updateResult.entries.length } }
    )
    return updateResult
  }

  // Entry doesn't exist, add new entry or create leaderboard
  const newEntry: ILeaderboardEntry = {
    player: playerId as Types.ObjectId,
    username,
    totalDamage: damage,
    gm,
    points,
    guildId,
    guildName,
  }

  const upsertResult = await Leaderboard.findOneAndUpdate(
    { weekNumber, status: 'active' },
    {
      $push: { entries: newEntry },
      $setOnInsert: {
        weekStart,
        weekEnd,
        data: { global: { pool: 0, reward: 0, ranks: {} }, guild: { pool: 0, reward: 0, ranks: {} } },
      },
    },
    { upsert: true, returnDocument: 'after' }
  )

  // Recalculate total count
  if (upsertResult) {
    await Leaderboard.updateOne(
      { _id: upsertResult._id },
      { $set: { 'metadata.totalDataCount': upsertResult.entries.length } }
    )
  }

  return upsertResult!
}

/**
 * Finalize leaderboard - set status and computed data
 */
export async function finalizeLeaderboard(
  weekNumber: number,
  data: ILeaderboardData,
  metadata: Partial<ILeaderboardMetadata>
): Promise<ILeaderboardDocument | null> {
  await connectDB()

  const updateSet: Record<string, unknown> = {
    status: 'finalized',
    data,
    'metadata.calculatedAt': new Date(),
    'metadata.rewardsDistributed': metadata.rewardsDistributed,
    'metadata.rewardsDistributedAt': metadata.rewardsDistributedAt,
    'metadata.rewardsSummary': metadata.rewardsSummary,
    'metadata.isManualSnapshot': metadata.isManualSnapshot,
    'metadata.notes': metadata.notes,
  }

  // Preserve dynamic damage metadata if provided
  if (metadata.expectedDamage !== undefined) {
    updateSet['metadata.expectedDamage'] = metadata.expectedDamage
  }
  if (metadata.totalRaidPower !== undefined) {
    updateSet['metadata.totalRaidPower'] = metadata.totalRaidPower
  }

  return Leaderboard.findOneAndUpdate(
    { weekNumber, status: 'active' },
    { $set: updateSet },
    { returnDocument: 'after' }
  )
}

/**
 * Mark rewards as distributed for a week
 */
export async function markRewardsDistributed(
  weekNumber: number,
  rewardsSummary: {
    playerCount: number
    playerShards: number
    guildCount: number
    guildShards: number
  }
): Promise<void> {
  await connectDB()

  await Leaderboard.updateOne(
    { weekNumber },
    {
      $set: {
        'metadata.rewardsDistributed': true,
        'metadata.rewardsDistributedAt': new Date(),
        'metadata.rewardsSummary': rewardsSummary,
      },
    }
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Delete Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Delete active leaderboard (used after finalization to start fresh)
 * Note: With new schema, we finalize instead of delete. This is kept for compatibility.
 */
export async function deleteActive(): Promise<{ deletedCount?: number }> {
  await connectDB()
  return Leaderboard.deleteMany({ status: 'active' })
}

/**
 * Delete old finalized leaderboards (cleanup)
 */
export async function deleteOldLeaderboards(
  beforeWeekNumber: number
): Promise<{ deletedCount?: number }> {
  await connectDB()
  return Leaderboard.deleteMany({
    status: 'finalized',
    weekNumber: { $lt: beforeWeekNumber },
  })
}
