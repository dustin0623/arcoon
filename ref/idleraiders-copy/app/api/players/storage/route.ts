import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { upgradeStorageSlots } from '@/lib/modules/players/player.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    await upgradeStorageSlots(playerId)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      message: 'Storage upgraded!',
      storageSlots: updatedState.storageSlots,
      dollars: updatedState.dollars,
      delta: {
        storageSlots: updatedState.storageSlots,
        dollars: updatedState.dollars,
      },
    }
  })
}
