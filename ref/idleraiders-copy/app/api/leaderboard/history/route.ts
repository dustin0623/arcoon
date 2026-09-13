import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/config/database'
import { logger } from '@/lib/utils/logger'
import * as leaderboardService from '@/lib/modules/leaderboards/leaderboard.service'

// Get historical leaderboard data
export async function GET(request: NextRequest): Promise<NextResponse> {
  await connectDB()

  try {
    const { searchParams } = new URL(request.url)
    const weekNumber = searchParams.get('week')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const includeActive = searchParams.get('includeActive') === 'true'

    // If specific week requested, get that leaderboard (finalized or live-active).
    if (weekNumber) {
      const leaderboard = await leaderboardService.getLeaderboardByWeek(parseInt(weekNumber, 10))

      if (!leaderboard) {
        return NextResponse.json({
          success: true,
          snapshot: null,
          message: 'No leaderboard found for this week',
        })
      }

      const isActive = leaderboard.status === 'active'

      return NextResponse.json({
        success: true,
        snapshot: {
          weekNumber: leaderboard.weekNumber,
          weekStart: leaderboard.weekStart,
          weekEnd: leaderboard.weekEnd,
          status: leaderboard.status,
          isActive,
          data: leaderboard.data,
          entries: leaderboard.entries,
          metadata: leaderboard.metadata,
          createdAt: leaderboard.createdAt,
        },
      })
    }

    // Get list of historical leaderboards (most recent first), optionally
    // prepending the currently-active week as a synthetic snapshot.
    const leaderboards = await leaderboardService.getLeaderboardHistory(limit, includeActive)

    const formattedLeaderboards = leaderboards.map((lb) => {
      const isActive = lb.status === 'active'
      return {
        weekNumber: lb.weekNumber,
        weekStart: lb.weekStart,
        weekEnd: lb.weekEnd,
        status: lb.status,
        isActive,
        data: lb.data,
        entries: lb.entries,
        metadata: lb.metadata,
        createdAt: lb.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      snapshots: formattedLeaderboards,
      total: formattedLeaderboards.length,
    })
  } catch (error) {
    logger.error('[API] Leaderboard History', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard history' },
      { status: 400 }
    )
  }
}
