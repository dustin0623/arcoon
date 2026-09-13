import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import * as guildwarService from '@/lib/modules/guildwars/guildwar.service'
import * as playerRepo from '@/lib/modules/players/player.repository'
import * as guildRepo from '@/lib/modules/guilds/guild.repository'
import { getCurrentWeek } from '@/lib/modules/leaderboards/leaderboard.logic'

// Get guild war overview for current season
export async function GET(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const { searchParams } = new URL(request.url)
    const history = searchParams.get('history') === 'true'
    const weekNumber = searchParams.get('week')

    // Return past war seasons
    if (history) {
      const limit = parseInt(searchParams.get('limit') ?? '10')
      const seasons = await guildwarService.getFinalizedGuildWars(limit)
      return { seasons }
    }

    // Return specific week's war season
    if (weekNumber) {
      const season = await guildwarService.getGuildWarByWeek(parseInt(weekNumber))
      return { season }
    }

    // Get player and guild info
    const player = await playerRepo.findById(playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    // Get current week info
    const currentWeekData = getCurrentWeek()

    // Lazy auto-revive sweep for destroyed strongholds (>24h old).
    // Rate-limited to once per 60s per week via Redis lock, so this is
    // safe to call on every war-overview hit.
    await guildwarService.runAutoReviveSweepIfDue(currentWeekData.weekNumber)

    // Get or create current war season
    const warSeason = await guildwarService.getOrCreateCurrentGuildWar()

    // Get outposts with current garrison
    const outposts = await guildwarService.getOutpostsWithCurrentStatus()

    // Get all strongholds (including destroyed) so the UI can render
    // rebuilding/muted enemy strongholds with revival countdowns
    const strongholds = await guildwarService.getAllStrongholdsIncludingDestroyed()

    // Get war leaderboard
    const leaderboard = await guildwarService.getWarLeaderboard()

    // Get player's guild war entry if they have a guild
    let guildEntry = null
    let guildStronghold = null
    if (player.guildId) {
      guildEntry = await guildwarService.getGuildWarEntry(player.guildId)
      guildStronghold = strongholds.find(
        (s) => s.guildId.toString() === player.guildId?.toString()
      )
    }

    return {
      season: {
        weekNumber: currentWeekData.weekNumber,
        weekStart: currentWeekData.weekStart.toISOString(),
        weekEnd: currentWeekData.weekEnd.toISOString(),
        status: warSeason.status,
      },
      outposts,
      strongholds,
      leaderboard,
      guildEntry,
      guildStronghold,
    }
  })
}

// Join the war (ensure guild participation)
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const player = await playerRepo.findById(playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (!player.guildId) {
      throw new Error('You must be in a guild to participate in guild wars')
    }

    const guild = await guildRepo.findById(player.guildId)
    if (!guild) {
      throw new Error('Guild not found')
    }

    // Ensure guild is participating (creates entry + stronghold)
    await guildwarService.ensureGuildParticipation(
      guild._id,
      guild.name,
      guild.level
    )

    // Return updated war overview
    const outposts = await guildwarService.getOutpostsWithCurrentStatus()
    // Include destroyed strongholds so the UI can render rebuilding/muted cards
    const strongholds = await guildwarService.getAllStrongholdsIncludingDestroyed()
    const guildEntry = await guildwarService.getGuildWarEntry(guild._id)
    const guildStronghold = strongholds.find(
      (s) => s.guildId.toString() === guild._id.toString()
    )

    return {
      success: true,
      message: `${guild.name} has joined the war!`,
      outposts,
      strongholds,
      guildEntry,
      guildStronghold,
    }
  })
}
