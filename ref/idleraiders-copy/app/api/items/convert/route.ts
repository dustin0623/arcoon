import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { convertMaterials } from '@/lib/modules/items/item.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { fromMaterialId, toMaterialId, quantity } = body

    if (!fromMaterialId || !toMaterialId) {
      throw new Error('Missing fromMaterialId or toMaterialId')
    }

    const result = await convertMaterials(playerId, fromMaterialId, toMaterialId, quantity ?? 1)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      ...result,
      message: 'Conversion complete!',
      delta: {
        coins: updatedState.coins,
        materials: updatedState.materials,
      },
    }
  })
}
