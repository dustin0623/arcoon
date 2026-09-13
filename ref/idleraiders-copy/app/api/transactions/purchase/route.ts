import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/config/database'
import { withAuth } from '@/lib/api/auth'
import { queueDollarPurchase } from '@/lib/modules/transactions/transaction.service'
import { createPurchaseQuote, HivePriceNotInitializedError } from '@/lib/modules/transactions/transaction.logic'

// Get purchase quote
export async function GET(request: NextRequest): Promise<NextResponse> {
  await connectDB()

  try {
    const { searchParams } = new URL(request.url)
    const quantity = parseInt(searchParams.get('quantity') || '1', 10)
    if (quantity < 1) {
      return NextResponse.json({ success: false, error: 'Quantity must be at least 1' }, { status: 400 })
    }

    const quote = await createPurchaseQuote(quantity)
    return NextResponse.json({ success: true, quote })
  } catch (error) {
    if (error instanceof HivePriceNotInitializedError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 503 })
    }
    const err = error as Error
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}

// Create purchase transaction or get quote
export async function POST(request: NextRequest) {
  return withAuth(request, async (_playerId, username) => {
    const body = await request.json()
    const { action, transactionId, quantity } = body

    // Handle quote request
    if (action === 'quote') {
      if (!quantity || quantity < 1) {
        throw new Error('Quantity must be at least 1')
      }
      const quote = await createPurchaseQuote(quantity)
      return { quote }
    }

    // Handle purchase request (default action)
    if (!transactionId) {
      throw new Error('Missing blockchain transaction ID')
    }
    if (!quantity || quantity < 1) {
      throw new Error('Invalid quantity')
    }

    // username is JWT-verified; queueDollarPurchase performs its own checks.
    const result = await queueDollarPurchase(transactionId, username, { quantity })

    return result
  })
}
