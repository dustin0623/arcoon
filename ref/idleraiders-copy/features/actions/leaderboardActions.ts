import { useCallback } from 'react'
import { useApiActions } from './apiClient'

/**
 * Centralized leaderboard API calls.
 * All three endpoints are consolidated here so callers never hit /api/leaderboard*
 * URLs directly.
 */
export const useLeaderboardActions = () => {
  const { authGet } = useApiActions()

  /**
   * Fetch the live, computed leaderboard for the current week.
   * Returns the inner payload shape: { weekNumber, startDate, endDate, global, guild }.
   *
   * Note: the underlying route double-wraps the body
   * (`{ success, data: { success, data: {...} } }`) in some environments; we
   * normalize that here so callers always get the flat leaderboard shape.
   */
  const getCurrentLeaderboard = useCallback(async () => {
    try {
      const data = await authGet('/api/leaderboard')
      // authGet already unwraps one layer. Some deployments still return
      // { success, data: {...} } in the inner body, so unwrap once more if needed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = data as any
      return body?.data ?? body
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }, [authGet])

  /**
   * Fetch a list of historical leaderboards (most recent first).
   * Pass `includeActive` to prepend the in-progress week as a synthetic snapshot.
   * Returns `{ success, snapshots, total }`.
   */
  const getLeaderboardHistory = useCallback(
    async ({ limit = 10, includeActive = false }: { limit?: number; includeActive?: boolean } = {}) => {
      try {
        const params = new URLSearchParams()
        params.set('limit', limit.toString())
        if (includeActive) params.set('includeActive', 'true')
        return await authGet(`/api/leaderboard/history?${params.toString()}`)
      } catch (error) {
        const err = error as Error
        return { success: false, message: err.message, snapshots: [] }
      }
    },
    [authGet],
  )

  /**
   * Fetch a single historical (or live-active) leaderboard by week number.
   * Returns `{ success, snapshot }` where snapshot is null when not found.
   */
  const getLeaderboardByWeek = useCallback(
    async (weekNumber: number) => {
      try {
        return await authGet(`/api/leaderboard/history?week=${weekNumber}`)
      } catch (error) {
        const err = error as Error
        return { success: false, message: err.message, snapshot: null }
      }
    },
    [authGet],
  )

  return {
    getCurrentLeaderboard,
    getLeaderboardHistory,
    getLeaderboardByWeek,
  }
}

export default useLeaderboardActions
