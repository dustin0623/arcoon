/**
* Socket Manager
* Handles user registration for transaction notifications and price updates
*/

import { Server, Socket } from 'socket.io'
import { authenticateSocket } from './socket.auth'
import { CORS_ORIGIN } from '../../lib/config/config'

/**
 * Rate limiter configuration
 */
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 30, // max requests per window
}

/**
 * Track rate limits per socket
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if request should be rate limited
 */
function isRateLimited(socketId: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(socketId)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(socketId, { count: 1, resetTime: now + RATE_LIMIT.windowMs })
    return false
  }

  if (limit.count >= RATE_LIMIT.maxRequests) {
    return true
  }

  limit.count++
  return false
}

/**
 * Clean up rate limit entries for disconnected sockets
 */
function cleanupRateLimit(socketId: string): void {
  rateLimitMap.delete(socketId)
}

/**
 * User socket registry for server-initiated events
 * Maps username -> socketId
 */
export const userSockets: Record<string, string> = {}

/**
 * Socket.IO server instance (set after initialization)
 */
let ioInstance: Server | null = null

/**
 * Get the Socket.IO server instance
 */
export function getIO(): Server | null {
  return ioInstance
}

/**
 * Notify a user about transaction status change
 */
export function notifyTransactionUpdate(
  username: string,
  data: {
    transactionId: string
    status: 'completed' | 'failed'
    type: string
    message?: string
    balanceUpdate?: {
      gold?: number
      dollars?: number
    }
  }
): void {
  const socketId = userSockets[username]
  if (socketId && ioInstance) {
    ioInstance.to(socketId).emit('transaction:update', data)
    console.log(`[idleraiders-logs] Notified ${username} of transaction ${data.status}: ${data.transactionId}`)
  }
}



/**
 * Initialize Socket.IO server
 */
export function initializeSocketServer(httpServer: any): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  ioInstance = io

  // Authentication middleware
  io.use(authenticateSocket)

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const socketWithAuth = socket as Socket & { authenticated?: boolean; username?: string }

    if (!socketWithAuth.authenticated || !socketWithAuth.username) {
      console.log('[idleraiders-logs] Unauthenticated connection rejected:', socket.id)
      socket.disconnect(true)
      return
    }

    const username = socketWithAuth.username

    console.log(`[idleraiders-logs] Connected: ${username} (${socket.id})`)

    // Register user socket for server-initiated events
    userSockets[username] = socket.id

    /**
     * Ping/pong for connection health check
     */
    socket.on('ping', (callback) => {
      callback?.({ pong: true, timestamp: Date.now() })
    })

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`[idleraiders-logs] Disconnected: ${username} (${reason})`)
      delete userSockets[username]
      cleanupRateLimit(socket.id)
    })

    // Error handler
    socket.on('error', (error) => {
      console.error(`[idleraiders-logs] Error for ${username}:`, error.message)
    })

    // Send connection success
    socket.emit('connected', {
      success: true,
      message: 'Connected to Idle Raiders server',
      username,
    })
  })

  console.log('[idleraiders-logs] Socket.IO server initialized')
  return io
}

export default { initializeSocketServer, userSockets, notifyTransactionUpdate, getIO }
