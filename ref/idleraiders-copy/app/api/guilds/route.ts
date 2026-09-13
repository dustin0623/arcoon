import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/config/database'
import { withAuth } from '@/lib/api/auth'
import { getAvailableGuilds, getGuild, createGuild, requestToJoinGuild, approveJoinRequest, rejectJoinRequest, getJoinRequests, cancelJoinRequest, getPlayerPendingApplications, checkAndUpdateReputationsIfNeeded } from '@/lib/modules/guilds/guild.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

// Get available guilds (public) or player's guild (authenticated)
export async function GET(request: NextRequest) {
  await connectDB()

  const { searchParams } = new URL(request.url)
  const listAll = searchParams.get('list') === 'true'

  if (listAll) {
    try {
      // Check if guild reputations need to be recalculated (on-demand, hourly)
      // This uses Redis to track last update time - only recalculates if stale
      const reputationStatus = await checkAndUpdateReputationsIfNeeded()
      
      // Support sorting options: reputation (default), level, raidPower, members, xp
      const sortByParam = searchParams.get('sortBy') as 'reputation' | 'level' | 'raidPower' | 'members' | 'xp' | null
      const sortBy = sortByParam && ['reputation', 'level', 'raidPower', 'members', 'xp'].includes(sortByParam)
        ? sortByParam
        : 'reputation'
      
      const guilds = await getAvailableGuilds(sortBy)
      return NextResponse.json({ 
        success: true, 
        guilds,
        rankingUpdate: {
          lastUpdate: reputationStatus.lastUpdate?.toISOString() ?? null,
          nextUpdate: reputationStatus.nextUpdate?.toISOString() ?? null
        }
      })
    } catch (error) {
      const err = error as Error
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }
  }

  return withAuth(request, async (playerId) => {
    const guild = await getGuild(playerId)
    return { guild }
  })
}

// Create a new guild
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { guildName, motto } = body

    if (!guildName) {
      throw new Error('Missing guildName')
    }

    const guild = await createGuild(playerId, guildName, motto)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      guild,
      message: `Created ${guildName}!`,
      delta: {
        guildId: updatedState.guildId,
        coins: updatedState.coins,
        achievements: updatedState.achievements,
      },
    }
  })
}

// Request to join an existing guild
export async function PUT(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { guildName, action, requestPlayerId, message } = body

    // Handle join request actions (approve/reject)
    if (action === 'approve' && requestPlayerId) {
      const guild = await approveJoinRequest(playerId, requestPlayerId)
      return {
        guild,
        message: 'Join request approved!',
      }
    }

    if (action === 'reject' && requestPlayerId) {
      const result = await rejectJoinRequest(playerId, requestPlayerId)
      return result
    }

    if (action === 'get_requests') {
      const requests = await getJoinRequests(playerId)
      return { requests }
    }

    if (action === 'cancel' && guildName) {
      const result = await cancelJoinRequest(playerId, guildName)
      return result
    }

    if (action === 'get_my_applications') {
      const applications = await getPlayerPendingApplications(playerId)
      return { applications }
    }

    // Default: Request to join
    if (!guildName) {
      throw new Error('Missing guildName')
    }

    const result = await requestToJoinGuild(playerId, guildName, message)

    return {
      success: result.success,
      message: result.message,
    }
  })
}
