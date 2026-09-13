import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type GuildRole = 'leader' | 'officer' | 'member'

export interface IGuildMember {
  playerId: Types.ObjectId
  name: string
  role: GuildRole
  raidPower: number
  totalGuildDamage: number
  joinedAt: Date
  lastActive: Date
  donatedXp: number
}


export interface IChatMessage {
  sender: string
  text: string
  timestamp: Date
}

export interface IJoinRequest {
  playerId: Types.ObjectId
  playerName: string
  level: number
  raidPower: number
  message?: string
  appliedAt: Date
}

export interface IGuildPerk {
  perkId: string
  branch: string
  tier: number
  unlockedAt: Date
  unlockedBy: Types.ObjectId
}

export interface IGuild {
  name: string
  motto: string
  level: number
  xp: number
  tokens: number
  points: number
  members: IGuildMember[]
  perks: IGuildPerk[]
  chat: IChatMessage[]
  joinRequests: IJoinRequest[]
  createdAt: Date
  // Ranking fields (cached for performance)
  totalRaidPower: number
  reputation: number
  activeMembers24h: number
  lastReputationUpdate: Date
}

export interface IGuildDocument extends IGuild, Document {
  _id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Schemas
// ═══════════════════════════════════════════════════════════════════════════════

const GuildMemberSchema = new Schema<IGuildMember>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
  name: String,
  role: { type: String, enum: ['leader', 'officer', 'member'], default: 'member' },
  raidPower: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  donatedXp: { type: Number, default: 0 },
},
  { _id: false }
)


const ChatMessageSchema = new Schema<IChatMessage>({
  sender: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
},
  { _id: false }
)

const JoinRequestSchema = new Schema<IJoinRequest>({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  playerName: { type: String, required: true },
  level: { type: Number, default: 1 },
  raidPower: { type: Number, default: 0 },
  message: { type: String, default: '' },
  appliedAt: { type: Date, default: Date.now },
},
  { _id: false }
)

const GuildPerkSchema = new Schema<IGuildPerk>({
  perkId: { type: String, required: true },
  branch: { type: String, required: true },
  tier: { type: Number, required: true },
  unlockedAt: { type: Date, default: Date.now },
  unlockedBy: { type: Schema.Types.ObjectId, ref: 'Player' },
},

  { _id: false }
)

const GuildSchema = new Schema<IGuildDocument>({
  name: { type: String, unique: true, required: true },
  motto: { type: String, default: '' },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  members: [GuildMemberSchema],
  perks: { type: [GuildPerkSchema], default: [] },
  chat: { type: [ChatMessageSchema], default: [] },
  joinRequests: { type: [JoinRequestSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  // Ranking fields
  totalRaidPower: { type: Number, default: 0 },
  reputation: { type: Number, default: 0 },
  activeMembers24h: { type: Number, default: 0 },
  lastReputationUpdate: { type: Date, default: Date.now },
})

// Indexes for efficient sorting in guild browser
GuildSchema.index({ reputation: -1 })
GuildSchema.index({ totalRaidPower: -1 })
GuildSchema.index({ level: -1, xp: -1 })

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

const Guild: Model<IGuildDocument> =
  mongoose.models.Guild || mongoose.model<IGuildDocument>('Guild', GuildSchema)

export default Guild
