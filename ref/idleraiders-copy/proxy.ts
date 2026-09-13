import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { logger } from '@/lib/utils/logger'
import { JWT_SECRET_ENCODED } from '@/lib/config/config'

interface JWTPayload {
	playerId: string
	username: string
	iat: number
	exp: number
}

// Routes that require authentication
const PROTECTED_ROUTES = ['/game']

// Routes that are public (no auth required)
const PUBLIC_ROUTES = ['/login', '/docs', '/']

async function verifyToken(token: string): Promise<JWTPayload | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET_ENCODED)
		return payload as unknown as JWTPayload
	} catch (error) {
		logger.debug('Proxy', 'Token verification failed')
		return null
	}
}

export async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname

	// Skip proxy for API routes (API routes have their own auth)
	if (pathname.startsWith('/api')) {
		return NextResponse.next()
	}

	// Check if route is protected
	const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
	const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route))

	if (!isProtectedRoute && !isPublicRoute) {
		// Routes not explicitly protected or public are allowed (e.g., docs, static pages)
		return NextResponse.next()
	}

	// Get token from cookies (set by AuthContext)
	const token = request.cookies.get('auth_token')?.value

	// For protected routes
	if (isProtectedRoute) {
		if (!token) {
			// No token, redirect to login
			return NextResponse.redirect(new URL('/login', request.url))
		}

		const payload = await verifyToken(token)
		if (!payload) {
			// Invalid or expired token, redirect to login
			const response = NextResponse.redirect(new URL('/login?session_expired=true', request.url))
			// Clear invalid token cookie
			response.cookies.delete('auth_token')
			return response
		}

		// Token is valid, continue
		return NextResponse.next()
	}

	// For public routes, if user is authenticated and tries to access login, redirect to game
	if (isPublicRoute && pathname === '/login') {
		if (token) {
			const payload = await verifyToken(token)
			if (payload) {
				// User is authenticated, redirect to game
				return NextResponse.redirect(new URL('/game', request.url))
			}
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|public).*)',
	],
}
