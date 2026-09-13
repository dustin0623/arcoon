import { useCallback } from 'react'
import { toast } from 'sonner'
import { useApiActions } from './apiClient'

export const usePlayerActions = () => {
  const { authPost, authGet } = useApiActions()

  const getPlayerState = useCallback(async () => {
    try {
      return await authGet('/api/players/state')
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }, [authGet])

  const regenerateEnergy = useCallback(async () => {
    try {
      const data = await authPost('/api/players/energy', {})
      toast.success(data.message || 'Energy regenerated!')
      return data
    } catch (error) {
      const err = error as Error
      toast.error(err.message || 'Failed to regenerate energy')
      return { success: false, message: err.message }
    }
  }, [authPost])

  const checkGameVersion = useCallback(
    async (version: string) => {
      try {
        return await authGet('/api/players/version')
      } catch (error) {
        const err = error as Error
        return { success: false, message: err.message }
      }
    },
    [authGet],
  )

  const upgradeStorageSlots = useCallback(async () => {
    try {
      const data = await authPost('/api/players/storage', { action: 'upgrade' })
      toast.success(data.message || 'Storage upgraded!')
      return data
    } catch (error) {
      const err = error as Error
      toast.error(err.message || 'Failed to upgrade storage')
      return { success: false, message: err.message }
    }
  }, [authPost])

  const registerPlayer = useCallback(
    async (transactionId: string) => {
      try {
        return await authPost('/api/players/register', { transactionId })
      } catch (error) {
        const err = error as Error
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const getReferrals = useCallback(async () => {
    try {
      return await authGet('/api/players/referrals')
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }, [authGet])

  return {
    getPlayerState,
    regenerateEnergy,
    checkGameVersion,
    upgradeStorageSlots,
    registerPlayer,
    getReferrals,
  }
}

export default usePlayerActions
