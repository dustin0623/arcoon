import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { usePotion } from '@/lib/modules/items/item.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { type } = body

    if (!type) {
      throw new Error('Missing potion type')
    }

    const result = await usePotion(playerId, type)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      ...result,
      message: 'Potion used!',
      delta: {
        energy: updatedState.energy,
        lastCycleUpdate: updatedState.lastCycleUpdate,
        missionStats: updatedState.missionStats,
        potions: updatedState.potions,
      },
    }
  })
}
