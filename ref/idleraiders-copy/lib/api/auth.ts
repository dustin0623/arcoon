import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { JWT_SECRET_ENCODED } from '@/lib/config/config'
import { connectDB } from '@/lib/config/database'

export interface AuthenticatedRequest extends NextRequest {
	playerId?: string
	username?: string
}

interface JWTPayload {
	playerId: string
	username: string
}

export async function getAuthFromRequest(request: NextRequest): Promise<{ playerId: string; username: string } | null> {
	const authHeader = request.headers.get('authorization')
	if (!authHeader?.startsWith('Bearer ')) {
		return null
	}

	const token = authHeader.substring(7)

	try {
		const { payload } = await jwtVerify(token, JWT_SECRET_ENCODED)
		const { playerId, username } = payload as unknown as JWTPayload

		if (!playerId || !username) {
			return null
		}

		return { playerId, username }
	} catch (error) {
		logger.debug('Auth', 'Token verification failed')
		return null
	}
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
	return NextResponse.json({ success: false, error: message }, { status: 401 })
}

export function errorResponse(message: string, status: number = 400): NextResponse {
	return NextResponse.json({ success: false, error: message }, { status })
}

export function successResponse<T>(data: T, status: number = 200): NextResponse {
	return NextResponse.json({ success: true, ...data }, { status })
}

export async function withAuth<T>(
	request: NextRequest,
	handler: (playerId: string, username: string) => Promise<T>,
): Promise<NextResponse> {
	await connectDB()

	const auth = await getAuthFromRequest(request)
	if (!auth) {
		return unauthorizedResponse()
	}

	try {
		const result = await handler(auth.playerId, auth.username)
		return successResponse(result)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Operation failed'
		logger.error('[API] Handler error', error)
		return errorResponse(errorMessage)
	}
}

export async function withOptionalAuth<T>(
	request: NextRequest,
	handler: (playerId: string | null, username: string | null) => Promise<T>,
): Promise<NextResponse> {
	await connectDB()

	const auth = await getAuthFromRequest(request)

	try {
		const result = await handler(auth?.playerId ?? null, auth?.username ?? null)
		return successResponse(result)
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Operation failed'
		logger.error('[API] Handler error', error)
		return errorResponse(errorMessage)
	}
}
