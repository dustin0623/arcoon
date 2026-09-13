import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type TerritoryId = 't1' | 't2' | 't3' | 't4' | 't5'

export interface IMilestones {
  totalBossDamage: number
  totalMinutesPlayed: number
  totalOpenedPacks: number
  totalCardsCollected: number
  totalCraftedCards: number
  totalMissionsCompleted: number
  totalTrainingSessions: number
  storyProgress: number
  // Per-dungeon-per-mission lifetime completion counter, keyed `${dungeonId}_${missionTypeId}`.
  // Sparse: only stores entries the player has actually completed.
  missionCompletions: Map<string, number>
}

export interface IMissionStats {
  fatigue: number
  mastery: number
  isExpBoostActive: boolean
}

export interface IDailyDungeonStats {
  lastReset: Date
  runs: Map<string, number>
}

export interface IPlayer {
  username: string
  isRegistered: boolean
  // Ban state — set by admin tooling (e.g., for multi-accounting, abuse, RMT).
  // When true, the /game gate blocks the player from playing. Login still works.
  isBanned: boolean
  banReason?: string
  bannedAt?: Date
  level: number
  xp: number
  coins: number
  shards: number
  dollars: number
  energy: number
  storageSlots: number
  missionStats?: IMissionStats
  milestones?: IMilestones
  activeMission: Types.ObjectId | null
  guildId: Types.ObjectId | null
  lastCycleUpdate: Date
  referredBy: string
  dailyDungeonStats?: IDailyDungeonStats
  /**
   * Bounded set of Transaction `_id`s whose credit (e.g. balance/dollars $inc)
   * has already been applied to this player. Used as an idempotency anchor in
   * the credit-applying processors so a replay after a worker crash will
   * no-op rather than double-credit. Capped to the most recent 1000 entries.
   * Excluded from default queries via `select: false`.
   */
  creditedTxIds: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

export interface IPlayerDocument extends IPlayer, Document {
  _id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Schemas
// ═══════════════════════════════════════════════════════════════════════════════

const MilestoneSchema = new Schema<IMilestones>({
  totalBossDamage: { type: Number, default: 0 },
  totalMinutesPlayed: { type: Number, default: 0 },
  totalOpenedPacks: { type: Number, default: 0 },
  totalCardsCollected: { type: Number, default: 0 },
  totalCraftedCards: { type: Number, default: 0 },
  totalMissionsCompleted: { type: Number, default: 0 },
  totalTrainingSessions: { type: Number, default: 0 },
  storyProgress: { type: Number, min: 0, max: 25, default: 0 },
  missionCompletions: { type: Map, of: Number, default: {} },
},
  { _id: false }
)

const MissionStatsSchema = new Schema<IMissionStats>({
  fatigue: { type: Number, min: 0, default: 0 },
  mastery: { type: Number, min: 0, default: 0 },
  isExpBoostActive: { type: Boolean, default: false },
},
  { _id: false }
)

const DailyDungeonStatsSchema = new Schema<IDailyDungeonStats>(
  {
    lastReset: { type: Date, default: Date.now },
    runs: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { _id: false }
)

const PlayerSchema = new Schema<IPlayerDocument>(
  {
    username: { type: String, unique: true, required: true },
    isRegistered: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false, index: true },
    banReason: { type: String },
    bannedAt: { type: Date },
    level: { type: Number, min: 1, max: 150, default: 1 },
    xp: { type: Number, min: 0, default: 0 },
    coins: { type: Number, min: 0, default: 0 },
    shards: { type: Number, min: 0, default: 0 },
    dollars: { type: Number, min: 0, default: 0 },
    energy: { type: Number, min: 0, max: 100, default: 100 },
    storageSlots: { type: Number, min: 3, default: 3 },
    activeMission: { type: Schema.Types.ObjectId, ref: 'Mission', default: null },
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild', default: null },
    missionStats: MissionStatsSchema,
    milestones: MilestoneSchema,
    dailyDungeonStats: DailyDungeonStatsSchema,
    lastCycleUpdate: { type: Date, default: Date.now },
    referredBy: { type: String, default: 'idleraiders' },
    creditedTxIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      // Hide from default queries — this is internal bookkeeping, not data
      // that should ever flow to API consumers or socket payloads.
      select: false,
    },
  },
  { timestamps: true }
)

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

const Player: Model<IPlayerDocument> =
  mongoose.models.Player || mongoose.model<IPlayerDocument>('Player', PlayerSchema)

export default Player
