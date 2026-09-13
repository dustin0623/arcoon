import { NextRequest } from 'next/server'
import { Types } from 'mongoose'
import { withAuth } from '@/lib/api/auth'
import * as guildwarService from '@/lib/modules/guildwars/guildwar.service'
import * as playerRepo from '@/lib/modules/players/player.repository'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

// Start outpost attack mission
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { outpostId } = body

    if (!outpostId) {
      throw new Error('Missing outpostId')
    }

    const player = await playerRepo.findById(playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (!player.guildId) {
      throw new Error('You must be in a guild to attack outposts')
    }

    // Start the outpost attack mission
    const { missionId, duration } = await guildwarService.startOutpostAttack(
      new Types.ObjectId(playerId),
      player.guildId,
      outpostId
    )

    // Get updated player state
    const updatedState = await buildPlayerStateById(playerId)

    return {
      success: true,
      message: 'Outpost attack started!',
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
