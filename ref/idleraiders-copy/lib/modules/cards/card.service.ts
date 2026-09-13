import type { Types } from 'mongoose'
import type { ICardDocument, CardRarity, CardType } from './card.model'
import * as cardRepo from './card.repository'
import * as playerRepo from '../players/player.repository'
import * as historyService from '../histories/history.service'
import GAME_DATA from '@/public/data'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface GameCard {
  id: string
  name?: string
  class?: string
  rarity?: CardRarity
  type?: CardType
  cost?: number
  supply?: { max?: number }
  boost?: { percent?: number }
  base?: Record<string, unknown>
  materials?: Record<string, number>
  [key: string]: unknown
}

interface CraftResult {
  card: ICardDocument
  materialCost: Record<string, number>
  previousCount: number
  currentCount: number
  isNew: boolean
}

interface CollectionStats {
  totalCards: number
  uniqueCards: number
  byRarity: Record<CardRarity, number>
  byType: Record<CardType, number>
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const CARDS_ARRAY = ((GAME_DATA as { CARDS?: GameCard[] }).CARDS ?? []) as GameCard[]

const CARDS_BY_ID = Object.fromEntries(
  CARDS_ARRAY.map((card) => [card.id, card])
) as Record<string, GameCard>

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

async function getPlayerOrThrow(playerId: string | Types.ObjectId) {
  const player = await playerRepo.findById(playerId.toString())
  if (!player) throw new Error('Player not found')
  return player
}

async function logHistorySafe(payload: Parameters<typeof historyService.logEvent>[0]): Promise<void> {
  try {
    await historyService.logEvent(payload)
  } catch (error) {
    console.warn('[CardService] history log skipped:', (error as Error).message)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getCards(playerId: string | Types.ObjectId): Promise<ICardDocument[]> {
  return cardRepo.findByOwner(playerId)
}

export async function getCardsByType(playerId: string | Types.ObjectId, type: CardType): Promise<ICardDocument[]> {
  return cardRepo.findByOwnerAndType(playerId, type)
}

export async function getCardsByRarity(playerId: string | Types.ObjectId, rarity: CardRarity): Promise<ICardDocument[]> {
  return cardRepo.findByOwnerAndRarity(playerId, rarity)
}

export async function getCollectionStats(playerId: string | Types.ObjectId): Promise<CollectionStats> {
  return cardRepo.getOwnerCardAggregation(playerId)
}

export interface AddCardResult {
  card: ICardDocument
  previousCount: number
  currentCount: number
  isNew: boolean
}

export async function addCard(
  playerId: string | Types.ObjectId,
  card: GameCard | string,
  source?: string
): Promise<ICardDocument | null> {
  const cardDef = typeof card === 'string' ? CARDS_BY_ID[card] : card
  if (!cardDef) throw new Error('Card not found')

  const rarity = cardDef.rarity ?? 'common'
  const type = cardDef.type ?? 'hero'
  const cardClass = cardDef.class

  return cardRepo.upsertCard(playerId, cardDef.id, { rarity, type, class: cardClass, quantity: 1 })
}

/**
 * Add a card and return detailed information including previous/current counts
 * This is used for pack openings and other places where we need to track quantity changes
 */
export async function addCardWithDetails(
  playerId: string | Types.ObjectId,
  card: GameCard | string,
  source?: string
): Promise<AddCardResult> {
  const cardDef = typeof card === 'string' ? CARDS_BY_ID[card] : card
  if (!cardDef) throw new Error('Card not found')

  const rarity = cardDef.rarity ?? 'common'
  const type = cardDef.type ?? 'hero'
  const cardClass = cardDef.class

  // Get existing card to check previous count
  const existingCard = await cardRepo.findByOwnerAndCardId(playerId, cardDef.id)
  const previousCount = existingCard?.quantity ?? 0
  const isNew = !existingCard

  // Add the card
  const updatedCard = await cardRepo.upsertCard(playerId, cardDef.id, { rarity, type, class: cardClass, quantity: 1 })
  if (!updatedCard) throw new Error('Failed to add card')

  const currentCount = updatedCard.quantity

  return {
    card: updatedCard,
    previousCount,
    currentCount,
    isNew,
  }
}

export async function addCards(
  playerId: string | Types.ObjectId,
  cards: (GameCard | string)[]
): Promise<ICardDocument[]> {
  const results: ICardDocument[] = []
  for (const card of cards) {
    const added = await addCard(playerId, card)
    if (added) results.push(added)
  }
  return results
}

export async function removeCard(
  playerId: string | Types.ObjectId,
  cardId: string,
  quantity: number = 1
): Promise<ICardDocument | null> {
  const card = await cardRepo.findByOwnerAndCardId(playerId, cardId)
  if (!card) throw new Error('Card not found')
  if (card.quantity < quantity) throw new Error('Not enough cards')

  if (card.quantity === quantity) {
    await cardRepo.deleteById(card._id.toString())
    return card
  }

  return cardRepo.decrementQuantity(playerId, cardId, quantity)
}

export async function craftCard(playerId: string | Types.ObjectId, cardId: string): Promise<CraftResult> {
  const player = await getPlayerOrThrow(playerId)
  const cardDef = CARDS_BY_ID[cardId]
  if (!cardDef) throw new Error('Card not found')
  if (!cardDef.materials || Object.keys(cardDef.materials).length === 0) {
    throw new Error('Card cannot be crafted')
  }

  // Import item repo only when needed to avoid circular deps
  const itemRepo = await import('../items/item.repository')

  // Check materials
  const materials = await itemRepo.findByPlayer(playerId, 'material')
  const materialMap = new Map(materials.map((m) => [m.id, m.quantity]))

  for (const [materialId, required] of Object.entries(cardDef.materials)) {
    const available = materialMap.get(materialId) ?? 0
    if (available < required) {
      throw new Error(`Not enough ${materialId}: need ${required}, have ${available}`)
    }
  }

  // Consume materials
  for (const [materialId, required] of Object.entries(cardDef.materials)) {
    await itemRepo.decrementQuantity(playerId, materialId, 'material', required)
  }

// Add the card with detailed tracking
  const cardResult = await addCardWithDetails(playerId, cardDef, 'crafting')

  // Update milestones
  const milestones = (player.milestones as Record<string, number>) ?? {}
  milestones.totalCardsCollected = (milestones.totalCardsCollected ?? 0) + 1
  milestones.totalCardsCrafted = (milestones.totalCardsCrafted ?? 0) + 1
  await playerRepo.updateById(player._id.toString(), { milestones })

  await logHistorySafe({
    playerId: player._id,
    source: 'crafting',
    eventType: 'crafting',
    eventKey: 'crafting.card_crafted',
    metadata: {
      cardId,
      cardName: cardDef.name,
      rarity: cardDef.rarity,
      type: cardDef.type,
      materialsUsed: cardDef.materials,
      previousCount: cardResult.previousCount,
      currentCount: cardResult.currentCount,
      isNew: cardResult.isNew,
    },
    target: {
      entityType: 'card',
      entityId: cardId,
      label: cardDef.name ?? cardId,
    },
  })

  // Send Discord notification (async, non-blocking)
  import('@/lib/config/discord').then(({ notifyCrafting }) => {
    notifyCrafting({
      playerName: player.username,
      cardName: cardDef.name ?? cardId,
      cardRarity: cardDef.rarity ?? 'common',
      isFirstCraft: cardResult.isNew,
    }).catch(() => {})
  }).catch(() => {})

  return { 
    card: cardResult.card, 
    materialCost: cardDef.materials,
    previousCount: cardResult.previousCount,
    currentCount: cardResult.currentCount,
    isNew: cardResult.isNew,
  }
}

export async function transferCard(
  fromPlayerId: string | Types.ObjectId,
  toPlayerId: string | Types.ObjectId,
  cardId: string,
  quantity: number = 1
): Promise<{ fromCard: ICardDocument | null; toCard: ICardDocument | null }> {
  const fromPlayer = await getPlayerOrThrow(fromPlayerId)
  const toPlayer = await getPlayerOrThrow(toPlayerId)

  const cardDef = CARDS_BY_ID[cardId]
  if (!cardDef) throw new Error('Card not found')

  const fromCard = await removeCard(fromPlayerId, cardId, quantity)
  const toCard = await cardRepo.upsertCard(toPlayerId, cardId, {
    rarity: cardDef.rarity ?? 'common',
    type: cardDef.type ?? 'hero',
    class: cardDef.class,
    quantity,
  })

  await logHistorySafe({
    playerId: fromPlayer._id,
    source: 'market',
    eventType: 'transfer',
    eventKey: 'cards.transfer',
    metadata: {
      cardId,
      quantity,
      fromPlayer: fromPlayer.username,
      toPlayer: toPlayer.username,
    },
    target: {
      entityType: 'card',
      entityId: cardId,
      label: cardDef.name ?? cardId,
    },
  })

  return { fromCard, toCard }
}

/**
 * Gets previously gained story cards in a territory
 * Used for 20% card roll on replays to randomly select from owned cards
 */
export async function getPlayerCardsByTerritory(playerId: string | Types.ObjectId, territoryId: string): Promise<ICardDocument[]> {
  // Get the quest range for this territory
  const territoryIdx = parseInt(territoryId.replace('t', '')) - 1
  const questsInTerritory = 5
  const startQuestIdx = territoryIdx * questsInTerritory
  const endQuestIdx = startQuestIdx + questsInTerritory

  // Get player's cards that were sourced from this territory
  const allCards = await cardRepo.findByOwner(playerId)
  const territoryCards = allCards.filter((card) => {
    // Check if this card's ID matches a story card from this territory's range
    // Story card IDs are typically formatted like: story_t1_q1, story_t1_q2, etc.
    const cardId = card.cardId
    const isStoryCard = cardId.startsWith('story_')
    if (!isStoryCard) return false

    // Extract territory from card ID
    const parts = cardId.split('_')
    if (parts.length >= 2) {
      const cardTerritoryId = parts[1]
      return cardTerritoryId === territoryId
    }
    return false
  })

  return territoryCards
}

// Export for use in item.service
export { CARDS_BY_ID }
