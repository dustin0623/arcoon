import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { completeMission } from '@/lib/modules/missions/mission.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { missionId } = body

    if (!missionId) {
      throw new Error('Missing missionId')
    }

    const result = await completeMission(playerId, missionId)
    const updatedState = await buildPlayerStateById(playerId)

    // If mission was already completed or not found, return cleared response (no rewards)
    if ('cleared' in result && result.cleared) {
      return {
        success: true,
        cleared: true,
        message: 'Mission cleared - no rewards (already completed or not found)',
        delta: {
          activeMission: updatedState.activeMission,
        },
      }
    }

    return {
      ...result,
      message: 'Mission completed!',
      delta: {
        coins: updatedState.coins,
        shards: updatedState.shards,
        level: updatedState.level,
        xp: updatedState.xp,
        xpToNextLevel: updatedState.xpToNextLevel,
        energy: updatedState.energy,
        lastCycleUpdate: updatedState.lastCycleUpdate,
        missionStats: updatedState.missionStats,
        milestones: updatedState.milestones,
        activeMission: updatedState.activeMission,
        cards: updatedState.cards,
        materials: updatedState.materials,
        potions: updatedState.potions,
        achievements: updatedState.achievements,
        dailyDungeonStats: updatedState.dailyDungeonStats,
        stats: updatedState.stats,
        // Include top-level mission stats for profile page
        totalMissions: updatedState.totalMissions,
        totalBossDamage: updatedState.totalBossDamage,
        totalMinutesPlayed: updatedState.totalMinutesPlayed,
      },
    }
  })
}
