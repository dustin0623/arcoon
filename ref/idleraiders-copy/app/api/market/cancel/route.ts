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

    // Cancel the listing directly
    const result = await marketService.cancelListing(playerId, listingId)

    return {
      success: true,
      message: 'Listing cancelled successfully',
      listingId,
    }
  })
}
