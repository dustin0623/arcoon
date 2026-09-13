import type { Types } from 'mongoose'
import type { IHistoryDocument } from './history.model'
import * as historyRepo from './history.repository'
import * as playerRepo from '../players/player.repository'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface ResolvedActor {
  username: string | null
  actorId: Types.ObjectId | null
}

interface PlayerIdRef {
  _id?: Types.ObjectId
  id?: Types.ObjectId | string
  username?: string
  playerId?: Types.ObjectId | string
}

interface HistoryEntry {
  _id?: Types.ObjectId
  username?: string
  source?: string
  eventType?: string
  data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  eventKey?: string
  status?: string
  actor?: {
    username?: string
    playerId?: Types.ObjectId | null
  }
  target?: {
    entityType?: string | null
    entityId?: string | null
    label?: string | null
  }
  context?: {
    service?: string
    action?: string
  }
  tags?: string[]
  type?: string
  sourceName?: string
  missionTypeId?: string
  duration?: number
  listingType?: string
  createdAt?: Date
}

interface LogEventPayload {
  playerId?: Types.ObjectId | string
  actorId?: Types.ObjectId | string
  username?: string
  source?: string
  service?: string
  eventType?: string
  action?: string
  data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  eventKey?: string
  status?: string
  target?: {
    entityType?: string
    entityId?: string
    label?: string
  }
  correlationId?: string
  tags?: string[]
  type?: string
  details?: Record<string, unknown>
}

interface GetHistoryOptions {
  eventType?: string
  source?: string
  limit?: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

async function resolveUsernameAndActor(
  playerOrUsername: string | Types.ObjectId | PlayerIdRef | null | undefined
): Promise<ResolvedActor> {
  if (!playerOrUsername) return { username: null, actorId: null }

  if (typeof playerOrUsername === 'string') {
    const byId = await playerRepo.findById(playerOrUsername)
    if (byId) return { username: byId.username, actorId: byId._id }
    return { username: playerOrUsername, actorId: null }
  }

  const ref = playerOrUsername as PlayerIdRef
  if (ref._id || ref.id) {
    const actorId = ref._id || (ref.id as Types.ObjectId)
    if (ref.username) return { username: ref.username, actorId }
    const player = await playerRepo.findById(actorId.toString())
    return { username: player?.username || null, actorId: player?._id || actorId }
  }

  if (ref.username) {
    return { username: ref.username, actorId: (ref.playerId as Types.ObjectId) || null }
  }

  return { username: null, actorId: null }
}

function normalizeEntry(entry: IHistoryDocument): HistoryEntry {
  const data = entry.data ?? entry.metadata ?? {}
  return {
    ...entry.toObject(),
    username: entry.username || entry.actor?.username,
    source: entry.source || entry.context?.service,
    eventType: entry.eventType || entry.context?.action,
    data,
    type: (data as Record<string, unknown>).type as string | undefined,
    sourceName: (data as Record<string, unknown>).sourceName as string | undefined,
    missionTypeId: (data as Record<string, unknown>).missionTypeId as string | undefined,
    duration: (data as Record<string, unknown>).duration as number | undefined,
    listingType: (data as Record<string, unknown>).listingType as string | undefined,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

export async function logEvent(payload: LogEventPayload): Promise<IHistoryDocument>
export async function logEvent(
  username: string,
  source: string,
  eventType: string,
  data: Record<string, unknown>
): Promise<IHistoryDocument>
export async function logEvent(
  usernameOrPayload: string | LogEventPayload,
  sourceArg?: string,
  eventTypeArg?: string,
  dataArg?: Record<string, unknown>
): Promise<IHistoryDocument> {
  let payload: LogEventPayload

  if (typeof usernameOrPayload === 'object' && usernameOrPayload !== null && sourceArg === undefined) {
    payload = usernameOrPayload
  } else {
    payload = {
      username: usernameOrPayload as string,
      source: sourceArg,
      eventType: eventTypeArg,
      data: dataArg,
    }
  }

  const { username, actorId } = await resolveUsernameAndActor(
    payload.playerId || payload.actorId || payload.username
  )

  if (!username) throw new Error('History logEvent requires a resolvable username')

  const source = payload.source || payload.service || 'system'
  const eventType = payload.eventType || payload.action || 'event'
  const metadata = payload.metadata ?? payload.data ?? {}

  return historyRepo.create({
    username,
    source,
    eventType,
    data: metadata,
    eventKey: payload.eventKey || `${source}.${eventType}`,
    status: (payload.status as 'started' | 'completed' | 'failed' | 'cancelled') || 'completed',
    actor: {
      playerId: actorId || (payload.playerId as Types.ObjectId) || (payload.actorId as Types.ObjectId) || null,
      username,
    },
    target: {
      entityType: payload.target?.entityType || null,
      entityId: payload.target?.entityId || null,
      label: payload.target?.label || null,
    },
    context: {
      service: source,
      action: eventType,
      correlationId: payload.correlationId || null,
    },
    metadata,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
  })
}

export async function getHistory(
  playerOrUsername: string | Types.ObjectId | PlayerIdRef,
  options: GetHistoryOptions = {}
): Promise<{ entries: HistoryEntry[]; total: number }> {
  const { eventType, source, limit = 50 } = options
  const { username } = await resolveUsernameAndActor(playerOrUsername)
  if (!username) return { entries: [], total: 0 }

  const entries = await historyRepo.findByUsername(username, { eventType, source, limit })
  return { entries: entries.map(normalizeEntry), total: entries.length }
}

export async function clearHistory(username: string): Promise<{ deleted: number }> {
  const result = await historyRepo.deleteByUsername(username)
  return { deleted: result.deletedCount }
}
