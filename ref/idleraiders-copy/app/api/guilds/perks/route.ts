import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { getGuildPerks, unlockPerk } from '@/lib/modules/guilds/guild.service'

// Get guild perks data
export async function GET(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const perksData = await getGuildPerks(playerId)
    return { perks: perksData }
  })
}

// Unlock a perk
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { branchId, tier } = body

    if (!branchId || tier === undefined) {
      throw new Error('Missing branchId or tier')
    }

    const result = await unlockPerk(playerId, branchId, tier)

    return {
      success: result.success,
      message: result.message,
      guild: {
        points: result.guild.points,
        perks: result.guild.perks,
      },
    }
  })
}
