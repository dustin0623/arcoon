import Item, { type IItem, type IItemDocument, type ItemType } from './item.model';
import type { FilterQuery, UpdateQuery, QueryOptions, Types } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateItemData {
  playerId: Types.ObjectId | string;
  id: string;
  itemType: ItemType;
  quantity: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Repository Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function create(data: CreateItemData): Promise<IItemDocument> {
  return Item.create(data);
}

export async function findById(id: string): Promise<IItemDocument | null> {
  return Item.findById(id);
}

export async function findOne(filter: FilterQuery<IItem>): Promise<IItemDocument | null> {
  return Item.findOne(filter);
}

export async function findMany(
  filter: FilterQuery<IItem> = {},
  options: QueryOptions = {}
): Promise<IItemDocument[]> {
  return Item.find(filter, null, options);
}

export async function findByPlayer(
  playerId: Types.ObjectId | string,
  itemType?: ItemType
): Promise<IItemDocument[]> {
  const query: FilterQuery<IItem> = { playerId };
  if (itemType) query.itemType = itemType;
  return Item.find(query);
}

export async function findByPlayerAndId(
  playerId: Types.ObjectId | string,
  itemId: string,
  itemType?: ItemType
): Promise<IItemDocument | null> {
  const query: FilterQuery<IItem> = { playerId, id: itemId };
  if (itemType) query.itemType = itemType;
  return Item.findOne(query);
}

// Alias for clarity
export async function findByPlayerAndItemId(
  playerId: Types.ObjectId | string,
  itemId: string,
  itemType?: ItemType
): Promise<IItemDocument | null> {
  const query: FilterQuery<IItem> = { playerId, id: itemId };
  if (itemType) query.itemType = itemType;
  return Item.findOne(query);
}

export async function findMaterial(
  playerId: Types.ObjectId | string,
  materialId: string
): Promise<IItemDocument | null> {
  return Item.findOne({ playerId, id: materialId, itemType: 'material' });
}

export async function findPotion(
  playerId: Types.ObjectId | string,
  potionId: string
): Promise<IItemDocument | null> {
  return Item.findOne({ playerId, id: potionId, itemType: 'potion' });
}

export async function findPack(
  playerId: Types.ObjectId | string,
  packId: string
): Promise<IItemDocument | null> {
  return Item.findOne({ playerId, id: packId, itemType: 'pack' });
}

export async function updateById(
  id: string,
  update: UpdateQuery<IItem>,
  options: QueryOptions = { returnDocument: 'after' }
): Promise<IItemDocument | null> {
  return Item.findByIdAndUpdate(id, update, options);
}

export async function updateOne(
  filter: FilterQuery<IItem>,
  update: UpdateQuery<IItem>,
  options: QueryOptions = { returnDocument: 'after' }
): Promise<IItemDocument | null> {
  return Item.findOneAndUpdate(filter, update, options);
}

export async function incrementQuantity(
  playerId: Types.ObjectId | string,
  itemId: string,
  itemType: ItemType,
  amount: number
): Promise<IItemDocument | null> {
  return Item.findOneAndUpdate(
    { playerId, id: itemId, itemType },
    { $inc: { quantity: amount } },
    { returnDocument: 'after', upsert: true }
  );
}

export async function upsertItem(
  playerId: Types.ObjectId | string,
  itemId: string,
  itemType: ItemType,
  quantity: number
): Promise<IItemDocument | null> {
  return Item.findOneAndUpdate(
    { playerId, id: itemId, itemType },
    { $inc: { quantity } },
    { returnDocument: 'after', upsert: true }
  );
}

export async function decrementQuantity(
  playerId: Types.ObjectId | string,
  itemId: string,
  itemType: ItemType,
  amount: number
): Promise<IItemDocument | null> {
  return Item.findOneAndUpdate(
    { playerId, id: itemId, itemType },
    { $inc: { quantity: -amount } },
    { returnDocument: 'after' }
  );
}

// Decrement quantity by document _id (for guild donations, etc.)
export async function decrementQuantityById(
  documentId: Types.ObjectId | string,
  amount: number
): Promise<IItemDocument | null> {
  const item = await Item.findById(documentId);
  if (!item) return null;
  
  item.quantity -= amount;
  if (item.quantity <= 0) {
    await Item.findByIdAndDelete(documentId);
    return null;
  }
  return item.save();
}

export async function deleteById(id: string): Promise<IItemDocument | null> {
  return Item.findByIdAndDelete(id);
}

export async function deleteOne(filter: FilterQuery<IItem>): Promise<IItemDocument | null> {
  return Item.findOneAndDelete(filter);
}

export async function deleteByIdIfEmpty(id: string): Promise<boolean> {
  const item = await Item.findById(id);
  if (item && item.quantity <= 0) {
    await Item.findByIdAndDelete(id);
    return true;
  }
  return false;
}

export async function count(filter: FilterQuery<IItem> = {}): Promise<number> {
  return Item.countDocuments(filter);
}

export async function getMaterials(playerId: Types.ObjectId | string): Promise<IItemDocument[]> {
  return Item.find({ playerId, itemType: 'material' });
}

export async function getPotions(playerId: Types.ObjectId | string): Promise<IItemDocument[]> {
  return Item.find({ playerId, itemType: 'potion' });
}

export async function getPacks(playerId: Types.ObjectId | string): Promise<IItemDocument[]> {
  return Item.find({ playerId, itemType: 'pack' });
}
