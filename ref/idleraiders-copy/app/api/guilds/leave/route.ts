import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { leaveGuild } from '@/lib/modules/guilds/guild.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    await leaveGuild(playerId)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      message: 'Left guild successfully.',
      delta: {
        guildId: updatedState.guildId,
        achievements: updatedState.achievements,
      },
    }
  })
}
