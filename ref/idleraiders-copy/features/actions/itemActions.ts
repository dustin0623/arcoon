import { useCallback } from 'react'
import { toast } from 'sonner'
import { useApiActions } from './apiClient'

export const useItemActions = () => {
  const { authPost } = useApiActions()

  const usePotion = useCallback(
    async (type: 'energy_potion' | 'exp_potion') => {
      try {
        const data = await authPost('/api/items/potion', { type })
        toast.success(data.message || 'Potion used!')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to use potion')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  return {
    usePotion,
  }
}

export default useItemActions
