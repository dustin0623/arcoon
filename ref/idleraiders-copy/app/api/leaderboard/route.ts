import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/config/database'
import { withAuth } from '@/lib/api/auth'
import { logger } from '@/lib/utils/logger'
import {
	getCurrentWeekLeaderboard,
	getGuildLeaderboard,
	getComputedLeaderboardData,
	getActiveDamageMetadata,
} from '@/lib/modules/leaderboards/leaderboard.service'

// Get leaderboard data
export async function GET(request: NextRequest): Promise<NextResponse> {
	await connectDB()

	try {
		const { searchParams } = new URL(request.url)
		const type = searchParams.get('type')
		const guildId = searchParams.get('guildId')

		// Get guild leaderboard
		if (type === 'guild' && guildId) {
			const entries = await getGuildLeaderboard(guildId)
			return NextResponse.json({ success: true, entries })
		}

		// Get current week leaderboard
		if (type === 'current') {
			const entries = await getCurrentWeekLeaderboard()
			return NextResponse.json({ success: true, entries })
		}

		// Default: computed leaderboard data using stored expectedDamage from active leaderboard
		const { expectedDamage, totalRaidPower } = await getActiveDamageMetadata()
		const PREMIUM_POOL = 1_000
		const GUILD_POINTS_POOL = 10_000
		const leaderboard = await getComputedLeaderboardData(expectedDamage, PREMIUM_POOL, GUILD_POINTS_POOL)

		return NextResponse.json({
			success: true,
			data: {
				...leaderboard,
				// Dynamic values stored on the leaderboard document (no recalculation per request)
				expectedDamage,
				totalRaidPower,
			},
		})
	} catch (error) {
		logger.error('[API] Leaderboard', error)
		return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard' }, { status: 400 })
	}
}

// Get player's weekly stats (authenticated)
export async function POST(request: NextRequest) {
	return withAuth(request, async (playerId) => {
		// Get player's current weekly stats
		const leaderboard = await getCurrentWeekLeaderboard()

		if (!leaderboard || leaderboard.length === 0) {
			return { stats: null }
		}

		const playerIndex = leaderboard.findIndex((entry) => entry.player.toString() === playerId.toString())

		if (playerIndex === -1) {
			return { stats: null }
		}

		const playerEntry = leaderboard[playerIndex]

		return {
			stats: {
				rank: playerIndex + 1,
				damage: playerEntry.totalDamage,
				gm: playerEntry.gm || 0,
				points: playerEntry.points || playerEntry.totalDamage,
				username: playerEntry.username,
			},
		}
	})
}
