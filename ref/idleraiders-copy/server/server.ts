import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { connectDB } from '../lib/config/database'
import { CORS_ORIGIN, PORT } from '../lib/config/config'
import { startWorkers, stopWorkers } from './workers/index'
import { initializeSocketServer } from './sockets/socket.manager'
import { closeRedisConnection } from '../lib/config/redis'
import { closeTransactionQueue } from '../lib/queues/transaction.queue'
import { getCurrentHivePrice, isHiveUsdPriceInitialized } from '../lib/modules/transactions/transaction.logic'

const app = express()
const server = http.createServer(app)

// Global middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// Price endpoint - returns the current HIVE USD price.
// Responds 503 until the price worker has reported its first successful fetch.
app.get('/api/price', async (req, res) => {
  if (!(await isHiveUsdPriceInitialized())) {
    res.status(503).json({
      success: false,
      error: 'Price service unavailable, please try again shortly',
      timestamp: new Date().toISOString(),
    })
    return
  }

  const price = await getCurrentHivePrice()
  res.json({
    success: true,
    hiveUsd: price,
    hivePerDollar: 1 / price,
    timestamp: new Date().toISOString(),
  })
})



// Start
let io: ReturnType<typeof initializeSocketServer> | null = null

// Startup banner
function printBanner() {
  const divider = '═'.repeat(50)
  console.log('')
  console.log(`╔${divider}╗`)
  console.log(`║${'IDLE RAIDERS SERVER'.padStart(35).padEnd(50)}║`)
  console.log(`╠${divider}╣`)
  console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(34)}║`)
  console.log(`║  Port:        ${String(PORT).padEnd(34)}║`)
  console.log(`║  CORS Origin: ${CORS_ORIGIN.substring(0, 34).padEnd(34)}║`)
  console.log(`╚${divider}╝`)
  console.log('')
}

async function start() {
  printBanner()

  console.log('[idleraiders-logs] Connecting to database...')
  await connectDB()
  console.log('[idleraiders-logs] Database connected')


  // Initialize Socket.IO server first (before workers)
  console.log('[idleraiders-logs] Starting Socket.IO...')
  io = initializeSocketServer(server)
  console.log('[idleraiders-logs] Socket.IO initialized')

  // Start workers (uses getIO() internally for socket notifications)
  // This also recovers any pending transactions from DB and re-queues them
  console.log('[idleraiders-logs] Starting workers...')
  await startWorkers()
  console.log('[idleraiders-logs] Workers started')

  server.listen(PORT, () => {
    console.log('')
    console.log(`[idleraiders-logs] Ready and listening on port ${PORT}`)
    console.log(`[idleraiders-logs] Health check: http://localhost:${PORT}/api/health`)
    console.log('')
  })
}

start().catch((err) => {
  console.error('[idleraiders-logs] Fatal error during startup:', err)
  process.exit(1)
})

// Graceful shutdown
async function shutdown(signal: string) {
  console.log('')
  console.log(`[idleraiders-logs] Received ${signal}, shutting down gracefully...`)

  try {
    // Stop workers first (BullMQ + cron)
    console.log('[idleraiders-logs] Stopping workers...')
    await stopWorkers()

    // Close the transaction queue
    console.log('[idleraiders-logs] Closing transaction queue...')
    await closeTransactionQueue()

    // Close Redis connection
    console.log('[idleraiders-logs] Closing Redis connection...')
    await closeRedisConnection()

    // Close Socket.IO
    if (io) {
      console.log('[idleraiders-logs] Closing Socket.IO...')
      io.close()
    }

    // Close HTTP server
    console.log('[idleraiders-logs] Closing HTTP server...')
    server.close(() => {
      console.log('[idleraiders-logs] Shutdown complete')
      process.exit(0)
    })

    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('[idleraiders-logs] Forced shutdown after timeout')
      process.exit(1)
    }, 10000)
  } catch (err) {
    console.error('[idleraiders-logs] Error during shutdown:', err)
    process.exit(1)
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
