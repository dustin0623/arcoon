import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type ListingType = 'card'

export interface ICardStats {
  raidPower?: number
  mastery?: number
  luck?: number
  gm?: number
}

export interface IMarketListing {
  seller: Types.ObjectId
  sellerName?: string
  listingType: ListingType
  // Card listing fields
  cardId?: string
  cardName?: string
  cardRarity?: string
  cardType?: string
  cardStats?: ICardStats
  // Common fields
  quantity: number
  price: number
  listedAt: Date
  expiresAt?: Date
  soldAt: Date | null
  buyerName?: string
}

export interface IMarketListingDocument extends IMarketListing, Document {
  _id: Types.ObjectId
}

// Type aliases for backwards compatibility
export type IMarket = IMarketListing
export type IMarketDocument = IMarketListingDocument

// ═══════════════════════════════════════════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════════════════════════════════════════

const MarketSchema = new Schema<IMarketListingDocument>({
  seller: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  sellerName: String,
  listingType: { type: String, enum: ['card'], required: true },
  // Card listing fields
  cardId: String,
  cardName: String,
  cardRarity: String,
  cardType: String,
  cardStats: {
    raidPower: Number,
    mastery: Number,
    luck: Number,
    gm: Number,
  },
  // Common fields
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  listedAt: { type: Date, default: Date.now },
  expiresAt: Date,
  soldAt: { type: Date, default: null },
  buyerName: String,
})

MarketSchema.index({ listingType: 1, soldAt: 1 })

// ═══════════════════════════════════════════════════════════════════════════════
// Model Export
// ═══════════════════════════════════════════════════════════════════════════════

const Market: Model<IMarketListingDocument> =
  mongoose.models.Market || mongoose.model<IMarketListingDocument>('Market', MarketSchema)

export default Market
