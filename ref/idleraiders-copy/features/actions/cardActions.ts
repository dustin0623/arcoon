import { useCallback } from 'react'
import { toast } from 'sonner'
import { useApiActions } from './apiClient'

export const useCardActions = () => {
  const { authPost } = useApiActions()

  const convertMaterial = useCallback(
    async (
      fromMaterialId: string,
      toMaterialId: string,
      opts?: { silent?: boolean; quantity?: number },
    ) => {
      try {
        const data = await authPost('/api/items/convert', { 
          fromMaterialId, 
          toMaterialId, 
          quantity: opts?.quantity ?? 1 
        })
        if (!opts?.silent) toast.success(data.message || 'Conversion complete!')
        return data
      } catch (error) {
        const err = error as Error
        if (!opts?.silent) toast.error(err.message || 'Conversion failed')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  return {
    convertMaterial,
  }
}

export default useCardActions
