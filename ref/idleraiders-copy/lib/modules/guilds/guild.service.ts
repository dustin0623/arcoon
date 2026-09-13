import { type IGuildDocument } from './guild.model'
import * as guildRepo from './guild.repository' // Guild repository
import * as guildWarRepo from '../guildwars/guildwar.repository'
import * as playerRepo from '../players/player.repository'
import * as itemRepo from '../items/item.repository'
import * as historyService from '../histories/history.service'
import * as guildLogic from './guild.logic'
import { buildPlayerState, getRawCardBoostsById } from '../players/player.builder'
import GAME_DATA from '@/public/data'
import { TOKEN_MAIN } from '@/lib/config/tokens'

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const GUILD_MIN_LEVEL = 16

interface GuildMemberInfo {
  id: string
  name: string
  motto: string
  level: number
  xp: number
  memberCount: number
  maxMembers: number
  isFull: boolean
  // Ranking fields
  totalRaidPower: number
  reputation: number
  rank: number
}

interface ChatMessage {
  sender: string
  text: string
  timestamp: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

async function logHistorySafe(payload: Record<string, unknown>): Promise<void> {
  try {
    await historyService.logEvent(payload)
  } catch (error) {
    const err = error as Error
    console.warn('[GuildService] history log skipped:', err.message)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Reputation & Ranking Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function calculateGuildReputation(guildId: string): Promise<number> {
  const guild = await guildRepo.findById(guildId)
  if (!guild) return 0
  
  // Get war entry for valor
  const warEntry = await guildWarRepo.findEntryByGuild(guildId)
  const weeklyValor = warEntry?.valor ?? 0
  
  // Calculate components
  const baseScore = guild.level * 500
  
  // Activity calculation (members active in last 24 hours)
  const now = Date.now()
  const activeMembers = guild.members.filter(m => 
    now - new Date(m.lastActive).getTime() < 24 * 60 * 60 * 1000
  ).length
  const activityRatio = guild.members.length > 0 
    ? activeMembers / guild.members.length 
    : 0
  
  // Get actual player levels for activity bonus
  const memberIds = guild.members.map(m => m.playerId.toString())
  const players = await playerRepo.findByIds(memberIds)
  const playerLevelMap = new Map(players.map(p => [p._id.toString(), p.level ?? 1]))
  
  const avgMemberLevel = guild.members.length > 0
    ? guild.members.reduce((sum, m) => sum + (playerLevelMap.get(m.playerId.toString()) ?? 1), 0) / guild.members.length
    : 1
  const activityBonus = activityRatio * (avgMemberLevel * 100)
  
  // War bonus with activity multiplier
  let activityMultiplier = 0.5
  if (activityRatio > 0.75) activityMultiplier = 2.0
  else if (activityRatio > 0.50) activityMultiplier = 1.5
  else if (activityRatio > 0.25) activityMultiplier = 1.0
  
  const warBonus = (weeklyValor / 1000) * activityMultiplier
  
  // Reputation does NOT include raid power (raid power is bragging rights only)
  const reputation = Math.floor(baseScore + activityBonus + warBonus)
  
  // Calculate total raid power from actual player cards (not cached guild member data)
  let totalRaidPower = 0
  for (const member of guild.members) {
    const rawValues = await getRawCardBoostsById(member.playerId)
    totalRaidPower += rawValues.raidPower
    
    // Also update the cached raidPower on the guild member
    await guildRepo.updateMemberRaidPower(guildId, member.playerId.toString(), rawValues.raidPower)
  }
  
  // Update cached values
  await guildRepo.updateReputationCache(guildId, {
    reputation,
    totalRaidPower,
    activeMembers24h: activeMembers,
    lastReputationUpdate: new Date()
  })
  
  return reputation
}

export async function calculateAllGuildReputations(): Promise<void> {
  const guilds = await guildRepo.findAllLean()
  for (const guild of guilds) {
    await calculateGuildReputation(guild._id.toString())
  }
}

// Redis key for tracking last global reputation update
const REDIS_REPUTATION_LAST_UPDATE_KEY = 'idleraiders:guild_reputation_last_update'
const REPUTATION_UPDATE_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Check if guild reputations need to be recalculated (on-demand).
 * Uses Redis to track last update time globally - avoids checking each guild individually.
 * Only recalculates if more than 1 hour has passed since last update.
 */
export async function checkAndUpdateReputationsIfNeeded(): Promise<{
  updated: boolean
  lastUpdate: Date | null
  nextUpdate: Date | null
}> {
  try {
    const { getRedisConnection } = await import('@/lib/config/redis')
    const redis = getRedisConnection()
    
    // Check last update time from Redis
    const lastUpdateStr = await redis.get(REDIS_REPUTATION_LAST_UPDATE_KEY)
    const lastUpdate = lastUpdateStr ? new Date(parseInt(lastUpdateStr, 10)) : null
    const now = Date.now()
    
    // If never updated or more than 1 hour ago, recalculate
    if (!lastUpdate || (now - lastUpdate.getTime()) > REPUTATION_UPDATE_INTERVAL_MS) {
      console.log('[idleraiders-logs] Guild reputations stale, recalculating...')
      
      // Set the update time immediately to prevent concurrent recalculations
      await redis.set(REDIS_REPUTATION_LAST_UPDATE_KEY, now.toString(), 'EX', 7200) // 2 hour TTL
      
      // Recalculate all guild reputations
      await calculateAllGuildReputations()
      
      console.log('[idleraiders-logs] Guild reputations recalculated')
      const nextUpdate = new Date(now + REPUTATION_UPDATE_INTERVAL_MS)
      return { updated: true, lastUpdate: new Date(now), nextUpdate }
    }
    
    const nextUpdate = new Date(lastUpdate.getTime() + REPUTATION_UPDATE_INTERVAL_MS)
    return { updated: false, lastUpdate, nextUpdate }
  } catch (error) {
    console.error('[idleraiders-logs] Error checking/updating reputations:', error)
    // On error, don't block - just return without updating
    return { updated: false, lastUpdate: null, nextUpdate: null }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Query Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function getGuild(playerId: string): Promise<IGuildDocument | null> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  if (!player.guildId) return null
  
  // Update member's lastActive timestamp (non-blocking)
  guildRepo.updateMemberLastActive(player.guildId, player._id).catch(() => {})
  
  return guildRepo.findById(player.guildId)
}

export async function getAvailableGuilds(
  sortBy: 'reputation' | 'level' | 'raidPower' | 'members' | 'xp' = 'reputation'
): Promise<GuildMemberInfo[]> {
  const guilds = await guildRepo.findAllSortedForBrowse(sortBy)

  const result = guilds
    .map((g) => {
      const maxMembers = guildLogic.getMaxMembersForLevel(g.level)
      return {
        id: g._id.toString(),
        name: g.name,
        motto: g.motto || '',
        level: g.level,
        xp: g.xp,
        memberCount: g.members.length,
        maxMembers,
        isFull: g.members.length >= maxMembers,
        totalRaidPower: g.totalRaidPower ?? 0,
        reputation: g.reputation ?? 0,
        rank: 0, // Will be set below
      }
    })
    .filter((g) => !g.isFull)

  // Assign ranks based on reputation (after filtering)
  const sortedByRep = [...result].sort((a, b) => b.reputation - a.reputation)
  sortedByRep.forEach((g, idx) => {
    g.rank = idx + 1
  })

  // Re-sort by the requested field
  if (sortBy === 'reputation') {
    return sortedByRep
  }
  
  // Sort by other fields while keeping rank
  const sortFns: Record<string, (a: GuildMemberInfo, b: GuildMemberInfo) => number> = {
    level: (a, b) => b.level - a.level || b.xp - a.xp,
    raidPower: (a, b) => b.totalRaidPower - a.totalRaidPower,
    members: (a, b) => b.memberCount - a.memberCount,
    xp: (a, b) => b.xp - a.xp,
  }
  
  return result.sort(sortFns[sortBy] || sortFns.level)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Guild Management
// ═══════════════════════════════════════════════════════════════════════════════

export async function createGuild(
  playerId: string,
  guildName: string,
  motto = ''
): Promise<IGuildDocument> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  if (player.guildId) throw new Error('Already in a guild')
  if (player.level < GUILD_MIN_LEVEL) {
    throw new Error(`You must reach level ${GUILD_MIN_LEVEL} to create a guild`)
  }
  if (!guildName || guildName.trim().length === 0) throw new Error('Guild name is required')

  const CREATION_FEE = GAME_DATA.PROGRESSION?.GUILDS?.CREATION_FEE ?? 10000
  if ((player.coins ?? 0) < CREATION_FEE) {
    throw new Error(`Insufficient Realm Coins. Guild creation costs ${CREATION_FEE.toLocaleString()} ${TOKEN_MAIN}.`)
  }

  // Create guild
  const guild = await guildRepo.create({
    name: guildName,
    motto,
    members: [
      {
        playerId: player._id,
        name: player.username,
        role: 'leader',
        raidPower: 0,
        totalGuildDamage: 0,
      },
    ],
  })

  // Update player
  await playerRepo.updateGuildAndCoins(player._id, guild._id, -CREATION_FEE)

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.created',
    metadata: {
      action: 'Created guild',
      type: 'create',
      guildId: guild._id.toString(),
      guildName: guild.name,
      member: player.username,
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild'],
  })

  return guild
}

export async function requestToJoinGuild(
  playerId: string, 
  guildName: string,
  message?: string
): Promise<{ success: boolean; message: string }> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  if (player.guildId) throw new Error('Already in a guild')
  if (player.level < GUILD_MIN_LEVEL) {
    throw new Error(`You must reach level ${GUILD_MIN_LEVEL} to join a guild`)
  }

  const guild = await guildRepo.findByName(guildName)
  if (!guild) throw new Error('Guild not found')

  const maxMembers = guildLogic.getMaxMembersForLevel(guild.level)
  if (guild.members.length >= maxMembers) {
    throw new Error(`Guild is full (${guild.members.length}/${maxMembers} members at level ${guild.level})`)
  }

  // Check if already has a pending request
  const hasRequest = await guildRepo.hasJoinRequest(guild._id, player._id)
  if (hasRequest) {
    throw new Error('You already have a pending request to join this guild')
  }

  // Get player stats (level and raidPower)
  const playerState = await buildPlayerState(player)
  const raidPower = playerState.stats?.raidPower ?? 0

  // Add join request with level and raidPower
  await guildRepo.addJoinRequest(guild._id, player._id, player.username, player.level, raidPower, message)

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.join_requested',
    metadata: {
      action: 'Requested to join guild',
      type: 'request',
      guildId: guild._id.toString(),
      guildName: guild.name,
      member: player.username,
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild'],
  })

  return { success: true, message: `Request sent to ${guild.name}` }
}

export async function approveJoinRequest(
  approverId: string, 
  requestPlayerId: string
): Promise<IGuildDocument> {
  const approver = await playerRepo.findById(approverId)
  if (!approver) throw new Error('Approver not found')
  if (!approver.guildId) throw new Error('You are not in a guild')

  const guild = await guildRepo.findById(approver.guildId)
  if (!guild) throw new Error('Guild not found')

  // Check permissions
  const member = guildRepo.findMemberByPlayerId(guild, approver._id)
  if (!member || (member.role !== 'leader' && member.role !== 'officer')) {
    throw new Error('Only leaders and officers can approve join requests')
  }

  // Check if request exists
  const hasRequest = await guildRepo.hasJoinRequest(guild._id, requestPlayerId)
  if (!hasRequest) {
    throw new Error('Join request not found')
  }

  // Check if guild is full (based on guild level)
  const maxMembers = guildLogic.getMaxMembersForLevel(guild.level)
  if (guild.members.length >= maxMembers) {
    throw new Error(`Guild is full (${guild.members.length}/${maxMembers} members at level ${guild.level})`)
  }

  // Get the requesting player
  const requestingPlayer = await playerRepo.findById(requestPlayerId)
  if (!requestingPlayer) throw new Error('Requesting player not found')
  if (requestingPlayer.guildId) throw new Error('Player already joined another guild')

  // Remove the request and add member
  await guildRepo.removeJoinRequest(guild._id, requestPlayerId)
  await guildRepo.addMember(guild._id, {
    playerId: requestingPlayer._id,
    name: requestingPlayer.username,
    role: 'member',
    raidPower: 0,
    totalGuildDamage: 0,
  })

  // Update player's guild reference
  await playerRepo.setGuildId(requestingPlayer._id, guild._id)

  // Remove all other pending applications from this player to other guilds
  await guildRepo.removeAllPlayerApplications(requestingPlayer._id)

  // Refetch guild after update
  const updatedGuild = await guildRepo.findById(guild._id)
  if (!updatedGuild) throw new Error('Guild not found after update')

  await logHistorySafe({
    playerId: approver._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.join_approved',
    metadata: {
      action: 'Approved join request',
      type: 'approve',
      guildId: guild._id.toString(),
      guildName: guild.name,
      approver: approver.username,
      member: requestingPlayer.username,
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild'],
  })

  return updatedGuild
}

export async function rejectJoinRequest(
  rejecterId: string, 
  requestPlayerId: string
): Promise<{ success: boolean; message: string }> {
  const rejecter = await playerRepo.findById(rejecterId)
  if (!rejecter) throw new Error('Rejecter not found')
  if (!rejecter.guildId) throw new Error('You are not in a guild')

  const guild = await guildRepo.findById(rejecter.guildId)
  if (!guild) throw new Error('Guild not found')

  // Check permissions
  const member = guildRepo.findMemberByPlayerId(guild, rejecter._id)
  if (!member || (member.role !== 'leader' && member.role !== 'officer')) {
    throw new Error('Only leaders and officers can reject join requests')
  }

  // Check if request exists
  const hasRequest = await guildRepo.hasJoinRequest(guild._id, requestPlayerId)
  if (!hasRequest) {
    throw new Error('Join request not found')
  }

  // Remove the request
  await guildRepo.removeJoinRequest(guild._id, requestPlayerId)

  const requestingPlayer = await playerRepo.findById(requestPlayerId)

  await logHistorySafe({
    playerId: rejecter._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.join_rejected',
    metadata: {
      action: 'Rejected join request',
      type: 'reject',
      guildId: guild._id.toString(),
      guildName: guild.name,
      rejecter: rejecter.username,
      member: requestingPlayer?.username || 'Unknown',
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild'],
  })

  return { success: true, message: 'Join request rejected' }
}

export async function getJoinRequests(playerId: string): Promise<{ 
  playerId: string
  playerName: string
  message?: string
  appliedAt: Date
}[]> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  if (!player.guildId) throw new Error('You are not in a guild')

  const guild = await guildRepo.findById(player.guildId)
  if (!guild) throw new Error('Guild not found')

  // Check permissions
  const member = guildRepo.findMemberByPlayerId(guild, player._id)
  if (!member || (member.role !== 'leader' && member.role !== 'officer')) {
    throw new Error('Only leaders and officers can view join requests')
  }

  const requests = await guildRepo.getJoinRequests(guild._id)
  return requests.map(r => ({
    playerId: r.playerId.toString(),
    playerName: r.playerName,
    level: r.level ?? 1,
    raidPower: r.raidPower ?? 0,
    message: r.message,
    appliedAt: r.appliedAt,
  }))
}

export async function cancelJoinRequest(
  playerId: string,
  guildName: string
): Promise<{ success: boolean; message: string }> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  const guild = await guildRepo.findByName(guildName)
  if (!guild) throw new Error('Guild not found')

  // Check if player has a pending request
  const hasRequest = await guildRepo.hasJoinRequest(guild._id, player._id)
  if (!hasRequest) {
    throw new Error('No pending request found for this guild')
  }

  // Remove the request
  await guildRepo.removeJoinRequest(guild._id, player._id)

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.join_cancelled',
    metadata: {
      action: 'Cancelled join request',
      type: 'cancel',
      guildId: guild._id.toString(),
      guildName: guild.name,
      member: player.username,
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild'],
  })

  return { success: true, message: `Cancelled request to join ${guild.name}` }
}

export async function getPlayerPendingApplications(
  playerId: string
): Promise<{ guildId: string; guildName: string; appliedAt: Date }[]> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  
  return guildRepo.findPlayerPendingApplications(player._id)
}

// Legacy function - keep for backwards compatibility but redirect to request system
export async function joinGuild(playerId: string, guildName: string): Promise<IGuildDocument> {
  // For backwards compatibility, try to request to join
  await requestToJoinGuild(playerId, guildName)
  // Throw an error indicating the request was sent
  throw new Error('Join request sent! Please wait for approval from guild officers.')
}

export async function leaveGuild(playerId: string): Promise<void> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  if (!player.guildId) throw new Error('Not in a guild')

  const guild = await guildRepo.findById(player.guildId)
  if (!guild) throw new Error('Guild not found')

  const guildName = guild.name
  const guildId = guild._id.toString()

  // Remove member
  await guildRepo.removeMember(guild._id, player._id)

  // Refetch to check remaining members
  const updatedGuild = await guildRepo.findById(guild._id)

  if (!updatedGuild || updatedGuild.members.length === 0) {
    await guildRepo.deleteById(guild._id)
  } else {
    // Promote new leader if needed
    if (!guildRepo.hasLeader(updatedGuild) && updatedGuild.members.length > 0) {
      const firstMember = updatedGuild.members[0]
      await guildRepo.updateMemberRoleByPlayerId(guild._id, firstMember.playerId, 'leader')
    }
  }

  // Clear player's guild reference
  await playerRepo.setGuildId(player._id, null)

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.left',
    metadata: {
      action: 'Left guild',
      type: 'leave',
      guildId,
      guildName,
      member: player.username,
    },
    target: {
      entityType: 'guild',
      entityId: guildId,
      label: guildName,
    },
    tags: ['guild'],
  })
}

export async function kickMember(playerId: string, memberId: string): Promise<void> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  const guild = await guildRepo.findById(player.guildId!)
  if (!guild) throw new Error('Guild not found')

  const requester = guildRepo.findMemberByPlayerId(guild, player._id)
  if (!requester || (requester.role !== 'leader' && requester.role !== 'officer')) {
    throw new Error('Insufficient permissions')
  }

  const kickedMember = guildRepo.findMemberById(guild, memberId)
  if (!kickedMember) throw new Error('Member not found')

  // Remove from guild
  await guildRepo.removeMemberById(guild._id, memberId)

  // Clear kicked player's guild reference
  if (kickedMember.playerId) {
    await playerRepo.setGuildId(kickedMember.playerId, null)
  }

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.member_kicked',
    metadata: {
      action: 'Kicked member',
      type: 'kick',
      guildId: guild._id.toString(),
      guildName: guild.name,
      member: kickedMember.name || 'Unknown member',
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild'],
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chat Functions
// ═════════════════════════════════════════════���═════════════════════════════════

export async function sendChat(
  playerId: string,
  playerName: string,
  text: string
): Promise<ChatMessage> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  const guild = await guildRepo.findById(player.guildId!)
  if (!guild) throw new Error('Guild not found')

  const message: ChatMessage = { sender: playerName, text, timestamp: new Date() }
  await guildRepo.addChatMessage(guild._id, message)
  return message
}

// ═══════════════════════════════════════════════════════════════════════════════
// Settings Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function setGuildName(playerId: string, name: string): Promise<IGuildDocument> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  const guild = await guildRepo.findById(player.guildId!)
  if (!guild) throw new Error('Guild not found')

  const member = guildRepo.findMemberByPlayerId(guild, player._id)
  if (!member || member.role !== 'leader') {
    throw new Error('Only leader can change name')
  }

  const oldName = guild.name
  const updated = await guildRepo.updateName(guild._id, name)
  if (!updated) throw new Error('Failed to update guild name')

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.renamed',
    metadata: {
      action: 'Renamed guild',
      type: 'rename',
      guildId: guild._id.toString(),
      oldName,
      newName: updated.name,
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: updated.name,
    },
    tags: ['guild'],
  })

  return updated
}

export async function setGuildMotto(playerId: string, motto: string): Promise<IGuildDocument> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  const guild = await guildRepo.findById(player.guildId!)
  if (!guild) throw new Error('Guild not found')

  const member = guildRepo.findMemberByPlayerId(guild, player._id)
  if (!member || member.role !== 'leader') {
    throw new Error('Only leader can change motto')
  }

  const updated = await guildRepo.updateMotto(guild._id, motto)
  if (!updated) throw new Error('Failed to update guild motto')

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.motto_updated',
    metadata: {
      action: 'Updated guild motto',
      type: 'motto',
      guildId: guild._id.toString(),
      guildName: guild.name,
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild'],
  })

  return updated
}

export async function transferLeadership(
  playerId: string,
  memberId: string
): Promise<IGuildDocument> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  const guild = await guildRepo.findById(player.guildId!)
  if (!guild) throw new Error('Guild not found')

  const current = guildRepo.findMemberByPlayerId(guild, player._id)
  if (!current || current.role !== 'leader') {
    throw new Error('Only leader can transfer')
  }

  const target = guildRepo.findMemberById(guild, memberId)
  if (!target) throw new Error('Member not found')

  // Update roles
  await guildRepo.updateMemberRoleByPlayerId(guild._id, player._id, 'member')
  await guildRepo.updateMemberRole(guild._id, memberId, 'leader')

  const updated = await guildRepo.findById(guild._id)
  if (!updated) throw new Error('Guild not found after update')

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.leadership_transferred',
    metadata: {
      action: 'Transferred leadership',
      type: 'leadership',
      guildId: guild._id.toString(),
      guildName: guild.name,
      member: target.name,
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild'],
  })

  return updated
}

// ═══════════════════════════════════════════════════════════════════════════════
// Donation Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function donateMaterial(
  playerId: string,
  materialName: string,
  batches: number = 1
): Promise<{ xpGained: number; materialsUsed: number; guild: IGuildDocument }> {
  if (batches < 1) throw new Error('Invalid donation quantity')

  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  const guild = await guildRepo.findById(player.guildId!)
  if (!guild) throw new Error('Guild not found')

  const material = await itemRepo.findByPlayerAndItemId(player._id, materialName, 'material')
  if (!material || material.quantity <= 0) {
    throw new Error(`No ${materialName} to donate`)
  }

  const DONATION_AMOUNT = GAME_DATA.PROGRESSION?.GUILDS?.DONATION_AMOUNT ?? 5
  const isBoss = (material as any).type === 'boss'
  const perBatch = isBoss ? 1 : DONATION_AMOUNT
  const totalDeduct = perBatch * batches

  if (material.quantity < totalDeduct) {
    throw new Error(`Not enough ${materialName} to donate (need ${totalDeduct}, have ${material.quantity})`)
  }

  const baseRate = GAME_DATA.PROGRESSION?.GUILDS?.DONATION_RATES?.[materialName] || 50
  const xpPerBatch = isBoss ? baseRate : Math.floor((baseRate * perBatch) / 10)
  const totalXpGain = xpPerBatch * batches

  const newLevel = guildLogic.getGuildLevelFromXP(guild.xp + totalXpGain)

  const updated = await guildRepo.addXp(guild._id, totalXpGain, newLevel)
  if (!updated) throw new Error('Failed to update guild XP')

  await itemRepo.decrementQuantityById(material._id, totalDeduct)

  await guildRepo.updateMemberContribution(guild._id, player._id, totalXpGain, 0)

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.material_donated',
    metadata: {
      action: 'Donated material',
      type: 'donate',
      guildId: guild._id.toString(),
      guildName: guild.name,
      member: player.username,
      material: materialName,
      batches,
      materialsUsed: totalDeduct,
      xpGained: totalXpGain,
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild'],
  })

  return { xpGained: totalXpGain, materialsUsed: totalDeduct, guild: updated }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Guild Perks Functions
// ═════════════════════════════════════════════════════════════════��═════════════

export interface GuildPerksData {
  availablePoints: number
  totalPointsSpent: number
  unlockedPerks: guildLogic.UnlockedPerk[]
  branches: ReturnType<typeof guildLogic.getPerkBranches>
}

export async function getGuildPerks(playerId: string): Promise<GuildPerksData> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  if (!player.guildId) throw new Error('Not in a guild')

  const guild = await guildRepo.getGuildWithPerks(player.guildId)
  if (!guild) throw new Error('Guild not found')

  const unlockedPerks: guildLogic.UnlockedPerk[] = (guild.perks ?? []).map(p => ({
    perkId: p.perkId,
    branch: p.branch,
    tier: p.tier,
  }))

  const totalPointsSpent = guildLogic.calculateTotalPointsSpent(unlockedPerks)

  return {
    availablePoints: guild.points ?? 0,
    totalPointsSpent,
    unlockedPerks,
    branches: guildLogic.getPerkBranches(),
  }
}

export async function unlockPerk(
  playerId: string,
  branchId: string,
  tier: number
): Promise<{ success: boolean; guild: IGuildDocument; message: string }> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')
  if (!player.guildId) throw new Error('Not in a guild')

  const guild = await guildRepo.findById(player.guildId)
  if (!guild) throw new Error('Guild not found')

  // Check permissions - only leader and officers can unlock perks
  const member = guildRepo.findMemberByPlayerId(guild, player._id)
  if (!member || (member.role !== 'leader' && member.role !== 'officer')) {
    throw new Error('Only leaders and officers can unlock perks')
  }

  // Get perk tier data
  const tierData = guildLogic.getPerkTier(branchId, tier)
  if (!tierData) throw new Error('Perk not found')

  // Build unlocked perks array for validation
  const unlockedPerks: guildLogic.UnlockedPerk[] = (guild.perks ?? []).map(p => ({
    perkId: p.perkId,
    branch: p.branch,
    tier: p.tier,
  }))

  // Check if can unlock
  const canUnlock = guildLogic.canUnlockPerk(
    { points: guild.points ?? 0, perks: unlockedPerks },
    branchId,
    tier
  )

  if (!canUnlock.canUnlock) {
    throw new Error(canUnlock.reason ?? 'Cannot unlock perk')
  }

  // Unlock the perk
  const updatedGuild = await guildRepo.addPerk(
    guild._id,
    {
      perkId: tierData.id,
      branch: branchId,
      tier,
      unlockedAt: new Date(),
      unlockedBy: player._id,
    },
    tierData.pointsCost
  )

  if (!updatedGuild) throw new Error('Failed to unlock perk')

  await logHistorySafe({
    playerId: player._id,
    source: 'guild',
    eventType: 'guild',
    eventKey: 'guild.perk_unlocked',
    metadata: {
      action: 'Unlocked perk',
      type: 'perk',
      guildId: guild._id.toString(),
      guildName: guild.name,
      member: player.username,
      perkId: tierData.id,
      perkName: tierData.name,
      branch: branchId,
      tier,
      pointsCost: tierData.pointsCost,
    },
    target: {
      entityType: 'guild',
      entityId: guild._id.toString(),
      label: guild.name,
    },
    tags: ['guild', 'perk'],
  })

  return {
    success: true,
    guild: updatedGuild,
    message: `Unlocked ${tierData.name}!`,
  }
}

export async function getGuildPerkEffectsForPlayer(
  playerId: string
): Promise<guildLogic.GuildPerkEffects | null> {
  const player = await playerRepo.findById(playerId)
  if (!player || !player.guildId) return null

  const guild = await guildRepo.getGuildWithPerks(player.guildId)
  if (!guild) return null

  const unlockedPerks: guildLogic.UnlockedPerk[] = (guild.perks ?? []).map(p => ({
    perkId: p.perkId,
    branch: p.branch,
    tier: p.tier,
  }))

  return guildLogic.calculatePerkEffects(unlockedPerks)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Guild Bonuses for Players
// ═══════════════════════════════════════════════════════════════════════════════

interface GuildBonuses {
  xpBonus: number      // Percentage as decimal (0.5 = 50%)
  materialBonus: number
  energyRegen: number
  bossDamage: number
}

const GUILD_LEVELS = (GAME_DATA as { PROGRESSION?: { GUILDS?: { LEVELS?: Array<{
  level: number
  xpBonus: number
  materialBonus: number
  energyRegen: number
  bossDamage: number
}> } } }).PROGRESSION?.GUILDS?.LEVELS ?? []

/**
 * Get guild level bonuses for a player based on their guild's level.
 * Returns zero bonuses if player is not in a guild.
 */
export async function getPlayerGuildBonuses(playerId: string): Promise<GuildBonuses> {
  const defaultBonuses: GuildBonuses = { xpBonus: 0, materialBonus: 0, energyRegen: 0, bossDamage: 0 }
  
  const player = await playerRepo.findById(playerId)
  if (!player || !player.guildId) return defaultBonuses
  
  const guild = await guildRepo.findById(player.guildId)
  if (!guild) return defaultBonuses
  
  const guildLevel = guild.level ?? 1
  const levelEntry = GUILD_LEVELS.find(l => l.level === guildLevel)
  
  if (!levelEntry) return defaultBonuses
  
  return {
    xpBonus: levelEntry.xpBonus ?? 0,
    materialBonus: levelEntry.materialBonus ?? 0,
    energyRegen: levelEntry.energyRegen ?? 0,
    bossDamage: levelEntry.bossDamage ?? 0,
  }
}

/**
 * Get guild level bonuses synchronously from a guild document.
 */
export function getGuildBonusesFromGuild(guild: IGuildDocument | null): GuildBonuses {
  const defaultBonuses: GuildBonuses = { xpBonus: 0, materialBonus: 0, energyRegen: 0, bossDamage: 0 }

  if (!guild) return defaultBonuses

  const guildLevel = guild.level ?? 1
  const levelEntry = GUILD_LEVELS.find(l => l.level === guildLevel)

  if (!levelEntry) return defaultBonuses

  return {
    xpBonus: levelEntry.xpBonus ?? 0,
    materialBonus: levelEntry.materialBonus ?? 0,
    energyRegen: levelEntry.energyRegen ?? 0,
    bossDamage: levelEntry.bossDamage ?? 0,
  }
}
