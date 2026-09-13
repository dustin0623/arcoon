import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type HistoryStatus = 'started' | 'completed' | 'failed' | 'cancelled'

export interface IHistoryActor {
  playerId: Types.ObjectId | null
  username: string
}

export interface IHistoryTarget {
  entityType: string | null
  entityId: string | null
  label: string | null
}

export interface IHistoryContext {
  service: string
  action: string
  correlationId: string | null
}

export interface IHistory {
  // Legacy compatibility fields
  username: string
  source: string
  eventType: string
  data: Record<string, unknown>
  // Canonical audit fields
  eventKey: string
  status: HistoryStatus
  actor: IHistoryActor
  target?: IHistoryTarget
  context: IHistoryContext
  metadata: Record<string, unknown>
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface IHistoryDocument extends IHistory, Document {
  _id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════════════════════════════════════════

const historySchema = new Schema<IHistoryDocument>(
  {
    // Legacy compatibility fields kept for existing consumers.
    username: { type: String, required: true },
    source: { type: String, required: true },
    eventType: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },

    // Canonical audit fields.
    eventKey: { type: String, required: true },
    status: {
      type: String,
      enum: ['started', 'completed', 'failed', 'cancelled'],
      default: 'completed',
    },
    actor: {
      playerId: { type: Schema.Types.ObjectId, ref: 'Player', default: null },
      username: { type: String, required: true },
    },
    target: {
      entityType: { type: String, default: null },
      entityId: { type: String, default: null },
      label: { type: String, default: null },
    },
    context: {
      service: { type: String, required: true },
      action: { type: String, required: true },
      correlationId: { type: String, default: null },
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    tags: [{ type: String }],
  },
  { timestamps: true }
)

historySchema.pre('validate', function setCompatibilityDefaults(this: IHistoryDocument) {
  if (!this.actor) this.actor = { playerId: null, username: '' }
  if (!this.actor.username && this.username) this.actor.username = this.username
  if (!this.username && this.actor.username) this.username = this.actor.username

  if (!this.context) this.context = { service: '', action: '', correlationId: null }
  if (!this.context.service && this.source) this.context.service = this.source
  if (!this.source && this.context.service) this.source = this.context.service

  if (!this.eventType) this.eventType = 'system'
  if (!this.context.action) this.context.action = this.eventType
  if (!this.eventKey) this.eventKey = `${this.source}.${this.eventType}`

  if (this.data == null && this.metadata != null) this.data = this.metadata
  if (this.metadata == null && this.data != null) this.metadata = this.data
})

// Performance indexes for common queries
historySchema.index({ username: 1 })
historySchema.index({ username: 1, createdAt: -1 })
historySchema.index({ eventType: 1 })
historySchema.index({ eventKey: 1, createdAt: -1 })
historySchema.index({ source: 1, createdAt: -1 })
historySchema.index({ 'actor.playerId': 1, createdAt: -1 })
historySchema.index({ 'context.correlationId': 1 })

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

// Delete cached model in development to pick up schema changes
if (mongoose.models.History) {
  delete mongoose.models.History
}

const History: Model<IHistoryDocument> = mongoose.model<IHistoryDocument>('History', historySchema)

export default History
