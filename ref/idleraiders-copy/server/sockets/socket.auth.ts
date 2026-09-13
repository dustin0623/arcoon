import { jwtVerify } from 'jose'
import { JWT_SECRET_ENCODED } from '../../lib/config/config'

function getSocketToken(socket) {
  const authToken = socket.handshake.auth?.token
  const headerToken = socket.handshake.headers?.authorization

  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim()
  }

  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.replace(/^Bearer\s+/i, '').trim()
  }

  return null
}

export async function authenticateSocket(socket, next) {
  const token = getSocketToken(socket)

  if (!token) {
    socket.authenticated = false
    return next()
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_ENCODED)

    if (!payload.username || typeof payload.username !== 'string') {
      socket.emit('auth_error', {
        error: 'INVALID_TOKEN',
        message: 'Invalid token payload',
      })
      return next(new Error('Authentication failed: Invalid token payload'))
    }

    socket.username = payload.username
    socket.playerId = typeof payload.playerId === 'string' ? payload.playerId : null
    socket.authenticated = true

    return next()
  } catch (error) {
    const isExpired = error?.code === 'ERR_JWT_EXPIRED'
    socket.emit('auth_error', {
      error: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: isExpired ? 'Token has expired' : 'Invalid token',
    })
    return next(new Error(`Authentication failed: ${error.message}`))
  }
}

export function requireAuth(socket, handler) {
  return async (data) => {
    if (!socket.authenticated) return
    return handler(data)
  }
}

export default requireAuth
