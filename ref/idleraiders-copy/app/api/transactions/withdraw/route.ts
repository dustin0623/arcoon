import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { queueWithdraw } from '@/lib/modules/transactions/transaction.service'
import { TOKEN_MAIN, TOKEN_PREMIUM, isTokenSymbol } from '@/lib/config/tokens'

export async function POST(request: NextRequest) {
  return withAuth(request, async (_playerId, username) => {
    const body = await request.json()
    const { quantity, symbol, to } = body

    if (!quantity || quantity <= 0) {
      throw new Error('Invalid withdrawal quantity')
    }
    if (!isTokenSymbol(symbol)) {
      throw new Error(`Invalid symbol. Must be ${TOKEN_MAIN} or ${TOKEN_PREMIUM}.`)
    }
    if (!to) {
      throw new Error('Missing recipient address')
    }

    // username is JWT-verified; queueWithdraw performs its own balance pre-check
    // and reservation. The atomic deduction in the processor is the authoritative
    // guard against over-spending.
    const result = await queueWithdraw(username, { quantity, symbol, to })

    return result
  })
}
