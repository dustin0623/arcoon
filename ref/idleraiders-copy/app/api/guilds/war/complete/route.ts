import { NextRequest } from 'next/server'
import { Types } from 'mongoose'
import { withAuth } from '@/lib/api/auth'
import * as guildwarService from '@/lib/modules/guildwars/guildwar.service'
import * as missionRepo from '@/lib/modules/missions/mission.repository'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

// Complete a war mission (outpost or stronghold attack)
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { missionId } = body

    if (!missionId) {
      throw new Error('Missing missionId')
    }

    // Get mission
    const mission = await missionRepo.findById(new Types.ObjectId(missionId))
    if (!mission) {
      throw new Error('Mission not found')
    }

    // Validate mission ownership
    if (mission.owner.toString() !== playerId.toString()) {
      throw new Error('Mission does not belong to this player')
    }

    // Get player's actual raid power from stats (correctly calculated from all cards, equipment, etc.)
    const playerState = await buildPlayerStateById(playerId)
    const raidPower = playerState.stats?.raidPower ?? 0

    let result
    if (mission.type === 'war_outpost') {
      result = await guildwarService.completeOutpostAttack(
        new Types.ObjectId(missionId),
        new Types.ObjectId(playerId),
        raidPower
      )
    } else if (mission.type === 'war_stronghold') {
      result = await guildwarService.completeStrongholdAttack(
        new Types.ObjectId(missionId),
        new Types.ObjectId(playerId),
        raidPower
      )
    } else {
      throw new Error('Invalid mission type for war completion')
    }

    // Get updated player state (re-fetch to get accurate post-mission state)
    const updatedState = await buildPlayerStateById(playerId)

    // Get updated war overview
    const outposts = await guildwarService.getOutpostsWithCurrentStatus()
    const strongholds = await guildwarService.getAllStrongholdsWithCurrentHp()
    const leaderboard = await guildwarService.getWarLeaderboard()

    return {
      ...result,
      delta: {
        energy: updatedState.energy,
        lastCycleUpdate: updatedState.lastCycleUpdate,
        activeMission: updatedState.activeMission,
      },
      warUpdate: {
        outposts,
        strongholds,
        leaderboard,
      },
    }
  })
}
