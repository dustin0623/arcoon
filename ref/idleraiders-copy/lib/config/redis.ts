import { Redis } from 'ioredis'
import { REDIS_URL } from './config'

interface RedisCache {
  client: Redis | null
}

declare global {
  // eslint-disable-next-line no-var
  var __idleraidersRedis: RedisCache | undefined
}

const cached: RedisCache = globalThis.__idleraidersRedis ?? { client: null }

if (!globalThis.__idleraidersRedis) {
  globalThis.__idleraidersRedis = cached
}

/**
 * Get or create a Redis client connection
 * Uses singleton pattern to avoid multiple connections
 */
export function getRedisConnection(): Redis {
  if (cached.client) {
    return cached.client
  }

  cached.client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
  })

  cached.client.on('error', (err) => {
    console.error('[idleraiders-logs] Redis connection error:', err.message)
  })

  cached.client.on('connect', () => {
    console.log('[idleraiders-logs] Connected to Redis')
  })

  return cached.client
}

/**
 * Close the Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  if (cached.client) {
    await cached.client.quit()
    cached.client = null
    console.log('[idleraiders-logs] Redis connection closed')
  }
}

export default { getRedisConnection, closeRedisConnection }
