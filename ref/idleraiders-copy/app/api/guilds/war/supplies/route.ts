import { NextRequest } from 'next/server'
import { Types } from 'mongoose'
import { withAuth } from '@/lib/api/auth'
import * as guildwarService from '@/lib/modules/guildwars/guildwar.service'
import * as playerRepo from '@/lib/modules/players/player.repository'
import * as guildRepo from '@/lib/modules/guilds/guild.repository'
import { WAR_ECONOMY_CONFIG } from '@/public/data/progression/progression'

/**
 * GET /api/guilds/war/supplies
 * Get guild's supply stats and active buffs
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const player = await playerRepo.findById(playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (!player.guildId) {
      throw new Error('You must be in a guild to view war supplies')
    }

    const guildObjectId = typeof player.guildId === 'string'
      ? new Types.ObjectId(player.guildId)
      : player.guildId

    const guildEntry = await guildwarService.getGuildWarEntry(guildObjectId)
    if (!guildEntry) {
      throw new Error('Guild not participating in war')
    }

    // Filter out expired buffs
    const now = new Date()
    const activeBuffs = guildEntry.activeBuffs.filter(
      (buff) => new Date(buff.expiresAt) > now
    )

    return {
      supplies: {
        current: guildEntry.warSupplies,
        generated: guildEntry.suppliesGenerated,
        spent: guildEntry.suppliesSpent,
      },
      activeBuffs,
      stats: {
        valor: guildEntry.valor,
        damageReceived: guildEntry.damageReceived,
        attacksSurvived: guildEntry.attacksSurvived,
        strongholdDefenses: guildEntry.strongholdDefenses,
        repairsCompleted: guildEntry.repairsCompleted,
        buffsActivated: guildEntry.buffsActivated,
      },
      costs: WAR_ECONOMY_CONFIG.SUPPLY_COSTS,
      buffDurations: WAR_ECONOMY_CONFIG.BUFF_DURATIONS,
    }
  })
}

/**
 * POST /api/guilds/war/supplies
 * Spend supplies on an action
 * 
 * Body: {
 *   action: 'repairGarrison' | 'repairOutpost' | 'warCry' | 'reinforce' | 'rally' | 'fortify'
 *   targetOutpostId?: string // Required for repairOutpost
 * }
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const body = await request.json()
    const { action, targetOutpostId } = body as {
      action: guildwarService.SupplyActionType
      targetOutpostId?: string
    }

    if (!action) {
      throw new Error('Action is required')
    }

    const validActions = ['repairGarrison', 'repairOutpost', 'warCry', 'reinforce', 'rally', 'shieldWall']
    if (!validActions.includes(action)) {
      throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`)
    }

    if (action === 'repairOutpost' && !targetOutpostId) {
      throw new Error('targetOutpostId is required for repairOutpost action')
    }

    const player = await playerRepo.findById(playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (!player.guildId) {
      throw new Error('You must be in a guild to spend war supplies')
    }

    // Check if player is leader
    const guild = await guildRepo.findById(player.guildId)
    if (!guild) {
      throw new Error('Guild not found')
    }

    // Find leader from members array - the leader is stored with role: "leader"
    const playerObjectId = typeof playerId === 'string' ? new Types.ObjectId(playerId) : playerId
    const leaderMember = guild.members?.find(m => m.role === 'leader')
    
    const isLeader = leaderMember?.playerId && playerObjectId && leaderMember.playerId.equals(playerObjectId)
    
    if (!isLeader) {
      throw new Error('Only the guild leader can spend war supplies')
    }

    // Spend supplies - use ObjectId directly
    const guildObjectId = typeof player.guildId === 'string' 
      ? new Types.ObjectId(player.guildId) 
      : player.guildId

    const result = await guildwarService.spendWarSupplies(
      guildObjectId,
      playerObjectId,
      action,
      targetOutpostId
    )

    return result
  })
}
