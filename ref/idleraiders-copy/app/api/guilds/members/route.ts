import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { kickMember, transferLeadership, getGuild } from '@/lib/modules/guilds/guild.service'

// Get guild members - redirects to main guild endpoint
export async function GET(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const guild = await getGuild(playerId)
    if (!guild) {
      return { members: [], guild: null }
    }
    return { members: guild.members, guild }
  })
}

// Kick a member
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { memberId } = body

    if (!memberId) {
      throw new Error('Missing memberId')
    }

    await kickMember(playerId, memberId)
    return { message: 'Member kicked.' }
  })
}

// Transfer leadership
export async function PUT(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { memberId } = body

    if (!memberId) {
      throw new Error('Missing memberId')
    }

    const guild = await transferLeadership(playerId, memberId)
    return { guild, message: 'Leadership transferred' }
  })
}
