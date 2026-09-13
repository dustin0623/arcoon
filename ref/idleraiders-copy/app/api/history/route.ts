import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { getHistory } from '@/lib/modules/histories/history.service'

export async function GET(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType') || undefined
    const source = searchParams.get('source') || undefined
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const result = await getHistory(playerId, { eventType, source, limit })

    return { history: result.entries, total: result.total }
  })
}
