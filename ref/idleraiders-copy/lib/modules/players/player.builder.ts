import Card, { type ICardDocument } from '../cards/card.model'
import Item, { type IItemDocument } from '../items/item.model'
import Mission, { type IMissionDocument } from '../missions/mission.model'
import Player, { type IPlayerDocument } from './player.model'
// Import Guild model to ensure schema is registered before populate
import '../guilds/guild.model'
import { xpToNextLevel } from './player.logic'
import { getManilaDateString } from '@/lib/utils/time'
import { CARDS_BY_ID } from '@/lib/registries/card.registry'
import { MATERIALS_BY_ID } from '@/lib/registries/item.registry'
import GAME_DATA from '@/public/data'
import { BOOSTER_MULTIPLIERS } from '@/public/data/cards/cardConfig'
import type { Types } from 'mongoose'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface GameCard {
	id: string
	name?: string
	description?: string
	type?: string
	class?: string
	rarity?: string
	stats?: {
		raidPower?: number
		mastery?: number
		luck?: number
		gm?: number
	}
}

interface GameItem {
	id: string
	name?: string
	type?: string
	icon?: string
	category?: string
}

// Boosts come exclusively from booster-type cards (xpBoost, materialBoost, energyBoost)
interface RawBoosts {
	expBoost: number
	matBoost: number
	energyBoost: number
}

// Combined card-derived values: boosts from booster cards + stats from hero/equipment/etc.
export interface RawCardValues extends RawBoosts {
  raidPower: number
  mastery: number
  luck: number
}

interface Stats {
	raidPower: number
	mastery: number
	luck: number
	gm: number
}

interface Boosts {
	expBoost: number
	matBoost: number
	energyBoost: number
}

// Guild-level bonuses derived from the player's guild level (decimals, e.g. 0.04 = +4%).
// All zero when the player is not in a guild.
interface GuildBonuses {
	xpBonus: number
	materialBonus: number
	energyRegen: number
	bossDamage: number
}

interface SerializedMission {
	id: string
	type: string
	sourceName: string
	missionLabel: string
	startTime: number
	duration: number
	completedAt: number | null
}

interface MaterialItem {
	id: string
	name: string
	type: string
	icon: string
	quantity: number
	itemType: 'material'
}

interface CardItem {
	id: string
	cardId: string
	rarity: string
	type: string
	quantity: number
	name: string
	description: string
	source: string | null
	stats: Record<string, number>
}

interface Achievement {
	id: string
	name: string
	description: string
	icon?: string
	category?: string
	unlocked: boolean
}

export interface PlayerState {
	username: string
	isRegistered: boolean
	level: number
	xp: number
	xpToNextLevel: number
	coins: number
	shards: number
	dollars: number
	energy: number
	storageSlots: number
	lastCycleUpdate: Date
	referredBy: string
	missionStats: { fatigue: number; mastery: number; isExpBoostActive: boolean }
	dailyDungeonStats: Record<string, number>
	boosts: Boosts
	guildBonuses: GuildBonuses
	milestones: Record<string, unknown>
	activeMission: SerializedMission | null
	guildId: Types.ObjectId | null
	joinedAt: Date | null
	totalMissions: number
	totalBossDamage: number
	totalMinutesPlayed: number
	stats: Stats
	cards: CardItem[]
	materials: MaterialItem[]
	potions: IItemDocument[]
	packs: IItemDocument[]
	achievements: Achievement[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

function formatMaterialName(materialId: string): string {
	if (!materialId) return 'Unknown'
	return materialId
		.replace(/^material_/i, '')
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')
}

export function applyBoostCap(rawPercent: number): number {
	// Soft cap at 75%, diminishing returns beyond that up to 150% max
	// This prevents extreme XP/material stacking while keeping booster cards valuable
	if (rawPercent <= 0) return 0
	if (rawPercent <= 75) return rawPercent
	const overflow = rawPercent - 75
	return Math.min(150, 75 + 75 * Math.sqrt(overflow / 75))
}

function computeRawCardValues(dbCards: ICardDocument[]): RawCardValues {
	const raw: RawCardValues = { expBoost: 0, matBoost: 0, energyBoost: 0, raidPower: 0, mastery: 0, luck: 0 }
	for (const card of dbCards) {
		const cardDef = CARDS_BY_ID[card.cardId] ?? {}
		const qty = card.quantity ?? 1
		if (cardDef.type === 'booster' && cardDef.class && cardDef.rarity) {
			// Booster cards: only contribute to the 3 boost types
			const boostPercent = BOOSTER_MULTIPLIERS[cardDef.rarity] ?? 0
			const amount = boostPercent * qty
			if (cardDef.class === 'xpBoost') raw.expBoost += amount
			else if (cardDef.class === 'materialBoost') raw.matBoost += amount
			else if (cardDef.class === 'energyBoost') raw.energyBoost += amount
		} else {
			// Non-booster cards: contribute to raidPower, mastery, and luck stats
			raw.raidPower += (cardDef.stats?.raidPower ?? 0) * qty
			raw.mastery += (cardDef.stats?.mastery ?? 0) * qty
			raw.luck += (cardDef.stats?.luck ?? 0) * qty
		}
	}
	return raw
}

export async function getRawCardBoostsById(playerId: string | Types.ObjectId): Promise<RawCardValues> {
	const dbCards = await Card.find({ owner: playerId }).lean()
	return computeRawCardValues(dbCards as ICardDocument[])
}

function getMissionLabel(type: string): string {
	switch (type) {
		case 'dungeon':
			return 'Dungeon Run'
		case 'story':
			return 'Story Quest'
		case 'boss':
			return 'Boss Raid'
		case 'training':
			return 'Training Session'
		case 'war_outpost':
			return 'Attacking Outpost'
		case 'war_stronghold':
			return 'Attacking Stronghold'
		default:
			return 'Mission'
	}
}

function serializeActiveMission(mission: IMissionDocument | null): SerializedMission | null {
	if (!mission) return null

	const missionId = mission._id?.toString?.() ?? null
	const startTime = mission.startTime instanceof Date ? mission.startTime.getTime() : Number(mission.startTime)
	const duration = Number(mission.duration)

	if (!missionId || !Number.isFinite(startTime) || !Number.isFinite(duration)) {
		return null
	}

	return {
		id: missionId,
		type: mission.type ?? 'dungeon',
		sourceName: mission.sourceName ?? 'Mission',
		missionLabel: getMissionLabel(mission.type ?? 'dungeon'),
		startTime,
		duration,
		completedAt:
			mission.completedAt instanceof Date ? mission.completedAt.getTime() : (mission.completedAt ?? null),
	}
}

// ════════════════════��══════════════════════════════════════════════════════════
// Main Builder
// ═══════��═══════════��═══════════════════════════════════��═══════════════════════

export async function buildPlayerState(player: IPlayerDocument): Promise<PlayerState> {
	// Handle both populated and non-populated activeMission
	const rawActiveMission = player.activeMission
	const isPopulated = rawActiveMission && typeof rawActiveMission === 'object' && '_id' in rawActiveMission
	const activeMissionId = isPopulated ? (rawActiveMission as IMissionDocument)._id : (rawActiveMission ?? null)
	const shouldLoadActiveMission = !!activeMissionId && !isPopulated

	const [dbCards, dbItems, activeMissionDoc] = await Promise.all([
		Card.find({ owner: player._id }).lean(),
		Item.find({ playerId: player._id }).lean(),
		shouldLoadActiveMission ? Mission.findById(activeMissionId).lean() : null,
	])

	// Use populated mission if available, otherwise use the fetched one
	const missionToSerialize = isPopulated
		? (rawActiveMission as IMissionDocument)
		: (activeMissionDoc as IMissionDocument | null)
	const activeMission = serializeActiveMission(missionToSerialize)

	// Single pass over items: materials, potions, packs, totalMaterials
	const materials: MaterialItem[] = []
	const potions: IItemDocument[] = []
	const packs: IItemDocument[] = []
	let totalMaterials = 0

	for (const item of dbItems as IItemDocument[]) {
		if (item.itemType === 'material') {
			const materialDef = MATERIALS_BY_ID[item.id] ?? {}
			materials.push({
				id: item.id,
				name: materialDef.name ?? formatMaterialName(item.id),
				type: materialDef.type ?? 'common',
				icon: materialDef.icon ?? '📦',
				quantity: item.quantity ?? 0,
				itemType: 'material',
			})
			totalMaterials += item.quantity ?? 0
		} else if (item.itemType === 'potion') {
			potions.push(item)
		} else if (item.itemType === 'pack') {
			packs.push(item)
		}
	}

	// Separate stat accumulation (hero/equipment/etc.) from boost accumulation (booster cards only)
	const stats: Stats = { raidPower: 0, mastery: 0, luck: 0, gm: 0 }
	const rawBoosts: RawBoosts = { expBoost: 0, matBoost: 0, energyBoost: 0 }

	const cards: CardItem[] = (dbCards as ICardDocument[]).map((dbCard) => {
		const cardDef = CARDS_BY_ID[dbCard.cardId] ?? {}
		const s = cardDef.stats ?? {}
		const qty = dbCard.quantity ?? 1

		if (cardDef.type === 'booster' && cardDef.class && cardDef.rarity) {
			// Booster cards: only contribute to the 3 boost types, no stats
			const boostPercent = BOOSTER_MULTIPLIERS[cardDef.rarity] ?? 0
			const amount = boostPercent * qty
			if (cardDef.class === 'xpBoost') rawBoosts.expBoost += amount
			else if (cardDef.class === 'materialBoost') rawBoosts.matBoost += amount
			else if (cardDef.class === 'energyBoost') rawBoosts.energyBoost += amount
		} else {
			// Non-booster cards: contribute to stats only
			stats.raidPower += (s.raidPower || 0) * qty
			stats.mastery += (s.mastery || 0) * qty
			stats.luck += (s.luck || 0) * qty
			stats.gm += (s.gm || 0) * qty
		}

		return {
			id: dbCard.cardId,
			cardId: dbCard.cardId,
			rarity: dbCard.rarity,
			type: dbCard.type,
			quantity: qty,
			name: cardDef.name ?? dbCard.cardId,
			description: cardDef.description ?? '',
			source: dbCard.source ?? null,
			stats: s as Record<string, number>,
		}
	})

	const boosts: Boosts = {
		expBoost: applyBoostCap(rawBoosts.expBoost),
		matBoost: applyBoostCap(rawBoosts.matBoost),
		energyBoost: applyBoostCap(rawBoosts.energyBoost),
	}

	// Derive guild bonuses from the populated guild doc (set up via
	// buildPlayerStateById's .populate('guildId')). Safely falls back to zeros
	// when guildId isn't populated (e.g. some direct buildPlayerState callers)
	// or when the player has no guild.
	const guildBonuses: GuildBonuses = (() => {
		const zero: GuildBonuses = { xpBonus: 0, materialBonus: 0, energyRegen: 0, bossDamage: 0 }
		const guildRef = player.guildId as unknown
		if (!guildRef || typeof guildRef !== 'object') return zero
		const guildLevel = (guildRef as { level?: number }).level
		if (typeof guildLevel !== 'number') return zero
		const levels = (GAME_DATA as { PROGRESSION?: { GUILDS?: { LEVELS?: Array<{
			level: number
			xpBonus: number
			materialBonus: number
			energyRegen: number
			bossDamage: number
		}> } } }).PROGRESSION?.GUILDS?.LEVELS ?? []
		const entry = levels.find((l) => l.level === guildLevel)
		if (!entry) return zero
		return {
			xpBonus: entry.xpBonus ?? 0,
			materialBonus: entry.materialBonus ?? 0,
			energyRegen: entry.energyRegen ?? 0,
			bossDamage: entry.bossDamage ?? 0,
		}
	})()

	// Serialize the milestones subdoc — convert the missionCompletions Map to a plain object
	// so it survives JSON transport and is consumable by the client UI.
	const rawMilestones = (player.milestones ?? {}) as Record<string, unknown>
	const rawMissionCompletions = rawMilestones.missionCompletions
	const missionCompletionsObj =
		rawMissionCompletions instanceof Map
			? Object.fromEntries(rawMissionCompletions)
			: ((rawMissionCompletions as Record<string, number> | undefined) ?? {})
	const milestones: Record<string, number> & { missionCompletions: Record<string, number> } = {
		...(rawMilestones as Record<string, number>),
		missionCompletions: missionCompletionsObj,
	}

	interface AchStats {
		totalMissions: number
		totalBossDamage: number
		raidPower: number
		uniqueCards: number
		totalMaterials: number
		coins: number
		playerLevel: number
		territoriesCompleted: number
		totalTerritories: number
		minutesPlayed: number
		inGuild: boolean
	}

	const achStats: AchStats = {
		totalMissions: milestones.totalMissionsCompleted ?? 0,
		totalBossDamage: milestones.totalBossDamage ?? 0,
		raidPower: stats.raidPower,
		uniqueCards: dbCards.length,
		totalMaterials,
		coins: player.coins ?? 0,
		playerLevel: player.level ?? 1,
		territoriesCompleted: milestones.storyProgress ?? 0,
		totalTerritories: (GAME_DATA as { WORLD?: { TERRITORIES?: unknown[] } }).WORLD?.TERRITORIES?.length ?? 0,
		minutesPlayed: milestones.totalMinutesPlayed ?? 0,
		inGuild: !!player.guildId,
	}

	interface ProgressionAchievement {
		id: string
		name: string
		title?: string
		description: string
		icon?: string
		check?: (stats: AchStats) => boolean
		rewards?: AchievementRewards
	}

	const progressionAchievements = ((GAME_DATA as { PROGRESSION?: { ACHIEVEMENTS?: ProgressionAchievement[] } })
		.PROGRESSION?.ACHIEVEMENTS ?? []) as ProgressionAchievement[]

	const achievements: Achievement[] = (Array.isArray(progressionAchievements) ? progressionAchievements : []).map(
		(a) => {
			const { check, title, rewards, ...rest } = a
			const unlocked = typeof check === 'function' ? check(achStats) : false
			return {
				...rest,
				name: title ?? rest.name ?? a.id,
				unlocked,
			}
		},
	)

	const rawRuns =
		player.dailyDungeonStats?.runs instanceof Map ? Object.fromEntries(player.dailyDungeonStats.runs) : {}

	const lastReset = player.dailyDungeonStats?.lastReset
	const todayManila = getManilaDateString(new Date())
	const lastResetManila = lastReset ? getManilaDateString(new Date(lastReset)) : null
	const dailyDungeonStatsObj = lastResetManila === todayManila ? rawRuns : {}

	return {
		username: player.username,
		isRegistered: player.isRegistered ?? false,
		level: player.level ?? 1,
		xp: player.xp ?? 0,
		xpToNextLevel: xpToNextLevel(player.level ?? 1),
		coins: player.coins ?? 0,
		shards: player.shards ?? 0,
		dollars: player.dollars ?? 0,
		energy: player.energy ?? 0,
		storageSlots: player.storageSlots ?? 3,
		lastCycleUpdate: player.lastCycleUpdate,
		referredBy: player.referredBy ?? 'idleraiders',
		missionStats: player.missionStats ?? { fatigue: 0, mastery: 0, isExpBoostActive: false },
		dailyDungeonStats: dailyDungeonStatsObj,
		boosts,
		guildBonuses,
		milestones,
		activeMission,
		guildId: player.guildId ?? null,
		joinedAt: player.createdAt ?? null,
		totalMissions: milestones.totalMissionsCompleted ?? 0,
		totalBossDamage: milestones.totalBossDamage ?? 0,
		totalMinutesPlayed: milestones.totalMinutesPlayed ?? 0,
		stats,
		cards,
		materials,
		potions,
		packs,
		achievements,
	}
}

export async function buildPlayerStateById(playerId: string | Types.ObjectId): Promise<PlayerState> {
	if (!playerId) {
		throw new Error('Player ID is required')
	}

	const player = await Player.findById(playerId).populate('activeMission').populate('guildId')

	if (!player) {
		throw new Error('Player not found')
	}

	return buildPlayerState(player)
}

export default buildPlayerState
