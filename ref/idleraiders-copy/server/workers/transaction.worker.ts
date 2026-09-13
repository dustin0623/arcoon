/**
 * Transaction Worker
 * BullMQ worker for processing transaction jobs
 */

import { Worker, type Job } from 'bullmq'
import type { Server } from 'socket.io'
import { getRedisConnection } from '../../lib/config/redis'
import { TRANSACTION_QUEUE_NAME, type TransactionJobData } from '../../lib/queues/transaction.queue'
import Transaction from '../../lib/modules/transactions/transaction.model'
import * as processor from '../../lib/modules/transactions/transaction.processor'
import { initializeSocketRefs } from '../../lib/modules/transactions/transaction.processor'
import { userSockets } from '../sockets/socket.manager'

let workerInstance: Worker<TransactionJobData> | null = null

/**
 * Process a transaction job
 */
async function processJob(job: Job<TransactionJobData>, io: Server): Promise<void> {
  const { transactionId, type, sender } = job.data

  console.log(`[idleraiders-logs] Processing ${type} job for ${sender} (${job.id})`)

  // Fetch the transaction from MongoDB
  const tx = await Transaction.findById(transactionId)

  if (!tx) {
    console.error(`[idleraiders-logs] Transaction not found: ${transactionId}`)
    throw new Error(`Transaction not found: ${transactionId}`)
  }

  // Skip if already completed
  if (tx.status === 'completed') {
    console.log(`[idleraiders-logs] Transaction already completed: ${transactionId}`)
    return
  }

  // Update status to processing
  if (tx.status === 'pending') {
    tx.status = 'processing'
    await tx.save()
  }

  // Process based on type
  switch (type) {
    case 'deposit':
      await processor.processDeposit(tx, io)
      break
    case 'withdraw':
      await processor.processWithdraw(tx, io)
      break
    case 'dollar_purchase':
      await processor.processDollarPurchase(tx, io)
      break
    case 'registration':
      await processor.processRegistration(tx, io)
      break
    case 'referral_payout':
      console.log(`[idleraiders-logs] Referral payout not yet implemented`)
      tx.status = 'failed'
      tx.logs = { failureCheckpoint: 'notImplemented' }
      await tx.save()
      break
    default:
      console.warn(`[idleraiders-logs] Unknown transaction type: ${type}`)
      tx.status = 'failed'
      tx.logs = { failureCheckpoint: 'unknownType', type }
      await tx.save()
  }

  console.log(`[idleraiders-logs] Completed ${type} job for ${sender} - Status: ${tx.status}`)
}

/**
 * Initialize the transaction worker
 */
export function initializeTransactionWorker(io: Server): Worker<TransactionJobData> {
  if (workerInstance) {
    return workerInstance
  }

  // Initialize socket references for the processor
  initializeSocketRefs(io, userSockets)

  const connection = getRedisConnection()

  workerInstance = new Worker<TransactionJobData>(
    TRANSACTION_QUEUE_NAME,
    async (job) => {
      await processJob(job, io)
    },
    {
      connection,
      concurrency: 5, // Process up to 5 jobs concurrently
      limiter: {
        max: 10,
        duration: 1000, // Rate limit: 10 jobs per second
      },
    }
  )

  // Event handlers
  workerInstance.on('completed', (job) => {
    console.log(`[idleraiders-logs] Job ${job.id} completed`)
  })

  workerInstance.on('failed', (job, error) => {
    console.error(`[idleraiders-logs] Job ${job?.id} failed:`, error.message)
  })

  workerInstance.on('error', (error) => {
    console.error('[idleraiders-logs] Worker error:', error.message)
  })

  console.log('[idleraiders-logs] Transaction worker initialized')

  return workerInstance
}

/**
 * Close the worker gracefully
 */
export async function closeTransactionWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close()
    workerInstance = null
    console.log('[idleraiders-logs] Transaction worker closed')
  }
}

export default {
  initializeTransactionWorker,
  closeTransactionWorker,
}
