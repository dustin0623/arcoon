import { NextRequest } from 'next/server'
import { Types } from 'mongoose'
import { withAuth } from '@/lib/api/auth'
import * as guildwarService from '@/lib/modules/guildwars/guildwar.service'
import * as playerRepo from '@/lib/modules/players/player.repository'
import * as guildRepo from '@/lib/modules/guilds/guild.repository'

/**
 * POST /api/guilds/war/stronghold/revive
 * Revive a destroyed stronghold
 * Costs 2500 Realm Coins from the leader's wallet
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (playerId) => {
    const player = await playerRepo.findById(playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (!player.guildId) {
      throw new Error('You must be in a guild to revive a stronghold')
    }

    // Check if player is leader
    const guild = await guildRepo.findById(player.guildId)
    if (!guild) {
      throw new Error('Guild not found')
    }

    // Find leader from members array
    const playerObjectId = typeof playerId === 'string' ? new Types.ObjectId(playerId) : playerId
    const leaderMember = guild.members?.find(m => m.role === 'leader')
    
    const isLeader = leaderMember?.playerId && playerObjectId && leaderMember.playerId.equals(playerObjectId)
    
    if (!isLeader) {
      throw new Error('Only the guild leader can revive the stronghold')
    }

    // Attempt revival
    const guildObjectId = typeof player.guildId === 'string' 
      ? new Types.ObjectId(player.guildId) 
      : player.guildId

    const result = await guildwarService.reviveStronghold(
      playerObjectId,
      guildObjectId
    )

    return result
  })
}
