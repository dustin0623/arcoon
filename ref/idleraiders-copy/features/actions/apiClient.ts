import { useCallback } from 'react'
import { useGame } from '@/context/GameContext'

export function useApiActions() {
  const { apiRequest } = useGame()

  const authPost = useCallback(async (endpoint: string, payload: Record<string, unknown> = {}) => {
    const result = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (!result.success) {
      throw new Error(result.error || 'Request failed')
    }

    // Delta updates are auto-applied in GameContext.apiRequest
    return result.data
  }, [apiRequest])

  const authGet = useCallback(async (endpoint: string) => {
    const result = await apiRequest(endpoint, {
      method: 'GET',
    })

    if (!result.success) {
      throw new Error(result.error || 'Request failed')
    }

    return result.data
  }, [apiRequest])

  const authPut = useCallback(async (endpoint: string, payload: Record<string, unknown> = {}) => {
    const result = await apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })

    if (!result.success) {
      throw new Error(result.error || 'Request failed')
    }

    // Delta updates are auto-applied in GameContext.apiRequest
    return result.data
  }, [apiRequest])

  return { authPost, authGet, authPut }
}

export default useApiActions
