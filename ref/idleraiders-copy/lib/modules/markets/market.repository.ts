import type { Types, FilterQuery } from 'mongoose'
import Market, { type IMarketDocument, type IMarket } from './market.model'
import { connectDB } from '@/lib/config/database'

// ═══════════════════════════════════════════════════════════════════════════════
// Query Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function findById(id: string | Types.ObjectId): Promise<IMarketDocument | null> {
  await connectDB()
  return Market.findById(id)
}

export async function findByIdLean(id: string | Types.ObjectId): Promise<IMarket | null> {
  await connectDB()
  return Market.findById(id).lean()
}

export async function findOne(filter: FilterQuery<IMarket>): Promise<IMarketDocument | null> {
  await connectDB()
  return Market.findOne(filter)
}

export async function findActiveListings(filters: {
  type?: string
  rarity?: string
}): Promise<IMarket[]> {
  await connectDB()
  const query: FilterQuery<IMarket> = {
    soldAt: null,
    expiresAt: { $gt: new Date() },
  }
  if (filters.type) query.listingType = filters.type
  if (filters.rarity) query.cardRarity = filters.rarity
  
  return Market.find(query).sort({ createdAt: -1 }).lean()
}

export async function findBySeller(
  sellerId: Types.ObjectId | string
): Promise<IMarketDocument[]> {
  await connectDB()
  return Market.find({ seller: sellerId })
}

export async function findBySellerLean(
  sellerId: Types.ObjectId | string
): Promise<IMarket[]> {
  await connectDB()
  return Market.find({ seller: sellerId }).lean()
}

export async function findRecentSales(limit: number = 20): Promise<IMarket[]> {
  await connectDB()
  return Market.find({ soldAt: { $ne: null } })
    .sort({ soldAt: -1 })
    .limit(limit)
    .lean()
}

export async function findUserSales(
  sellerId: Types.ObjectId | string,
  limit: number = 50
): Promise<IMarket[]> {
  await connectDB()
  return Market.find({ seller: sellerId, soldAt: { $ne: null } })
    .sort({ soldAt: -1 })
    .limit(limit)
    .lean()
}

// ═══════════════════════════════════════════════════════════════════════════════
// Create Functions
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateCardListingData {
  seller: Types.ObjectId
  sellerName: string
  cardId: string
  cardName: string
  cardRarity: string
  cardType: string
  cardStats?: {
    raidPower?: number
    mastery?: number
    luck?: number
    gm?: number
  }
  quantity: number
  price: number
  expiresAt: Date
}



export async function createCardListing(data: CreateCardListingData): Promise<IMarketDocument> {
  await connectDB()
  return Market.create({
    ...data,
    listingType: 'card',
  })
}



// ═══════════════════════════════════════════════════════════════════════════════
// Update Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function save(listing: IMarketDocument): Promise<IMarketDocument> {
  await connectDB()
  return listing.save()
}

export async function markAsSold(
  listingId: Types.ObjectId | string,
  buyerName: string
): Promise<IMarketDocument | null> {
  await connectDB()
  return Market.findByIdAndUpdate(
    listingId,
    {
      $set: {
        soldAt: new Date(),
        buyerName,
      },
    },
    { returnDocument: 'after' }
  )
}

export async function updateQuantityAndPrice(
  listingId: Types.ObjectId | string,
  quantity: number,
  price: number,
  markSold: boolean = false,
  buyerName?: string
): Promise<IMarketDocument | null> {
  await connectDB()
  const update: Record<string, unknown> = {
    $set: { quantity, price },
  }
  if (markSold) {
    update.$set = {
      ...update.$set as object,
      soldAt: new Date(),
      buyerName,
    }
  }
  return Market.findByIdAndUpdate(listingId, update, { returnDocument: 'after' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// Delete Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function deleteById(id: string | Types.ObjectId): Promise<IMarketDocument | null> {
  await connectDB()
  return Market.findByIdAndDelete(id)
}

export async function deleteExpired(): Promise<{ deletedCount?: number }> {
  await connectDB()
  return Market.deleteMany({
    expiresAt: { $lte: new Date() },
    soldAt: null,
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// Aggregation Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function countActiveListings(): Promise<number> {
  await connectDB()
  return Market.countDocuments({
    soldAt: null,
    expiresAt: { $gt: new Date() },
  })
}

export async function countByType(listingType: 'card'): Promise<number> {
  await connectDB()
  return Market.countDocuments({
    listingType,
    soldAt: null,
    expiresAt: { $gt: new Date() },
  })
}
