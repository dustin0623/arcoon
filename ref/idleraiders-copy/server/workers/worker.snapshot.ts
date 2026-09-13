/**
 * Weekly Snapshot Worker
 * BullMQ-based worker for reliable weekly leaderboard finalization
 *
 * Orchestrates:
 * - Leaderboard finalization (computing final ranks)
 * - Reward distribution (shards to players, points to guilds)
 * - Starting fresh for new week
 */

import { Worker, type Job } from 'bullmq'
import cron from 'node-cron'
import { getRedisConnection } from '../../lib/config/redis'
import { getCurrentWeek } from '../../lib/modules/leaderboards/leaderboard.logic'
import {
  finalizeWeeklyLeaderboard,
  rewardsDistributedForWeek,
  clearActiveLeaderboard,
} from '../../lib/modules/leaderboards/leaderboard.service'
import * as leaderboardRepo from '../../lib/modules/leaderboards/leaderboard.repository'
import * as guildwarService from '../../lib/modules/guildwars/guildwar.service'
import * as guildwarRepo from '../../lib/modules/guildwars/guildwar.repository'
import {
  getSnapshotQueue,
  scheduleWeeklySnapshot,
  type SnapshotJobData,
  type SnapshotJobResult,
} from '../../lib/queues/snapshot.queue'

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const QUEUE_NAME = 'snapshot-queue'
const REDIS_LOCK_KEY = 'idleraiders:snapshot_worker_lock'
const LOCK_TTL = 300 // 5 minutes max processing time

// ═══════════════════════════════════════════════════════════════════════════════
// Worker Instance
// ═══════════════════════════════════════════════════════════════════════════════

let snapshotWorker: Worker<SnapshotJobData, SnapshotJobResult> | null = null
let cronTask: ReturnType<typeof cron.schedule> | null = null

/**
 * Acquire a distributed lock to prevent duplicate processing
 */
async function acquireLock(weekNumber: number): Promise<boolean> {
  const redis = getRedisConnection()
  const lockKey = `${REDIS_LOCK_KEY}:week-${weekNumber}`
  const result = await redis.set(lockKey, Date.now().toString(), 'EX', LOCK_TTL, 'NX')
  return result === 'OK'
}

/**
 * Release the distributed lock
 */
async function releaseLock(weekNumber: number): Promise<void> {
  const redis = getRedisConnection()
  const lockKey = `${REDIS_LOCK_KEY}:week-${weekNumber}`
  await redis.del(lockKey)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Job Processor
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Process weekly snapshot job
 * Finalizes the leaderboard and distributes rewards
 */
async function processSnapshotJob(job: Job<SnapshotJobData>): Promise<SnapshotJobResult> {
  const { weekNumber, triggeredBy } = job.data

  console.log(`[idleraiders-logs] Processing weekly snapshot for week ${weekNumber} (triggered by: ${triggeredBy})`)

  // Acquire distributed lock
  const lockAcquired = await acquireLock(weekNumber)
  if (!lockAcquired) {
    console.log(`[idleraiders-logs] Could not acquire lock for week ${weekNumber}, another worker is processing`)
    throw new Error(`Lock not acquired for week ${weekNumber}`)
  }

  try {
    // Check if already processed (idempotency)
    const alreadyDistributed = await rewardsDistributedForWeek(weekNumber)
    if (alreadyDistributed) {
      console.log(`[idleraiders-logs] Rewards already distributed for week ${weekNumber}, skipping`)
      return {
        success: true,
        weekNumber,
        leaderboardSnapshotsCreated: 0,
        guildSnapshotsCreated: 0,
        rewardsDistributed: {
          playerCount: 0,
          totalShards: 0,
          guildCount: 0,
          totalGuildShards: 0,
        },
        warSeasonFinalized: false,
        warRewardsDistributed: {
          guildCount: 0,
          totalPointsDistributed: 0,
        },
      }
    }

    // Check if leaderboard exists for this week
    const activeLeaderboard = await leaderboardRepo.findActive()
    const activeGuildWar = await guildwarRepo.findActiveByWeek(weekNumber)

    if (!activeLeaderboard && !activeGuildWar) {
      console.log(`[idleraiders-logs] No active leaderboard or guild war found for week ${weekNumber}`)
      return {
        success: true,
        weekNumber,
        leaderboardSnapshotsCreated: 0,
        guildSnapshotsCreated: 0,
        rewardsDistributed: {
          playerCount: 0,
          totalShards: 0,
          guildCount: 0,
          totalGuildShards: 0,
        },
        warSeasonFinalized: false,
        warRewardsDistributed: {
          guildCount: 0,
          totalPointsDistributed: 0,
        },
      }
    }

    const isManual = triggeredBy === 'manual'
    let leaderboardResult = {
      playerRewards: { count: 0, totalShards: 0 },
      guildRewards: { count: 0, totalShards: 0 },
    }
    let warSeasonResult = {
      count: 0,
      totalPointsDistributed: 0,
    }

    // 1. Finalize leaderboard and distribute rewards (if exists)
    if (activeLeaderboard) {
      console.log(`[idleraiders-logs] Step 1: Finalizing leaderboard and distributing rewards...`)
      const { rewardsDistributed } = await finalizeWeeklyLeaderboard(weekNumber, isManual)
      leaderboardResult = rewardsDistributed
    }

    // 2. Finalize guild war and distribute rewards (if exists)
    if (activeGuildWar) {
      console.log(`[idleraiders-logs] Step 2: Finalizing guild war and distributing war rewards...`)
      try {
        const { rewardsDistributed } = await guildwarService.finalizeGuildWar(weekNumber)
        warSeasonResult = rewardsDistributed
      } catch (error) {
        console.error(`[idleraiders-logs] Error finalizing guild war:`, error)
        // Continue - leaderboard was already finalized
      }
    }

    console.log(`[idleraiders-logs] Week ${weekNumber} snapshot processing complete`)

    return {
      success: true,
      weekNumber,
      leaderboardSnapshotsCreated: activeLeaderboard ? 1 : 0,
      guildSnapshotsCreated: 0,
      rewardsDistributed: {
        playerCount: leaderboardResult.playerRewards.count,
        totalShards: leaderboardResult.playerRewards.totalShards,
        guildCount: leaderboardResult.guildRewards.count,
        totalGuildShards: leaderboardResult.guildRewards.totalShards,
      },
      warSeasonFinalized: !!activeGuildWar,
      warRewardsDistributed: warSeasonResult,
    }
  } catch (error) {
    console.error(`[idleraiders-logs] Error processing snapshot for week ${weekNumber}:`, error)
    throw error
  } finally {
    // Always release lock
    await releaseLock(weekNumber)
  }
}

// ══════════════════════════════════════════���════════════════════════════════════
// Worker Initialization
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize the BullMQ snapshot worker
 */
export function initializeSnapshotWorker(): void {
  console.log('[idleraiders-logs] Starting weekly snapshot worker (BullMQ)...')

  // Initialize the queue (ensures it exists)
  getSnapshotQueue()

  // Create worker
  snapshotWorker = new Worker<SnapshotJobData, SnapshotJobResult>(QUEUE_NAME, processSnapshotJob, {
    connection: getRedisConnection(),
    concurrency: 1, // Process one snapshot at a time
  })

  snapshotWorker.on('completed', (job, result) => {
    console.log(`[idleraiders-logs] Snapshot job completed for week ${result.weekNumber}:`, {
      leaderboardFinalized: result.leaderboardSnapshotsCreated,
      playerRewards: result.rewardsDistributed.playerCount,
      totalShards: result.rewardsDistributed.totalShards,
      guildRewards: result.rewardsDistributed.guildCount,
      totalGuildPoints: result.rewardsDistributed.totalGuildShards,
    })
  })

  snapshotWorker.on('failed', (job, err) => {
    console.error(`[idleraiders-logs] Snapshot job failed for week ${job?.data.weekNumber}:`, err.message)
  })

  // Schedule cron to trigger weekly snapshots
  // Runs every Sunday 16:00 UTC (= Monday 00:00 UTC+8)
  cronTask = cron.schedule('1 16 * * 0', async () => {
    console.log('[idleraiders-logs] Cron triggered - scheduling weekly snapshot job')
    const { weekNumber } = getCurrentWeek()
    const previousWeekNumber = weekNumber - 1
    
    // 1. Finalize previous week
    await scheduleWeeklySnapshot(previousWeekNumber, 'cron')
    
    // 2. Start new week's guild war (creates the war season with outposts)
    try {
      console.log(`[idleraiders-logs] Starting new guild war for week ${weekNumber}...`)
      await guildwarService.getOrCreateCurrentGuildWar()
      console.log(`[idleraiders-logs] Guild war for week ${weekNumber} created successfully`)
    } catch (error) {
      console.error(`[idleraiders-logs] Error creating guild war for week ${weekNumber}:`, error)
    }
  })

  console.log('[idleraiders-logs] Weekly snapshot worker started (BullMQ + cron scheduler)')
}

/**
 * Stop the snapshot worker and cron
 */
export async function stopSnapshotWorker(): Promise<void> {
  if (cronTask) {
    cronTask.stop()
    cronTask = null
  }

  if (snapshotWorker) {
    await snapshotWorker.close()
    snapshotWorker = null
  }

  console.log('[idleraiders-logs] Stopped snapshot worker')
}

/**
 * Manually trigger snapshot creation (for testing or admin action)
 */
export async function triggerSnapshotCreationManually(): Promise<void> {
  console.log('[idleraiders-logs] Manual trigger - scheduling snapshot job')
  const { weekNumber } = getCurrentWeek()
  // For manual trigger, we finalize the CURRENT week (not previous)
  await scheduleWeeklySnapshot(weekNumber, 'manual')
}

/**
 * Manually start a guild war for the current week (for testing or admin action)
 * This creates the guild war season with 5 outposts ready for guilds to join
 */
export async function startGuildWarManually(): Promise<{
  success: boolean
  weekNumber: number
  message: string
}> {
  const { weekNumber, weekStart, weekEnd } = getCurrentWeek()
  
  console.log(`[idleraiders-logs] Manual trigger - starting guild war for week ${weekNumber}`)
  
  try {
    // Check if war already exists
    const existingWar = await guildwarRepo.findActiveByWeek(weekNumber)
    if (existingWar) {
      return {
        success: true,
        weekNumber,
        message: `Guild war for week ${weekNumber} already exists`,
      }
    }
    
    // Create new guild war
    const guildWar = await guildwarService.getOrCreateCurrentGuildWar()
    
    console.log(`[idleraiders-logs] Guild war for week ${weekNumber} created successfully`)
    
    return {
      success: true,
      weekNumber,
      message: `Guild war for week ${weekNumber} created with ${guildWar.outposts.length} outposts`,
    }
  } catch (error) {
    console.error(`[idleraiders-logs] Error creating guild war:`, error)
    return {
      success: false,
      weekNumber,
      message: (error as Error).message,
    }
  }
}

/**
 * Get current snapshot worker status
 */
export async function getSnapshotWorkerStatus(): Promise<{
  isRunning: boolean
  currentWeek: number
  lastSnapshotWeek: number | null
}> {
  const { weekNumber } = getCurrentWeek()

  // Check for most recent completed snapshot
  const queue = getSnapshotQueue()
  const completedJobs = await queue.getCompleted(0, 1)
  const lastSnapshotWeek = completedJobs[0]?.returnvalue?.weekNumber ?? null

  return {
    isRunning: snapshotWorker !== null,
    currentWeek: weekNumber,
    lastSnapshotWeek,
  }
}
