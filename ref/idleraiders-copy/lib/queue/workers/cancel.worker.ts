import { Worker } from 'bullmq'
import { redis } from '@/lib/redis/client'
import type { CancelJobData, CancelJobResult } from '@/lib/queue/cancel.queue'
import * as playerRepo from '@/lib/modules/players/player.repository'
import * as cardRepo from '@/lib/modules/cards/card.repository'
import * as marketRepo from '@/lib/modules/markets/market.repository'
import * as historyService from '@/lib/modules/histories/history.service'

// Helper to log history safely
async function logHistorySafe(payload: any): Promise<void> {
  try {
    await historyService.logEvent(payload)
  } catch (error) {
    console.error('[Cancel Worker] Failed to log history:', error)
  }
}

export async function createCancelWorker() {
  const worker = new Worker<CancelJobData, CancelJobResult>(
    'marketplace-cancellations',
    async (job) => {
      const { playerId, listingId } = job.data
      const transactionId = job.id!

      console.log(`[Cancel Worker] Processing job ${transactionId}: cancel listing ${listingId}`)

      try {
        // Use MongoDB session for transaction support
        const session = await playerRepo.startSession()

        try {
          // Get player and listing
          const [player, listing] = await Promise.all([
            playerRepo.findById(playerId, { session }),
            marketRepo.findById(listingId),
          ])

          if (!player) {
            throw new Error('Player not found')
          }

          if (!listing) {
            throw new Error('Listing not found')
          }

          // Verify ownership
          if (listing.seller.toString() !== player._id.toString()) {
            throw new Error('Not your listing')
          }

          // Check if already sold
          if (listing.soldAt) {
            throw new Error('Already sold - cannot cancel')
          }

          // Return card to seller
          await cardRepo.upsertCard(playerId, listing.cardId!, {
            rarity: listing.cardRarity!,
            type: listing.cardType!,
            quantity: listing.quantity,
            source: 'market_cancel',
          })

          const itemsReturned = {
            type: 'card' as const,
            quantity: listing.quantity,
            id: listing.cardId,
          }

          // Log history
          await logHistorySafe({
            playerId,
            source: 'market',
            eventType: 'market',
            eventKey: 'market.listing_cancelled',
            status: 'cancelled',
            metadata: {
              listingId: listing._id.toString(),
              listingType: listing.listingType,
              quantity: listing.quantity,
              transactionId,
            },
            target: {
              entityType: 'market_listing',
              entityId: listing._id.toString(),
              label: listing.cardName || listing.cardId || 'Unknown',
            },
          })

          // Delete listing
          await marketRepo.deleteById(listingId)

          await session.commitTransaction()

          return {
            success: true,
            listingId,
            itemsReturned,
          }
        } catch (error) {
          await session.abortTransaction()
          throw error
        } finally {
          await session.endSession()
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[Cancel Worker] Job ${transactionId} failed:`, message)
        throw error
      }
    },
    {
      connection: redis,
      concurrency: 5, // Process max 5 cancellations simultaneously
      settings: {
        lockDuration: 30000, // 30 second lock per job
        lockRenewTime: 15000, // Renew lock every 15 seconds
      },
    }
  )

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`[Cancel Worker] Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Cancel Worker] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[Cancel Worker] Worker error:', err)
  })

  return worker
}
