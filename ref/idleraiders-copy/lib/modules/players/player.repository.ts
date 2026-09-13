import Player, { type IPlayer, type IPlayerDocument } from './player.model'
import type { FilterQuery, UpdateQuery, QueryOptions, Types, PipelineStage } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreatePlayerData {
  username: string;
  isRegistered?: boolean;
  referredBy?: string;
  coins?: number;
  shards?: number;
  dollars?: number;
  energy?: number;
  level?: number;
  xp?: number;
}

export interface PlayerLeaderboardEntry {
  _id: Types.ObjectId;
  username: string;
  level: number;
  xp: number;
  guildId?: Types.ObjectId | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Repository Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function create(data: CreatePlayerData): Promise<IPlayerDocument> {
  return Player.create(data);
}

export async function findById(id: string | Types.ObjectId): Promise<IPlayerDocument | null> {
  return Player.findById(id);
}

export async function findByIdLean(id: string | Types.ObjectId): Promise<IPlayer | null> {
  return Player.findById(id).lean();
}

export async function findByIds(ids: (string | Types.ObjectId)[]): Promise<IPlayerDocument[]> {
  return Player.find({ _id: { $in: ids } });
}

export async function findByUsername(username: string): Promise<IPlayerDocument | null> {
  return Player.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
}

export async function findByUsernameLean(username: string): Promise<IPlayer | null> {
  return Player.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).lean();
}

export async function findOne(filter: FilterQuery<IPlayer>): Promise<IPlayerDocument | null> {
  return Player.findOne(filter);
}

export async function findMany(
  filter: FilterQuery<IPlayer> = {},
  options: QueryOptions = {}
): Promise<IPlayerDocument[]> {
  return Player.find(filter, null, options);
}

export async function findByGuild(guildId: Types.ObjectId | string): Promise<IPlayerDocument[]> {
  return Player.find({ guildId });
}

export async function findRegistered(limit: number = 100): Promise<IPlayerDocument[]> {
  return Player.find({ isRegistered: true }).limit(limit);
}

export async function updateById(
  id: string | Types.ObjectId,
  update: UpdateQuery<IPlayer>,
  options: QueryOptions = { returnDocument: 'after' }
): Promise<IPlayerDocument | null> {
  return Player.findByIdAndUpdate(id, update, options);
}

export async function updateByUsername(
  username: string,
  update: UpdateQuery<IPlayer>,
  options: QueryOptions = { returnDocument: 'after' }
): Promise<IPlayerDocument | null> {
  return Player.findOneAndUpdate(
    { username: { $regex: new RegExp(`^${username}$`, 'i') } },
    update,
    options
  );
}

export async function incrementField(
  id: string | Types.ObjectId,
  field: string,
  amount: number
): Promise<IPlayerDocument | null> {
  return Player.findByIdAndUpdate(
    id,
    { $inc: { [field]: amount } },
    { returnDocument: 'after' }
  );
}

export async function setActiveMission(
  playerId: string | Types.ObjectId,
  missionId: Types.ObjectId | null
): Promise<IPlayerDocument | null> {
  return Player.findByIdAndUpdate(playerId, { activeMission: missionId }, { returnDocument: 'after' });
}

export async function clearActiveMission(playerId: string | Types.ObjectId): Promise<IPlayerDocument | null> {
  return setActiveMission(playerId, null);
}

export async function setGuild(
  playerId: string | Types.ObjectId,
  guildId: Types.ObjectId | null
): Promise<IPlayerDocument | null> {
  return Player.findByIdAndUpdate(playerId, { guildId }, { returnDocument: 'after' });
}

// Alias for setGuild for clarity
export async function setGuildId(
  playerId: string | Types.ObjectId,
  guildId: Types.ObjectId | null
): Promise<IPlayerDocument | null> {
  return Player.findByIdAndUpdate(playerId, { guildId }, { returnDocument: 'after' });
}

export async function updateGuildAndCoins(
  playerId: Types.ObjectId,
  guildId: Types.ObjectId | null,
  coinsDelta: number
): Promise<IPlayerDocument | null> {
  return Player.findByIdAndUpdate(
    playerId,
    { 
      $set: { guildId },
      $inc: { coins: coinsDelta }
    },
    { returnDocument: 'after' }
  );
}

export async function leaveGuild(playerId: string | Types.ObjectId): Promise<IPlayerDocument | null> {
  return setGuild(playerId, null);
}

export async function deleteById(id: string | Types.ObjectId): Promise<IPlayerDocument | null> {
  return Player.findByIdAndDelete(id);
}

export async function deleteByUsername(username: string): Promise<IPlayerDocument | null> {
  return Player.findOneAndDelete({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
}

export async function count(filter: FilterQuery<IPlayer> = {}): Promise<number> {
  return Player.countDocuments(filter);
}

export async function countRegistered(): Promise<number> {
  return Player.countDocuments({ isRegistered: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Leaderboard Aggregations
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTopByXp(limit: number = 100): Promise<PlayerLeaderboardEntry[]> {
  return Player.aggregate([
    { $match: { isRegistered: true } },
    { $sort: { xp: -1 } },
    { $limit: limit },
    { $project: { username: 1, level: 1, xp: 1, guildId: 1 } },
  ]);
}

export async function getTopByLevel(limit: number = 100): Promise<PlayerLeaderboardEntry[]> {
  return Player.aggregate([
    { $match: { isRegistered: true } },
    { $sort: { level: -1, xp: -1 } },
    { $limit: limit },
    { $project: { username: 1, level: 1, xp: 1, guildId: 1 } },
  ]);
}

export async function getPlayerRank(
  playerId: string | Types.ObjectId,
  sortField: 'xp' | 'level' = 'xp'
): Promise<number> {
  const player = await Player.findById(playerId);
  if (!player) return -1;

  const filter: FilterQuery<IPlayer> = { isRegistered: true };
  if (sortField === 'xp') {
    filter.xp = { $gt: player.xp };
  } else {
    filter.$or = [
      { level: { $gt: player.level } },
      { level: player.level, xp: { $gt: player.xp } },
    ];
  }

  return (await Player.countDocuments(filter)) + 1;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Bulk Operations for Reward Distribution
// ═══════════════════════════════════════════════════════════════════════════════

export async function bulkIncrementShards(
  updates: Array<{ playerId: string | Types.ObjectId; amount: number }>
): Promise<{ modifiedCount: number; matchedCount: number }> {
  if (updates.length === 0) return { modifiedCount: 0, matchedCount: 0 };

  const bulkOps = updates.map(({ playerId, amount }) => ({
    updateOne: {
      filter: { _id: playerId },
      update: { $inc: { shards: amount } },
    },
  }));

  const result = await Player.bulkWrite(bulkOps);
  return { modifiedCount: result.modifiedCount, matchedCount: result.matchedCount };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Energy Operations
// ═══════════════════════════════════════════════════════════════════════════════

export async function deductEnergy(
  playerId: string | Types.ObjectId,
  amount: number
): Promise<IPlayerDocument | null> {
  return Player.findByIdAndUpdate(
    playerId,
    { $inc: { energy: -amount } },
    { returnDocument: 'after' }
  );
}
