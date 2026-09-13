import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type MissionType = 'dungeon' | 'story' | 'boss' | 'training' | 'war_outpost' | 'war_stronghold'
export type TrainingType = 'weapons' | 'mount' | 'merchant'

export interface IMission {
  owner: Types.ObjectId
  type: MissionType
  sourceName?: string
  startTime: Date
  duration: number
  dungeonId?: string
  missionTypeId?: string
  territoryId?: string
  questNumber?: number
  bossId?: string
  // War mission fields
  guildWarId?: Types.ObjectId
  targetOutpostId?: string
  targetGuildId?: Types.ObjectId
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IMissionDocument extends IMission, Document {
  _id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════════════════════════════════════════

const MissionSchema = new Schema<IMissionDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['dungeon', 'story', 'boss', 'training', 'war_outpost', 'war_stronghold'],
      required: true,
    },
    sourceName: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: Number,
      min: 0,
      required: true,
    },
    dungeonId: {
      type: String,
      trim: true,
    },
    missionTypeId: {
      type: String,
      trim: true,
    },
    territoryId: {
      type: String,
      trim: true,
    },
    questNumber: {
      type: Number,
    },
    bossId: {
      type: String,
      trim: true,
    },
    // War mission fields
    guildWarId: {
      type: Schema.Types.ObjectId,
      ref: 'GuildWar',
    },
    targetOutpostId: {
      type: String,
      trim: true,
    },
    targetGuildId: {
      type: Schema.Types.ObjectId,
      ref: 'Guild',
    },
    completedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
)

MissionSchema.index({ owner: 1, completedAt: 1 })

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

const Mission: Model<IMissionDocument> =
  mongoose.models.Mission || mongoose.model<IMissionDocument>('Mission', MissionSchema)

export default Mission
