import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { queueDeposit } from '@/lib/modules/transactions/transaction.service'
import { TOKEN_MAIN, TOKEN_PREMIUM, isTokenSymbol } from '@/lib/config/tokens'

export async function POST(request: NextRequest) {
  return withAuth(request, async (_playerId, username) => {
    const body = await request.json()
    const { transactionId, quantity, symbol } = body

    if (!transactionId) {
      throw new Error('Missing blockchain transaction ID')
    }
    if (!quantity || quantity <= 0) {
      throw new Error('Invalid deposit quantity')
    }
    if (!isTokenSymbol(symbol)) {
      throw new Error(`Invalid symbol. Must be ${TOKEN_MAIN} or ${TOKEN_PREMIUM}.`)
    }

    // username is JWT-verified; queueDeposit performs its own player/duplicate checks.
    const result = await queueDeposit(transactionId, username, { quantity, symbol })

    return result
  })
}
