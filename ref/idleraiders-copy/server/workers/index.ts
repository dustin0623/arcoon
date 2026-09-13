/**
 * Workers Index
 * Initialize all background workers
 */

import { initializeTransactionWorker, closeTransactionWorker } from './transaction.worker'
import { initializePriceWorker, stopPriceWorker } from './worker.price'
import { initializeSnapshotWorker, stopSnapshotWorker } from './worker.snapshot'
import { initializeGuildWarWorker, stopGuildWarWorker } from './worker.guildwar'
import { getIO } from '../sockets/socket.manager'
import { recoverPendingTransactions } from '../../lib/modules/transactions/transaction.service'

/**
 * Start all workers
 */
export async function startWorkers(): Promise<void> {
  console.log('[idleraiders-logs] Starting workers...')

  // Initialize BullMQ transaction worker (uses getIO() internally for notifications)
  const io = getIO()
  if (io) {
    initializeTransactionWorker(io)
    
    // Recover any pending transactions from database and re-queue them
    await recoverPendingTransactions()
  } else {
    console.warn('[idleraiders-logs] Socket.IO not initialized, transaction worker skipped')
  }

  // Initialize price worker (cron-based)
  initializePriceWorker()

  // Initialize snapshot worker (cron-based)
  initializeSnapshotWorker()

  // Initialize guild war worker (cron-based - hourly supply generation)
  initializeGuildWarWorker()

  // Note: Reputation worker removed - now uses on-demand Redis-based updates
  // when users visit the guild browser (hourly check via checkAndUpdateReputationsIfNeeded)

  console.log('[idleraiders-logs] All workers initialized')
}

/**
 * Stop all workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  console.log('[idleraiders-logs] Stopping workers...')

  await closeTransactionWorker()
  stopPriceWorker()
  stopSnapshotWorker()
  stopGuildWarWorker()

  console.log('[idleraiders-logs] All workers stopped')
}

export default { startWorkers, stopWorkers }
