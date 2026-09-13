import { useCallback } from 'react'
import { useApiActions } from './apiClient'

interface MarketFilters {
  category?: string
  rarity?: string
  type?: string
  sort?: string
}

export const useMarketActions = () => {
  const { authPost, authGet } = useApiActions()

  const getListings = useCallback(
    async (filters?: MarketFilters) => {
      try {
        const queryParams = new URLSearchParams()
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.set(key, value)
          })
        }
        const url = `/api/market/listings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        return await authGet(url)
      } catch (error) {
        const err = error as Error
        return { success: false, message: err.message }
      }
    },
    [authGet],
  )

  const buyCard = useCallback(
    async (listingId: string) => {
      try {
        const data = await authPost('/api/market/buy', { listingId, type: 'card' })
        return data
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [authPost],
  )

  const sellCard = useCallback(
    async (cardId: string, quantity: number, price: number) => {
      try {
        const data = await authPost('/api/market/sell', { cardId, quantity, price, type: 'card' })
        return data
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [authPost],
  )

  const cancelListing = useCallback(
    async (listingId: string) => {
      try {
        const data = await authPost('/api/market/cancel', { listingId })
        return data
      } catch (error) {
        const err = error as Error
        return { success: false, error: err.message }
      }
    },
    [authPost],
  )

  const getRecentSales = useCallback(async () => {
    try {
      return await authGet('/api/market/listings?recentSales=true')
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }, [authGet])

  return {
    getListings,
    buyCard,
    sellCard,
    cancelListing,
    getRecentSales,
  }
}

export default useMarketActions
