import { useCallback } from 'react'
import { toast } from 'sonner'
import { useApiActions } from './apiClient'

export const useGuildActions = () => {
  const { authPost, authGet, authPut } = useApiActions()

  const getGuild = useCallback(async () => {
    try {
      const response = await authGet('/api/guilds')
      return response?.guild
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }, [authGet])

  const getGuilds = useCallback(async (sortBy: 'reputation' | 'level' | 'raidPower' | 'members' | 'xp' = 'reputation') => {
    try {
      return await authGet(`/api/guilds?list=true&sortBy=${sortBy}`)
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message, guilds: [] }
    }
  }, [authGet])

  const requestJoinGuild = useCallback(
    async (guildName: string, message?: string) => {
      try {
        const data = await authPut('/api/guilds', { guildName, message })
        return data
      } catch (error) {
        const err = error as Error
        throw err
      }
    },
    [authPut],
  )

  const getJoinRequests = useCallback(async () => {
    try {
      const data = await authPut('/api/guilds', { action: 'get_requests' })
      return data?.requests ?? []
    } catch (error) {
      return []
    }
  }, [authPut])

  const approveJoinRequest = useCallback(
    async (requestPlayerId: string) => {
      try {
        const data = await authPut('/api/guilds', { action: 'approve', requestPlayerId })
        toast.success(data.message || 'Join request approved!')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to approve request')
        return { success: false, message: err.message }
      }
    },
    [authPut],
  )

  const rejectJoinRequest = useCallback(
    async (requestPlayerId: string) => {
      try {
        const data = await authPut('/api/guilds', { action: 'reject', requestPlayerId })
        toast.success(data.message || 'Join request rejected')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to reject request')
        return { success: false, message: err.message }
      }
    },
    [authPut],
  )

  const cancelJoinRequest = useCallback(
    async (guildName: string) => {
      try {
        const data = await authPut('/api/guilds', { action: 'cancel', guildName })
        toast.success(data.message || 'Request cancelled')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to cancel request')
        return { success: false, message: err.message }
      }
    },
    [authPut],
  )

  const getMyApplications = useCallback(async () => {
    try {
      const data = await authPut('/api/guilds', { action: 'get_my_applications' })
      return data?.applications ?? []
    } catch (error) {
      return []
    }
  }, [authPut])

  // Legacy join function - redirects to request
  const joinGuild = useCallback(
    async (guildName: string) => {
      return requestJoinGuild(guildName)
    },
    [requestJoinGuild],
  )

  const createGuild = useCallback(
    async (guildName: string, motto = '') => {
      try {
        const data = await authPost('/api/guilds', { action: 'create', guildName, motto })
        toast.success(data.message || `Created ${guildName}!`)
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to create guild')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const leaveGuild = useCallback(async () => {
    try {
      const data = await authPost('/api/guilds/leave', {})
      toast.success(data.message || 'Left guild')
      return data
    } catch (error) {
      const err = error as Error
      toast.error(err.message || 'Failed to leave guild')
      return { success: false, message: err.message }
    }
  }, [authPost])

  const kickMember = useCallback(
    async (memberId: string) => {
      try {
        const data = await authPost('/api/guilds/members', { action: 'kick', memberId })
        toast.success(data.message || 'Member kicked')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to kick member')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const getChat = useCallback(async () => {
    try {
      const response = await authGet('/api/guilds/chat')
      return response?.chat ?? []
    } catch (error) {
      return []
    }
  }, [authGet])

  const sendChat = useCallback(
    async (text: string) => {
      try {
        return await authPost('/api/guilds/chat', { text })
      } catch (error) {
        const err = error as Error
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const setGuildName = useCallback(
    async (name: string) => {
      try {
        const data = await authPut('/api/guilds/settings', { name })
        toast.success(data.message || 'Guild name updated')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to update guild name')
        return { success: false, message: err.message }
      }
    },
    [authPut],
  )

  const setGuildMotto = useCallback(
    async (motto: string) => {
      try {
        const data = await authPut('/api/guilds/settings', { motto })
        toast.success(data.message || 'Guild motto updated')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to update guild motto')
        return { success: false, message: err.message }
      }
    },
    [authPut],
  )

  const transferLeadership = useCallback(
    async (memberId: string) => {
      try {
        const data = await authPost('/api/guilds/members', { action: 'transfer', memberId })
        toast.success(data.message || 'Leadership transferred')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to transfer leadership')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const donateMaterial = useCallback(
    async (materialName: string, batches: number = 1) => {
      try {
        const data = await authPost('/api/guilds/donate', { materialName, batches })
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to donate material')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  // ═══════════════════════════════════════════════════════════════════════════════
  // Guild Perks Actions
  // ═══════════════════════════════════════════════════════════════════════════════

  const getGuildPerks = useCallback(async () => {
    try {
      return await authGet('/api/guilds/perks')
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message, perks: null }
    }
  }, [authGet])

  const unlockPerk = useCallback(
    async (branchId: string, tier: number) => {
      try {
        const data = await authPost('/api/guilds/perks', { branchId, tier })
        toast.success(data.message || 'Perk unlocked!')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to unlock perk')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  // ══════════════════════════════════════════════════════════════════════���═��══════
  // Guild War Actions
  // ═══════════════════════════════════════════════════════════════════════════════

  const getWarOverview = useCallback(async () => {
    try {
      return await authGet('/api/guilds/war')
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }, [authGet])

  const getWarHistory = useCallback(
    async (limit = 10, skip = 0) => {
      try {
        return await authGet(`/api/guilds/war?history=true&limit=${limit}&skip=${skip}`)
      } catch (error) {
        const err = error as Error
        return { success: false, message: err.message, wars: [] }
      }
    },
    [authGet],
  )

  const joinWar = useCallback(async () => {
    try {
      const data = await authPost('/api/guilds/war', {})
      toast.success(data.message || 'Joined the war!')
      return data
    } catch (error) {
      const err = error as Error
      toast.error(err.message || 'Failed to join war')
      return { success: false, message: err.message }
    }
  }, [authPost])

  const attackOutpost = useCallback(
    async (outpostId: string) => {
      try {
        const data = await authPost('/api/guilds/war/outpost', { outpostId })
        toast.success(data.message || 'Attack started!')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to start attack')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const attackStronghold = useCallback(
    async (targetGuildId: string) => {
      try {
        const data = await authPost('/api/guilds/war/stronghold', { targetGuildId })
        toast.success(data.message || 'Attack started!')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to start attack')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const spendSupplies = useCallback(
    async (action: string, targetOutpostId?: string) => {
      try {
        const data = await authPost('/api/guilds/war/supplies', { action, targetOutpostId })
        toast.success(data.message || 'Supplies spent!')
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to spend supplies')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  const reviveStronghold = useCallback(
    async () => {
      try {
        const data = await authPost('/api/guilds/war/stronghold/revive', {})
        if (data.success) {
          toast.success(data.message || 'Stronghold revived!')
        } else {
          toast.error(data.message || 'Failed to revive stronghold')
        }
        return data
      } catch (error) {
        const err = error as Error
        toast.error(err.message || 'Failed to revive stronghold')
        return { success: false, message: err.message }
      }
    },
    [authPost],
  )

  return {
    getGuild,
    getGuilds,
    joinGuild,
    requestJoinGuild,
    cancelJoinRequest,
    getMyApplications,
    getJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    createGuild,
    leaveGuild,
    kickMember,
    getChat,
    sendChat,
    setGuildName,
    setGuildMotto,
    transferLeadership,
    donateMaterial,
    getGuildPerks,
    unlockPerk,
    getWarOverview,
    getWarHistory,
    joinWar,
    attackOutpost,
    attackStronghold,
    spendSupplies,
    reviveStronghold,
  }
}

export default useGuildActions
