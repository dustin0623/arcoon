/**
 * Transaction Queue
 * BullMQ queue for processing blockchain transactions
 */

import { Queue, type JobsOptions } from 'bullmq'
import { getRedisConnection } from '../config/redis'

// Queue name constant
export const TRANSACTION_QUEUE_NAME = 'transaction-queue'

// Job types
export type TransactionJobType = 'deposit' | 'withdraw' | 'dollar_purchase' | 'registration' | 'referral_payout'

export interface TransactionJobData {
  transactionId: string  // MongoDB _id of the transaction document
  type: TransactionJobType
  sender: string
}

// Default job options
const defaultJobOptions: JobsOptions = {
  attempts: 5, // Increased to 5 attempts for blockchain confirmation delays
  backoff: {
    type: 'exponential',
    delay: 3000, // 3s, 6s, 12s, 24s, 48s - gives time for chain confirmation
  },
  removeOnComplete: {
    age: 3600, // Keep completed jobs for 1 hour
    count: 1000, // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 86400, // Keep failed jobs for 24 hours
  },
}

// Singleton queue instance
let queueInstance: Queue<TransactionJobData> | null = null

/**
 * Get or create the transaction queue
 */
export function getTransactionQueue(): Queue<TransactionJobData> {
  if (!queueInstance) {
    const connection = getRedisConnection()
    queueInstance = new Queue<TransactionJobData>(TRANSACTION_QUEUE_NAME, {
      connection,
      defaultJobOptions,
    })

    console.log('[idleraiders-logs] Transaction queue initialized')
  }

  return queueInstance
}

/**
 * Add a transaction job to the queue
 */
export async function addTransactionJob(
  transactionId: string,
  type: TransactionJobType,
  sender: string,
  options?: JobsOptions
): Promise<string> {
  const queue = getTransactionQueue()

  const job = await queue.add(
    type,
    {
      transactionId,
      type,
      sender,
    },
    {
      ...options,
      // Use transactionId as job ID to prevent duplicates
      jobId: `tx-${transactionId}`,
    }
  )

  console.log(`[idleraiders-logs] Added job: ${type} for ${sender} (${job.id})`)

  return job.id!
}

/**
 * Close the queue gracefully
 */
export async function closeTransactionQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close()
    queueInstance = null
    console.log('[idleraiders-logs] Transaction queue closed')
  }
}

export default {
  getTransactionQueue,
  addTransactionJob,
  closeTransactionQueue,
  TRANSACTION_QUEUE_NAME,
}
