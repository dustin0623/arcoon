import History, { type IHistory, type IHistoryDocument } from './history.model';
import type { FilterQuery, QueryOptions, Types } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateHistoryData {
  username: string;
  source: string;
  eventType: string;
  data: Record<string, unknown>;
  eventKey?: string;
  status?: 'started' | 'completed' | 'failed' | 'cancelled';
  actor?: {
    playerId?: Types.ObjectId | null;
    username: string;
  };
  target?: {
    entityType?: string | null;
    entityId?: string | null;
    label?: string | null;
  };
  context?: {
    service: string;
    action: string;
    correlationId?: string | null;
  };
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface FindHistoryOptions {
  eventType?: string;
  source?: string;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Repository Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function create(data: CreateHistoryData): Promise<IHistoryDocument> {
  return History.create(data);
}

export async function findById(id: string): Promise<IHistoryDocument | null> {
  return History.findById(id);
}

export async function findOne(filter: FilterQuery<IHistory>): Promise<IHistoryDocument | null> {
  return History.findOne(filter);
}

export async function findMany(
  filter: FilterQuery<IHistory> = {},
  options: QueryOptions = {}
): Promise<IHistoryDocument[]> {
  return History.find(filter, null, options);
}

export async function findByUsername(
  username: string,
  options: FindHistoryOptions = {}
): Promise<IHistoryDocument[]> {
  const { eventType, source, limit = 50 } = options;
  const query: FilterQuery<IHistory> = { username };
  
  if (eventType) query.eventType = eventType;
  if (source) query.source = source;
  
  const cappedLimit = Math.min(Math.max(limit, 1), 200);
  return History.find(query).sort({ createdAt: -1 }).limit(cappedLimit);
}

export async function findByPlayerId(
  playerId: Types.ObjectId | string,
  options: FindHistoryOptions = {}
): Promise<IHistoryDocument[]> {
  const { eventType, source, limit = 50 } = options;
  const query: FilterQuery<IHistory> = { 'actor.playerId': playerId };
  
  if (eventType) query.eventType = eventType;
  if (source) query.source = source;
  
  const cappedLimit = Math.min(Math.max(limit, 1), 200);
  return History.find(query).sort({ createdAt: -1 }).limit(cappedLimit);
}

export async function deleteByUsername(username: string): Promise<{ deletedCount: number }> {
  const result = await History.deleteMany({ username });
  return { deletedCount: result.deletedCount };
}

export async function deleteById(id: string): Promise<IHistoryDocument | null> {
  return History.findByIdAndDelete(id);
}

export async function count(filter: FilterQuery<IHistory> = {}): Promise<number> {
  return History.countDocuments(filter);
}
