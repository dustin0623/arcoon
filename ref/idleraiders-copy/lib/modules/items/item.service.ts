import type { Types } from 'mongoose'
import type { IItemDocument, ItemType } from './item.model'
import * as itemRepo from './item.repository'
import * as playerRepo from '../players/player.repository'
import * as cardRepo from '../cards/card.repository'
import { addCard, addCardWithDetails, type AddCardResult } from '../cards/card.service'
import { MATERIALS_BY_ID, CATALYSTS_BY_ID } from '@/lib/registries/item.registry'
import GAME_DATA from '@/public/data'
import * as historyService from '../histories/history.service'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface GameItem {
  id: string
  name?: string
  category?: string
  catergory?: string // typo in original data
}

interface GameCard {
  id: string
  name?: string
  rarity?: string
  type?: string
  cost?: number
  supply?: { max?: number }
  boost?: { percent?: number }
}

interface GamePack {
  id: string
  name?: string
  buy?: { coins?: number; shards?: number; dollars?: number }
  data?: {
    dropRates: Record<string, number>
    guaranteedRarity?: string
    cardCount?: number
  }
}

interface SystemConfig {
  ENERGY?: { MAX: number }
}

interface EconomyConfig {
  MATERIAL_CONVERSION?: { ratio?: number; coinCost?: number }
}

interface OpenPackResult {
  cards: GameCard[]
  packId: string
  remainingPacks: number
}

interface OpenPacksResult extends OpenPackResult {
  quantity: number
}

// Hard cap: backend & UI both limit a single bulk open to 10 packs.
const MAX_PACKS_PER_OPEN = 10

interface BuyPacksResult {
  quantity: number
  totalCost: number
  currencyType: string
  player: Awaited<ReturnType<typeof playerRepo.findById>>
}

interface ConvertResult {
  fromMaterialId: string
  toMaterialId: string
  converted: number
  coinCost: number
  ratio: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const ENERGY = ((GAME_DATA as { SYSTEM?: SystemConfig }).SYSTEM?.ENERGY ?? { MAX: 100 })
const ITEMS_ARRAY = ((GAME_DATA as { ITEMS?: GameItem[] }).ITEMS ?? []) as GameItem[]
const CARDS_ARRAY = ((GAME_DATA as { CARDS?: GameCard[] }).CARDS ?? []) as GameCard[]

const PACKS_BY_ID = Object.fromEntries(
  ITEMS_ARRAY.filter((item) => item?.catergory === 'pack' || item?.category === 'pack').map((item) => [item.id, item])
) as Record<string, GamePack>

const CARDS_BY_RARITY = CARDS_ARRAY.reduce((acc, card) => {
  if (!card?.rarity || card.type === 'booster' || card.source?.type === 'crafting' || card.source?.type === 'story') return acc
  if (!acc[card.rarity]) acc[card.rarity] = []
  acc[card.rarity].push(card)
  return acc
}, {} as Record<string, GameCard[]>)

const BOOSTER_CARDS_BY_RARITY = CARDS_ARRAY.reduce((acc, card) => {
  if (card?.type !== 'booster' || !card?.rarity) return acc
  if (!acc[card.rarity]) acc[card.rarity] = []
  acc[card.rarity].push(card)
  return acc
}, {} as Record<string, GameCard[]>)

const PACK_FALLBACK_CARD = CARDS_ARRAY.find((card) => card?.type !== 'booster') ?? CARDS_ARRAY[0]
const BOOSTER_FALLBACK_CARD = CARDS_ARRAY.find((card) => card?.type === 'booster') ?? CARDS_ARRAY[0]

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
    console.warn('[ItemService] history log skipped:', (error as Error).message)
  }
}

function rollCardRarity(dropRates: Record<string, number>, guaranteedRarity: string | null = null): string {
  if (guaranteedRarity) return guaranteedRarity
  const r = Math.random()
  let cumulative = 0
  for (const [rarity, rate] of Object.entries(dropRates)) {
    cumulative += rate
    if (r < cumulative) return rarity
  }
  return 'common'
}

async function rollPackCard(rarity: string, supplyMap: Record<string, number> = {}): Promise<GameCard> {
  const pool = CARDS_BY_RARITY[rarity] ?? []
  if (pool.length === 0) return PACK_FALLBACK_CARD

  const availableCards = pool.filter((card) => {
    const maxSupply = card.supply?.max ?? Infinity
    const currentSupply = supplyMap[card.id] ?? 0
    return currentSupply < maxSupply
  })

  if (availableCards.length === 0) {
    const allRarities = Object.keys(CARDS_BY_RARITY)
    for (const otherRarity of allRarities) {
      if (otherRarity === rarity) continue
      const otherPool = CARDS_BY_RARITY[otherRarity] ?? []
      const otherAvailable = otherPool.filter((card) => {
        const maxSupply = card.supply?.max ?? Infinity
        const currentSupply = supplyMap[card.id] ?? 0
        return currentSupply < maxSupply
      })
      if (otherAvailable.length > 0) {
        return otherAvailable[Math.floor(Math.random() * otherAvailable.length)]
      }
    }
    return PACK_FALLBACK_CARD
  }

  return availableCards[Math.floor(Math.random() * availableCards.length)]
}

async function rollBoosterCard(dropRates: Record<string, number>, supplyMap: Record<string, number> = {}): Promise<GameCard> {
  const r = Math.random()
  let cumulative = 0
  let rarity = 'common'
  for (const [rarityKey, rate] of Object.entries(dropRates)) {
    cumulative += rate
    if (r < cumulative) {
      rarity = rarityKey
      break
    }
  }
  const pool = BOOSTER_CARDS_BY_RARITY[rarity] ?? []

  const availableCards = pool.filter((card) => {
    const maxSupply = card.supply?.max ?? Infinity
    const currentSupply = supplyMap[card.id] ?? 0
    return currentSupply < maxSupply
  })

  if (availableCards.length > 0) {
    return availableCards[Math.floor(Math.random() * availableCards.length)]
  }

  const allRarities = Object.keys(BOOSTER_CARDS_BY_RARITY)
  for (const otherRarity of allRarities) {
    if (otherRarity === rarity) continue
    const otherPool = BOOSTER_CARDS_BY_RARITY[otherRarity] ?? []
    const otherAvailable = otherPool.filter((card) => {
      const maxSupply = card.supply?.max ?? Infinity
      const currentSupply = supplyMap[card.id] ?? 0
      return currentSupply < maxSupply
    })
    if (otherAvailable.length > 0) {
      return otherAvailable[Math.floor(Math.random() * otherAvailable.length)]
    }
  }

  return BOOSTER_FALLBACK_CARD
}

async function getAvailableBoosterSupply(): Promise<number> {
  const boosterCards = CARDS_ARRAY.filter((card) => card.type === 'booster')
  const supplyData = await cardRepo.getBoosterSupplyAggregation()

  const mintedMap: Record<string, number> = {}
  supplyData.forEach((item: { _id: string; minted: number }) => {
    mintedMap[item._id] = item.minted
  })

  let totalAvailable = 0
  boosterCards.forEach((card) => {
    const maxSupply = card.supply?.max ?? 0
    const currentMinted = mintedMap[card.id] ?? 0
    const available = Math.max(0, maxSupply - currentMinted)
    totalAvailable += available
  })

  return totalAvailable
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getItems(playerId: string | Types.ObjectId, itemType: ItemType | null = null): Promise<IItemDocument[]> {
  return itemRepo.findByPlayer(playerId, itemType ?? undefined)
}

export async function getMaterials(playerId: string | Types.ObjectId): Promise<IItemDocument[]> {
  return itemRepo.getMaterials(playerId)
}

export async function addMaterial(playerId: string | Types.ObjectId, name: string, quantity: number): Promise<IItemDocument[]> {
  if (typeof quantity !== 'number' || quantity <= 0) throw new Error('Invalid quantity')

  await itemRepo.upsertItem(playerId, name, 'material', quantity)
  return itemRepo.getMaterials(playerId)
}

export async function usePotion(playerId: string | Types.ObjectId, type: string): Promise<{ potion: IItemDocument; energy?: number }> {
  const player = await getPlayerOrThrow(playerId)
  // Type should be the full potion ID (e.g., 'energy_potion', 'exp_potion')
  const potion = await itemRepo.findPotion(playerId, type)
  if (!potion || potion.quantity <= 0) {
    throw new Error(`No ${type.replace('_potion', '')} potions available`)
  }

  potion.quantity -= 1
  if (potion.quantity <= 0) {
    await itemRepo.deleteById(potion._id.toString())
  } else {
    await potion.save()
  }

  let result: { potion: IItemDocument; energy?: number; expBoostActive?: boolean } = { potion }
  if (type === 'energy_potion') {
    await playerRepo.updateById(player._id.toString(), {
      energy: ENERGY.MAX,
      lastCycleUpdate: new Date(),
    })
    result = { potion, energy: ENERGY.MAX }
  } else if (type === 'exp_potion') {
    // Check if EXP boost is already active
    if (player.missionStats?.isExpBoostActive) {
      throw new Error('EXP boost is already active')
    }
    // Set EXP boost active flag
    await playerRepo.updateById(player._id.toString(), {
      'missionStats.isExpBoostActive': true,
    })
    result = { potion, expBoostActive: true }
  }

  return result
}

export async function addPotion(playerId: string | Types.ObjectId, type: string, quantity: number = 1): Promise<IItemDocument[]> {
  const player = await getPlayerOrThrow(playerId)
  
  // Check storage limit before adding potions
  const currentPotions = await itemRepo.getPotions(playerId)
  const totalPotionsOwned = currentPotions.reduce((sum, p) => sum + (p.quantity ?? 0), 0)
  const storageSlots = player.storageSlots ?? 3
  
  // Only add potions up to the storage limit
  const availableSpace = Math.max(0, storageSlots - totalPotionsOwned)
  const quantityToAdd = Math.min(quantity, availableSpace)
  
  if (quantityToAdd <= 0) {
    // Storage full - don't add any potions
    return currentPotions
  }
  
  await itemRepo.upsertItem(playerId, type, 'potion', quantityToAdd)
  return itemRepo.getPotions(playerId)
}

export async function addPacks(playerId: string | Types.ObjectId, packId: string, quantity: number = 1): Promise<void> {
  await itemRepo.upsertItem(playerId, packId, 'pack', quantity)
}

export async function convertMaterials(
  playerId: string | Types.ObjectId,
  fromMaterialId: string,
  toMaterialId: string,
  quantity: number = 1
): Promise<ConvertResult> {
  // Fixed 5:1 ratio
  const RATIO = 5
  
  // Validate quantity (min 1, max 100 conversions at once)
  const convertCount = Math.max(1, Math.min(100, Math.floor(quantity)))
  const materialsNeeded = convertCount * RATIO
  
  if (fromMaterialId === toMaterialId) throw new Error('Cannot convert a material into itself')
  
  const targetDef = MATERIALS_BY_ID[toMaterialId]
  if (!targetDef) throw new Error('Invalid target material')

  // Calculate coin cost: materialsNeeded × zoneIndex × 25
  const ZONE_ORDER = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10']
  const targetZoneIndex = ZONE_ORDER.indexOf((targetDef.zone as string)?.toLowerCase() || 'd1')
  const COIN_COST = materialsNeeded * targetZoneIndex * 25

  const player = await getPlayerOrThrow(playerId)
  if ((player.coins ?? 0) < COIN_COST) throw new Error(`Need ${COIN_COST} coins to convert`)

  const source = await itemRepo.findMaterial(playerId, fromMaterialId)
  if (!source || source.quantity < materialsNeeded) {
    throw new Error(`Need ${materialsNeeded}× ${fromMaterialId} to convert. You have ${source?.quantity ?? 0}.`)
  }

  source.quantity -= materialsNeeded
  if (source.quantity <= 0) {
    await itemRepo.deleteById(source._id.toString())
  } else {
    await source.save()
  }

  await playerRepo.updateById(player._id.toString(), { $inc: { coins: -COIN_COST } })
  await addMaterial(playerId, toMaterialId, convertCount)

  return { fromMaterialId, toMaterialId, converted: convertCount, coinCost: COIN_COST, ratio: RATIO }
}

export async function openPacks(
  playerId: string | Types.ObjectId,
  packId: string,
  quantity: number = 1
): Promise<OpenPacksResult> {
  // Validate quantity up-front — UI caps at 10; enforce the same on the server.
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PACKS_PER_OPEN) {
    throw new Error(`Quantity must be an integer between 1 and ${MAX_PACKS_PER_OPEN}`)
  }

  const player = await getPlayerOrThrow(playerId)
  const pack = PACKS_BY_ID[packId] as GamePack | undefined
  if (!pack) throw new Error('Pack not found')
  if (!pack.data) throw new Error('Pack cannot be opened')
  if (packId !== 'standard_pack' && packId !== 'booster_pack') {
    throw new Error('Pack cannot be opened')
  }

  const ownedPack = await itemRepo.findPack(playerId, packId)
  if (!ownedPack || (ownedPack.quantity ?? 0) < quantity) {
    throw new Error(
      quantity > 1
        ? `Need ${quantity} packs to open — you have ${ownedPack?.quantity ?? 0}`
        : 'No packs available to open'
    )
  }

  // Fetch supply aggregation ONCE, then mutate the local map per-roll so supply
  // caps stay respected across the whole batch (prevents over-minting mid-bulk).
  const supplyData = await cardRepo.getTotalSupplyAggregation()
  const supplyMap: Record<string, number> = {}
  supplyData.forEach((item: { _id: string; supply: number }) => {
    supplyMap[item._id] = item.supply
  })

  const allCards: GameCard[] = []
  for (let p = 0; p < quantity; p++) {
    if (packId === 'standard_pack') {
      const guaranteedRarity = rollCardRarity(pack.data.dropRates, pack.data.guaranteedRarity ?? null)
      const first = await rollPackCard(guaranteedRarity, supplyMap)
      allCards.push(first)
      supplyMap[first.id] = (supplyMap[first.id] ?? 0) + 1
      for (let i = 1; i < (pack.data.cardCount ?? 1); i++) {
        const rarity = rollCardRarity(pack.data.dropRates)
        const next = await rollPackCard(rarity, supplyMap)
        allCards.push(next)
        supplyMap[next.id] = (supplyMap[next.id] ?? 0) + 1
      }
    } else {
      const card = await rollBoosterCard(pack.data.dropRates, supplyMap)
      allCards.push(card)
      supplyMap[card.id] = (supplyMap[card.id] ?? 0) + 1
    }
  }

  // Decrement the whole batch in a single save (or delete if it zeroes out).
  ownedPack.quantity -= quantity
  if (ownedPack.quantity <= 0) {
    await itemRepo.deleteById(ownedPack._id.toString())
  } else {
    await ownedPack.save()
  }

  // Add cards with detailed tracking (previousCount, currentCount).
  // Per-card try/catch so one failure doesn't stop the rest.
  const cardResults: (AddCardResult & { error?: string })[] = []
  for (const card of allCards) {
    try {
      const result = await addCardWithDetails(playerId, card, 'pack')
      cardResults.push(result)
    } catch (error) {
      console.error(`[ItemService] Failed to add card ${card.id}:`, (error as Error).message)
      cardResults.push({
        card: null as any,
        previousCount: 0,
        currentCount: 0,
        isNew: false,
        error: (error as Error).message,
      })
    }
  }

  const successfulCards = cardResults.filter(r => !r.error)

  // Update player milestones once for the whole batch.
  const milestones = (player.milestones as Record<string, number>) ?? {}
  milestones.totalOpenedPacks = (milestones.totalOpenedPacks ?? 0) + quantity
  milestones.totalCardsCollected = (milestones.totalCardsCollected ?? 0) + successfulCards.length
  await playerRepo.updateById(player._id.toString(), { milestones })

  await logHistorySafe({
    playerId: player._id,
    source: 'inventory',
    eventType: 'inventory',
    eventKey: 'inventory.pack_opened',
    metadata: {
      packId,
      packName: pack.name,
      quantity,
      cards: cardResults.map((result, i) => ({
        cardId: allCards[i].id,
        name: allCards[i].name,
        rarity: allCards[i].rarity,
        type: allCards[i].type,
        previousCount: result.previousCount,
        currentCount: result.currentCount,
        isNew: result.isNew,
        ...(result.error && { error: result.error, failed: true }),
      })),
      cardsCount: allCards.length,
      cardsAdded: successfulCards.length,
      cardsFailed: cardResults.filter(r => r.error).length,
      remainingPacks: Math.max(ownedPack.quantity ?? 0, 0),
    },
    target: {
      entityType: 'pack',
      entityId: packId,
      label: pack.name ?? packId,
    },
  })

  // One Discord notification summarizing the whole batch; one tavern ping per legendary+.
  import('@/lib/config/discord').then(({ notifyPackOpening, notifyTavernEvent }) => {
    notifyPackOpening({
      playerName: player.username,
      packName: pack.name ?? packId,
      packId,
      cardsObtained: allCards.map(card => ({
        name: card.name ?? card.id,
        rarity: card.rarity ?? 'common',
        type: card.type ?? 'unknown',
      })),
      remainingPacks: Math.max(ownedPack.quantity ?? 0, 0),
    }).catch(() => {})

    const legendaryCards = allCards.filter(card =>
      card.rarity?.toLowerCase() === 'legendary' || card.rarity?.toLowerCase() === 'mythic'
    )
    for (const card of legendaryCards) {
      notifyTavernEvent({
        eventType: 'legendary_pull',
        playerName: player.username,
        cardName: card.name ?? card.id,
        cardRarity: card.rarity ?? 'legendary',
        packName: pack.name ?? packId,
      }).catch(() => {})
    }
  }).catch(() => {})

  return {
    cards: allCards,
    packId,
    quantity,
    remainingPacks: Math.max(ownedPack.quantity ?? 0, 0),
  }
}

/**
 * Backwards-compatible single-pack opener. Delegates to `openPacks` with qty=1
 * so any existing callers (scripts, tests, legacy integrations) keep working.
 */
export async function openPack(
  playerId: string | Types.ObjectId,
  packId: string
): Promise<OpenPackResult> {
  const { cards, remainingPacks } = await openPacks(playerId, packId, 1)
  return { cards, packId, remainingPacks }
}

export async function buyPacks(
  playerId: string | Types.ObjectId,
  packId: string,
  quantity: number,
  paymentMethod: string
): Promise<BuyPacksResult> {
  const player = await getPlayerOrThrow(playerId)
  const pack = PACKS_BY_ID[packId] as GamePack | undefined
  if (!pack) throw new Error('Pack not found')

  if (packId === 'booster_pack') {
    const availableSupply = await getAvailableBoosterSupply()
    if (availableSupply <= 0) {
      throw new Error('Booster packs are sold out - all booster cards have been minted')
    }
  }

  let totalCost = 0
  let currencyType = 'token'
  const updateData: Record<string, number> = {}

  if (paymentMethod === 'coins' || paymentMethod === 'token') {
    const tokenCost = (pack.buy?.coins ?? 0) * quantity
    if ((player.coins ?? 0) < tokenCost) throw new Error('Not enough Realm Coins')
    updateData.coins = (player.coins ?? 0) - tokenCost
    totalCost = tokenCost
  } else if (paymentMethod === 'shards' || paymentMethod === 'shard') {
    const shardCost = (pack.buy?.shards ?? 0) * quantity
    if ((player.shards ?? 0) < shardCost) throw new Error('Not enough Soul Shards')
    updateData.shards = (player.shards ?? 0) - shardCost
    totalCost = shardCost
    currencyType = 'shard'
  } else if (paymentMethod === 'dollars' || paymentMethod === 'dollar') {
    const dollarCost = (pack.buy?.dollars ?? 2) * quantity
    if ((player.dollars ?? 0) < dollarCost) throw new Error('Not enough Dollars')
    updateData.dollars = Number(((player.dollars ?? 0) - dollarCost).toFixed(2))
    totalCost = dollarCost
    currencyType = 'dollar'
  } else {
    throw new Error('Invalid payment method')
  }

  await playerRepo.updateById(player._id.toString(), updateData)
  await itemRepo.upsertItem(playerId, packId, 'pack', quantity)

  await logHistorySafe({
    playerId: player._id,
    source: 'packs',
    eventType: 'packs',
    eventKey: 'packs.purchase',
    metadata: {
      packId,
      packName: pack.name,
      quantity,
      totalCost,
      currencyType,
      paymentMethod,
    },
    target: {
      entityType: 'pack',
      entityId: packId,
      label: pack.name ?? packId,
    },
  })

  const updatedPlayer = await playerRepo.findById(player._id.toString())
  return { quantity, totalCost, currencyType, player: updatedPlayer }
}

/**
 * Adds a generic item (chest, etc.) to player inventory
 */
export async function addItem(playerId: string | Types.ObjectId, itemId: string, quantity: number = 1): Promise<IItemDocument[]> {
  await getPlayerOrThrow(playerId)
  await itemRepo.upsertItem(playerId, itemId, 'chest', quantity)
  return itemRepo.findByPlayer(playerId, 'chest')
}

/**
 * Opens a territory chest and distributes materials to player inventory
 */
export async function openTerritoryChest(
  playerId: string | Types.ObjectId,
  chestItemId: string,
  materials: string[]
): Promise<Record<string, number>> {
  // Aggregate material counts
  const materialCounts: Record<string, number> = {}
  for (const matId of materials) {
    materialCounts[matId] = (materialCounts[matId] ?? 0) + 1
  }

  // Add materials to inventory
  await Promise.all(
    Object.entries(materialCounts).map(([matId, qty]) =>
      addMaterial(playerId, matId, qty)
    )
  )

  // Remove chest item from inventory
  const items = await itemRepo.findByPlayer(playerId, 'chest')
  const chest = items.find(i => i.id === chestItemId)
  if (chest) {
    chest.quantity = Math.max(0, (chest.quantity ?? 1) - 1)
    if (chest.quantity <= 0) {
      await itemRepo.deleteById(chest._id.toString())
    } else {
      await chest.save()
    }
  }

  return materialCounts
}
