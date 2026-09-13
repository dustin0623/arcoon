import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { connectDB } from '@/lib/config/database'
import { logger } from '@/lib/utils/logger'
import { loginPlayer } from '@/lib/modules/players/player.service'
import { JWT_SECRET_ENCODED, JWT_EXPIRY_SECONDS } from '@/lib/config/config'

export async function POST(request: NextRequest): Promise<NextResponse> {
	await connectDB()

	try {
		const body = await request.json()
		const { username, signature, referral } = body

		if (!username) {
			return NextResponse.json({ success: false, error: 'Missing username' }, { status: 400 })
		}

		if (!signature) {
			return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 400 })
		}

		const result = await loginPlayer(username, signature, referral || '')

		// Generate a proper JWT token
		const token = await new SignJWT({
			playerId: result.player._id.toString(),
			username: result.player.username,
		})
			.setProtectedHeader({ alg: 'HS256' })
			.setIssuedAt()
			.setExpirationTime(Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS)
			.sign(JWT_SECRET_ENCODED)

		return NextResponse.json({
			success: true,
			token,
			player: {
				id: result.player._id.toString(),
				username: result.player.username,
				isRegistered: result.player.isRegistered,
			},
		})
	} catch (error) {
		logger.error('[API] Login', error)
		return NextResponse.json({ success: false, error: 'Login failed' }, { status: 400 })
	}
}
