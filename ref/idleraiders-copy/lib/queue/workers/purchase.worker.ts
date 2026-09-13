import { Worker } from 'bullmq'
import { redis } from '@/lib/redis/client'
import type { PurchaseJobData, PurchaseJobResult } from '@/lib/queue/purchase.queue'
import * as playerRepo from '@/lib/modules/players/player.repository'
import * as cardRepo from '@/lib/modules/cards/card.repository'
import * as marketRepo from '@/lib/modules/markets/market.repository'
import * as historyService from '@/lib/modules/histories/history.service'
import type { Types } from 'mongoose'

const MARKET_FEE_PERCENT = 0.05 // 5% fee

// Helper to log history safely
async function logHistorySafe(payload: any): Promise<void> {
  try {
    await historyService.logEvent(payload)
  } catch (error) {
    console.error('[Purchase Worker] Failed to log history:', error)
  }
}

export async function createPurchaseWorker() {
  const worker = new Worker<PurchaseJobData, PurchaseJobResult>(
    'marketplace-purchases',
    async (job) => {
      const { playerId, listingId, type, quantity } = job.data
      const transactionId = job.id!

      console.log(`[Purchase Worker] Processing job ${transactionId}: ${type} purchase of listing ${listingId}`)

      try {
        // Use MongoDB session for transaction support
        const session = await playerRepo.startSession()
        
        try {
          // Get player and listing with lock
          const [player, listing] = await Promise.all([
            playerRepo.findById(playerId, { session }),
            marketRepo.findById(listingId),
          ])

          if (!player) {
            throw new Error('Player not found')
          }

          if (!listing || listing.soldAt) {
            throw new Error('Listing not found or already sold')
          }

          if (listing.expiresAt && new Date(listing.expiresAt) <= new Date()) {
            throw new Error('Listing expired')
          }

          if (listing.seller.toString() === player._id.toString()) {
            throw new Error('Cannot buy own listing')
          }

          // Process card purchase
          await processPurchaseCard(player._id, listing, session, transactionId)

          await session.commitTransaction()

          return {
            success: true,
            listingId,
            transactionId,
            coins: (await playerRepo.findById(playerId))?.coins ?? 0,
          }
        } catch (error) {
          await session.abortTransaction()
          throw error
        } finally {
          await session.endSession()
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[Purchase Worker] Job ${transactionId} failed:`, message)
        throw error
      }
    },
    {
      connection: redis,
      concurrency: 5, // Process max 5 purchases simultaneously
      settings: {
        lockDuration: 30000, // 30 second lock per job
        lockRenewTime: 15000, // Renew lock every 15 seconds
      },
    }
  )

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`[Purchase Worker] Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Purchase Worker] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[Purchase Worker] Worker error:', err)
  })

  return worker
}

// ═══════════════════════════════════════════════════════════════════════════════
// Purchase Processors
// ═══════════════════════════════════════════════════════════════════════════════

async function processPurchaseCard(
  playerId: Types.ObjectId,
  listing: any,
  session: any,
  transactionId: string
): Promise<void> {
  // Validate player has enough coins
  if ((listing.player?.coins ?? 0) < listing.price) {
    throw new Error('Not enough Realm Coins')
  }

  // Deduct from buyer
  await playerRepo.incrementField(playerId, 'coins', -listing.price, { session })

  // Add card to buyer
  await cardRepo.upsertCard(playerId, listing.cardId!, {
    rarity: listing.cardRarity!,
    type: listing.cardType!,
    quantity: listing.quantity,
    source: 'market',
  })

  // Pay seller (minus fee)
  const fee = Math.floor(listing.price * MARKET_FEE_PERCENT)
  const sellerProceeds = listing.price - fee
  await playerRepo.incrementField(listing.seller, 'coins', sellerProceeds, { session })

  // Mark as sold
  listing.soldAt = new Date()
  listing.buyerName = (await playerRepo.findById(playerId, { session }))?.username
  listing.buyerNameId = playerId
  await marketRepo.save(listing)

  // Log history for buyer
  await logHistorySafe({
    playerId,
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
      transactionId,
    },
    target: {
      entityType: 'market_listing',
      entityId: listing._id.toString(),
      label: listing.cardName || listing.cardId || 'Unknown',
    },
  })

  // Log history for seller
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
      buyer: listing.buyerName,
      proceeds: sellerProceeds,
      fee,
      transactionId,
    },
    target: {
      entityType: 'market_listing',
      entityId: listing._id.toString(),
      label: listing.cardName || listing.cardId || 'Unknown',
    },
  })
}


