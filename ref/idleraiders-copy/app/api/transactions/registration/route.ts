import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { queueRegistration } from '@/lib/modules/transactions/transaction.service'
import Player from '@/lib/modules/players/player.model'

export async function POST(request: NextRequest) {
  return withAuth(request, async (_playerId, username) => {
    const body = await request.json()
    const { transactionId } = body

    if (!transactionId) {
      throw new Error('Missing blockchain transaction ID')
    }

    // Look up by JWT-verified username so the route's source of truth is the
    // signed token, not a client-trusted ID.
    const player = await Player.findOne({ username })
    if (!player) {
      throw new Error('Player not found')
    }

    if (player.isRegistered) {
      throw new Error('Player already registered')
    }

    // Use the player's stored referredBy field (set during login) rather than
    // trusting the client.
    const referral = player.referredBy || 'idleraiders'

    const result = await queueRegistration(transactionId, username, { referral })

    return result
  })
}
