/**
 * Guild War Worker
 * Cron-based worker for guild war economy tasks
 *
 * Handles:
 * - Hourly supply generation for guilds holding outposts
 * - Expired buff cleanup
 */

import cron from 'node-cron'
import { getRedisConnection } from '../../lib/config/redis'
import * as guildwarService from '../../lib/modules/guildwars/guildwar.service'
import * as guildwarRepo from '../../lib/modules/guildwars/guildwar.repository'

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const REDIS_LOCK_KEY = 'idleraiders:guildwar_supply_lock'
const LOCK_TTL = 60 // 1 minute max processing time

// ═══════════════════════════════════════════════════════════════════════════════
// Worker Instance
// ═══════════════════════════════════════════════════════════════════════════════

let supplyGenerationCron: ReturnType<typeof cron.schedule> | null = null
let buffCleanupCron: ReturnType<typeof cron.schedule> | null = null

/**
 * Acquire a distributed lock to prevent duplicate processing
 */
async function acquireLock(lockType: string): Promise<boolean> {
  const redis = getRedisConnection()
  const lockKey = `${REDIS_LOCK_KEY}:${lockType}`
  const result = await redis.set(lockKey, Date.now().toString(), 'EX', LOCK_TTL, 'NX')
  return result === 'OK'
}

/**
 * Release the distributed lock
 */
async function releaseLock(lockType: string): Promise<void> {
  const redis = getRedisConnection()
  const lockKey = `${REDIS_LOCK_KEY}:${lockType}`
  await redis.del(lockKey)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Supply Generation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate hourly supplies for all guilds holding outposts
 * Only the guild holding an outpost at the time of the tick receives supplies
 */
async function processHourlySupplyGeneration(): Promise<void> {
  console.log('[idleraiders-logs] Processing hourly supply generation...')

  // Acquire distributed lock
  const lockAcquired = await acquireLock('supply-generation')
  if (!lockAcquired) {
    console.log('[idleraiders-logs] Could not acquire supply generation lock, another worker is processing')
    return
  }

  try {
    // Check if there's an active guild war
    const activeWar = await guildwarRepo.findActive()
    if (!activeWar) {
      console.log('[idleraiders-logs] No active guild war, skipping supply generation')
      return
    }

    // Generate supplies
    const result = await guildwarService.generateHourlySupplies()

    console.log(`[idleraiders-logs] Supply generation complete: ${result.totalSupplies} supplies to ${result.guildsAwarded} guilds`)
  } catch (error) {
    console.error('[idleraiders-logs] Error in supply generation:', error)
  } finally {
    await releaseLock('supply-generation')
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Buff Cleanup
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Remove expired buffs from all guild entries
 */
async function processBuffCleanup(): Promise<void> {
  console.log('[idleraiders-logs] Processing buff cleanup...')

  // Acquire distributed lock
  const lockAcquired = await acquireLock('buff-cleanup')
  if (!lockAcquired) {
    console.log('[idleraiders-logs] Could not acquire buff cleanup lock, another worker is processing')
    return
  }

  try {
    // Check if there's an active guild war
    const activeWar = await guildwarRepo.findActive()
    if (!activeWar) {
      console.log('[idleraiders-logs] No active guild war, skipping buff cleanup')
      return
    }

    // Remove expired buffs
    await guildwarRepo.removeExpiredBuffs()

    console.log('[idleraiders-logs] Buff cleanup complete')
  } catch (error) {
    console.error('[idleraiders-logs] Error in buff cleanup:', error)
  } finally {
    await releaseLock('buff-cleanup')
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Worker Initialization
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize the guild war worker with cron jobs
 */
export function initializeGuildWarWorker(): void {
  console.log('[idleraiders-logs] Starting guild war worker...')

  // Hourly supply generation - runs at the start of every hour
  // "0 * * * *" = minute 0 of every hour
  supplyGenerationCron = cron.schedule('0 * * * *', async () => {
    await processHourlySupplyGeneration()
  })

  // Buff cleanup - runs every 5 minutes to clean up expired buffs
  // "*/5 * * * *" = every 5 minutes
  buffCleanupCron = cron.schedule('*/5 * * * *', async () => {
    await processBuffCleanup()
  })

  console.log('[idleraiders-logs] Guild war worker started (supply generation: hourly, buff cleanup: every 5 min)')
}

/**
 * Stop the guild war worker
 */
export function stopGuildWarWorker(): void {
  if (supplyGenerationCron) {
    supplyGenerationCron.stop()
    supplyGenerationCron = null
  }

  if (buffCleanupCron) {
    buffCleanupCron.stop()
    buffCleanupCron = null
  }

  console.log('[idleraiders-logs] Stopped guild war worker')
}

/**
 * Manually trigger supply generation (for testing or admin action)
 */
export async function triggerSupplyGenerationManually(): Promise<{
  success: boolean
  guildsAwarded: number
  totalSupplies: number
}> {
  console.log('[idleraiders-logs] Manual trigger - generating supplies')

  try {
    const result = await guildwarService.generateHourlySupplies()
    return {
      success: true,
      guildsAwarded: result.guildsAwarded,
      totalSupplies: result.totalSupplies,
    }
  } catch (error) {
    console.error('[idleraiders-logs] Error in manual supply generation:', error)
    return {
      success: false,
      guildsAwarded: 0,
      totalSupplies: 0,
    }
  }
}

/**
 * Get guild war worker status
 */
export function getGuildWarWorkerStatus(): {
  isRunning: boolean
  supplyGenerationActive: boolean
  buffCleanupActive: boolean
} {
  return {
    isRunning: supplyGenerationCron !== null || buffCleanupCron !== null,
    supplyGenerationActive: supplyGenerationCron !== null,
    buffCleanupActive: buffCleanupCron !== null,
  }
}
