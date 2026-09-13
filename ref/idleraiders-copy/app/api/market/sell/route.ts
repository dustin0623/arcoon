import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { createCardListing } from '@/lib/modules/markets/market.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { cardId, quantity, price } = body

    if (!price || price <= 0) {
      throw new Error('Missing or invalid price')
    }

    if (!cardId) {
      throw new Error('Missing cardId')
    }

    const result = await createCardListing(playerId, cardId, quantity || 1, price)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      ...result,
      delta: {
        cards: updatedState.cards,
        stats: updatedState.stats,
        achievements: updatedState.achievements,
      },
    }
  })
}
