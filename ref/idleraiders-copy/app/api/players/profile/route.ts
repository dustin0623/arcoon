import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/config/database'
import * as playerRepo from '@/lib/modules/players/player.repository'
import * as cardRepo from '@/lib/modules/cards/card.repository'
import * as itemRepo from '@/lib/modules/items/item.repository'
import * as guildRepo from '@/lib/modules/guilds/guild.repository'
import { xpToNextLevel } from '@/lib/modules/players/player.logic'
import { applyBoostCap } from '@/lib/modules/players/player.builder'
import { CARDS_BY_ID } from '@/lib/registries/card.registry'
import { BOOSTER_MULTIPLIERS } from '@/public/data/cards/cardConfig'

/**
 * GET /api/players/profile?username=xxx
 * Returns public profile data for a player by username
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      )
    }

    // Find the player
    const player = await playerRepo.findByUsernameLean(username)
    if (!player) {
      return NextResponse.json(
        { success: false, message: 'Player not found' },
        { status: 404 }
      )
    }

    const playerId = player._id

    // Get cards for stat calculation. Stats are NOT persisted on the card
    // documents — they live on the static CARDS_BY_ID registry and are
    // multiplied by the card's owned quantity. This mirrors the logic in
    // `lib/modules/players/player.builder.ts`.
    const cards = await cardRepo.findByOwner(playerId)

    let totalRaidPower = 0
    let totalMastery = 0
    let totalLuck = 0
    let totalGM = 0
    let totalCards = 0
    const rawBoosts = { expBoost: 0, matBoost: 0, energyBoost: 0 }

    for (const card of cards) {
      const qty = card.quantity ?? 1
      totalCards += qty
      const def = CARDS_BY_ID[card.cardId] ?? {}
      const stats = (def as { stats?: { raidPower?: number; mastery?: number; luck?: number; gm?: number } }).stats ?? {}

      if (def.type === 'booster' && def.class && def.rarity) {
        // Booster cards contribute only to the three boost types
        const pct = BOOSTER_MULTIPLIERS[def.rarity] ?? 0
        const amount = pct * qty
        if (def.class === 'xpBoost') rawBoosts.expBoost += amount
        else if (def.class === 'materialBoost') rawBoosts.matBoost += amount
        else if (def.class === 'energyBoost') rawBoosts.energyBoost += amount
      } else {
        totalRaidPower += (stats.raidPower ?? 0) * qty
        totalMastery += (stats.mastery ?? 0) * qty
        totalLuck += (stats.luck ?? 0) * qty
        totalGM += (stats.gm ?? 0) * qty
      }
    }
    const uniqueCards = cards.length

    // Apply the same diminishing-returns cap used for the viewing player
    const boosts = {
      expBoost: applyBoostCap(rawBoosts.expBoost),
      matBoost: applyBoostCap(rawBoosts.matBoost),
      energyBoost: applyBoostCap(rawBoosts.energyBoost),
    }

    // Get materials count
    const materials = await itemRepo.getMaterials(playerId)
    const totalMaterials = materials.reduce((a, m) => a + (m.quantity ?? 0), 0)

    // Get guild info if player is in a guild
    let guildInfo = null
    if (player.guildId) {
      const guild = await guildRepo.findById(player.guildId.toString())
      if (guild) {
        const member = guild.members.find(m => m.playerId.toString() === playerId.toString())
        guildInfo = {
          name: guild.name,
          level: guild.level,
          role: member?.role ?? 'member',
        }
      }
    }

    // Milestones live on a nested subdoc — pull totals from there
    const milestones = (player.milestones ?? {}) as Record<string, number>
    const level = player.level ?? 1

    // Return public profile data
    return NextResponse.json({
      success: true,
      profile: {
        username: player.username,
        avatar: (player as unknown as { avatar?: string }).avatar ?? '⚔️',
        level,
        xp: player.xp ?? 0,
        xpToNextLevel: xpToNextLevel(level),
        coins: player.coins ?? 0,
        shards: player.shards ?? 0,
        totalMissions: milestones.totalMissionsCompleted ?? 0,
        totalBossDamage: milestones.totalBossDamage ?? 0,
        totalMinutesPlayed: milestones.totalMinutesPlayed ?? 0,
        joinedAt: player.createdAt ? new Date(player.createdAt).getTime() : Date.now(),
        // Computed stats
        raidPower: totalRaidPower,
        mastery: totalMastery,
        luck: totalLuck,
        gm: totalGM,
        totalCards,
        uniqueCards,
        totalMaterials,
        // Effective (post-cap) boost percentages from booster cards
        boosts,
        // Guild info (if any)
        guild: guildInfo,
      },
    })
  } catch (error) {
    console.error('[API] Error fetching player profile:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
