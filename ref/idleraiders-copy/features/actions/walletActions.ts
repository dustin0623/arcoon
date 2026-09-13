import { useCallback } from 'react'
import { toast } from 'sonner'
import { useApiActions } from './apiClient'

export const useWalletActions = () => {
  const { authPost, authGet } = useApiActions()

  const getBalances = useCallback(async () => {
    try {
      return await authGet('/api/players/state')
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }, [authGet])

  const deposit = useCallback(
    async (transactionId: string, quantity: number, symbol = 'REALMC') => {
      try {
        const data = await authPost('/api/transactions/deposit', { transactionId, quantity, symbol })
        toast.success(data.message || 'Deposit initiated')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to create deposit')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const withdraw = useCallback(
    async (quantity: number, symbol: string, to: string) => {
      try {
        const data = await authPost('/api/transactions/withdraw', { quantity, symbol, to })
        toast.success(data.message || 'Withdrawal initiated')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to create withdrawal')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const fetchPurchaseQuote = useCallback(
    async (quantity: number) => {
      try {
        const response = await authPost('/api/transactions/purchase', { action: 'quote', quantity })
        return response.quote ?? null
      } catch {
        return null
      }
    },
    [authPost],
  )

  const purchase = useCallback(
    async (transactionId: string, quantity: number) => {
      try {
        const data = await authPost('/api/transactions/purchase', { action: 'purchase', transactionId, quantity })
        toast.success(data.message || 'Purchase initiated')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to create purchase')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const registration = useCallback(
    async (transactionId: string, referral: string) => {
      try {
        const data = await authPost('/api/transactions/registration', { transactionId, referral })
        toast.success(data.message || 'Registration initiated')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to create registration')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  return {
    getBalances,
    deposit,
    withdraw,
    fetchPurchaseQuote,
    purchase,
    registration,
  }
}

export default useWalletActions
