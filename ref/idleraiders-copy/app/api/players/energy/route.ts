import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { getEnergy } from '@/lib/modules/players/player.service'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const result = await getEnergy(playerId)
    return {
      message: 'Energy regenerated!',
      delta: {
        energy: result.energy,
        maxEnergy: result.maxEnergy,
        lastCycleUpdate: result.lastCycleUpdate,
      },
    }
  })
}
