import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { registerPlayer } from '@/lib/modules/players/player.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { transactionId } = body

    if (!transactionId) {
      throw new Error('Missing transaction ID')
    }

    await registerPlayer(playerId, transactionId)
    const updatedState = await buildPlayerStateById(playerId)
    
    return {
      message: 'Registration successful! Welcome to Idle Raiders.',
      delta: {
        isRegistered: updatedState.isRegistered,
        achievements: updatedState.achievements,
      },
    }
  })
}
