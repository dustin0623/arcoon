import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/config/database'
import { logger } from '@/lib/utils/logger'
import GAME_DATA from '@/public/data'

export async function POST(request: NextRequest): Promise<NextResponse> {
	await connectDB()

	try {
		const body = await request.json()
		const clientVersion = body.version || null
		const serverVersion = GAME_DATA.SYSTEM.VERSION

		if (clientVersion === serverVersion) {
			return NextResponse.json({
				success: true,
				upToDate: true,
				version: serverVersion,
			})
		}

		return NextResponse.json({
			success: true,
			upToDate: false,
			version: serverVersion,
			data: {
				CARDS: GAME_DATA.CARDS,
				ITEMS: GAME_DATA.ITEMS,
				WORLD: GAME_DATA.WORLD,
				PROGRESSION: GAME_DATA.PROGRESSION,
				ECONOMY: GAME_DATA.ECONOMY,
				SYSTEM: GAME_DATA.SYSTEM,
			},
		})
	} catch (error) {
		logger.error('[API] Version check', error)
		return NextResponse.json({ success: false, error: 'Version check failed' }, { status: 400 })
	}
}
