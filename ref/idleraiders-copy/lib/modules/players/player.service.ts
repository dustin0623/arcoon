import type { Types } from 'mongoose'
import Player, { type IPlayerDocument } from './player.model'
import * as playerRepo from './player.repository'
import * as itemRepo from '../items/item.repository'
import * as historyService from '../histories/history.service'
import { getRawCardBoostsById, applyBoostCap } from './player.builder'
import { getXPForLevel } from './player.logic'
import * as guildService from '../guilds/guild.service'
import GAME_DATA from '@/public/data'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface LoginResult {
	player: IPlayerDocument
	isNew: boolean
}

interface EnergyResult {
	energy: number
	maxEnergy: number
	regeneratedEnergy: number
	lastCycleUpdate: Date
}

interface CollectResult {
	collected: number
	materialId: string
	totalMaterials: number
}

interface ReferralInfo {
	username: string
	isRegistered: boolean
}

interface GameTerritory {
	id: string
	name?: string
	materialId?: string
	levels?: Record<number, { maintenanceCost?: number; materialsPerHour?: number; upgradeCost?: number }>
}

interface SystemConfig {
	ENERGY?: { MAX: number; REGEN_INTERVAL: number; PER_TICK: number }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const SYSTEM = (GAME_DATA as { SYSTEM?: SystemConfig }).SYSTEM ?? {}
const ENERGY_CONFIG = SYSTEM.ENERGY ?? { MAX: 100, REGEN_INTERVAL: 900, PER_TICK: 5 }
// Convert seconds to milliseconds for the interval
const ENERGY = {
	MAX: ENERGY_CONFIG.MAX,
	REGEN_RATE: ENERGY_CONFIG.PER_TICK,
	CYCLE_INTERVAL_MS: ENERGY_CONFIG.REGEN_INTERVAL * 1000, // 900 seconds = 900000ms = 15 minutes
}
const MAX_LEVEL = 150

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

async function getPlayerOrThrow(playerId: string | Types.ObjectId): Promise<IPlayerDocument> {
	const player = await playerRepo.findById(playerId)
	if (!player) throw new Error('Player not found')
	return player
}

async function logHistorySafe(payload: Parameters<typeof historyService.logEvent>[0]): Promise<void> {
	try {
		await historyService.logEvent(payload)
	} catch (error) {
		console.warn('[idleraiders-logs] history log skipped:', (error as Error).message)
	}
}

/**
 * Roll a random material based on drop rates
 * Uses weighted random selection from the drop rate table
 */
function rollMaterial(dropRates: Record<string, number>): string {
	const roll = Math.random()
	let cumulative = 0
	for (const [materialId, rate] of Object.entries(dropRates)) {
		cumulative += rate
		if (roll <= cumulative) return materialId
	}
	// Fallback to first material if rates don't sum to 1
	return Object.keys(dropRates)[0]
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

export async function loginPlayer(username: string, signature: string, referral: string = ''): Promise<LoginResult> {
	// TODO: verify signature with Hive keychain
	console.log('[idleraiders-logs] loginPlayer signature:', signature?.slice(0, 20))

	let player = await playerRepo.findByUsername(username)
	let isNew = false

	if (!player) {
		player = await playerRepo.create({
			username,
			referredBy: referral || 'idleraiders',
		})
		isNew = true

		await logHistorySafe({
			playerId: player._id,
			source: 'auth',
			eventType: 'login',
			eventKey: 'auth.login',
			metadata: { isNew, referral },
		})
	}

	return { player, isNew }
}

export async function registerPlayer(
	playerId: string | Types.ObjectId,
	registrationData: Record<string, unknown> = {},
): Promise<IPlayerDocument> {
	const player = await getPlayerOrThrow(playerId)

	if (player.isRegistered) {
		throw new Error('Player already registered')
	}

	player.isRegistered = true
	await player.save()

	await logHistorySafe({
		playerId: player._id,
		source: 'auth',
		eventType: 'registration',
		eventKey: 'auth.registration',
		metadata: registrationData,
	})

	// Send Discord notification (async, non-blocking)
	import('@/lib/config/discord').then(({ notifyRegistration }) => {
		notifyRegistration({
			playerName: player.username,
			playerId: player._id.toString(),
		}).catch(() => {})
	}).catch(() => {})

	return player
}

export async function getReferrals(playerId: string | Types.ObjectId): Promise<ReferralInfo[]> {
	const player = await getPlayerOrThrow(playerId)
	const referred = await Player.find({ referredBy: player.username }, 'username isRegistered').lean()
	return referred.map((r) => ({ username: r.username, isRegistered: r.isRegistered }))
}

export async function getPlayerData(username: string): Promise<IPlayerDocument> {
	const player = await Player.findOne({ username }).populate('activeMission').populate('guildId')
	if (!player) throw new Error('Player not found')
	return player
}

export async function addXp(
	playerId: string | Types.ObjectId,
	amount: number,
	playerDoc?: IPlayerDocument | null,
): Promise<{ player: IPlayerDocument; levelsGained: number; xpAdded: number }> {
	const player = playerDoc ?? (await getPlayerOrThrow(playerId))
	let levelsGained = 0

	player.xp = (player.xp ?? 0) + amount

	while (player.level < MAX_LEVEL && player.xp >= getXPForLevel(player.level)) {
		player.xp -= getXPForLevel(player.level)
		player.level += 1
		levelsGained += 1
	}

	await player.save()
	return { player, levelsGained, xpAdded: amount }
}

export async function updateCoins(playerId: string | Types.ObjectId, amount: number): Promise<IPlayerDocument> {
	const player = await getPlayerOrThrow(playerId)
	player.coins = Math.max(0, (player.coins ?? 0) + amount)
	await player.save()
	return player
}

export async function updateShards(playerId: string | Types.ObjectId, amount: number): Promise<IPlayerDocument> {
	const player = await getPlayerOrThrow(playerId)
	player.shards = Math.max(0, (player.shards ?? 0) + amount)
	await player.save()
	return player
}

export async function upgradeStorageSlots(playerId: string | Types.ObjectId): Promise<IPlayerDocument> {
	const STORAGE_UPGRADE_COST = 1
	const player = await getPlayerOrThrow(playerId)
	if ((player.dollars ?? 0) < STORAGE_UPGRADE_COST) {
		throw new Error('Not enough dollars to upgrade storage')
	}
	player.dollars = (player.dollars ?? 0) - STORAGE_UPGRADE_COST
	player.storageSlots = (player.storageSlots ?? 3) + 1
	await player.save()
	return player
}

export async function getEnergy(playerId: string | Types.ObjectId): Promise<EnergyResult> {
	const player = await getPlayerOrThrow(playerId)
	const now = Date.now()
	const cycleBase = player.lastCycleUpdate?.getTime() ?? now
	const cycleElapsed = now - cycleBase
	const cycleTicks = Math.floor(cycleElapsed / ENERGY.CYCLE_INTERVAL_MS)

	let dirty = false
	let regeneratedEnergy = 0

	// Check if at least one cycle tick has passed
	if (cycleTicks > 0) {
	// Regenerate energy if not at max, applying energy boost from cards + guild bonus
	if (player.energy < ENERGY.MAX) {
		// Get energy boost from booster cards
		const cardBoosts = await getRawCardBoostsById(playerId)
		const energyBoostPct = applyBoostCap(cardBoosts.energyBoost)

		// Get guild energy regen bonus (decimal, e.g., 0.04 = +4%)
		const guildBonuses = await guildService.getPlayerGuildBonuses(playerId.toString())
		const guildEnergyBonus = guildBonuses.energyRegen

		// Apply both card boost and guild bonus.
		// IMPORTANT: compute the total gain across all elapsed ticks BEFORE rounding.
		// Previously we rounded the per-tick rate (e.g. round(5 * 1.04) = 5), which
		// silently ate any guild bonus below +10%. We now let player.energy accumulate
		// as a float — it's floored only for display / mission cost checks, so
		// small bonuses like +4% correctly accumulate across cycles.
		const multiplier = (1 + energyBoostPct / 100) * (1 + guildEnergyBonus)
		const regenRaw = cycleTicks * ENERGY.REGEN_RATE * multiplier
		regeneratedEnergy = Math.min(regenRaw, ENERGY.MAX - player.energy)
		player.energy = Math.min(ENERGY.MAX, player.energy + regeneratedEnergy)
	}

		// Advance lastCycleUpdate by the number of complete cycles
		// This maintains the cycle rhythm (e.g., if 2 cycles passed, advance by 2 * interval)
		player.lastCycleUpdate = new Date(cycleBase + cycleTicks * ENERGY.CYCLE_INTERVAL_MS)
		dirty = true
	}

	if (dirty) {
		await player.save()
	}

	return {
		energy: player.energy,
		maxEnergy: ENERGY.MAX,
		regeneratedEnergy,
		lastCycleUpdate: player.lastCycleUpdate,
	}
}

// Export for external use
export { getPlayerOrThrow }
