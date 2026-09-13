import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { attackBoss } from '@/lib/modules/missions/mission.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { bossId, raidPower } = body

    if (!bossId) {
      throw new Error('Missing bossId')
    }

    const result = await attackBoss(playerId, bossId, raidPower || 100)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      ...result,
      message: 'Boss attacked!',
      delta: {
        coins: updatedState.coins,
        shards: updatedState.shards,
        missionStats: updatedState.missionStats,
        milestones: updatedState.milestones,
        materials: updatedState.materials,
        achievements: updatedState.achievements,
      },
    }
  })
}
