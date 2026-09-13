import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import * as marketService from '@/lib/modules/markets/market.service'

export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { listingId } = body

    if (!listingId) {
      throw new Error('Missing listingId')
    }

    // Process the purchase directly
    const { listing, player } = await marketService.buyCardListing(playerId, listingId)

    return {
      success: true,
      message: 'Purchase completed successfully',
      listingId,
      coins: player.coins,
      card: {
        id: listing.cardId,
        name: listing.cardName,
        rarity: listing.cardRarity,
        quantity: listing.quantity,
      },
    }
  })
}
