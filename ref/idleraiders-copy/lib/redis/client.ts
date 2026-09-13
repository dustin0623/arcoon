import Redis from 'ioredis'

let redisInstance: Redis | null = null

function getRedis(): Redis {
  if (redisInstance) {
    return redisInstance
  }

  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set')
  }

  // Create Redis connection
  redisInstance = new Redis(process.env.REDIS_URL, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    enableReadyCheck: true,
    enableOfflineQueue: true,
  })

  // Handle connection events
  redisInstance.on('connect', () => {
    console.log('[Redis] Connected')
  })

  redisInstance.on('error', (err) => {
    console.error('[Redis] Error:', err.message)
  })

  redisInstance.on('close', () => {
    console.log('[Redis] Connection closed')
  })

  return redisInstance
}

export const redis = new Proxy({} as Redis, {
  get: (target, prop) => {
    const instance = getRedis()
    return (instance as any)[prop]
  },
})

export default redis
