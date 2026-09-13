import { Queue } from 'bullmq'
import { redis } from '@/lib/redis/client'

export interface PurchaseJobData {
  playerId: string
  listingId: string
  type: 'card'
}

export interface PurchaseJobResult {
  success: boolean
  listingId: string
  transactionId: string
  coins: number
}

/**
 * Lazy queue factory.
 *
 * BullMQ's `Queue` constructor immediately touches its `connection` (adds
 * listeners, probes status, etc.). If we instantiate at module scope, the
 * Proxy-based `redis` client resolves `REDIS_URL` at import time — which
 * fails during `next build`'s "Collecting page data" step, where env vars
 * aren't reliably available to the analyzer process.
 *
 * By instantiating on first property access, construction is deferred until
 * an actual request runs in a Node.js runtime where `REDIS_URL` is set.
 */
let queueInstance: Queue<PurchaseJobData, PurchaseJobResult> | null = null

function getPurchaseQueue(): Queue<PurchaseJobData, PurchaseJobResult> {
  if (queueInstance) return queueInstance
  queueInstance = new Queue<PurchaseJobData, PurchaseJobResult>('marketplace-purchases', {
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

// Proxy exposes the same `Queue` shape to callers, but construction is deferred.
export const purchaseQueue = new Proxy({} as Queue<PurchaseJobData, PurchaseJobResult>, {
  get: (_target, prop) => {
    const instance = getPurchaseQueue()
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop as string]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value
  },
})

export default purchaseQueue
