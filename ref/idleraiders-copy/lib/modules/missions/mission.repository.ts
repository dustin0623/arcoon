import Mission, { type IMission, type IMissionDocument, type MissionType } from './mission.model';
import type { FilterQuery, UpdateQuery, QueryOptions, Types } from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateMissionData {
  owner: Types.ObjectId | string;
  type: MissionType;
  sourceName?: string;
  startTime?: Date;
  duration: number;
  dungeonId?: string;
  missionTypeId?: string;
  territoryId?: string;
  questNumber?: number;
  bossId?: string;
  // War mission fields
  guildWarId?: Types.ObjectId;
  targetOutpostId?: string;
  targetGuildId?: Types.ObjectId;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Repository Functions
// ═══════════════════════════════════════════════════════════════════════════════

export async function create(data: CreateMissionData): Promise<IMissionDocument> {
  return Mission.create({
    ...data,
    startTime: data.startTime ?? new Date(),
    completedAt: null,
  });
}

export async function findById(id: string | Types.ObjectId): Promise<IMissionDocument | null> {
  return Mission.findById(id);
}

export async function findOne(filter: FilterQuery<IMission>): Promise<IMissionDocument | null> {
  return Mission.findOne(filter);
}

export async function findMany(
  filter: FilterQuery<IMission> = {},
  options: QueryOptions = {}
): Promise<IMissionDocument[]> {
  return Mission.find(filter, null, options);
}

export async function findByOwner(owner: Types.ObjectId | string): Promise<IMissionDocument[]> {
  return Mission.find({ owner }).sort({ createdAt: -1 });
}

export async function findActiveByOwner(owner: Types.ObjectId | string): Promise<IMissionDocument | null> {
  return Mission.findOne({ owner, completedAt: null });
}

export async function findCompletedByOwner(
  owner: Types.ObjectId | string,
  limit: number = 50
): Promise<IMissionDocument[]> {
  return Mission.find({ owner, completedAt: { $ne: null } })
    .sort({ completedAt: -1 })
    .limit(limit);
}

export async function findByType(
  owner: Types.ObjectId | string,
  type: MissionType,
  completed?: boolean
): Promise<IMissionDocument[]> {
  const filter: FilterQuery<IMission> = { owner, type };
  if (completed === true) filter.completedAt = { $ne: null };
  if (completed === false) filter.completedAt = null;
  return Mission.find(filter).sort({ createdAt: -1 });
}

export async function updateById(
  id: string | Types.ObjectId,
  update: UpdateQuery<IMission>,
  options: QueryOptions = { returnDocument: 'after' }
): Promise<IMissionDocument | null> {
  return Mission.findByIdAndUpdate(id, update, options);
}

export async function completeMission(id: string | Types.ObjectId): Promise<IMissionDocument | null> {
  return Mission.findByIdAndUpdate(id, { completedAt: new Date() }, { returnDocument: 'after' });
}

// Alias for completeMission
export const complete = completeMission;

export async function deleteById(id: string | Types.ObjectId): Promise<IMissionDocument | null> {
  return Mission.findByIdAndDelete(id);
}

export async function deleteByOwner(owner: Types.ObjectId | string): Promise<{ deletedCount: number }> {
  const result = await Mission.deleteMany({ owner });
  return { deletedCount: result.deletedCount };
}

export async function count(filter: FilterQuery<IMission> = {}): Promise<number> {
  return Mission.countDocuments(filter);
}

export async function countByOwner(
  owner: Types.ObjectId | string,
  type?: MissionType,
  completed?: boolean
): Promise<number> {
  const filter: FilterQuery<IMission> = { owner };
  if (type) filter.type = type;
  if (completed === true) filter.completedAt = { $ne: null };
  if (completed === false) filter.completedAt = null;
  return Mission.countDocuments(filter);
}

export async function getRecentMissions(
  owner: Types.ObjectId | string,
  hours: number = 24,
  type?: MissionType
): Promise<IMissionDocument[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const filter: FilterQuery<IMission> = { owner, createdAt: { $gte: since } };
  if (type) filter.type = type;
  return Mission.find(filter).sort({ createdAt: -1 });
}
