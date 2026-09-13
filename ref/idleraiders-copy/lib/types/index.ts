import type { NextRequest, NextResponse } from 'next/server'
import type { Document, Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// API Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiSuccessResponse<T = Record<string, unknown>> {
	success: true
	data?: T
	[key: string]: unknown
}

export interface ApiErrorResponse {
	success: false
	error: string
	[key: string]: unknown
}

export type ApiResponse<T = Record<string, unknown>> = ApiSuccessResponse<T> | ApiErrorResponse

export type RouteHandler = (
	request: NextRequest,
	context?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse<ApiResponse>>

// ═══════════════════════════════════════════════════════════════════════════════
// Auth Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface JWTPayload {
	playerId: string
	username: string
	exp?: number
	iat?: number
}

export interface AuthResult {
	ok: true
	payload: JWTPayload
}

export interface AuthError {
	ok: false
	response: NextResponse<ApiErrorResponse>
}

export type AuthPayloadResult = AuthResult | AuthError

// ═══════════════════════════════════════════════════════════════════════════════
// Player Types
// ═══════════════════════════════════════════════════════════════════════════════

export type TerritoryId = 't1' | 't2' | 't3' | 't4' | 't5'

export interface IMilestones {
	totalBossDamage: number
	totalMinutesPlayed: number
	totalOpenedPacks: number
	totalCardsCollected: number
	totalCraftedCards: number
	totalMissionsCompleted: number
	storyProgress: number
	missionCompletions: Map<string, number>
}

export interface IMissionStats {
	fatigue: number
	isExpBoostActive: boolean
}

export interface IDailyDungeonStats {
	lastReset: Date
	runs: Map<string, number>
}

export interface IPlayer {
	_id: Types.ObjectId
	username: string
	isRegistered: boolean
	level: number
	xp: number
	coins: number
	shards: number
	dollars: number
	energy: number
	storageSlots: number
	missionStats?: IMissionStats
	milestones?: IMilestones
	activeMission: Types.ObjectId | null
	guildId: Types.ObjectId | null
	lastCycleUpdate: Date
	referredBy: string
	dailyDungeonStats?: IDailyDungeonStats
	createdAt: Date
	updatedAt: Date
}

export interface IPlayerDocument extends IPlayer, Document {
	_id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Card Types
// ═══════════════════════════════════════════════════════════════════════════════

export type CardType = 'hero' | 'equipment' | 'mount' | 'artifact' | 'relic' | 'story' | 'booster'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'special'

export interface Card {
	id: string
	name: string
	type: CardType
	class?: string
	rarity: Rarity
	description?: string
	stats?: Record<string, number>
	abilities?: string[]
}

export interface ICard {
	_id: Types.ObjectId
	playerId: Types.ObjectId
	id: string
	cardType: CardType
	level: number
	xp: number
	isLocked: boolean
	createdAt: Date
	updatedAt: Date
}

export interface ICardDocument extends ICard, Document {
	_id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Item Types
// ═══════════════════════════════════════════════════════════════════════════════

export type ItemType = 'material' | 'potion' | 'pack'

export interface IItem {
	_id: Types.ObjectId
	playerId: Types.ObjectId
	id: string
	itemType: ItemType
	quantity: number
	createdAt: Date
	updatedAt: Date
}

export interface IItemDocument extends IItem, Document {
	_id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Guild Types
// ═══════════════════════════════════════════════════════════════════════════════

export type GuildRole = 'leader' | 'officer' | 'member'

export interface IGuildMember {
	playerId: Types.ObjectId
	username: string
	role: GuildRole
	joinedAt: Date
	totalContributed: number
}

export interface IGuild {
	_id: Types.ObjectId
	name: string
	tag: string
	description: string
	leaderId: Types.ObjectId
	members: IGuildMember[]
	treasury: number
	level: number
	xp: number
	maxMembers: number
	createdAt: Date
	updatedAt: Date
}

export interface IGuildDocument extends IGuild, Document {
	_id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mission Types
// ═══════════════════════════════════════════════════════════════════════════════

export type MissionType = 'story' | 'boss' | 'dungeon'
export type MissionStatus = 'active' | 'completed' | 'failed'

export interface IMission {
	_id: Types.ObjectId
	playerId: Types.ObjectId
	type: MissionType
	targetId: string
	status: MissionStatus
	startedAt: Date
	completesAt: Date
	cardIds: Types.ObjectId[]
	createdAt: Date
	updatedAt: Date
}

export interface IMissionDocument extends IMission, Document {
	_id: Types.ObjectId
}

// ═════════════════════════════════════════════════════════════════════════════�����═
// Market Types
// ═══════════════════════════════════════════════════════════════════════════════

export type ListingStatus = 'active' | 'sold' | 'cancelled'
export type ListingType = 'card' | 'item'

export interface IMarketListing {
	_id: Types.ObjectId
	sellerId: Types.ObjectId
	sellerUsername: string
	listingType: ListingType
	cardId?: Types.ObjectId
	itemId?: string
	itemType?: ItemType
	quantity: number
	price: number
	currency: 'coins' | 'shards'
	status: ListingStatus
	createdAt: Date
	updatedAt: Date
}

export interface IMarketListingDocument extends IMarketListing, Document {
	_id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// History Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface IHistoryTarget {
	entityType: string
	entityId: string
	label: string
}

export interface IHistory {
	_id: Types.ObjectId
	playerId: Types.ObjectId
	username?: string
	source: string
	eventType: string
	eventKey: string
	metadata: Record<string, unknown>
	target?: IHistoryTarget
	tags: string[]
	createdAt: Date
}

export interface IHistoryDocument extends IHistory, Document {
	_id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Transaction Types
// ═══════════════════════════════════════════════════════════════════════════════

export type TransactionType = 'deposit' | 'withdraw' | 'transfer' | 'purchase'
export type TransactionStatus = 'pending' | 'completed' | 'failed'

export interface ITransaction {
	_id: Types.ObjectId
	playerId: Types.ObjectId
	type: TransactionType
	amount: number
	currency: string
	chainTxId?: string
	status: TransactionStatus
	metadata?: Record<string, unknown>
	createdAt: Date
	updatedAt: Date
}

export interface ITransactionDocument extends ITransaction, Document {
	_id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Leaderboard Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ILeaderboardEntry {
	_id: Types.ObjectId
	playerId: Types.ObjectId
	username: string
	score: number
	rank?: number
	period: string
	category: string
	createdAt: Date
	updatedAt: Date
}

export interface ILeaderboardEntryDocument extends ILeaderboardEntry, Document {
	_id: Types.ObjectId
}

// ═══════════════════════════════════════════════════════════════════════════════
// Game Data Types (Static Configuration)
// ═══════════════════════════════════════════════════════════════════════════════

export interface GameItem {
  id: string
  name?: string
  category?: string
  type?: string
  rarity?: string
}

export interface GameCard {
  id: string
  name?: string
  type?: string
  rarity?: string
  class?: string
  stats?: Record<string, number>
  abilities?: string[]
  description?: string
}

export interface GameCardConfig {
	id: string
	name: string
	type: CardType
	rarity: Rarity
	description?: string
	stats?: Record<string, number>
	abilities?: string[]
}

export interface GameTerritoryConfig {
	id: TerritoryId
	name: string
	requiredLevel: number
	requiredStoryCard?: string
}

export interface GameBossConfig {
	id: string
	name: string
	level: number
	health: number
	rewards: Record<string, number>
}

export interface GameDungeonConfig {
	id: string
	name: string
	level: number
	energyCost: number
	rewards: Record<string, number>
}

export interface GameSystemConfig {
	PLAYER: {
		MAX_LEVEL: number
	}
	ENERGY: {
		MAX: number
		REGEN_INTERVAL: number
	}
	FATIGUE: {
		MAX: number
	}
}

export interface GameEconomyConfig {
	leaderboard?: {
		EXPECTED_DAMAGE: number
		PREMIUM_POOL: number
	}
}

export interface GameData {
	CARDS: {
		HEROES: GameCardConfig[]
		EQUIPMENTS: GameCardConfig[]
		MOUNTS: GameCardConfig[]
		ARTIFACTS: GameCardConfig[]
		RELICS: GameCardConfig[]
		STORIES: GameCardConfig[]
		BOOSTERS: GameCardConfig[]
		[key: string]: GameCardConfig[]
	}
	ITEMS: {
		MATERIALS: Array<{ id: string; name: string; rarity: Rarity }>
		CONSUMABLES: Array<{ id: string; name: string; effect: string }>
	}
	WORLD: {
		TERRITORIES: GameTerritoryConfig[]
		BOSSES: GameBossConfig[]
		DUNGEONS: GameDungeonConfig[]
	}
	SYSTEM: GameSystemConfig
	ECONOMY: GameEconomyConfig
	PROGRESSION: Record<string, unknown>
}
