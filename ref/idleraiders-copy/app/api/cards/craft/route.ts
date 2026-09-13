import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { craftCard } from '@/lib/modules/cards/card.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { recipeId } = body

    if (!recipeId) {
      throw new Error('Missing recipeId')
    }

    const result = await craftCard(playerId, recipeId)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      ...result,
      delta: {
        coins: updatedState.coins,
        materials: updatedState.materials,
        cards: updatedState.cards,
        stats: updatedState.stats,
        achievements: updatedState.achievements,
      },
    }
  })
}
