import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/config/database'
import { withAuth } from '@/lib/api/auth'
import { logger } from '@/lib/utils/logger'
import { getListings, cancelListing, getRecentSales } from '@/lib/modules/markets/market.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

// Get listings
export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		await connectDB()

		const { searchParams } = new URL(request.url)
		const type = searchParams.get('type') || undefined
		const rarity = searchParams.get('rarity') || undefined
		const recent = searchParams.get('recent') === 'true'

		if (recent) {
			const sales = await getRecentSales()
			return NextResponse.json({ success: true, sales })
		}

		const result = await getListings({ type, rarity })
		return NextResponse.json({ success: true, ...result })
	} catch (error) {
		logger.error('[API] /api/market/listings GET', error)
		return NextResponse.json({ success: false, error: 'Failed to fetch listings' }, { status: 500 })
	}
}

// Cancel a listing
export async function DELETE(request: NextRequest) {
	return withAuth(request, async (playerId) => {
		const body = await request.json()
		const { listingId } = body

		if (!listingId) {
			throw new Error('Missing listingId')
		}

		await cancelListing(playerId, listingId)
		const updatedState = await buildPlayerStateById(playerId)

		return {
			message: 'Listing cancelled.',
			cards: updatedState.cards,
			materials: updatedState.materials,
			stats: updatedState.stats,
			achievements: updatedState.achievements,
		}
	})
}
