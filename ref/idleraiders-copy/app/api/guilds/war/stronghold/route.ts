import { NextRequest } from 'next/server'
import { Types } from 'mongoose'
import { withAuth } from '@/lib/api/auth'
import * as guildwarService from '@/lib/modules/guildwars/guildwar.service'
import * as playerRepo from '@/lib/modules/players/player.repository'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

// Start stronghold attack mission
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { targetGuildId } = body

    if (!targetGuildId) {
      throw new Error('Missing targetGuildId')
    }

    const player = await playerRepo.findById(playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (!player.guildId) {
      throw new Error('You must be in a guild to attack strongholds')
    }

    // Start the stronghold attack mission
    const { missionId, duration } = await guildwarService.startStrongholdAttack(
      new Types.ObjectId(playerId),
      player.guildId,
      new Types.ObjectId(targetGuildId)
    )

    // Get updated player state
    const updatedState = await buildPlayerStateById(playerId)

    return {
      success: true,
      message: 'Stronghold attack started!',
      missionId: missionId.toString(),
      duration,
      delta: {
        energy: updatedState.energy,
        lastCycleUpdate: updatedState.lastCycleUpdate,
        activeMission: updatedState.activeMission,
      },
    }
  })
}
