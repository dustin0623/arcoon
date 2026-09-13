/**
 * Snapshot Queue
 * BullMQ-based queue for reliable weekly snapshot processing
 */

import { Queue, Worker, type Job } from 'bullmq'
import { getRedisConnection } from '../config/redis'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface SnapshotJobData {
  type: 'weekly_snapshot'
  weekNumber: number
  triggeredBy: 'cron' | 'manual'
  triggeredAt: string
}

export interface SnapshotJobResult {
  success: boolean
  weekNumber: number
  leaderboardSnapshotsCreated: number
  guildSnapshotsCreated: number
  rewardsDistributed: {
    playerCount: number
    totalShards: number
    guildCount: number
    totalGuildShards: number
  }
  // War season results (V2)
  warSeasonFinalized?: boolean
  warRewardsDistributed?: {
    guildCount: number
    totalPointsDistributed: number
  }
  error?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// Queue Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const QUEUE_NAME = 'snapshot-queue'

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 60000, // 1 minute initial delay, exponential backoff
  },
  removeOnComplete: { count: 50 },
  removeOnFail: { count: 100 },
}

// ═══════════════════════════════════════════════════════════════════════════════
// Queue Instance
// ═══════════════════════════════════════════════════════════════════════════════

let snapshotQueue: Queue<SnapshotJobData, SnapshotJobResult> | null = null

export function getSnapshotQueue(): Queue<SnapshotJobData, SnapshotJobResult> {
  if (!snapshotQueue) {
    snapshotQueue = new Queue<SnapshotJobData, SnapshotJobResult>(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions,
    })
  }
  return snapshotQueue
}

// ═══════════════════════════════════════════════════════════════════════════════
// Job Scheduling
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Schedule a weekly snapshot job
 * Uses job ID to ensure idempotency (same week = same job ID)
 */
export async function scheduleWeeklySnapshot(
  weekNumber: number,
  triggeredBy: 'cron' | 'manual' = 'cron'
): Promise<Job<SnapshotJobData, SnapshotJobResult>> {
  const queue = getSnapshotQueue()
  const jobId = `weekly-snapshot-week-${weekNumber}`

  // Check if job already exists/completed for this week
  const existingJob = await queue.getJob(jobId)
  if (existingJob) {
    const state = await existingJob.getState()
    if (state === 'completed') {
      console.log(`[idleraiders-logs] Snapshot for week ${weekNumber} already completed, skipping`)
      return existingJob
    }
    if (state === 'active' || state === 'waiting' || state === 'delayed') {
      console.log(`[idleraiders-logs] Snapshot for week ${weekNumber} already in progress (${state})`)
      return existingJob
    }
    // If failed, remove and retry
    await existingJob.remove()
  }

  const job = await queue.add(
    'weekly_snapshot',
    {
      type: 'weekly_snapshot',
      weekNumber,
      triggeredBy,
      triggeredAt: new Date().toISOString(),
    },
    { jobId }
  )

  console.log(`[idleraiders-logs] Scheduled weekly snapshot job for week ${weekNumber}`)
  return job
}

/**
 * Get the status of a snapshot job
 */
export async function getSnapshotJobStatus(weekNumber: number): Promise<{
  exists: boolean
  state?: string
  result?: SnapshotJobResult
}> {
  const queue = getSnapshotQueue()
  const jobId = `weekly-snapshot-week-${weekNumber}`
  const job = await queue.getJob(jobId)

  if (!job) {
    return { exists: false }
  }

  const state = await job.getState()
  return {
    exists: true,
    state,
    result: job.returnvalue ?? undefined,
  }
}

/**
 * Close the snapshot queue gracefully
 */
export async function closeSnapshotQueue(): Promise<void> {
  if (snapshotQueue) {
    await snapshotQueue.close()
    snapshotQueue = null
    console.log('[idleraiders-logs] Snapshot queue closed')
  }
}
