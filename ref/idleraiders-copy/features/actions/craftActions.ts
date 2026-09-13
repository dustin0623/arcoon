import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useApiActions } from './apiClient'

interface CraftResult {
  success?: boolean
  message?: string
  delta?: {
    coins?: number
    materials?: Array<{ id: string; quantity: number }>
    cards?: Array<{ id: string; quantity: number }>
    stats?: Record<string, unknown>
    achievements?: unknown[]
  }
}

export const useCraftActions = () => {
  const { authPost } = useApiActions()
  const [isCrafting, setIsCrafting] = useState(false)

  const craftCard = useCallback(
    async (recipeId: string, opts?: { silent?: boolean }): Promise<CraftResult> => {
      setIsCrafting(true)
      try {
        const data = await authPost('/api/cards/craft', { recipeId })

        if (data?.success === false) {
          if (!opts?.silent) toast.error(data.message || 'Failed to craft card')
          return data
        }

        if (!opts?.silent) toast.success(data?.message || 'Card crafted successfully!')
        return data
      } catch (error) {
        const err = error as Error
        if (!opts?.silent) toast.error(err.message || 'Failed to craft card')
        return { success: false, message: err.message }
      } finally {
        setIsCrafting(false)
      }
    },
    [authPost],
  )

  return {
    isCrafting,
    craftCard,
  }
}
