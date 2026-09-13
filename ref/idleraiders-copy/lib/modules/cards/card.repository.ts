import Card, { 
  type ICard, 
  type ICardDocument, 
  type CardRarity, 
  type CardType,
} from './card.model';
import type { FilterQuery, UpdateQuery, QueryOptions, Types, PipelineStage } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateCardData {
  owner: Types.ObjectId | string;
  cardId: string;
  rarity: CardRarity;
  type: CardType;
  class?: string;
  quantity?: number;
}

export interface SupplyAggregation {
  _id: string;
  supply: number;
  minted?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Repository Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function create(data: CreateCardData): Promise<ICardDocument> {
  return Card.create(data);
}

export async function findById(id: string): Promise<ICardDocument | null> {
  return Card.findById(id);
}

export async function findOne(filter: FilterQuery<ICard>): Promise<ICardDocument | null> {
  return Card.findOne(filter);
}

export async function findMany(
  filter: FilterQuery<ICard> = {},
  options: QueryOptions = {}
): Promise<ICardDocument[]> {
  return Card.find(filter, null, options);
}

export async function findByOwner(owner: Types.ObjectId | string): Promise<ICardDocument[]> {
  return Card.find({ owner });
}

export async function findByOwnerAndCardId(
  owner: Types.ObjectId | string,
  cardId: string
): Promise<ICardDocument | null> {
  return Card.findOne({ owner, cardId });
}

export async function findByOwnerAndType(
  owner: Types.ObjectId | string,
  type: CardType
): Promise<ICardDocument[]> {
  return Card.find({ owner, type });
}

export async function findByOwnerAndRarity(
  owner: Types.ObjectId | string,
  rarity: CardRarity
): Promise<ICardDocument[]> {
  return Card.find({ owner, rarity });
}

export async function updateById(
  id: string,
  update: UpdateQuery<ICard>,
  options: QueryOptions = { returnDocument: 'after' }
): Promise<ICardDocument | null> {
  return Card.findByIdAndUpdate(id, update, options);
}

export async function updateOne(
  filter: FilterQuery<ICard>,
  update: UpdateQuery<ICard>,
  options: QueryOptions = { returnDocument: 'after' }
): Promise<ICardDocument | null> {
  return Card.findOneAndUpdate(filter, update, options);
}

export async function upsertCard(
  owner: Types.ObjectId | string,
  cardId: string,
  data: {
    rarity: CardRarity;
    type: CardType;
    class?: string;
    quantity?: number;
  }
): Promise<ICardDocument | null> {
  return Card.findOneAndUpdate(
    { owner, cardId },
    { 
      $inc: { quantity: data.quantity ?? 1 },
      $setOnInsert: { rarity: data.rarity, type: data.type, ...(data.class && { class: data.class }) },
    },
    { returnDocument: 'after', upsert: true }
  );
}

export async function incrementQuantity(
  owner: Types.ObjectId | string,
  cardId: string,
  amount: number = 1
): Promise<ICardDocument | null> {
  return Card.findOneAndUpdate(
    { owner, cardId },
    { $inc: { quantity: amount } },
    { returnDocument: 'after' }
  );
}

export async function decrementQuantity(
  owner: Types.ObjectId | string,
  cardId: string,
  amount: number = 1
): Promise<ICardDocument | null> {
  return Card.findOneAndUpdate(
    { owner, cardId },
    { $inc: { quantity: -amount } },
    { returnDocument: 'after' }
  );
}

export async function deleteById(id: string): Promise<ICardDocument | null> {
  return Card.findByIdAndDelete(id);
}

export async function deleteOne(filter: FilterQuery<ICard>): Promise<ICardDocument | null> {
  return Card.findOneAndDelete(filter);
}

export async function count(filter: FilterQuery<ICard> = {}): Promise<number> {
  return Card.countDocuments(filter);
}

export async function countByOwner(owner: Types.ObjectId | string): Promise<number> {
  return Card.countDocuments({ owner });
}

export async function sumQuantityByOwner(owner: Types.ObjectId | string): Promise<number> {
  const result = await Card.aggregate([
    { $match: { owner } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  return result[0]?.total ?? 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Aggregation Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTotalSupplyAggregation(): Promise<SupplyAggregation[]> {
  return Card.aggregate([
    { $group: { _id: '$cardId', supply: { $sum: '$quantity' } } },
  ]);
}

export async function getBoosterSupplyAggregation(): Promise<SupplyAggregation[]> {
  return Card.aggregate([
    { $match: { type: 'booster' } },
    { $group: { _id: '$cardId', minted: { $sum: '$quantity' } } },
  ]);
}

/**
 * Calculate total raid power across ALL players in the game.
 * This aggregates card quantities × raidPower stats for non-booster cards.
 * Used for dynamic expected damage calculation.
 */
export async function getTotalRaidPowerAggregation(): Promise<number> {
  // Import card config for stat calculation
  const { CARDS_BY_ID } = await import('@/lib/registries/card.registry')
  
  // Get all cards grouped by cardId with total quantity
  const cardTotals = await Card.aggregate([
    { $match: { type: { $ne: 'booster' } } }, // Exclude boosters (they don't contribute to raid power)
    { $group: { _id: '$cardId', totalQty: { $sum: '$quantity' } } },
  ])
  
  let totalRaidPower = 0
  
  for (const entry of cardTotals) {
    const cardDef = CARDS_BY_ID[entry._id]
    if (cardDef?.stats?.raidPower) {
      totalRaidPower += cardDef.stats.raidPower * (entry.totalQty || 0)
    }
  }
  
  return totalRaidPower
}

export async function getOwnerCardAggregation(owner: Types.ObjectId | string): Promise<{
  totalCards: number;
  uniqueCards: number;
  byRarity: Record<CardRarity, number>;
  byType: Record<CardType, number>;
}> {
  const pipeline: PipelineStage[] = [
    { $match: { owner } },
    {
      $group: {
        _id: null,
        totalCards: { $sum: '$quantity' },
        uniqueCards: { $sum: 1 },
        rarities: { $push: { rarity: '$rarity', qty: '$quantity' } },
        types: { $push: { type: '$type', qty: '$quantity' } },
      },
    },
  ];

  const result = await Card.aggregate(pipeline);

  if (!result[0]) {
    return {
      totalCards: 0,
      uniqueCards: 0,
      byRarity: {} as Record<CardRarity, number>,
      byType: {} as Record<CardType, number>,
    };
  }

  const { totalCards, uniqueCards, rarities, types } = result[0];
  
  const byRarity = {} as Record<CardRarity, number>;
  rarities.forEach((r: { rarity: CardRarity; qty: number }) => {
    byRarity[r.rarity] = (byRarity[r.rarity] || 0) + r.qty;
  });

  const byType = {} as Record<CardType, number>;
  types.forEach((t: { type: CardType; qty: number }) => {
    byType[t.type] = (byType[t.type] || 0) + t.qty;
  });

  return { totalCards, uniqueCards, byRarity, byType };
}
