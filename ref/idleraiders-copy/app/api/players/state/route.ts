import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function GET(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const playerState = await buildPlayerStateById(playerId)
    return { playerState }
  })
}
