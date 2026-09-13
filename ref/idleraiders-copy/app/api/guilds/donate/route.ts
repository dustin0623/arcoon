import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { donateMaterial } from '@/lib/modules/guilds/guild.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { materialName, batches = 1 } = body

    if (!materialName) {
      throw new Error('Missing materialName')
    }

    if (typeof batches !== 'number' || batches < 1 || !Number.isInteger(batches)) {
      throw new Error('Invalid batches value')
    }

    const result = await donateMaterial(playerId, materialName, batches)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      ...result,
      message: 'Material donated!',
      delta: {
        materials: updatedState.materials,
        achievements: updatedState.achievements,
      },
    }
  })
}
