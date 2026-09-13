import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { openPacks, buyPacks } from '@/lib/modules/items/item.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'

// Open a pack (or multiple packs in one request)
export async function PUT(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { packId, quantity } = body as { packId?: string; quantity?: number }

    if (!packId) {
      throw new Error('Missing packId')
    }

    // Default to 1 when the client omits quantity (backwards compatible).
    const qty =
      typeof quantity === 'number' && Number.isFinite(quantity) && quantity >= 1
        ? Math.min(Math.floor(quantity), 10)
        : 1

    const result = await openPacks(playerId, packId, qty)
    const updatedState = await buildPlayerStateById(playerId)

    return {
      ...result,
      message: qty > 1 ? `${qty} packs opened!` : 'Pack opened!',
      delta: {
        cards: updatedState.cards,
        stats: updatedState.stats,
        packs: updatedState.packs,
        achievements: updatedState.achievements,
      },
    }
  })
}

// Buy packs
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { packId, quantity, paymentMethod } = body

    if (!packId) {
      throw new Error('Missing packId')
    }

    const result = await buyPacks(playerId, packId, quantity || 1, paymentMethod || 'coins')
    const updatedState = await buildPlayerStateById(playerId)

    return {
      ...result,
      message: `Purchased ${quantity || 1} pack${quantity !== 1 ? 's' : ''}!`,
      delta: {
        coins: updatedState.coins,
        shards: updatedState.shards,
        dollars: updatedState.dollars,
        packs: updatedState.packs,
        achievements: updatedState.achievements,
      },
    }
  })
}
