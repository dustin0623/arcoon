import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Outpost status - neutral or controlled by a guild
 */
export interface IWarOutpost {
  outpostId: string // "outpost_1" through "outpost_5"
  name: string
  controlledBy?: Types.ObjectId // Guild ID
  controlledByName?: string
  capturedAt?: Date
  garrison: number // Current HP (0 to maxGarrison)
  maxGarrison: number // Max HP: outpost_1=100K, outpost_2=250K, outpost_3=500K, outpost_4=750K, outpost_5=1M
  // Points now calculated from damage dealt with outpost damage multiplier
}

/**
 * Guild stronghold - each guild has one
 */
export interface IWarStronghold {
  guildId: Types.ObjectId
  guildName: string
  maxHp: number // Based on guild level (1000 base + level * 100)
  currentHp: number
  lastRegenAt: Date // For on-demand HP regeneration
  isDestroyed: boolean
  destroyedAt?: Date
  destroyedBy?: Types.ObjectId // Guild that destroyed it
}

/**
 * Active war buff
 * - warCry: +10% damage for 1 hour
 * - reinforce: +15% defense for 2 hours
 * - rally: Free attacks (no energy cost) for 1 hour
 * - shieldWall: -25% damage received for 2 hours (replaces fortify)
 */
export interface IWarBuff {
  type: 'warCry' | 'reinforce' | 'rally' | 'shieldWall'
  activatedAt: Date
  expiresAt: Date
  activatedBy: Types.ObjectId
}

/**
 * Individual member contribution within a guild entry
 */
export interface IMemberWarContribution {
  playerId: Types.ObjectId
  username: string
  damageDealt: number // Total damage dealt this season
  missionsCompleted: number // War missions completed this season
  outpostsCaptured: number // Capture contributions
  strongholdsDestroyed: number // Stronghold kill contributions
  valorEarned: number // Total valor earned (attack + defense)
}

/**
 * Guild entry in guild war (similar to ILeaderboardEntry)
 */
export interface IGuildWarEntry {
  guildId: Types.ObjectId
  guildName: string
  valor: number // Primary ranking metric (renamed from points)
  outpostsCaptured: number // Total outposts captured this season
  strongholdsDestroyed: number // Total strongholds destroyed this season
  totalDamageDealt: number // Total damage dealt by all members
  
  // War Economy - Defense
  damageReceived: number // Total damage absorbed when defending
  attacksSurvived: number // Outposts attacked but not lost
  strongholdDefenses: number // Stronghold attacks survived
  
  // War Economy - Supplies
  warSupplies: number // Current supply balance
  suppliesGenerated: number // Total earned this season
  suppliesSpent: number // Total spent this season
  
  // War Economy - Actions
  repairsCompleted: number // Repair action count
  buffsActivated: number // Buff action count
  activeBuffs: IWarBuff[] // Currently active buffs
  
  memberContributions: IMemberWarContribution[]
}

/**
 * Rank entry for finalized guild war data
 */
export interface IGuildWarRank {
  guildId: string
  guildName: string
  valor: number // Primary ranking (renamed from points)
  damageReceived: number // Total damage absorbed
  totalDamageDealt: number // Raw damage dealt for display
  outpostsCaptured: number
  strongholdsDestroyed: number
  reward: number
}

/**
 * Computed guild war data (populated during finalization)
 */
export interface IGuildWarData {
  pool: number // Total reward pool
  reward: number // Total rewards distributed
  ranks: Record<string, IGuildWarRank> // "1", "2", "3"...
}

/**
 * Guild war metadata
 */
export interface IGuildWarMetadata {
  totalGuildsParticipated: number
  calculatedAt?: Date
  rewardsDistributed?: boolean
  rewardsDistributedAt?: Date
  rewardsSummary?: {
    guildCount: number
    totalPointsDistributed: number
  }
  notes?: string
}

/**
 * Main guild war document interface
 * One document per week - mirrors Leaderboard structure
 */
export interface IGuildWar {
  // Week identity
  weekNumber: number
  weekStart: Date
  weekEnd: Date

  // Status: active = current week, finalized = historical
  status: 'active' | 'finalized'

  // Outposts (5 total, neutral at season start)
  outposts: IWarOutpost[]

  // Guild strongholds (created when guild joins war)
  strongholds: IWarStronghold[]

  // Root level data (populated during finalization)
  data: IGuildWarData

  // Guild entries with points and contributions
  entries: IGuildWarEntry[]

  // Metadata
  metadata: IGuildWarMetadata

  // Cycle update tracking (for stronghold regen - decay removed)
  lastCycleUpdate: Date

  createdAt: Date
  updatedAt: Date
}

export interface IGuildWarDocument extends IGuildWar, Document {
  _id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Schemas
// ═══════════════════════════════════════════════════════════════════════════════

const WarBuffSchema = new Schema<IWarBuff>(
  {
    type: { type: String, enum: ['warCry', 'reinforce', 'rally', 'shieldWall'], required: true },
    activatedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    activatedBy: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  },
  { _id: false }
)

const WarOutpostSchema = new Schema<IWarOutpost>(
  {
    outpostId: { type: String, required: true },
    name: { type: String, required: true },
    controlledBy: { type: Schema.Types.ObjectId, ref: 'Guild' },
    controlledByName: { type: String },
    capturedAt: { type: Date },
    garrison: { type: Number, default: 0 },
    maxGarrison: { type: Number, required: true },
  },
  { _id: false }
)

const WarStrongholdSchema = new Schema<IWarStronghold>(
  {
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild', required: true },
    guildName: { type: String, required: true },
    maxHp: { type: Number, required: true },
    currentHp: { type: Number, required: true },
    lastRegenAt: { type: Date, default: Date.now },
    isDestroyed: { type: Boolean, default: false },
    destroyedAt: { type: Date },
    destroyedBy: { type: Schema.Types.ObjectId, ref: 'Guild' },
  },
  { _id: false }
)

const MemberWarContributionSchema = new Schema<IMemberWarContribution>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    username: { type: String, required: true },
    damageDealt: { type: Number, default: 0 },
    missionsCompleted: { type: Number, default: 0 },
    outpostsCaptured: { type: Number, default: 0 },
    strongholdsDestroyed: { type: Number, default: 0 },
    valorEarned: { type: Number, default: 0 },
  },
  { _id: false }
)

const GuildWarEntrySchema = new Schema<IGuildWarEntry>(
  {
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild', required: true },
    guildName: { type: String, required: true },
    valor: { type: Number, default: 0 },
    outpostsCaptured: { type: Number, default: 0 },
    strongholdsDestroyed: { type: Number, default: 0 },
    totalDamageDealt: { type: Number, default: 0 },
    // War Economy - Defense
    damageReceived: { type: Number, default: 0 },
    attacksSurvived: { type: Number, default: 0 },
    strongholdDefenses: { type: Number, default: 0 },
    // War Economy - Supplies
    warSupplies: { type: Number, default: 0 },
    suppliesGenerated: { type: Number, default: 0 },
    suppliesSpent: { type: Number, default: 0 },
    // War Economy - Actions
    repairsCompleted: { type: Number, default: 0 },
    buffsActivated: { type: Number, default: 0 },
    activeBuffs: { type: [WarBuffSchema], default: [] },
    memberContributions: { type: [MemberWarContributionSchema], default: [] },
  },
  { _id: false }
)

const GuildWarRankSchema = new Schema(
  {
    guildId: { type: String },
    guildName: { type: String },
    valor: { type: Number },
    damageReceived: { type: Number, default: 0 },
    totalDamageDealt: { type: Number, default: 0 },
    outpostsCaptured: { type: Number },
    strongholdsDestroyed: { type: Number },
    reward: { type: Number },
  },
  { _id: false }
)

const GuildWarDataSchema = new Schema(
  {
    pool: { type: Number, default: 0 },
    reward: { type: Number, default: 0 },
    ranks: { type: Map, of: GuildWarRankSchema, default: {} },
  },
  { _id: false }
)

const GuildWarMetadataSchema = new Schema(
  {
    totalGuildsParticipated: { type: Number, default: 0 },
    calculatedAt: { type: Date },
    rewardsDistributed: { type: Boolean, default: false },
    rewardsDistributedAt: { type: Date },
    rewardsSummary: {
      guildCount: { type: Number },
      totalPointsDistributed: { type: Number },
    },
    notes: { type: String },
  },
  { _id: false }
)

// ════════════════════════════════���══════════════════════════════════════════════
// Main Schema
// ═══════════════════════════════════════════════════════════════════════════════

const GuildWarSchema = new Schema<IGuildWarDocument>(
  {
    weekNumber: { type: Number, required: true, index: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'finalized'],
      default: 'active',
      index: true,
    },
    outposts: { type: [WarOutpostSchema], default: [] },
    strongholds: { type: [WarStrongholdSchema], default: [] },
    data: { type: GuildWarDataSchema, default: () => ({ pool: 0, reward: 0, ranks: {} }) },
    entries: { type: [GuildWarEntrySchema], default: [] },
    metadata: { type: GuildWarMetadataSchema, default: () => ({}) },
    lastCycleUpdate: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Compound indexes for efficient lookups
GuildWarSchema.index({ weekNumber: 1, status: 1 })
GuildWarSchema.index({ status: 1, weekNumber: -1 })
GuildWarSchema.index({ 'entries.guildId': 1 })
GuildWarSchema.index({ 'entries.valor': -1 })
GuildWarSchema.index({ 'outposts.controlledBy': 1 })
GuildWarSchema.index({ 'strongholds.guildId': 1 })

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

const GuildWar: Model<IGuildWarDocument> =
  mongoose.models.GuildWar || mongoose.model<IGuildWarDocument>('GuildWar', GuildWarSchema)

export default GuildWar
