import { Queue } from 'bullmq'
import { redis } from '@/lib/redis/client'

export interface CancelJobData {
  playerId: string
  listingId: string
}

export interface CancelJobResult {
  success: boolean
  listingId: string
  itemsReturned: {
    type: 'card'
    quantity: number
    id?: string
  }
}

/**
 * Lazy queue factory — see `purchase.queue.ts` for the full rationale.
 * Constructing BullMQ `Queue` at module scope trips the build-time
 * "Collecting page data" step because it resolves `REDIS_URL` eagerly.
 */
let queueInstance: Queue<CancelJobData, CancelJobResult> | null = null

function getCancelQueue(): Queue<CancelJobData, CancelJobResult> {
  if (queueInstance) return queueInstance
  queueInstance = new Queue<CancelJobData, CancelJobResult>('marketplace-cancellations', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
      },
      removeOnFail: false, // Keep failed jobs for inspection
    },
  })
  return queueInstance
}

export const cancelQueue = new Proxy({} as Queue<CancelJobData, CancelJobResult>, {
  get: (_target, prop) => {
    const instance = getCancelQueue()
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop as string]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value
  },
})

export default cancelQueue
