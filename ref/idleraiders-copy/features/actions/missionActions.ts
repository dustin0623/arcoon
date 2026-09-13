import { useCallback } from 'react'
import { toast } from 'sonner'
import type { TrainingType } from '@/lib/modules/missions/mission.model'
import { useApiActions } from './apiClient'

export const useMissionActions = () => {
  const { authPost } = useApiActions()

  const startMission = useCallback(
    async (dungeonId: string, missionTypeId: string, questNumber: number | null = null) => {
      try {
        const data = await authPost('/api/missions/start', {
          dungeonId,
          missionTypeId,
          ...(questNumber != null ? { questNumber } : {}),
        })
        toast.success(data.message || 'Mission started!')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to start mission')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const completeMission = useCallback(
    async (missionId: string) => {
      try {
        const data = await authPost('/api/missions/complete', { missionId })
        // If mission was cleared (already completed or not found), show info toast instead
        if (data.cleared) {
          toast.info('Mission cleared - you can start a new one')
        } else {
          toast.success(data.message || 'Mission completed!')
        }
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to complete mission')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const attackBoss = useCallback(
    async (bossId: string, raidPower = 100) => {
      try {
        const data = await authPost('/api/missions/boss', { bossId, raidPower })
        toast.success(data.message || 'Boss attacked!')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to attack boss')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  // Training shares the unified mission start endpoint — the route discriminates
  // by the presence of `type` in the body and dispatches to `startTraining` on
  // the server. Completion flows through `completeMission` above.
  const startTraining = useCallback(
    async (type: TrainingType) => {
      try {
        const data = await authPost('/api/missions/start', { type })
        toast.success(data.message || 'Training started!')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to start training')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  return {
    startMission,
    completeMission,
    attackBoss,
    startTraining,
  }
}

export default useMissionActions
