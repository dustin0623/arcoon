import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'special'
export type CardType = 'hero' | 'equipment' | 'relic' | 'mount' | 'artifact' | 'booster' | 'transport'

export interface ICard {
  owner: Types.ObjectId
  cardId: string
  rarity: CardRarity
  type: CardType
  quantity: number
  createdAt: Date
  updatedAt: Date
}

export interface ICardDocument extends ICard, Document {
  _id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════════════════════════════════════════

const CardSchema = new Schema<ICardDocument>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    cardId: { type: String, required: true },
    type: {
      type: String,
      enum: ['hero', 'equipment', 'relic', 'mount', 'artifact', 'booster', 'transport'],
      required: true,
    },
    class: {
      type: String,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'special'],
      required: true,
    },
    quantity: { type: Number, default: 1 },
  },
  { timestamps: true }
)

CardSchema.index({ owner: 1, cardId: 1 }, { unique: true })

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

const Card: Model<ICardDocument> =
  mongoose.models.Card || mongoose.model<ICardDocument>('Card', CardSchema)

export default Card
