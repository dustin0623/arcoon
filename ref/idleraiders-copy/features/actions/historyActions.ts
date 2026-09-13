import { useCallback } from 'react'
import { useApiActions } from './apiClient'

interface HistoryOptions {
  eventType?: string
  limit?: number
}

export const useHistoryActions = () => {
  const { authGet } = useApiActions()

  const getUserHistory = useCallback(
    async ({ eventType, limit = 50 }: HistoryOptions = {}) => {
      try {
        const params = new URLSearchParams()
        if (eventType) params.set('eventType', eventType)
        params.set('limit', limit.toString())
        return await authGet(`/api/history?${params.toString()}`)
      } catch (error) {
        const err = error as Error
        return { success: false, message: err.message }
      }
    },
    [authGet],
  )

  return {
    getUserHistory,
  }
}

export default useHistoryActions
