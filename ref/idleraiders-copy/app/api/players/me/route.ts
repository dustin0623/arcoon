import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { connectDB } from '@/lib/config/database'
import { JWT_SECRET_ENCODED } from '@/lib/config/config'
import Player from '@/lib/modules/players/player.model'

export async function GET(request: NextRequest): Promise<NextResponse> {
  await connectDB()

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET_ENCODED)
    const username = payload.username as string

    if (!username) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Fetch player from database
    const player = await Player.findOne({ username }).lean()

    if (!player) {
      return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      player: {
        id: player._id.toString(),
        username: player.username,
        isRegistered: player.isRegistered,
        isBanned: player.isBanned ?? false,
        banReason: player.banReason,
        bannedAt: player.bannedAt,
        referredBy: player.referredBy,
        level: player.level,
        xp: player.xp,
        coins: player.coins,
        shards: player.shards,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
}
