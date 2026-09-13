import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/config/database'
import { logger } from '@/lib/utils/logger'
import * as cardRepo from '@/lib/modules/cards/card.repository'
import GAME_DATA from '@/public/data'

interface GameCard {
	id: string
	name?: string
	rarity?: string
	type?: string
	supply?: { max?: number; minted?: number }
	source?: { type?: string }
	[key: string]: unknown
}

const CARDS_ARRAY = ((GAME_DATA as unknown as { CARDS?: GameCard[] }).CARDS ?? []) as GameCard[]

export async function GET(request: NextRequest): Promise<NextResponse> {
	await connectDB()

	try {
		const { searchParams } = new URL(request.url)
		const type = searchParams.get('type') || 'standard'
		const availableOnly = searchParams.get('availableOnly') === 'true'

		// Get minted supply from database
		const mintedAggregation = await cardRepo.getTotalSupplyAggregation()
		const mintedMap: Record<string, number> = {}
		mintedAggregation.forEach((item) => {
			mintedMap[item._id] = item.supply
		})

		if (type === 'standard') {
			// Standard cards (non-booster)
			const standardCards = CARDS_ARRAY.filter((c) => c && c.id && c.type !== 'booster')
			const supply: Record<string, number> = {}
			standardCards.forEach((card) => {
				supply[card.id] = mintedMap[card.id] ?? 0
			})

			return NextResponse.json({
				success: true,
				type: 'standard',
				supply,
				cards: standardCards.map((card) => ({
					...card,
					currentSupply: mintedMap[card.id] ?? 0,
				})),
			})
		}

		if (type === 'booster') {
			// Booster cards
			const boosterCards = CARDS_ARRAY.filter((c) => c && c.id && c.type === 'booster')

			if (availableOnly) {
				// Calculate total available supply (max - minted)
				let totalAvailable = 0
				const cardAvailability: Record<
					string,
					{ cardId: string; name?: string; maxSupply: number; minted: number; available: number }
				> = {}

				boosterCards.forEach((card) => {
					const maxSupply = card.supply?.max ?? 0
					const minted = mintedMap[card.id] ?? 0
					const available = Math.max(0, maxSupply - minted)
					cardAvailability[card.id] = {
						cardId: card.id,
						name: card.name,
						maxSupply,
						minted,
						available,
					}
					totalAvailable += available
				})

				return NextResponse.json({
					success: true,
					type: 'booster',
					totalAvailable,
					cardAvailability,
					cards: boosterCards.map((card) => ({
						...card,
						minted: mintedMap[card.id] ?? 0,
						available: cardAvailability[card.id]?.available ?? 0,
					})),
				})
			}

			// Regular booster supply
			const supply: Record<string, number> = {}
			boosterCards.forEach((card) => {
				supply[card.id] = mintedMap[card.id] ?? 0
			})

			return NextResponse.json({
				success: true,
				type: 'booster',
				supply,
				cards: boosterCards.map((card) => ({
					...card,
					currentSupply: mintedMap[card.id] ?? 0,
				})),
			})
		}

		if (type === 'special') {
			// Special rarity cards
			const specialCards = CARDS_ARRAY.filter((c) => c && c.id && c.rarity === 'special')
			const supply: Record<string, number> = {}
			specialCards.forEach((card) => {
				supply[card.id] = mintedMap[card.id] ?? 0
			})

			return NextResponse.json({
				success: true,
				type: 'special',
				supply,
				cards: specialCards.map((card) => ({
					...card,
					currentSupply: mintedMap[card.id] ?? 0,
				})),
			})
		}

		return NextResponse.json({ success: false, error: 'Invalid supply type' }, { status: 400 })
	} catch (error) {
		logger.error('[API] Card supply', error)
		return NextResponse.json({ success: false, error: 'Failed to fetch card supply' }, { status: 500 })
	}
}
