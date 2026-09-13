import { Types } from 'mongoose'
import GuildWar, {
  type IGuildWarDocument,
  type IGuildWarEntry,
  type IWarOutpost,
  type IWarStronghold,
  type IGuildWarData,
  type IGuildWarMetadata,
  type IWarBuff,
} from './guildwar.model'
import { connectDB } from '@/lib/config/database'
import { calculateStrongholdHP, getSupplyRate } from './guildwar.logic'

// ═══════════════════════════════════════════════════════════════════════════════
// Default Outposts (HP and supplies scale by tier)
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_OUTPOSTS: IWarOutpost[] = [
  { outpostId: 'outpost_1', name: 'Northern Watchtower', garrison: 0, maxGarrison: 100_000 },
  { outpostId: 'outpost_2', name: 'Eastern Fortress', garrison: 0, maxGarrison: 250_000 },
  { outpostId: 'outpost_3', name: 'Southern Bastion', garrison: 0, maxGarrison: 500_000 },
  { outpostId: 'outpost_4', name: 'Western Citadel', garrison: 0, maxGarrison: 750_000 },
  { outpostId: 'outpost_5', name: 'Central Keep', garrison: 0, maxGarrison: 1_000_000 },
]

// ═══════════════════════════════════════════════════════════════════════════════
// Query Functions - Active Guild War
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Find the currently active guild war
 */
export async function findActive(): Promise<IGuildWarDocument | null> {
  await connectDB()
  return GuildWar.findOne({ status: 'active' })
}

/**
 * Find active guild war by week number
 */
export async function findActiveByWeek(weekNumber: number): Promise<IGuildWarDocument | null> {
  await connectDB()
  return GuildWar.findOne({ weekNumber, status: 'active' })
}

/**
 * Get all entries from active guild war sorted by valor
 */
export async function findAllEntriesSortedByValor(limit: number = 100): Promise<IGuildWarEntry[]> {
  await connectDB()
  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return []

  return [...guildWar.entries]
    .sort((a, b) => b.valor - a.valor || b.totalDamageDealt - a.totalDamageDealt)
    .slice(0, limit)
}

/**
 * Find entry for a specific guild in active guild war
 */
export async function findEntryByGuild(
  guildId: string | Types.ObjectId
): Promise<IGuildWarEntry | null> {
  await connectDB()
  if (!guildId) return null
  
  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return null

  // Convert to ObjectId if string, then use .equals() for proper ObjectId comparison
  const targetId = typeof guildId === 'string' ? new Types.ObjectId(guildId) : guildId
  return guildWar.entries.find((e) => e.guildId && targetId && e.guildId.equals(targetId)) || null
}

/**
 * Get all outposts from active guild war
 */
export async function findAllOutposts(): Promise<IWarOutpost[]> {
  await connectDB()
  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return []
  return guildWar.outposts
}

/**
 * Get specific outpost from active guild war
 */
export async function findOutpostById(outpostId: string): Promise<IWarOutpost | null> {
  await connectDB()
  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return null
  return guildWar.outposts.find((o) => o.outpostId === outpostId) || null
}

/**
 * Get stronghold for a specific guild
 */
export async function findStrongholdByGuild(
  guildId: string | Types.ObjectId
): Promise<IWarStronghold | null> {
  await connectDB()
  if (!guildId) return null
  
  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return null
  
  // Convert to ObjectId if string, then use .equals() for proper ObjectId comparison
  const targetId = typeof guildId === 'string' ? new Types.ObjectId(guildId) : guildId
  return guildWar.strongholds.find((s) => s.guildId && targetId && s.guildId.equals(targetId)) || null
}

/**
 * Get all active strongholds (not destroyed) - for attackable targets
 */
export async function findActiveStrongholds(): Promise<IWarStronghold[]> {
  await connectDB()
  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return []
  return guildWar.strongholds.filter((s) => !s.isDestroyed)
}

/**
 * Get all strongholds (including destroyed) - for overview display
 */
export async function findAllStrongholds(): Promise<IWarStronghold[]> {
  await connectDB()
  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return []
  return guildWar.strongholds
}

// ═══════════════════════════════════════════════════════════════════════════════
// Query Functions - Historical Guild Wars
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Find finalized guild war by week number
 */
export async function findByWeek(weekNumber: number): Promise<IGuildWarDocument | null> {
  await connectDB()
  return GuildWar.findOne({ weekNumber, status: 'finalized' })
}

/**
 * Get list of finalized guild wars (most recent first)
 */
export async function findFinalizedGuildWars(limit: number = 10): Promise<IGuildWarDocument[]> {
  await connectDB()
  return GuildWar.find({ status: 'finalized' })
    .sort({ weekNumber: -1 })
    .limit(limit)
}

/**
 * Check if a finalized guild war exists for a week
 */
export async function existsForWeek(weekNumber: number): Promise<boolean> {
  await connectDB()
  const count = await GuildWar.countDocuments({ weekNumber, status: 'finalized' })
  return count > 0
}

// ═══════════════════════════════════════════════════════════════════════════════
// Create / Update Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create or get active guild war for a week
 */
export async function getOrCreateActive(
  weekNumber: number,
  weekStart: Date,
  weekEnd: Date
): Promise<IGuildWarDocument> {
  await connectDB()

  let guildWar = await GuildWar.findOne({ weekNumber, status: 'active' })

  if (!guildWar) {
    guildWar = await GuildWar.create({
      weekNumber,
      weekStart,
      weekEnd,
      status: 'active',
      outposts: DEFAULT_OUTPOSTS,
      strongholds: [],
      data: { pool: 0, reward: 0, ranks: {} },
      entries: [],
      metadata: { totalGuildsParticipated: 0 },
    })
  }

  return guildWar
}

/**
 * Ensure guild has an entry and stronghold in the guild war
 */
export async function ensureGuildParticipation(
  weekNumber: number,
  weekStart: Date,
  weekEnd: Date,
  guildId: Types.ObjectId,
  guildName: string,
  guildLevel: number
): Promise<IGuildWarDocument> {
  await connectDB()

  // Get or create active season
  const guildWar = await getOrCreateActive(weekNumber, weekStart, weekEnd)

  // Check if guild already has an entry
  const existingEntry = guildWar.entries.find(
    (e) => e.guildId?.toString() === guildId.toString()
  )

  if (!existingEntry) {
    // Add guild entry with war economy fields
    guildWar.entries.push({
      guildId,
      guildName,
      valor: 0,
      outpostsCaptured: 0,
      strongholdsDestroyed: 0,
      totalDamageDealt: 0,
      damageReceived: 0,
      attacksSurvived: 0,
      strongholdDefenses: 0,
      warSupplies: 0,
      suppliesGenerated: 0,
      suppliesSpent: 0,
      repairsCompleted: 0,
      buffsActivated: 0,
      activeBuffs: [],
      memberContributions: [],
    })
    guildWar.metadata.totalGuildsParticipated = guildWar.entries.length
  }

  // Check if guild already has a stronghold
  const existingStronghold = guildWar.strongholds.find(
    (s) => s.guildId?.toString() === guildId.toString()
  )

  if (!existingStronghold) {
  // Add guild stronghold (HP based on guild level: 100K base + 5K per level)
  const maxHp = calculateStrongholdHP(guildLevel)
  guildWar.strongholds.push({
      guildId,
      guildName,
      maxHp,
      currentHp: maxHp,
      lastRegenAt: new Date(),
      isDestroyed: false,
    })
  }

  await guildWar.save()
  return guildWar
}

/**
 * Update outpost control after capture
 */
export async function updateOutpostControl(
  outpostId: string,
  guildId: Types.ObjectId,
  guildName: string,
  garrison: number
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'outposts.outpostId': outpostId },
    {
      $set: {
        'outposts.$.controlledBy': guildId,
        'outposts.$.controlledByName': guildName,
        'outposts.$.capturedAt': new Date(),
        'outposts.$.garrison': garrison,
      },
    },
    { returnDocument: 'after' }
  )
}

/**
 * Update outpost garrison (decay or damage)
 */
export async function updateOutpostGarrison(
  outpostId: string,
  garrison: number
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'outposts.outpostId': outpostId },
    { $set: { 'outposts.$.garrison': Math.max(0, garrison) } },
    { returnDocument: 'after' }
  )
}

/**
 * Reset outpost to neutral (garrison depleted)
 */
export async function resetOutpostToNeutral(
  outpostId: string
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'outposts.outpostId': outpostId },
    {
      $unset: {
        'outposts.$.controlledBy': '',
        'outposts.$.controlledByName': '',
        'outposts.$.capturedAt': '',
      },
      $set: { 'outposts.$.garrison': 0 },
    },
    { returnDocument: 'after' }
  )
}

/**
 * Update stronghold HP after attack
 */
export async function updateStrongholdHp(
  guildId: Types.ObjectId,
  damage: number,
  attackerGuildId?: Types.ObjectId
): Promise<{ guildWar: IGuildWarDocument | null; destroyed: boolean }> {
  await connectDB()

  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return { guildWar: null, destroyed: false }

  const stronghold = guildWar.strongholds.find(
    (s) => s.guildId?.toString() === guildId.toString()
  )
  if (!stronghold || stronghold.isDestroyed) {
    return { guildWar, destroyed: false }
  }

  // Apply damage
  stronghold.currentHp = Math.max(0, stronghold.currentHp - damage)

  // Check if destroyed
  let destroyed = false
  if (stronghold.currentHp <= 0) {
    stronghold.isDestroyed = true
    stronghold.destroyedAt = new Date()
    stronghold.destroyedBy = attackerGuildId
    destroyed = true
  }

  await guildWar.save()
  return { guildWar, destroyed }
}

/**
 * Revive a destroyed stronghold (resets isDestroyed, restores HP to 50%)
 */
export async function reviveStronghold(
  guildId: Types.ObjectId
): Promise<{ guildWar: IGuildWarDocument | null; revived: boolean }> {
  await connectDB()

  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return { guildWar: null, revived: false }

  const stronghold = guildWar.strongholds.find(
    (s) => s.guildId?.toString() === guildId.toString()
  )
  if (!stronghold) return { guildWar, revived: false }
  
  // Can only revive if destroyed
  if (!stronghold.isDestroyed) return { guildWar, revived: false }

  // Revive with 50% HP
  stronghold.isDestroyed = false
  stronghold.currentHp = Math.floor(stronghold.maxHp * 0.5)
  stronghold.destroyedAt = undefined
  stronghold.destroyedBy = undefined
  stronghold.lastRegenAt = new Date()

  await guildWar.save()
  return { guildWar, revived: true }
}

/**
 * Revive all destroyed strongholds in the active war whose destroyedAt is
 * older than the given cutoff. Returns the count and guild ids revived.
 *
 * Called lazily from the player-facing war overview endpoint, guarded by a
 * Redis sweep lock so we don't hammer Mongo on high traffic.
 */
export async function autoReviveExpiredStrongholds(
  cutoff: Date
): Promise<{ revivedCount: number; revivedGuildIds: Types.ObjectId[] }> {
  await connectDB()

  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return { revivedCount: 0, revivedGuildIds: [] }

  const revivedGuildIds: Types.ObjectId[] = []

  for (const s of guildWar.strongholds) {
    if (s.isDestroyed && s.destroyedAt && s.destroyedAt <= cutoff) {
      s.isDestroyed = false
      s.currentHp = s.maxHp
      s.destroyedAt = undefined
      s.destroyedBy = undefined
      s.lastRegenAt = new Date()
      revivedGuildIds.push(s.guildId)
    }
  }

  if (revivedGuildIds.length > 0) {
    await guildWar.save()
  }

  return { revivedCount: revivedGuildIds.length, revivedGuildIds }
}

/**
 * Add valor to guild entry
 */
export async function addGuildValor(
  guildId: Types.ObjectId,
  valor: number
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'entries.guildId': guildId },
    { $inc: { 'entries.$.valor': valor } },
    { returnDocument: 'after' }
  )
}

/**
 * Add damage received to guild entry (for defense tracking)
 */
export async function addDamageReceived(
  guildId: Types.ObjectId,
  damage: number
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'entries.guildId': guildId },
    { $inc: { 'entries.$.damageReceived': damage } },
    { returnDocument: 'after' }
  )
}

/**
 * Add war supplies to guild entry
 */
export async function addWarSupplies(
  guildId: Types.ObjectId,
  supplies: number
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'entries.guildId': guildId },
    { 
      $inc: { 
        'entries.$.warSupplies': supplies,
        'entries.$.suppliesGenerated': supplies > 0 ? supplies : 0,
      } 
    },
    { returnDocument: 'after' }
  )
}

/**
 * Spend war supplies from guild entry
 */
export async function spendWarSupplies(
  guildId: Types.ObjectId,
  amount: number
): Promise<IGuildWarDocument | null> {
  await connectDB()
  if (!guildId) return null

  // Use $elemMatch to ensure we find the SAME entry with matching guildId AND sufficient supplies
  return GuildWar.findOneAndUpdate(
    { 
      status: 'active', 
      entries: { 
        $elemMatch: { 
          guildId: guildId, 
          warSupplies: { $gte: amount } 
        } 
      } 
    },
    { 
      $inc: { 
        'entries.$.warSupplies': -amount,
        'entries.$.suppliesSpent': amount,
      } 
    },
    { returnDocument: 'after' }
  )
}

/**
 * Transfer war supplies from one guild to another (supply stealing)
 * Deducts from defender and adds to attacker
 */
export async function transferWarSupplies(
  fromGuildId: Types.ObjectId,
  toGuildId: Types.ObjectId,
  amount: number
): Promise<{ success: boolean }> {
  await connectDB()
  if (!fromGuildId || !toGuildId || amount <= 0) {
    return { success: false }
  }

  // Deduct from defender (can't steal more than they have)
  const defenderResult = await GuildWar.findOneAndUpdate(
    { 
      status: 'active', 
      entries: { 
        $elemMatch: { 
          guildId: fromGuildId, 
          warSupplies: { $gte: amount } 
        } 
      } 
    },
    { 
      $inc: { 
        'entries.$.warSupplies': -amount,
      } 
    },
    { returnDocument: 'after' }
  )

  if (!defenderResult) {
    // Defender doesn't have enough supplies - try to take whatever they have
    const guildWar = await GuildWar.findOne({ status: 'active' })
    const defenderEntry = guildWar?.entries.find(e => e.guildId.equals(fromGuildId))
    if (!defenderEntry || defenderEntry.warSupplies <= 0) {
      return { success: false }
    }
    
    const actualAmount = defenderEntry.warSupplies
    await GuildWar.findOneAndUpdate(
      { status: 'active', 'entries.guildId': fromGuildId },
      { $set: { 'entries.$.warSupplies': 0 } }
    )
    
    // Add to attacker
    await GuildWar.findOneAndUpdate(
      { status: 'active', 'entries.guildId': toGuildId },
      { $inc: { 'entries.$.warSupplies': actualAmount } }
    )
    
    return { success: true }
  }

  // Add to attacker
  await GuildWar.findOneAndUpdate(
    { status: 'active', 'entries.guildId': toGuildId },
    { $inc: { 'entries.$.warSupplies': amount } }
  )

  return { success: true }
}

/**
 * Add active buff to guild entry
 */
export async function addActiveBuff(
  guildId: Types.ObjectId,
  buff: IWarBuff
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'entries.guildId': guildId },
    { 
      $push: { 'entries.$.activeBuffs': buff },
      $inc: { 'entries.$.buffsActivated': 1 }
    },
    { returnDocument: 'after' }
  )
}

/**
 * Remove expired buffs from all guild entries
 */
export async function removeExpiredBuffs(): Promise<void> {
  await connectDB()

  const now = new Date()
  await GuildWar.updateMany(
    { status: 'active' },
    { $pull: { 'entries.$[].activeBuffs': { expiresAt: { $lte: now } } } }
  )
}

/**
 * Increment attacks survived counter
 */
export async function incrementAttacksSurvived(
  guildId: Types.ObjectId
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'entries.guildId': guildId },
    { $inc: { 'entries.$.attacksSurvived': 1 } },
    { returnDocument: 'after' }
  )
}

/**
 * Increment stronghold defenses counter
 */
export async function incrementStrongholdDefenses(
  guildId: Types.ObjectId
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'entries.guildId': guildId },
    { $inc: { 'entries.$.strongholdDefenses': 1 } },
    { returnDocument: 'after' }
  )
}

/**
 * Increment repairs completed counter
 */
export async function incrementRepairsCompleted(
  guildId: Types.ObjectId
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { status: 'active', 'entries.guildId': guildId },
    { $inc: { 'entries.$.repairsCompleted': 1 } },
    { returnDocument: 'after' }
  )
}

/**
 * Add member valor contribution
 */
export async function addMemberValor(
  guildId: Types.ObjectId,
  playerId: Types.ObjectId,
  valor: number
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { 
      status: 'active', 
      'entries.guildId': guildId,
      'entries.memberContributions.playerId': playerId 
    },
    { $inc: { 'entries.$[entry].memberContributions.$[member].valorEarned': valor } },
    { 
      arrayFilters: [
        { 'entry.guildId': guildId },
        { 'member.playerId': playerId }
      ],
      returnDocument: 'after' 
    }
  )
}

/**
 * Update guild entry stats after war mission completion
 * Uses valor system: damage/1000 * multiplier + capture/destroy bonuses
 */
export async function updateGuildWarStats(
  guildId: Types.ObjectId,
  playerId: Types.ObjectId,
  username: string,
  damage: number,
  valor: number,
  outpostCaptured: boolean,
  strongholdDestroyed: boolean,
  guildName?: string,
  guildLevel?: number
): Promise<IGuildWarDocument | null> {
  await connectDB()

  const guildWar = await GuildWar.findOne({ status: 'active' })
  if (!guildWar) return null

  // Ensure guild has an entry (auto-register if missing)
  let entry = guildWar.entries.find((e) => e.guildId?.toString() === guildId.toString())
  if (!entry) {
    // Auto-register guild if they don't have an entry yet
    if (guildName) {
      entry = {
        guildId,
        guildName,
        valor: 0,
        outpostsCaptured: 0,
        strongholdsDestroyed: 0,
        totalDamageDealt: 0,
        damageReceived: 0,
        attacksSurvived: 0,
        strongholdDefenses: 0,
        warSupplies: 0,
        suppliesGenerated: 0,
        suppliesSpent: 0,
        repairsCompleted: 0,
        buffsActivated: 0,
        activeBuffs: [],
        memberContributions: [],
      }
      guildWar.entries.push(entry)
      guildWar.metadata.totalGuildsParticipated = guildWar.entries.length
      
      // Also add stronghold if missing
      const hasStronghold = guildWar.strongholds.some(
        (s) => s.guildId?.toString() === guildId.toString()
      )
      if (!hasStronghold && guildLevel !== undefined) {
        const maxHp = calculateStrongholdHP(guildLevel)
        guildWar.strongholds.push({
          guildId,
          guildName,
          maxHp,
          currentHp: maxHp,
          lastRegenAt: new Date(),
          isDestroyed: false,
        })
      }
    } else {
      return guildWar
    }
  }

  // Update guild totals with valor
  entry.totalDamageDealt += damage
  entry.valor += valor
  if (outpostCaptured) entry.outpostsCaptured += 1
  if (strongholdDestroyed) entry.strongholdsDestroyed += 1

  // Find or create member contribution
  let memberContrib = entry.memberContributions.find(
    (m) => m.playerId?.toString() === playerId.toString()
  )

  if (!memberContrib) {
    memberContrib = {
      playerId,
      username,
      damageDealt: 0,
      missionsCompleted: 0,
      outpostsCaptured: 0,
      strongholdsDestroyed: 0,
      valorEarned: 0,
    }
    entry.memberContributions.push(memberContrib)
  }

  // Update member stats
  memberContrib.damageDealt += damage
  memberContrib.valorEarned += valor
  memberContrib.missionsCompleted += 1
  if (outpostCaptured) memberContrib.outpostsCaptured += 1
  if (strongholdDestroyed) memberContrib.strongholdsDestroyed += 1

  await guildWar.save()
  return guildWar
}

/**
 * Finalize guild war - set status and computed data
 */
export async function finalizeGuildWar(
  weekNumber: number,
  data: IGuildWarData,
  metadata: Partial<IGuildWarMetadata>
): Promise<IGuildWarDocument | null> {
  await connectDB()

  return GuildWar.findOneAndUpdate(
    { weekNumber, status: 'active' },
    {
      $set: {
        status: 'finalized',
        data,
        'metadata.calculatedAt': new Date(),
        'metadata.rewardsDistributed': metadata.rewardsDistributed,
        'metadata.rewardsDistributedAt': metadata.rewardsDistributedAt,
        'metadata.rewardsSummary': metadata.rewardsSummary,
        'metadata.notes': metadata.notes,
      },
    },
    { returnDocument: 'after' }
  )
}

/**
 * Mark rewards as distributed for a guild war
 */
export async function markRewardsDistributed(
  weekNumber: number,
  rewardsSummary: {
    guildCount: number
    totalPointsDistributed: number
  }
): Promise<void> {
  await connectDB()

  await GuildWar.updateOne(
    { weekNumber },
    {
      $set: {
        'metadata.rewardsDistributed': true,
        'metadata.rewardsDistributedAt': new Date(),
        'metadata.rewardsSummary': rewardsSummary,
      },
    }
  )
}

// ═��═════════════════════════════════════════════════════════════════════════════
// Delete Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Delete old finalized guild wars (cleanup)
 */
export async function deleteOldGuildWars(
  beforeWeekNumber: number
): Promise<{ deletedCount?: number }> {
  await connectDB()
  return GuildWar.deleteMany({
    status: 'finalized',
    weekNumber: { $lt: beforeWeekNumber },
  })
}
