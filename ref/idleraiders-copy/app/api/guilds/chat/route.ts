import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { sendChat, getGuild } from '@/lib/modules/guilds/guild.service'

// Get guild chat messages
export async function GET(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const guild = await getGuild(playerId)
    if (!guild) {
      throw new Error('Not in a guild')
    }
    // Return only the last 100 messages (already enforced by the repository)
    const chat = guild.chat?.slice(-100) ?? []
    return { chat }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId, username) => {
    const body = await request.json()
    const { text } = body

    if (!text) {
      throw new Error('Missing text')
    }

    const message = await sendChat(playerId, username, text)
    return { message }
  })
}
