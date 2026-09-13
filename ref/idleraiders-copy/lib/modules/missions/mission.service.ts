import type { Types } from 'mongoose'
import type { IMissionDocument, TrainingType } from './mission.model'
import type { IPlayerDocument } from '../players/player.model'
import * as missionRepo from './mission.repository'
import * as playerRepo from '../players/player.repository'
import {
	calculateDungeonReward,
	rollMaterialsFromPool,
	getDungeonUnlockGate,
	isMissionUnlocked,
	isMissionCompletionUnlocked,
} from './mission.logic'
import { getRawCardBoostsById, applyBoostCap } from '../players/player.builder'
import { rollPotionDrop } from '../items/item.logic'
import { getManilaDateString } from '@/lib/utils/time'
import { DEFAULT_COMPONENT_POOL, DEFAULT_CATALYST_POOL } from '@/public/data/world/bosses'
import * as itemService from '../items/item.service'
import * as leaderboardService from '../leaderboards/leaderboard.service'
import * as playerService from '../players/player.service'
import { addCard, addCardWithDetails, getPlayerCardsByTerritory, CARDS_BY_ID } from '../cards/card.service'
import Card from '../cards/card.model'
import * as historyService from '../histories/history.service'
import * as guildService from '../guilds/guild.service'
import GAME_DATA from '@/public/data'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface Potion {
	id: string
	category?: string
	catergory?: string
	chanceMultiplier?: Record<string, number>
}

interface Dungeon {
	id: string
	name: string
	materialPool?: string[]
	requiredLevel?: number
}

interface Territory {
	id: string
	name: string
	requiredLevel: number
	materialPool: string[]
	dropRate: { material: number; card: number }
	quests: Quest[]
}

interface Quest {
	questNumber: number
	globalQuestNumber: number
	title: string
	requiredLevel: number
	energyCost: number
	duration: number
	rewardCard?: {
		cardId: string
		rarity: string
		type: string
	}
}

interface Boss {
	id: string
	name: string
	tier: number // Changed from difficulty to tier to match public/data/world/bosses.ts
	componentPool: string[]
	catalystPool: string[]
	dropRate: { component: number; catalyst: number }
	catalystDropRate: { common: number; uncommon: number; rare: number; epic: number; legendary: number }
}

interface MissionType {
	energyCost: number
	duration: number
	baseTokenReward?: number
	materialRolls?: number
	fatiguePerMission?: number
}

interface StartMissionOptions {
	questNumber?: number
}

interface MissionResult {
	mission: IMissionDocument
	energy: number
}

interface DungeonCompletionResult {
	tokens: number
	materials: string[]
	potionDrop: string | null
	xp: number
}

interface StoryCompletionResult {
	xp: number
	cardDropped: boolean
	rewardCard: { cardId: string; rarity: string; type: string } | null
	progressAdvanced: boolean
	storyProgress: number
	territoryId: string
	questNumber: number
	isFirstCompletion: boolean
	chestItem?: {
		itemId: string
		materialCount: number
		materials: string[]
	}
}

interface BossCompletionResult {
	damage: number
	materialDrops: string[]
	componentDrop: string | null
	catalystDrop: { id: string; rarity: string } | null
	bossDefeated: boolean
	xp: number
}

interface HistoryPayload {
	playerId: Types.ObjectId | string
	source?: string
	eventType?: string
	eventKey?: string
	status?: string
	metadata?: Record<string, unknown>
	target?: {
		entityType: string
		entityId: string
		label: string
	}
	tags?: string[]
}

// Training types
export interface TrainingResult {
	mission: IMissionDocument
	energy: number
	totalLuck: number
	masteryReward: number
	completesAt: Date
}

export interface TrainingCompletionResult {
	masteryGained: number
	newStoredMastery: number
	expGained: number
}

export interface TrainingLuckStats {
	weapons: number
	mount: number
	merchant: number
}

export interface TrainingStatus {
	activeTraining: IMissionDocument | null
	currentLuck: TrainingLuckStats
	storedMastery: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const POTIONS_BY_ID = Object.fromEntries(
	((GAME_DATA as { ITEMS?: Potion[] }).ITEMS ?? [])
		.filter((item) => item?.catergory === 'potion' || item?.category === 'potion')
		.map((item) => [item.id, item]),
) as Record<string, Potion>

const DUNGEONS_BY_ID = Object.fromEntries(
	((GAME_DATA as { WORLD?: { DUNGEONS?: Dungeon[] } }).WORLD?.DUNGEONS ?? []).map((dungeon) => [dungeon.id, dungeon]),
) as Record<string, Dungeon>

const TERRITORIES_BY_ID = Object.fromEntries(
	((GAME_DATA as { WORLD?: { TERRITORIES?: Territory[] } }).WORLD?.TERRITORIES ?? []).map((territory) => [
		territory.id,
		territory,
	]),
) as Record<string, Territory>

const BOSSES_BY_ID = Object.fromEntries(
	((GAME_DATA as { WORLD?: { BOSSES?: Boss[] } }).WORLD?.BOSSES ?? []).map((boss) => [boss.id, boss]),
) as Record<string, Boss>

const MISSION_TYPES =
	(GAME_DATA as { WORLD?: { MISSION_TYPES?: Record<string, MissionType> } }).WORLD?.MISSION_TYPES ?? {}

const TERRITORY_IDS_ORDERED = ['t1', 't2', 't3', 't4', 't5']
const BOSS_RAID_DURATION = 1800
const BOSS_RAID_ENERGY = 30
const STORY_QUEST_XP = 90
const BOSS_RAID_XP = 45

// Training constants
export const TRAINING_DURATION = 60 // minutes
export const TRAINING_ENERGY_COST = 40

const TRAINING_CARD_TYPE_MAP: Record<TrainingType, string> = {
  weapons: 'equipment',
  mount: 'mount',
  merchant: 'transport',
}

const TRAINING_LABELS: Record<TrainingType, string> = {
  weapons: 'Weapons Training',
  mount: 'Mount Training',
  merchant: 'Merchant Training',
}

// Territory drop configuration now loaded from territory data (removed hardcoded pools)

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Gets the material pool for a territory (4 materials)
 * Reads from territory data instead of hardcoded map
 */
function getTerritoryMaterialPool(territoryId: string): string[] {
	const territory = TERRITORIES_BY_ID[territoryId]
	return territory?.materialPool ?? []
}

/**
 * Gets the drop rate distribution for a territory
 * Returns { material: 85%, card: 15% } by default
 */
function getTerritoryDropRate(territoryId: string): { material: number; card: number } {
	const territory = TERRITORIES_BY_ID[territoryId]
	return territory?.dropRate ?? { material: 85, card: 15 }
}

/**
 * Gets a random component from boss's component pool
 * Uses DEFAULT_COMPONENT_POOL if boss pool not specified
 */
function getBossComponentDrop(bossId: string): string | null {
	const boss = BOSSES_BY_ID[bossId]
	if (!boss) return null
	const pool = boss.componentPool ?? DEFAULT_COMPONENT_POOL
	if (pool.length === 0) return null
	return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Gets a catalyst with rarity determined by boss's catalystDropRate
 * Uses cumulative probability to select rarity, then random catalyst from pool
 * Uses DEFAULT_CATALYST_POOL if boss pool not specified
 */
function getBossCatalystDrop(bossId: string): { id: string; rarity: string } | null {
	const boss = BOSSES_BY_ID[bossId]
	if (!boss) return null
	const pool = boss.catalystPool ?? DEFAULT_CATALYST_POOL
	if (pool.length === 0) return null

	// Roll for rarity using cumulative probabilities
	const rates = boss.catalystDropRate
	const roll = Math.random()
	let cumulative = 0
	let selectedRarity: string | null = null

	for (const [rarity, weight] of Object.entries(rates) as [string, number][]) {
		cumulative += weight
		if (roll < cumulative) {
			selectedRarity = rarity
			break
		}
	}

	if (!selectedRarity) selectedRarity = 'common' // Fallback

	// Get random catalyst from pool
	const CATALYSTS_BY_ID = Object.fromEntries(
		((GAME_DATA as { ITEMS?: Array<{ id: string; rarity?: string }> }).ITEMS ?? [])
			.filter((item: any) => item?.type === 'catalyst')
			.map((item: any) => [item.id, item]),
	) as Record<string, any>

	const catalystsOfRarity = pool.filter((catId) => {
		const catalyst = CATALYSTS_BY_ID[catId]
		return catalyst?.rarity === selectedRarity
	})

	if (catalystsOfRarity.length === 0) {
		// Fallback: use any catalyst from pool
		const randomCatId = boss.catalystPool[Math.floor(Math.random() * boss.catalystPool.length)]
		return { id: randomCatId, rarity: selectedRarity }
	}

	const randomCatId = catalystsOfRarity[Math.floor(Math.random() * catalystsOfRarity.length)]
	return { id: randomCatId, rarity: selectedRarity }
}

/**
 * Determines material count: all difficulties provide 25-50 materials
 */
async function getPlayerOrThrow(playerId: string | Types.ObjectId): Promise<IPlayerDocument> {
	const player = await playerRepo.findById(playerId)
	if (!player) throw new Error('Player not found')
	return player
}

async function logHistorySafe(payload: HistoryPayload): Promise<void> {
	try {
		await historyService.logEvent(payload)
	} catch (error) {
		console.warn('[MissionService] history log skipped:', (error as Error).message)
	}
}

function getGlobalQuestIndex(territoryId: string, questNumber: number): number {
	const tIdx = TERRITORY_IDS_ORDERED.indexOf(territoryId)
	if (tIdx < 0) throw new Error('Unknown territory')
	return tIdx * 5 + (questNumber - 1)
}

function clearActiveMission(player: IPlayerDocument, missionId: Types.ObjectId): void {
	if (player.activeMission && player.activeMission.toString() === missionId.toString()) {
		player.activeMission = null
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getMissionHistory(
	playerId: string | Types.ObjectId,
	limit: number = 50,
): Promise<IMissionDocument[]> {
	return missionRepo.findCompletedByOwner(playerId, limit)
}

export async function startMission(
	playerId: string | Types.ObjectId,
	sourceId: string,
	missionTypeId: string,
	{ questNumber }: StartMissionOptions = {},
): Promise<MissionResult> {
	const player = await getPlayerOrThrow(playerId)
	if (missionTypeId === 'story_quest') {
		return _startStoryMission(player, sourceId, questNumber!)
	}
	if (missionTypeId === 'boss_raid') {
		return _startBossRaid(player, sourceId)
	}
	return _startDungeonMission(player, sourceId, missionTypeId)
}

async function _startDungeonMission(
	player: IPlayerDocument,
	dungeonId: string,
	missionTypeId: string,
): Promise<MissionResult> {
	const dungeon = DUNGEONS_BY_ID[dungeonId]
	if (!dungeon) throw new Error('Dungeon not found')
	
	// Check dungeon unlock gate (level + war campaign requirements)
	const dungeonGate = getDungeonUnlockGate(dungeon, player.level, player.milestones?.missionCompletions)
	if (!dungeonGate.unlocked) {
		if (!dungeonGate.levelMet) throw new Error('Dungeon locked - level too low')
		if (!dungeonGate.warCampaignMet) throw new Error('Dungeon locked - complete War Campaigns in previous dungeon')
	}
	
	if (!isMissionUnlocked(dungeon, missionTypeId, player.level)) throw new Error('Mission locked')
	if (!isMissionCompletionUnlocked(dungeonId, missionTypeId, player.milestones?.missionCompletions))
		throw new Error('Mission completion requirement not met')

	const missionType = MISSION_TYPES[missionTypeId]
	if (!missionType) throw new Error('Invalid mission type')
	if (player.energy < missionType.energyCost) throw new Error('Not enough energy')

	const active = await missionRepo.findActiveByOwner(player._id)
	if (active) throw new Error('Already on a mission')

	player.energy -= missionType.energyCost
	player.activeMission = null
	await player.save()

	const mission = await missionRepo.create({
		owner: player._id,
		type: 'dungeon',
		sourceName: dungeon.name,
		duration: missionType.duration,
		dungeonId,
		missionTypeId,
	})

	player.activeMission = mission._id as Types.ObjectId
	await player.save()

	await logHistorySafe({
		playerId: player._id,
		source: 'mission',
		eventType: 'mission',
		eventKey: 'mission.started',
		status: 'started',
		metadata: {
			action: 'start',
			type: 'dungeon',
			missionId: mission._id.toString(),
			dungeonId,
			dungeonName: dungeon.name,
			missionTypeId,
			duration: missionType.duration,
			energyCost: missionType.energyCost,
			sourceName: dungeon.name,
		},
		target: {
			entityType: 'mission',
			entityId: mission._id.toString(),
			label: dungeon.name,
		},
		tags: ['mission', 'dungeon'],
	})

	return { mission, energy: player.energy }
}

async function _startStoryMission(
	player: IPlayerDocument,
	territoryId: string,
	questNumber: number,
): Promise<MissionResult> {
	if (!questNumber) throw new Error('Missing questNumber for story quest')

	const territory = TERRITORIES_BY_ID[territoryId]
	if (!territory) throw new Error(`Territory not found: ${territoryId}`)

	if (player.level < territory.requiredLevel) throw new Error('Territory locked')

	const quest = territory.quests.find((q) => q.questNumber === questNumber)
	if (!quest) throw new Error(`Quest not found: territory=${territoryId}, questNumber=${questNumber}`)

	// Gating: storyProgress must be >= globalQuestNumber - 1
	// e.g. globalQuestNumber=1 requires storyProgress>=0 (always accessible first quest)
	//      globalQuestNumber=6 requires storyProgress>=5 (all of t1 done)
	const globalQuestNumber = quest.globalQuestNumber ?? (getGlobalQuestIndex(territoryId, questNumber) + 1)
	const storyProgress = player.milestones?.storyProgress ?? 0
	if (globalQuestNumber - 1 > storyProgress) throw new Error('Quest not yet unlocked')

	if (player.energy < quest.energyCost) throw new Error('Not enough energy')

	const active = await missionRepo.findActiveByOwner(player._id)
	if (active) throw new Error('Already on a mission')

	player.energy -= quest.energyCost
	await player.save()

	const mission = await missionRepo.create({
		owner: player._id,
		type: 'story',
		sourceName: quest.title,
		duration: quest.duration,
		territoryId,
		questNumber,
	})

	player.activeMission = mission._id as Types.ObjectId
	await player.save()

	await logHistorySafe({
		playerId: player._id,
		source: 'mission',
		eventType: 'mission',
		eventKey: 'mission.started',
		status: 'started',
		metadata: {
			action: 'start',
			type: 'story',
			missionId: mission._id.toString(),
			territoryId,
			territoryName: territory.name,
			questNumber,
			questTitle: quest.title,
			duration: quest.duration,
			energyCost: quest.energyCost,
			sourceName: quest.title,
		},
		target: {
			entityType: 'mission',
			entityId: mission._id.toString(),
			label: quest.title,
		},
		tags: ['mission', 'story'],
	})

	return { mission, energy: player.energy }
}

async function _startBossRaid(player: IPlayerDocument, bossId: string): Promise<MissionResult> {
	const boss = BOSSES_BY_ID[bossId]
	if (!boss) throw new Error('Boss not found')

	// Use boss.tier (or fallback to difficulty if available) to calculate required level
	// Required level formula: tier * 15 - 14 (e.g., tier 1 = level 1, tier 2 = level 16)
	const bossLevel = boss.tier ?? (boss as any).difficulty ?? 1
	const requiredLevel = bossLevel * 15 - 14
	if (player.level < requiredLevel) throw new Error('Boss locked - level too low')

	// Use boss-specific energy cost (tier-scaled: T1=20, T2=27, T3=35, T4=42, T5=50)
	const bossEnergyCost = boss.energyCost ?? BOSS_RAID_ENERGY
	if (player.energy < bossEnergyCost) throw new Error('Not enough energy')

	const active = await missionRepo.findActiveByOwner(player._id)
	if (active) throw new Error('Already on a mission')

	player.energy -= bossEnergyCost
	await player.save()

	const mission = await missionRepo.create({
		owner: player._id,
		type: 'boss',
		sourceName: boss.name,
		duration: BOSS_RAID_DURATION,
		bossId,
	})

	player.activeMission = mission._id as Types.ObjectId
	await player.save()

	await logHistorySafe({
		playerId: player._id,
		source: 'mission',
		eventType: 'mission',
		eventKey: 'mission.started',
		status: 'started',
		metadata: {
			action: 'start',
			type: 'boss',
			missionId: mission._id.toString(),
			bossId,
			bossName: boss.name,
			duration: BOSS_RAID_DURATION,
			energyCost: bossEnergyCost,
			sourceName: boss.name,
		},
		target: {
			entityType: 'mission',
			entityId: mission._id.toString(),
			label: boss.name,
		},
		tags: ['mission', 'boss'],
	})

	return { mission, energy: player.energy }
}

export async function completeMission(
  playerId: string | Types.ObjectId,
  missionId: string | Types.ObjectId,
  ): Promise<
  DungeonCompletionResult | StoryCompletionResult | BossCompletionResult | TrainingCompletionResult | { cleared: true }
  > {
  const player = await getPlayerOrThrow(playerId)
  const mission = await missionRepo.findById(missionId)
  
  // If mission not found or already completed, clear activeMission and return success (no rewards)
  if (!mission || mission.completedAt) {
  // Clear the activeMission reference if it matches this mission
  if (player.activeMission?.toString() === missionId.toString()) {
  player.activeMission = null
  await player.save()
  }
  // Return a cleared response instead of throwing - no rewards given
  return { cleared: true }
  }
  if (mission.owner.toString() !== player._id.toString()) throw new Error('Not your mission')

	const elapsed = Date.now() - mission.startTime.getTime()
	if (elapsed < mission.duration * 1000) throw new Error('Mission not yet complete')

	switch (mission.type) {
		case 'dungeon':
			return completeDungeonMission(playerId, mission)
		case 'story':
			return completeStoryQuest(playerId, mission)
		case 'boss':
			return completeBossMission(playerId, mission)
		case 'training':
			return completeTraining(playerId, mission._id)
		default:
			throw new Error(`Unknown mission type: ${mission.type}`)
	}
}

export async function completeDungeonMission(
	playerId: string | Types.ObjectId,
	mission: IMissionDocument,
): Promise<DungeonCompletionResult> {
	const player = await getPlayerOrThrow(playerId)
	const dungeon = DUNGEONS_BY_ID[mission.dungeonId!]
	const missionType = MISSION_TYPES[mission.missionTypeId!]

	const cardBoosts = await getRawCardBoostsById(playerId)
	
	// Get guild bonuses (xpBonus, materialBonus, etc.)
	const guildBonuses = await guildService.getPlayerGuildBonuses(playerId.toString())

	// Daily repeat tracking — resets each calendar day (Manila time, UTC+8)
	const now = new Date()
	const todayManila = getManilaDateString(now)
	if (!player.dailyDungeonStats) player.dailyDungeonStats = { runs: new Map(), lastReset: now }
	const lastReset = player.dailyDungeonStats.lastReset
	const lastResetManila = lastReset ? getManilaDateString(lastReset) : null
	if (lastResetManila !== todayManila) {
		player.dailyDungeonStats.lastReset = now
		player.dailyDungeonStats.runs = new Map()
	}
	const dungeonKey = `${mission.dungeonId}_${mission.missionTypeId}`
	const repeatCount = player.dailyDungeonStats.runs.get(dungeonKey) || 0

	const raidPower = cardBoosts.raidPower
	const baseReward = missionType?.baseTokenReward ?? 50
	const entryFatigue = player.missionStats?.fatigue ?? 0
	// Combine card-derived mastery with stored mastery from training
	const cardMastery = cardBoosts.mastery
	const storedMastery = player.missionStats?.mastery ?? 0
	const effectiveMastery = cardMastery + storedMastery
	const energyCost = missionType?.energyCost ?? 15
	const rawTokens = calculateDungeonReward(baseReward, raidPower, repeatCount, entryFatigue, effectiveMastery, energyCost)

	// Fixed rate: 1 material per 5-min interval from the dungeon's zone pool
	// Apply both card boost and guild material bonus
	const materialPool = dungeon?.materialPool ?? []
	const baseMatCount = missionType?.materialRolls ?? 1
	const matBoostPct = applyBoostCap(cardBoosts.matBoost)
	const guildMatBonus = guildBonuses.materialBonus // Already a decimal (e.g., 0.5 = 50%)
	const materialCount = Math.round(baseMatCount * (1 + matBoostPct / 100) * (1 + guildMatBonus))
	const materials = rollMaterialsFromPool(materialPool, materialCount)

	// Persist materials to the item store
	const materialCounts: Record<string, number> = {}
	for (const matId of materials) materialCounts[matId] = (materialCounts[matId] ?? 0) + 1
	await Promise.all(
		Object.entries(materialCounts).map(([matId, qty]) => itemService.addMaterial(playerId, matId, qty)),
	)

	const potionDrop = rollPotionDrop(cardBoosts.luck)

	// Add potion to player inventory if dropped
	if (potionDrop) {
		await itemService.addPotion(playerId, potionDrop, 1)
	}

	if (!player.missionStats) player.missionStats = { fatigue: 0, mastery: 0, isExpBoostActive: false }
	const tokens = rawTokens

	player.missionStats.fatigue = (player.missionStats.fatigue || 0) + (missionType?.fatiguePerMission || 0)
	player.dailyDungeonStats.runs.set(dungeonKey, repeatCount + 1)

	mission.completedAt = new Date()
	await mission.save()

	clearActiveMission(player, mission._id as Types.ObjectId)
	if (!player.milestones) player.milestones = {} as typeof player.milestones
	player.milestones!.totalMissionsCompleted = (player.milestones!.totalMissionsCompleted || 0) + 1

	// Per-dungeon-per-mission lifetime counter (sparse Map — only stores keys that have been run)
	if (!player.milestones!.missionCompletions) {
		player.milestones!.missionCompletions = new Map<string, number>()
	}
	const completionKey = `${mission.dungeonId}_${mission.missionTypeId}`
	const lifetimeRuns = player.milestones!.missionCompletions.get(completionKey) ?? 0
	player.milestones!.missionCompletions.set(completionKey, lifetimeRuns + 1)

	// Track total minutes played (mission duration is in seconds)
	const missionMinutes = Math.floor(mission.duration / 60)
	player.milestones!.totalMinutesPlayed = (player.milestones!.totalMinutesPlayed || 0) + missionMinutes

	player.coins = (player.coins || 0) + tokens

	const baseXp = missionMinutes
	const xpBoostPct = applyBoostCap(cardBoosts.expBoost)
	const guildXpBonus = guildBonuses.xpBonus // Already a decimal (e.g., 0.5 = 50%)
	// Apply EXP potion 2x multiplier if active
	const expPotionMultiplier = player.missionStats?.isExpBoostActive ? 2 : 1
	const xp = Math.round(baseXp * (1 + xpBoostPct / 100) * (1 + guildXpBonus) * expPotionMultiplier)
	
	// Consume EXP potion boost after use
	if (player.missionStats?.isExpBoostActive) {
		player.missionStats.isExpBoostActive = false
	}
	
	// Mark milestones as modified to ensure Mongoose saves nested changes (e.g., storyProgress)
	player.markModified('milestones')
	
	await playerService.addXp(playerId, xp, player)

	await logHistorySafe({
		playerId: player._id,
		source: 'mission',
		eventType: 'mission',
		eventKey: 'mission.completed',
		metadata: {
			action: 'complete',
			type: 'dungeon',
			missionId: mission._id.toString(),
			dungeonId: mission.dungeonId,
			missionTypeId: mission.missionTypeId,
			tokens,
			materials,
			potionDrop,
			xp,
			sourceName: mission.sourceName,
		},
		target: {
			entityType: 'mission',
			entityId: mission._id.toString(),
			label: mission.sourceName || mission.dungeonId || 'Unknown',
		},
		tags: ['mission', 'dungeon'],
	})

	return { tokens, materials, potionDrop, xp }
}

export async function completeStoryQuest(
	playerId: string | Types.ObjectId,
	mission: IMissionDocument,
): Promise<StoryCompletionResult> {
	const player = await getPlayerOrThrow(playerId)
	const cardBoosts = await getRawCardBoostsById(playerId)
	const guildBonuses = await guildService.getPlayerGuildBonuses(playerId.toString())
	const matBoostPct = applyBoostCap(cardBoosts.matBoost)
	const guildMatBonus = guildBonuses.materialBonus
	const territory = TERRITORIES_BY_ID[mission.territoryId!]
	const quest = territory?.quests.find((q) => q.questNumber === mission.questNumber)

	const globalIdx = getGlobalQuestIndex(mission.territoryId!, mission.questNumber!)
	const storyProgress = player.milestones?.storyProgress ?? 0

	// Determine if this is first completion (active/current story quest)
	const isFirstCompletion = globalIdx === storyProgress

	let cardDropped = false
	let rewardCard: { cardId: string; rarity: string; type: string } | null = null
	let materialDropCount = 0
	let chestItem: StoryCompletionResult['chestItem'] | undefined = undefined
	let progressAdvanced = false

	// ═════════════════════════════════════════════════════════════════════════
	// First-time completion: 15% card drop (blocking gate)
	// ═════════════════════════════════════════════════════════════════════════
		if (isFirstCompletion) {
			const cardDropRate = 15 // 15% chance on first completion
			cardDropped = Math.random() < cardDropRate / 100

// Quest uses 'reward' property with { id, name, rarity }
			const questReward = (quest as any)?.reward
			if (cardDropped && questReward?.id) {
				// Get the full card data from CARDS_BY_ID to include type
				const cardData = CARDS_BY_ID[questReward.id]
				const cardType = cardData?.type || 'hero'

				const cardResult = await addCardWithDetails(playerId, { id: questReward.id, rarity: questReward.rarity || 'special', type: cardType }, 'story')
				rewardCard = { 
					cardId: questReward.id, 
					rarity: questReward.rarity || 'special', 
					type: cardType,
					previousCount: cardResult.previousCount,
					currentCount: cardResult.currentCount,
					isNew: cardResult.isNew,
				}
				if (!player.milestones) player.milestones = {} as typeof player.milestones
				player.milestones!.totalCardsCollected = (player.milestones!.totalCardsCollected || 0) + 1
				progressAdvanced = true // Only advance if card is obtained
			} else {
			// Card not obtained - player cannot proceed, must retry
			// NO CHEST awarded on first completion
			progressAdvanced = false
		}
	} else {
		// ════════════���════════════════════════════════════════════════════════════
		// Replay/previous quest: card OR materials based on territory's dropRate
		// ═══════════════════════════�����═════════════════════════════════════════════
		const dropRate = getTerritoryDropRate(mission.territoryId!)
		const materialPool = getTerritoryMaterialPool(mission.territoryId!)
		const cardRoll = Math.random() < dropRate.card / 100

		if (cardRoll && materialPool.length > 0) {
			// Card drop: Get random card from territory's completed story cards
			// Card IDs use format: story_special_1, story_special_2, etc.
			const TERRITORY_CARD_RANGES: Record<string, [number, number]> = {
				t1: [1, 5], // Evershade: story_special_1 to story_special_5
				t2: [6, 10], // Sunspire Citadel: story_special_6 to story_special_10
				t3: [11, 15], // Frosthold: story_special_11 to story_special_15
				t4: [16, 20], // Ember City: story_special_16 to story_special_20
				t5: [21, 25], // Iron Citadel: story_special_21 to story_special_25
			}

			const [minCard, maxCard] = TERRITORY_CARD_RANGES[mission.territoryId!] || [1, 5]

			// Build card pool based on:
			// 1. The territory's story card range
			// 2. Only cards from stories the player has completed (storyProgress milestone)
			// storyProgress = N means player has completed quests 1 through N
			// e.g., storyProgress = 1 means quest 1 completed, can get story_special_1
			const territoryCardPool: string[] = []

			// highestCompletedStory equals storyProgress (not +1)
			// storyProgress = 1 means quest 1 completed -> can get story_special_1
			const highestCompletedStory = storyProgress

			// Add only cards from this territory that the player has completed
			for (let i = minCard; i <= maxCard && i <= highestCompletedStory; i++) {
				territoryCardPool.push(`story_special_${i}`)
			}

if (territoryCardPool.length > 0) {
					const randomCardId = territoryCardPool[Math.floor(Math.random() * territoryCardPool.length)]
					const selectedCard = CARDS_BY_ID[randomCardId]

					if (selectedCard) {
						const cardResult = await addCardWithDetails(
							playerId,
							{ id: randomCardId, rarity: selectedCard.rarity, type: selectedCard.type },
							'story',
						)
						rewardCard = { 
							cardId: randomCardId, 
							rarity: selectedCard.rarity, 
							type: selectedCard.type,
							previousCount: cardResult.previousCount,
							currentCount: cardResult.currentCount,
							isNew: cardResult.isNew,
						}
						cardDropped = true
					}
				}
		} else if (materialPool.length > 0) {
			// Material drop: 1 material per 5-minute interval of mission duration
			// Apply both card boost and guild material bonus
			const intervals = Math.floor(mission.duration / 300) // 5 minutes = 300 seconds
			const baseDropCount = intervals * 1 // 1 material per 5-minute interval
			const materialCount = Math.round(baseDropCount * (1 + matBoostPct / 100) * (1 + guildMatBonus))
			materialDropCount = materialCount
			const materials = rollMaterialsFromPool(materialPool, materialCount)

			// Persist materials
			const materialCounts: Record<string, number> = {}
			for (const matId of materials) materialCounts[matId] = (materialCounts[matId] ?? 0) + 1
			await Promise.all(
				Object.entries(materialCounts).map(([matId, qty]) => itemService.addMaterial(playerId, matId, qty)),
			)
		}
	}

	mission.completedAt = new Date()
	await mission.save()

	clearActiveMission(player, mission._id as Types.ObjectId)
	if (!player.milestones) player.milestones = {} as typeof player.milestones

	if (progressAdvanced) {
		player.milestones!.storyProgress = storyProgress + 1
	}

	player.milestones!.totalMissionsCompleted = (player.milestones!.totalMissionsCompleted || 0) + 1

	// Track total minutes played (mission duration is in seconds)
	const missionMinutes = Math.floor(mission.duration / 60)
	player.milestones!.totalMinutesPlayed = (player.milestones!.totalMinutesPlayed || 0) + missionMinutes

	const xpBoostPct = applyBoostCap(cardBoosts.expBoost)
	const guildXpBonus = guildBonuses.xpBonus
	// Apply EXP potion 2x multiplier if active
	const expPotionMultiplier = player.missionStats?.isExpBoostActive ? 2 : 1
	const xp = Math.round(STORY_QUEST_XP * (1 + xpBoostPct / 100) * (1 + guildXpBonus) * expPotionMultiplier)
	
	// Consume EXP potion boost after use
	if (player.missionStats?.isExpBoostActive) {
		player.missionStats.isExpBoostActive = false
	}
	
	// Mark milestones as modified to ensure Mongoose saves nested changes (e.g., storyProgress)
	player.markModified('milestones')
	
	await playerService.addXp(playerId, xp, player)

	await logHistorySafe({
		playerId: player._id,
		source: 'mission',
		eventType: 'mission',
		eventKey: 'mission.completed',
		metadata: {
			action: 'complete',
			type: 'story',
			missionId: mission._id.toString(),
			territoryId: mission.territoryId,
			questNumber: mission.questNumber,
			isFirstCompletion,
			cardDropped,
			rewardCard,
			materialDropCount,
			progressAdvanced,
			chestItem,
			storyProgress: player.milestones!.storyProgress,
			xp,
			sourceName: mission.sourceName,
		},
		target: {
			entityType: 'mission',
			entityId: mission._id.toString(),
			label: mission.sourceName || `${mission.territoryId}#${mission.questNumber}`,
		},
		tags: ['mission', 'story'],
	})

	return {
		xp,
		cardDropped,
		rewardCard,
		progressAdvanced,
		storyProgress: player.milestones!.storyProgress ?? 0,
		territoryId: mission.territoryId!,
		questNumber: mission.questNumber!,
		isFirstCompletion,
		chestItem,
	}
}

export async function completeBossMission(
	playerId: string | Types.ObjectId,
	mission: IMissionDocument,
): Promise<BossCompletionResult> {
	const player = await getPlayerOrThrow(playerId)
	const boss = BOSSES_BY_ID[mission.bossId!]
	if (!boss) throw new Error('Boss not found')

	const cardBoosts = await getRawCardBoostsById(playerId)
	const guildBonuses = await guildService.getPlayerGuildBonuses(playerId.toString())
	const matBoostPct = applyBoostCap(cardBoosts.matBoost)
	const raidPower = cardBoosts.raidPower ?? 0
	const baseDamage = Math.floor(raidPower * (0.8 + Math.random() * 0.4))
	const damage = Math.max(1, baseDamage)

	// ════════════════════════════════════════════��══════════════════════════════
	// Boss raid drops: 2 materials per 5 minutes (12 total in 30 minutes)
	// Each material rolls for component (75%) or catalyst (25%)
	// ═════════════════════════════════���═════════════════════════════════════════
	let totalComponentDrops = 0
	let totalCatalystDrops = 0
	const materialDrops: string[] = []
	const catalystDrops: Array<{ id: string; rarity: string }> = []

	// Calculate material count: 2 materials per 5 minutes
	// BOSS_RAID_DURATION is 1800 seconds (30 minutes) = 12 materials
	const materialsPerFiveMinutes = 2
	const fiveMinutesInSeconds = 300
	const baseMaterialCount = Math.floor((mission.duration / fiveMinutesInSeconds) * materialsPerFiveMinutes)
	const materialCount = Math.round(baseMaterialCount * (1 + matBoostPct / 100))

	// Roll for each material: component or catalyst
	for (let i = 0; i < materialCount; i++) {
		const dropRoll = Math.random()
		const componentChance = boss.dropRate.component / 100 // e.g., 0.75 for 75%

		if (dropRoll < componentChance) {
			// Component drop: random from boss's component pool
			const componentDrop = getBossComponentDrop(mission.bossId!)
			if (componentDrop) {
				materialDrops.push(componentDrop)
				totalComponentDrops++
				await itemService.addMaterial(playerId, componentDrop, 1)
			}
		} else {
			// Catalyst drop: weighted rarity selection
			const catalystDrop = getBossCatalystDrop(mission.bossId!)
			if (catalystDrop) {
				catalystDrops.push(catalystDrop)
				totalCatalystDrops++
				await itemService.addMaterial(playerId, catalystDrop.id, 1)
			}
		}
	}

	mission.completedAt = new Date()
	await mission.save()

	clearActiveMission(player, mission._id as Types.ObjectId)
	if (!player.milestones) player.milestones = {} as typeof player.milestones
	player.milestones!.totalBossDamage = (player.milestones!.totalBossDamage || 0) + damage
	player.milestones!.totalMissionsCompleted = (player.milestones!.totalMissionsCompleted || 0) + 1

	// Track total minutes played (mission duration is in seconds)
	const missionMinutes = Math.floor(mission.duration / 60)
	player.milestones!.totalMinutesPlayed = (player.milestones!.totalMinutesPlayed || 0) + missionMinutes

	const xpBoostPct = applyBoostCap(cardBoosts.expBoost)
	const guildXpBonus = guildBonuses.xpBonus
	// Apply EXP potion 2x multiplier if active
	const expPotionMultiplier = player.missionStats?.isExpBoostActive ? 2 : 1
	const xp = Math.round(BOSS_RAID_XP * (1 + xpBoostPct / 100) * (1 + guildXpBonus) * expPotionMultiplier)
	
	// Consume EXP potion boost after use
	if (player.missionStats?.isExpBoostActive) {
		player.missionStats.isExpBoostActive = false
	}
	
	// Mark milestones as modified to ensure Mongoose saves nested changes
	player.markModified('milestones')
	
	await playerService.addXp(playerId, xp, player)

	await leaderboardService.recordDamageForWeek(player._id, damage, mission.bossId!)

	await logHistorySafe({
		playerId: player._id,
		source: 'mission',
		eventType: 'mission',
		eventKey: 'mission.completed',
		metadata: {
			action: 'complete',
			type: 'boss',
			missionId: mission._id.toString(),
			bossId: mission.bossId,
			damage,
			componentDrops: totalComponentDrops,
			catalystDrops: totalCatalystDrops,
			totalMaterialDrops: materialCount,
			xp,
			sourceName: mission.sourceName,
		},
		target: {
			entityType: 'mission',
			entityId: mission._id.toString(),
			label: mission.sourceName || mission.bossId || 'Unknown',
		},
		tags: ['mission', 'boss'],
	})

	return { damage, materialDrops, componentDrop: null, catalystDrop: null, bossDefeated: false, xp }
}

export async function attackBoss(
	playerId: string | Types.ObjectId,
	bossId: string,
	raidPower: number,
): Promise<BossCompletionResult> {
	const player = await getPlayerOrThrow(playerId)
	const boss = BOSSES_BY_ID[bossId]
	if (!boss) throw new Error('Boss not found')

	const cardBoosts = await getRawCardBoostsById(playerId)
	const guildBonuses = await guildService.getPlayerGuildBonuses(playerId.toString())
	
	// Apply tier-based damage multiplier for leaderboard incentive
	// Higher tier bosses = more leaderboard damage (T1=1.0x, T5=2.0x)
	const tierMultiplier = boss.damageMultiplier ?? 1.0
	const baseDamage = Math.floor(raidPower * (0.8 + Math.random() * 0.4) * tierMultiplier)
	const damage = Math.max(1, baseDamage)

	// ════════════════════════════════���════════════════════════════════════════��═
	// Boss raid drops: Roll materials for component (75%) or catalyst (25%)
	// For attackBoss, generate a single material roll (consistent with single attack)
	// ═══════════════════════════════════════════════════════════════════════════
	let totalComponentDrops = 0
	let totalCatalystDrops = 0
	const materialDrops: string[] = []
	const catalystDrops: Array<{ id: string; rarity: string }> = []

	// Roll for one material per attack: component or catalyst
	const dropRoll = Math.random()
	const componentChance = boss.dropRate.component / 100 // e.g., 0.75 for 75%

	if (dropRoll < componentChance) {
		// Component drop: random from boss's component pool
		const componentDrop = getBossComponentDrop(bossId)
		if (componentDrop) {
			materialDrops.push(componentDrop)
			totalComponentDrops++
			await itemService.addMaterial(playerId, componentDrop, 1)
		}
	} else {
		// Catalyst drop: weighted rarity selection
		const catalystDrop = getBossCatalystDrop(bossId)
		if (catalystDrop) {
			catalystDrops.push(catalystDrop)
			totalCatalystDrops++
			await itemService.addMaterial(playerId, catalystDrop.id, 1)
		}
	}

	if (!player.milestones) player.milestones = {} as typeof player.milestones
	player.milestones!.totalBossDamage = (player.milestones!.totalBossDamage || 0) + damage

	const xpBoostPct = applyBoostCap(cardBoosts.expBoost)
	const guildXpBonus = guildBonuses.xpBonus
	// Apply EXP potion 2x multiplier if active
	const expPotionMultiplier = player.missionStats?.isExpBoostActive ? 2 : 1
	const bossXp = Math.round(BOSS_RAID_XP * (1 + xpBoostPct / 100) * (1 + guildXpBonus) * expPotionMultiplier)
	
	// Consume EXP potion boost after use
	if (player.missionStats?.isExpBoostActive) {
		player.missionStats.isExpBoostActive = false
	}
	await playerService.addXp(playerId, bossXp, player)
	await leaderboardService.recordDamageForWeek(player._id, damage, bossId)

	await logHistorySafe({
		playerId: player._id,
		source: 'mission',
		eventType: 'mission',
		eventKey: 'mission.boss_attack',
		metadata: {
			action: 'attack',
			type: 'boss',
			bossId,
			bossName: boss.name,
			damage,
			componentDrops: totalComponentDrops,
			catalystDrops: totalCatalystDrops,
			xp: bossXp,
			sourceName: boss.name,
		},
		target: {
			entityType: 'boss',
			entityId: bossId,
			label: boss.name,
		},
		tags: ['mission', 'boss'],
	})

	return { damage, materialDrops, componentDrop: null, catalystDrop: null, bossDefeated: false, xp: bossXp }
}

// ════════════════════════════════════��══════════════════════════════════════════
// Training Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate mastery gained from training based on total luck
 * Formula: floor(50 + totalLuck / 100)
 */
export function calculateMasteryReward(totalLuck: number): number {
	return Math.floor(50 + totalLuck / 100)
}

/**
 * Start a training session
 * Uses the same activeMission field as regular missions
 */
export async function startTraining(
	playerId: string | Types.ObjectId,
	trainingType: TrainingType
): Promise<TrainingResult> {
	const player = await getPlayerOrThrow(playerId)

	// Validate training type
	if (!['weapons', 'mount', 'merchant'].includes(trainingType)) {
		throw new Error('Invalid training type')
	}

	// Check for active mission (training shares the same slot)
	const active = await missionRepo.findActiveByOwner(player._id)
	if (active) throw new Error('Already on a mission or training')

	// Check energy
	if (player.energy < TRAINING_ENERGY_COST) {
		throw new Error('Not enough energy')
	}

	// Calculate expected mastery reward based on current cards
	const cardType = TRAINING_CARD_TYPE_MAP[trainingType]
	const dbCards = await Card.find({ owner: player._id, type: cardType }).lean()
	
	let totalLuck = 0
	for (const card of dbCards) {
		const cardDef = CARDS_BY_ID[card.cardId] ?? {}
		const qty = card.quantity ?? 1
		const luck = cardDef.stats?.luck ?? 0
		totalLuck += luck * qty
	}
	
	const masteryReward = calculateMasteryReward(totalLuck)

	// Deduct energy
	player.energy -= TRAINING_ENERGY_COST
	await player.save()

	// Create training mission document
	const mission = await missionRepo.create({
		owner: player._id,
		type: 'training',
		sourceName: TRAINING_LABELS[trainingType],
		duration: TRAINING_DURATION * 60, // Convert to seconds for consistency with other missions
	})

	// Set active mission
	player.activeMission = mission._id as Types.ObjectId
	await player.save()

	const completesAt = new Date(mission.startTime.getTime() + TRAINING_DURATION * 60 * 1000)

	await logHistorySafe({
		playerId: player._id,
		source: 'training',
		eventType: 'training',
		eventKey: 'training.started',
		status: 'started',
		metadata: {
			action: 'start',
			type: 'training',
			trainingType,
			missionId: mission._id.toString(),
			totalLuck,
			masteryReward,
			duration: TRAINING_DURATION,
			energyCost: TRAINING_ENERGY_COST,
			sourceName: TRAINING_LABELS[trainingType],
		},
		target: {
			entityType: 'training',
			entityId: mission._id.toString(),
			label: TRAINING_LABELS[trainingType],
		},
		tags: ['training', trainingType],
	})

	return {
		mission,
		energy: player.energy,
		totalLuck,
		masteryReward,
		completesAt,
	}
}

/**
 * Complete a training session
 * Re-calculates mastery reward based on current cards (consistent with mission logic)
 */
export async function completeTraining(
	playerId: string | Types.ObjectId,
	missionId: string | Types.ObjectId
): Promise<TrainingCompletionResult> {
	const player = await getPlayerOrThrow(playerId)
	const mission = await missionRepo.findById(missionId)

	if (!mission || mission.completedAt) {
		throw new Error('Training not found or already completed')
	}

	if (mission.owner.toString() !== player._id.toString()) {
		throw new Error('Not your training session')
	}

	if (mission.type !== 'training') {
		throw new Error('This is not a training session')
	}

	// Check if training is complete
	const elapsed = Date.now() - mission.startTime.getTime()
	if (elapsed < mission.duration * 1000) {
		throw new Error('Training not yet complete')
	}

	// Determine training type from sourceName
	let trainingType: TrainingType = 'weapons'
	if (mission.sourceName?.includes('Mount')) {
		trainingType = 'mount'
	} else if (mission.sourceName?.includes('Merchant')) {
		trainingType = 'merchant'
	}

	// Re-calculate mastery reward based on current card luck
	const cardType = TRAINING_CARD_TYPE_MAP[trainingType]
	const dbCards = await Card.find({ owner: player._id, type: cardType }).lean()
	
	let totalLuck = 0
	for (const card of dbCards) {
		const cardDef = CARDS_BY_ID[card.cardId] ?? {}
		const qty = card.quantity ?? 1
		const luck = cardDef.stats?.luck ?? 0
		totalLuck += luck * qty
	}
	
	const masteryGained = calculateMasteryReward(totalLuck)

	// Mark mission complete
	mission.completedAt = new Date()
	await mission.save()

	// Initialize missionStats if needed
	if (!player.missionStats) {
		player.missionStats = { fatigue: 0, mastery: 0, isExpBoostActive: false }
	}

	// Add mastery
	player.missionStats.mastery = (player.missionStats.mastery ?? 0) + masteryGained
	const newStoredMastery = player.missionStats.mastery

	// Calculate and add exp: 2 exp per 1 minute of training (120 exp per hour)
	const expGained = Math.floor(mission.duration / 60) * 2 // duration is in seconds
	player.exp = (player.exp ?? 0) + expGained

	// Update milestones
	if (!player.milestones) {
		player.milestones = {} as typeof player.milestones
	}
	player.milestones!.totalTrainingSessions = (player.milestones!.totalTrainingSessions ?? 0) + 1

	// Track minutes played
	const trainingMinutes = Math.floor(mission.duration / 60)
	player.milestones!.totalMinutesPlayed = (player.milestones!.totalMinutesPlayed ?? 0) + trainingMinutes

	// Clear active mission
	if (player.activeMission && player.activeMission.toString() === mission._id.toString()) {
		player.activeMission = null
	}

	// Mark milestones as modified to ensure Mongoose saves nested changes
	player.markModified('milestones')
	
	await player.save()

	await logHistorySafe({
		playerId: player._id,
		source: 'training',
		eventType: 'training',
		eventKey: 'training.completed',
		status: 'completed',
		metadata: {
			action: 'complete',
			type: 'training',
			trainingType,
			missionId: mission._id.toString(),
			totalLuck,
			masteryGained,
			newStoredMastery,
			expGained,
			sourceName: mission.sourceName,
		},
		target: {
			entityType: 'training',
			entityId: mission._id.toString(),
			label: mission.sourceName || 'Training',
		},
		tags: ['training', trainingType],
	})

	return {
		masteryGained,
		newStoredMastery,
		expGained,
	}
}
