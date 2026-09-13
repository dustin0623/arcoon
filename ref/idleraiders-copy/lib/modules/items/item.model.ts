import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type ItemType = 'material' | 'potion' | 'pack'

export interface IItem {
  playerId: Types.ObjectId
  id: string
  itemType: ItemType
  quantity: number
  createdAt: Date
  updatedAt: Date
}

export interface IItemDocument extends IItem, Document {
  _id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════════════════════════════════════════

const ItemSchema = new Schema<IItemDocument>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    id: { type: String, required: true },
    itemType: { type: String, enum: ['material', 'potion', 'pack'], required: true },
    quantity: { type: Number, default: 0, min: 0, max: 9999 },
  },
  { timestamps: true }
)

ItemSchema.index({ playerId: 1, id: 1 }, { unique: true })
ItemSchema.index({ playerId: 1, itemType: 1 })

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

const Item: Model<IItemDocument> =
  mongoose.models.Item || mongoose.model<IItemDocument>('Item', ItemSchema)

export default Item
