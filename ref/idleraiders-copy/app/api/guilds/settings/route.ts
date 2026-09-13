import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { setGuildName, setGuildMotto } from '@/lib/modules/guilds/guild.service'

export async function PUT(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { name, motto, action } = body

    if (action === 'name' || name) {
      if (!name) {
        throw new Error('Missing name')
      }
      const guild = await setGuildName(playerId, name)
      return { guild, message: 'Guild name updated' }
    }

    if (action === 'motto' || motto) {
      if (!motto) {
        throw new Error('Missing motto')
      }
      const guild = await setGuildMotto(playerId, motto)
      return { guild, message: 'Guild motto updated' }
    }

    throw new Error('Missing name or motto')
  })
}
