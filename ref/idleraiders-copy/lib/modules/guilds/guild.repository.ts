import { Types, type ClientSession } from 'mongoose'
import Guild, { type IGuildDocument, type IGuildMember, type GuildRole, type IChatMessage, type IGuildPerk, type IJoinRequest } from './guild.model'
import { connectDB } from '@/lib/config/database'

// ═══════════════════════════════════════════════════════════════════════════════
// Query Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function findById(id: string | Types.ObjectId): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findById(id)
}

// Alias for backwards compatibility
export const findGuildById = findById

export async function findByName(name: string): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
}

// Alias for backwards compatibility
export const findGuildByName = findByName

export async function findByTag(tag: string): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findOne({ tag: { $regex: new RegExp(`^${tag}$`, 'i') } })
}

// Alias for backwards compatibility
export const findGuildByTag = findByTag

export async function findByPlayerId(playerId: string | Types.ObjectId): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findOne({ 'members.playerId': new Types.ObjectId(playerId.toString()) })
}

// Alias for backwards compatibility
export const findGuildByPlayerId = findByPlayerId

export async function findAll(
  filter: Record<string, unknown> = {},
  options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> } = {}
): Promise<IGuildDocument[]> {
  await connectDB()
  const query = Guild.find(filter)
  if (options.skip) query.skip(options.skip)
  if (options.limit) query.limit(options.limit)
  if (options.sort) query.sort(options.sort)
  return query
}

// Alias for backwards compatibility
export const findAllGuilds = findAll

export async function findAllLean(): Promise<IGuildDocument[]> {
  await connectDB()
  return Guild.find().lean() as unknown as IGuildDocument[]
}

export async function findForStats(): Promise<IGuildDocument[]> {
  await connectDB()
  return Guild.find({}, { name: 1, members: 1, level: 1, xp: 1 }).lean() as unknown as IGuildDocument[]
}

export async function count(filter: Record<string, unknown> = {}): Promise<number> {
  await connectDB()
  return Guild.countDocuments(filter)
}

// Alias for backwards compatibility
export const countGuilds = count

// ═══════════════════════════════════════════════════════════════════════════════
// Create / Update Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function create(data: Partial<IGuildDocument>): Promise<IGuildDocument> {
  await connectDB()
  return Guild.create(data)
}

// Alias for backwards compatibility
export const createGuild = create

export async function updateById(
  id: string | Types.ObjectId,
  update: Partial<IGuildDocument>,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findByIdAndUpdate(id, update, options)
}

// Alias for backwards compatibility
export const updateGuildById = updateById

export async function deleteById(id: string | Types.ObjectId): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findByIdAndDelete(id)
}

// Alias for backwards compatibility
export const deleteGuildById = deleteById

// ═══════════════════════════════════════════════════════════════════════════════
// Member Management
// ═══════════════════════════════════════════════════════════════════════════════

export async function addMember(
  guildId: string | Types.ObjectId,
  member: Partial<IGuildMember>,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findByIdAndUpdate(
    guildId,
    { $push: { members: member } },
    options
  )
}

// Alias for backwards compatibility
export const addMemberToGuild = addMember

export async function removeMember(
  guildId: string | Types.ObjectId,
  playerId: string | Types.ObjectId,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findByIdAndUpdate(
    guildId,
    { $pull: { members: { playerId: new Types.ObjectId(playerId.toString()) } } },
    options
  )
}

// Alias for backwards compatibility
export const removeMemberFromGuild = removeMember

export async function removeMemberById(
  guildId: string | Types.ObjectId,
  memberId: string
): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findByIdAndUpdate(
    guildId,
    { $pull: { members: { _id: new Types.ObjectId(memberId) } } },
    { returnDocument: 'after' }
  )
}

export async function updateMemberRole(
  guildId: string | Types.ObjectId,
  memberId: string,
  role: GuildRole,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findOneAndUpdate(
    { _id: guildId, 'members._id': new Types.ObjectId(memberId) },
    { $set: { 'members.$.role': role } },
    options
  )
}

export async function updateMemberRoleByPlayerId(
  guildId: string | Types.ObjectId,
  playerId: string | Types.ObjectId,
  role: GuildRole,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findOneAndUpdate(
    { _id: guildId, 'members.playerId': new Types.ObjectId(playerId.toString()) },
    { $set: { 'members.$.role': role } },
    options
  )
}

export async function updateMemberContribution(
  guildId: string | Types.ObjectId,
  playerId: string | Types.ObjectId,
  xpAmount: number,
  tokensAmount: number,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findOneAndUpdate(
    { _id: guildId, 'members.playerId': new Types.ObjectId(playerId.toString()) },
    {
      $inc: {
        'members.$.donatedXp': xpAmount,
        'members.$.contributedTokens': tokensAmount
      }
    },
    options
  )
}

export async function updateMemberLastActive(
  guildId: string | Types.ObjectId,
  playerId: string | Types.ObjectId
): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findOneAndUpdate(
    { _id: guildId, 'members.playerId': new Types.ObjectId(playerId.toString()) },
    { $set: { 'members.$.lastActive': new Date() } },
    { returnDocument: 'after' }
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Reputation & Ranking
// ═══════════════════════════════════════════════════════════════════════════════

export async function updateReputationCache(
  guildId: string | Types.ObjectId,
  data: {
    reputation: number
    totalRaidPower: number
    activeMembers24h: number
    lastReputationUpdate: Date
  }
): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findByIdAndUpdate(
    guildId,
    { $set: data },
    { returnDocument: 'after' }
  )
}

export async function updateMemberRaidPower(
  guildId: string | Types.ObjectId,
  playerId: string,
  raidPower: number
): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findOneAndUpdate(
    { _id: guildId, 'members.playerId': playerId },
    { $set: { 'members.$.raidPower': raidPower } },
    { returnDocument: 'after' }
  )
}

export async function findAllSortedForBrowse(
  sortBy: 'reputation' | 'level' | 'raidPower' | 'members' | 'xp' = 'reputation',
  options: { skip?: number; limit?: number } = {}
): Promise<IGuildDocument[]> {
  await connectDB()
  
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    reputation: { reputation: -1, level: -1 },
    level: { level: -1, xp: -1 },
    raidPower: { totalRaidPower: -1, level: -1 },
    members: { 'members.length': -1, level: -1 },
    xp: { xp: -1, level: -1 },
  }
  
  const query = Guild.find().sort(sortMap[sortBy] || sortMap.reputation)
  if (options.skip) query.skip(options.skip)
  if (options.limit) query.limit(options.limit)
  
  return query
}

// ══════════��═══════════���════════════════════════════════════════════════════════
// Member Helper Functions (synchronous, operate on guild document)
// ═══════════════════════════════════════════════════════════════════════════════

export function findMemberByPlayerId(guild: IGuildDocument, playerId: Types.ObjectId | string): IGuildMember | undefined {
  const playerIdStr = playerId.toString()
  return guild.members.find((m) => m.playerId?.toString() === playerIdStr)
}

export function findMemberById(guild: IGuildDocument, memberId: string): IGuildMember | undefined {
  return guild.members.find((m) => (m as unknown as { _id?: Types.ObjectId })._id?.toString() === memberId)
}

export function hasLeader(guild: IGuildDocument): boolean {
  return guild.members.some((m) => m.role === 'leader')
}

// ═══════════════════════════════════════════════════════════════════════════════
// Guild XP & Level
// ═══════════════════════════════════════════════════════════════════════════════

export async function addXp(
  guildId: string | Types.ObjectId,
  amount: number,
  newLevel?: number,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  const update: Record<string, unknown> = { $inc: { xp: amount } }
  if (newLevel !== undefined) {
    update.$set = { level: newLevel }
  }
  return Guild.findByIdAndUpdate(guildId, update, options)
}

// Alias for backwards compatibility
export const addGuildXp = addXp

export async function setLevel(
  guildId: string | Types.ObjectId,
  level: number,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findByIdAndUpdate(
    guildId,
    { $set: { level } },
    options
  )
}

// Alias for backwards compatibility
export const setGuildLevel = setLevel

// ═══════════════════════════════════════════════════════════════════════════════
// Guild Settings
// ═══════════════════════════════════════════════════════════════════════════════

export async function updateName(
  guildId: string | Types.ObjectId,
  name: string
): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findByIdAndUpdate(
    guildId,
    { $set: { name } },
    { returnDocument: 'after' }
  )
}

export async function updateMotto(
  guildId: string | Types.ObjectId,
  motto: string
): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findByIdAndUpdate(
    guildId,
    { $set: { motto } },
    { returnDocument: 'after' }
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Treasury Management
// ═══════════════════════════════════════════════════════════════════════════════

export async function updateTreasury(
  guildId: string | Types.ObjectId,
  tokensAmount: number,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findByIdAndUpdate(
    guildId,
    { $inc: { tokens: tokensAmount } },
    options
  )
}

// Alias for backwards compatibility
export const updateGuildTreasury = updateTreasury

export async function incrementPoints(
  guildId: string | Types.ObjectId,
  pointsAmount: number,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findByIdAndUpdate(
    guildId,
    { $inc: { points: pointsAmount } },
    options
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chat Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function addChatMessage(
  guildId: string | Types.ObjectId,
  message: IChatMessage | { sender: string; text: string; timestamp: Date }
): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findByIdAndUpdate(
    guildId,
    {
      $push: {
        chat: {
          $each: [message],
          $slice: -100 // Keep only last 100 messages
        }
      }
    },
    { returnDocument: 'after' }
  )
}

export async function getChat(
  guildId: string | Types.ObjectId,
  limit: number = 50
): Promise<IChatMessage[]> {
  await connectDB()
  const guild = await Guild.findById(guildId).select('chat')
  if (!guild) return []
  return guild.chat.slice(-limit)
}

// Alias for backwards compatibility
export const getGuildChat = getChat

// ═══════════════════════════════════════════════════════════════════════════════
// Join Request Management
// ═══════════════════════════════════════════════════════════════════════════════

export async function addJoinRequest(
  guildId: string | Types.ObjectId,
  playerId: string | Types.ObjectId,
  playerName: string,
  level: number,
  raidPower: number,
  message?: string
): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findByIdAndUpdate(
    guildId,
    {
      $push: {
        joinRequests: {
          playerId: new Types.ObjectId(playerId.toString()),
          playerName,
          level,
          raidPower,
          message: message || '',
          appliedAt: new Date()
        }
      }
    },
    { returnDocument: 'after' }
  )
}

export async function removeJoinRequest(
  guildId: string | Types.ObjectId,
  playerId: string | Types.ObjectId
): Promise<IGuildDocument | null> {
  await connectDB()
  return Guild.findByIdAndUpdate(
    guildId,
    { $pull: { joinRequests: { playerId: new Types.ObjectId(playerId.toString()) } } },
    { returnDocument: 'after' }
  )
}

export async function getJoinRequests(
  guildId: string | Types.ObjectId
): Promise<IJoinRequest[]> {
  await connectDB()
  const guild = await Guild.findById(guildId).select('joinRequests')
  return guild?.joinRequests ?? []
}

export async function hasJoinRequest(
  guildId: string | Types.ObjectId,
  playerId: string | Types.ObjectId
): Promise<boolean> {
  await connectDB()
  const guild = await Guild.findOne({
    _id: guildId,
    'joinRequests.playerId': new Types.ObjectId(playerId.toString())
  })
  return !!guild
}

export async function findPlayerPendingApplications(
  playerId: string | Types.ObjectId
): Promise<{ guildId: string; guildName: string; appliedAt: Date }[]> {
  await connectDB()
  const guilds = await Guild.find(
    { 'joinRequests.playerId': new Types.ObjectId(playerId.toString()) },
    { _id: 1, name: 1, joinRequests: 1 }
  ).lean()
  
  return guilds.map(g => {
    const request = g.joinRequests.find(r => r.playerId.toString() === playerId.toString())
    return {
      guildId: g._id.toString(),
      guildName: g.name,
      appliedAt: request?.appliedAt || new Date()
    }
  })
}

export async function removeAllPlayerApplications(
  playerId: string | Types.ObjectId
): Promise<void> {
  await connectDB()
  await Guild.updateMany(
    { 'joinRequests.playerId': new Types.ObjectId(playerId.toString()) },
    { $pull: { joinRequests: { playerId: new Types.ObjectId(playerId.toString()) } } }
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Perks Management
// ═���═════════════════════════════════════════════════════════════════════════════

export async function addPerk(
  guildId: string | Types.ObjectId,
  perk: IGuildPerk,
  pointsCost: number,
  session?: ClientSession
): Promise<IGuildDocument | null> {
  await connectDB()
  const options = session ? { returnDocument: 'after', session } : { returnDocument: 'after' }
  return Guild.findByIdAndUpdate(
    guildId,
    {
      $push: { perks: perk },
      $inc: { points: -pointsCost }
    },
    options
  )
}

export async function getPerks(guildId: string | Types.ObjectId): Promise<IGuildPerk[]> {
  await connectDB()
  const guild = await Guild.findById(guildId).select('perks')
  return guild?.perks ?? []
}

export async function hasPerk(
  guildId: string | Types.ObjectId,
  perkId: string
): Promise<boolean> {
  await connectDB()
  const guild = await Guild.findOne({
    _id: guildId,
    'perks.perkId': perkId
  })
  return !!guild
}

export async function getGuildWithPerks(
  guildId: string | Types.ObjectId
): Promise<Pick<IGuildDocument, '_id' | 'name' | 'points' | 'perks' | 'level'> | null> {
  await connectDB()
  return Guild.findById(guildId).select('name points perks level').lean()
}

// ═══════════════════════════════════════════════════════════════════════════════
// Leaderboard Queries
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTopByXp(limit: number = 10): Promise<IGuildDocument[]> {
  await connectDB()
  return Guild.find().sort({ xp: -1 }).limit(limit)
}

// Alias for backwards compatibility
export const getTopGuildsByXp = getTopByXp

export async function getTopByLevel(limit: number = 10): Promise<IGuildDocument[]> {
  await connectDB()
  return Guild.find().sort({ level: -1, xp: -1 }).limit(limit)
}

// Alias for backwards compatibility
export const getTopGuildsByLevel = getTopByLevel

export async function findAllSortedByReputation(
  options: { skip?: number; limit?: number } = {}
): Promise<IGuildDocument[]> {
  await connectDB()
  const query = Guild.find().sort({ reputation: -1, level: -1, xp: -1 })
  if (options.skip) query.skip(options.skip)
  if (options.limit) query.limit(options.limit)
  return query
}

export async function getTopByReputation(limit: number = 50): Promise<IGuildDocument[]> {
  await connectDB()
  return Guild.find().sort({ reputation: -1 }).limit(limit)
}
