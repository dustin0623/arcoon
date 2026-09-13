import type { Types } from 'mongoose'
import type { IMarketDocument, IMarket } from './market.model'
import type { IPlayerDocument } from '../players/player.model'
import * as marketRepo from './market.repository'
import * as playerRepo from '../players/player.repository'
import * as cardRepo from '../cards/card.repository'
import * as historyService from '../histories/history.service'
import GAME_DATA from '@/public/data'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface MarketplaceConfig {
  LISTING_DURATION_HOURS: number
  LISTING_CREATION_FEE: number
  MARKET_FEE_PERCENT: number
}



interface CardStats {
  raidPower?: number
  mastery?: number
  luck?: number
  gm?: number
}

interface MappedCardListing {
  id: string
  price: number
  quantity: number
  seller: string
  listedAt: number
  expiresAt: number
  card: {
    id: string
    cardId: string
    name: string
    rarity: string
    type: string
    stats: CardStats
  }
}



interface ListingsResult {
  listings: IMarket[]
  cardListings: MappedCardListing[]
}

interface BuyResult {
  listing: IMarketDocument
  player: IPlayerDocument
}

interface CreateListingResult {
  listing: IMarketDocument
}

interface HistoryPayload {
  playerId: Types.ObjectId | string
  source?: string
  eventType?: string
  eventKey?: string
  status?: string
  metadata?: Record<string, unknown>
  target?: {
    entityType: string
    entityId: string
    label: string
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const ECONOMY = (GAME_DATA as { ECONOMY?: { marketplace?: MarketplaceConfig; MARKETPLACE?: MarketplaceConfig } }).ECONOMY
const MARKETPLACE: MarketplaceConfig = ECONOMY?.marketplace ?? ECONOMY?.MARKETPLACE ?? {
  LISTING_DURATION_HOURS: 168,
  LISTING_CREATION_FEE: 100,
  MARKET_FEE_PERCENT: 5,
}

const LISTING_EXPIRY_MS = MARKETPLACE.LISTING_DURATION_HOURS * 60 * 60 * 1000
const LISTING_CREATION_FEE = MARKETPLACE.LISTING_CREATION_FEE ?? 100
const MARKET_FEE_PERCENT = MARKETPLACE.MARKET_FEE_PERCENT / 100



interface GameCard {
  id: string
  name?: string
  rarity?: string
  type?: string
}

const CARD_REGISTRY = Object.fromEntries(
  ((GAME_DATA as { CARDS?: GameCard[] }).CARDS ?? []).map((card) => [card.id, card])
) as Record<string, GameCard>

function getCardName(cardId: string): string {
  const card = CARD_REGISTRY[cardId]
  return card?.name ?? cardId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

function toTimestamp(value: Date | string | number | null | undefined): number {
  if (!value) return Date.now()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime()
}

function mapCardListing(listing: IMarket): MappedCardListing {
  return {
    id: listing._id.toString(),
    price: listing.price,
    quantity: listing.quantity,
    seller: listing.sellerName,
    listedAt: toTimestamp(listing.listedAt || listing.createdAt),
    expiresAt: toTimestamp(listing.expiresAt),
    card: {
      id: listing.cardId!,
      cardId: listing.cardId!,
      name: getCardName(listing.cardId!),
      rarity: listing.cardRarity!,
      type: listing.cardType!,
      stats: {
        raidPower: listing.cardStats?.raidPower ?? 0,
        mastery: listing.cardStats?.mastery ?? 0,
        luck: listing.cardStats?.luck ?? 0,
        gm: listing.cardStats?.gm ?? 0,
      },
    },
  }
}

function validateListingInputs(quantity: number, price: number): void {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Invalid quantity')
  if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) throw new Error('Invalid price')
}

async function logHistorySafe(payload: HistoryPayload): Promise<void> {
  try {
    await historyService.logEvent(payload)
  } catch (error) {
    console.warn('[MarketService] history log skipped:', (error as Error).message)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getListings(filters: { type?: string; rarity?: string } = {}): Promise<ListingsResult> {
  const listings = await marketRepo.findActiveListings(filters)
  const cardListings = listings.filter((l) => l.listingType === 'card').map(mapCardListing)
  return { listings, cardListings }
}

export async function buyCardListing(playerId: string | Types.ObjectId, listingId: string): Promise<BuyResult> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  const listing = await marketRepo.findById(listingId)
  if (!listing || listing.soldAt) throw new Error('Listing not found or already sold')
  if (listing.expiresAt && new Date(listing.expiresAt) <= new Date()) throw new Error('Listing expired')
  if (listing.seller.toString() === player._id.toString()) throw new Error('Cannot buy own listing')
  if (player.coins < listing.price) throw new Error('Not enough Realm Coins')

  // Deduct from buyer
  await playerRepo.incrementField(player._id, 'coins', -listing.price)

  // Add card to buyer
  await cardRepo.upsertCard(player._id, listing.cardId!, {
    rarity: listing.cardRarity!,
    type: listing.cardType!,
    quantity: listing.quantity,
    source: 'market',
  })

  // Pay seller (minus fee)
  const fee = Math.floor(listing.price * MARKET_FEE_PERCENT)
  const sellerProceeds = listing.price - fee
  await playerRepo.incrementField(listing.seller, 'coins', sellerProceeds)

  // Mark as sold
  listing.soldAt = new Date()
  listing.buyerName = player.username
  await marketRepo.save(listing)

  // Refresh player
  const updatedPlayer = await playerRepo.findById(player._id)

  await logHistorySafe({
    playerId: player._id,
    source: 'market',
    eventType: 'market',
    eventKey: 'market.card_bought',
    metadata: {
      listingId: listing._id.toString(),
      cardId: listing.cardId,
      quantity: listing.quantity,
      price: listing.price,
      seller: listing.sellerName,
      fee,
    },
    target: {
      entityType: 'market_listing',
      entityId: listing._id.toString(),
      label: listing.cardName || listing.cardId || 'Unknown',
    },
  })

  await logHistorySafe({
    playerId: listing.seller,
    source: 'market',
    eventType: 'market',
    eventKey: 'market.card_sold',
    metadata: {
      listingId: listing._id.toString(),
      cardId: listing.cardId,
      quantity: listing.quantity,
      price: listing.price,
      buyer: player.username,
      proceeds: sellerProceeds,
      fee,
    },
    target: {
      entityType: 'market_listing',
      entityId: listing._id.toString(),
      label: listing.cardName || listing.cardId || 'Unknown',
    },
  })

  return { listing, player: updatedPlayer! }
}

export async function createCardListing(
  playerId: string | Types.ObjectId,
  cardId: string,
  quantity: number,
  price: number
): Promise<CreateListingResult> {
  validateListingInputs(quantity, price)

  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  if ((player.coins ?? 0) < LISTING_CREATION_FEE) {
    throw new Error(
      `Insufficient coins for listing fee. Required: ${LISTING_CREATION_FEE}, Have: ${player.coins ?? 0}`
    )
  }

  const card = await cardRepo.findByOwnerAndCardId(player._id, cardId)
  if (!card || card.quantity < quantity) throw new Error('Insufficient cards')

  // Deduct card from seller
  await cardRepo.decrementQuantity(player._id, cardId, quantity)

  // Deduct listing fee
  await playerRepo.incrementField(player._id, 'coins', -LISTING_CREATION_FEE)

  // Create listing
  const cardName = getCardName(cardId)
  const listing = await marketRepo.createCardListing({
    seller: player._id,
    sellerName: player.username,
    cardId,
    cardName,
    cardRarity: card.rarity,
    cardType: card.type,
    quantity,
    price,
    expiresAt: new Date(Date.now() + LISTING_EXPIRY_MS),
  })

  await logHistorySafe({
    playerId: player._id,
    source: 'market',
    eventType: 'market',
    eventKey: 'market.card_listing_created',
    metadata: {
      listingId: listing._id.toString(),
      cardId,
      quantity,
      price,
    },
    target: {
      entityType: 'market_listing',
      entityId: listing._id.toString(),
      label: cardName,
    },
  })

  return { listing }
}

export async function cancelListing(playerId: string | Types.ObjectId, listingId: string): Promise<{ success: true }> {
  const player = await playerRepo.findById(playerId)
  if (!player) throw new Error('Player not found')

  const listing = await marketRepo.findById(listingId)
  if (!listing) throw new Error('Listing not found')
  if (listing.seller.toString() !== player._id.toString()) throw new Error('Not your listing')
  if (listing.soldAt) throw new Error('Already sold')

  // Return card to seller
  await cardRepo.upsertCard(player._id, listing.cardId!, {
    rarity: listing.cardRarity!,
    type: listing.cardType!,
    quantity: listing.quantity,
    source: 'market',
  })

  await logHistorySafe({
    playerId: player._id,
    source: 'market',
    eventType: 'market',
    eventKey: 'market.listing_cancelled',
    status: 'cancelled',
    metadata: {
      listingId: listing._id.toString(),
      listingType: listing.listingType,
      quantity: listing.quantity,
    },
    target: {
      entityType: 'market_listing',
      entityId: listing._id.toString(),
      label: listing.cardName || listing.cardId || 'Unknown',
    },
  })

  await marketRepo.deleteById(listingId)
  return { success: true }
}

export async function getRecentSales(): Promise<IMarket[]> {
  return marketRepo.findRecentSales(20)
}

export async function getUserSales(playerId: string | Types.ObjectId, limit: number = 50): Promise<IMarket[]> {
  return marketRepo.findUserSales(playerId, limit)
}
