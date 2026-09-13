import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Individual player entry in the leaderboard
 * Contains boss dungeon stats and future guild war contribution
 */
export interface ILeaderboardEntry {
  // Player reference
  player: Types.ObjectId
  username: string

  // Boss Dungeon stats (global leaderboard)
  totalDamage: number
  gm: number
  points: number

  // Guild reference (for guild leaderboard aggregation)
  guildId?: Types.ObjectId
  guildName?: string

  // Guild War contribution (for future use)
  warContribution?: {
    damageDealt: number
    missionsCompleted: number
    outpostsCaptured: number
    strongholdsDestroyed: number
  }
}

/**
 * Rank entry for finalized leaderboard data
 */
export interface ILeaderboardRank {
  playerId?: string
  username: string
  damage: number
  score: number
  gm: number
  reward: number
}

/**
 * Guild rank entry for finalized leaderboard data
 */
export interface IGuildLeaderboardRank {
  guildId: Types.ObjectId
  guildName: string
  damage: number
  reward: number
}

/**
 * Computed leaderboard data (populated during finalization)
 */
export interface ILeaderboardData {
  global: {
    pool: number
    reward: number
    ranks: Record<string, ILeaderboardRank> // "1", "2", "3"...
  }
  guild?: {
    pool: number
    reward: number
    ranks?: Record<string, IGuildLeaderboardRank>
  }
}

/**
 * Leaderboard metadata
 */
export interface ILeaderboardMetadata {
  totalDataCount: number
  calculatedAt?: Date
  rewardsDistributed?: boolean
  rewardsDistributedAt?: Date
  rewardsSummary?: {
    playerCount: number
    playerShards: number
    guildCount: number
    guildShards: number
  }
  isManualSnapshot?: boolean
  notes?: string

  // Dynamic Expected Damage System
  // The damage target for THIS week, computed at week creation from previous week's totalRaidPower snapshot
  expectedDamage?: number
  // Snapshot of total raid power across ALL players, captured at finalization (end of week)
  // Used by the NEXT week's leaderboard to compute its expectedDamage
  totalRaidPower?: number
}

/**
 * Main leaderboard document interface
 * One document per week - contains both live and historical data
 */
export interface ILeaderboard {
  // Week identity
  weekNumber: number
  weekStart: Date
  weekEnd: Date

  // Status: active = current week, finalized = historical
  status: 'active' | 'finalized'

  // Root level data
  data: ILeaderboardData
  entries: ILeaderboardEntry[]
  metadata: ILeaderboardMetadata

  createdAt: Date
  updatedAt: Date
}

export interface ILeaderboardDocument extends ILeaderboard, Document {
  _id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Schemas
// ═══════════════════════════════════════════════════════════════════════════════

const WarContributionSchema = new Schema(
  {
    damageDealt: { type: Number, default: 0 },
    missionsCompleted: { type: Number, default: 0 },
    outpostsCaptured: { type: Number, default: 0 },
    strongholdsDestroyed: { type: Number, default: 0 },
  },
  { _id: false }
)

const LeaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    username: { type: String, required: true },
    totalDamage: { type: Number, default: 0 },
    gm: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild' },
    guildName: { type: String },
    warContribution: { type: WarContributionSchema },
  },
  { _id: false }
)

const LeaderboardRankSchema = new Schema(
  {
    playerId: { type: String },
    username: { type: String },
    damage: { type: Number },
    score: { type: Number },
    gm: { type: Number },
    reward: { type: Number },
  },
  { _id: false }
)

const GuildLeaderboardRankSchema = new Schema(
  {
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild' },
    guildName: { type: String },
    damage: { type: Number },
    reward: { type: Number },
  },
  { _id: false }
)

const LeaderboardDataSchema = new Schema(
  {
    global: {
      pool: { type: Number, default: 0 },
      reward: { type: Number, default: 0 },
      ranks: { type: Map, of: LeaderboardRankSchema, default: {} },
    },
    guild: {
      pool: { type: Number, default: 0 },
      reward: { type: Number, default: 0 },
      ranks: { type: Map, of: GuildLeaderboardRankSchema, default: {} },
    },
  },
  { _id: false }
)

const LeaderboardMetadataSchema = new Schema(
  {
    totalDataCount: { type: Number, default: 0 },
    calculatedAt: { type: Date },
    rewardsDistributed: { type: Boolean, default: false },
    rewardsDistributedAt: { type: Date },
    rewardsSummary: {
      playerCount: { type: Number },
      playerShards: { type: Number },
      guildCount: { type: Number },
      guildShards: { type: Number },
    },
    isManualSnapshot: { type: Boolean },
    notes: { type: String },
    expectedDamage: { type: Number },
    totalRaidPower: { type: Number },
  },
  { _id: false }
)

// ═══════════════════════════════════════════════════════════════════════════════
// Main Schema
// ═══════════════════════════════════════════════════════════════════════════════

const LeaderboardSchema = new Schema<ILeaderboardDocument>(
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
    data: { type: LeaderboardDataSchema, default: () => ({ global: {}, guild: {} }) },
    entries: { type: [LeaderboardEntrySchema], default: [] },
    metadata: { type: LeaderboardMetadataSchema, default: () => ({}) },
  },
  { timestamps: true }
)

// Compound indexes for efficient lookups
LeaderboardSchema.index({ weekNumber: 1, status: 1 })
LeaderboardSchema.index({ status: 1, weekNumber: -1 })
LeaderboardSchema.index({ 'entries.player': 1 })
LeaderboardSchema.index({ 'entries.points': -1 })

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

const Leaderboard: Model<ILeaderboardDocument> =
  mongoose.models.Leaderboard || mongoose.model<ILeaderboardDocument>('Leaderboard', LeaderboardSchema)

export default Leaderboard
