/**
 * Backfill Mission Completions
 *
 * Populates `player.milestones.missionCompletions` for all existing players by aggregating
 * their completed dungeon missions from the Mission collection.
 *
 * The new completion-gate progression system requires per-dungeon-per-mission counters that
 * didn't exist before this patch. Test players still have all of their historical mission
 * docs (`type='dungeon'`, `completedAt: <date>`), so we can rebuild the map from those records.
 *
 * Usage:
 *   pnpm backfill:missions              # dry run, prints summary only
 *   pnpm backfill:missions -- --apply   # actually writes to the database
 *
 * Safe to re-run: existing missionCompletions entries are overwritten with the freshly
 * recomputed counts, so this is idempotent against the Mission collection.
 */

import 'dotenv/config'
import mongoose, { Types } from 'mongoose'
import Mission from '../lib/modules/missions/mission.model'
import Player from '../lib/modules/players/player.model'

const MONGODB_URI = process.env.MONGO_URI || ''
const APPLY = process.argv.includes('--apply')

interface AggregateRow {
	_id: {
		owner: Types.ObjectId
		dungeonId: string
		missionTypeId: string
	}
	count: number
}

async function backfill() {
	console.log('═══════════════════════════════════════════════════════════════')
	console.log('         BACKFILL MISSION COMPLETIONS')
	console.log('═══════════════════════════════════════════════════════════════')
	console.log(`Mode: ${APPLY ? 'APPLY (writes will be committed)' : 'DRY RUN (no writes)'}`)
	console.log(`Timestamp: ${new Date().toISOString()}`)

	if (!MONGODB_URI) {
		console.error('\n❌ MONGO_URI is not set. Aborting.')
		process.exit(1)
	}

	await mongoose.connect(MONGODB_URI)
	console.log('\n[1/4] MongoDB connected')

	// ─────────────────────────────────────────────────────────────────────────
	// Aggregate completed dungeon missions per (player, dungeon, missionType)
	// ─────────────────────────────────────────────────────────────────────────
	console.log('\n[2/4] Aggregating completed dungeon missions...')

	const aggregation: AggregateRow[] = await Mission.aggregate([
		{
			$match: {
				type: 'dungeon',
				completedAt: { $ne: null },
				dungeonId: { $exists: true, $ne: null },
				missionTypeId: { $exists: true, $ne: null },
			},
		},
		{
			$group: {
				_id: {
					owner: '$owner',
					dungeonId: '$dungeonId',
					missionTypeId: '$missionTypeId',
				},
				count: { $sum: 1 },
			},
		},
	])

	console.log(`      Aggregated ${aggregation.length.toLocaleString()} (player × dungeon × mission) rows`)

	// ─────────────────────────────────────────────────────────────────────────
	// Group rows by player and build the per-player completion map
	// ─────────────────────────────────────────────────────────────────────────
	console.log('\n[3/4] Building per-player completion maps...')

	const perPlayer = new Map<string, Record<string, number>>()
	for (const row of aggregation) {
		const ownerKey = row._id.owner.toString()
		const completionKey = `${row._id.dungeonId}_${row._id.missionTypeId}`
		const map = perPlayer.get(ownerKey) ?? {}
		map[completionKey] = (map[completionKey] ?? 0) + row.count
		perPlayer.set(ownerKey, map)
	}

	console.log(`      Built maps for ${perPlayer.size.toLocaleString()} players with completed missions`)

	// Print a small sample so the operator can sanity-check before applying
	const sample = Array.from(perPlayer.entries()).slice(0, 5)
	if (sample.length) {
		console.log('\n      Sample (first 5 players):')
		for (const [ownerId, map] of sample) {
			const totalKeys = Object.keys(map).length
			const totalRuns = Object.values(map).reduce((a, b) => a + b, 0)
			console.log(
				`        ${ownerId} → ${totalKeys} key(s), ${totalRuns} total runs · ${JSON.stringify(map)}`,
			)
		}
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Write the maps back to each player document
	// ─────────────────────────────────────────────────────────────────────────
	console.log('\n[4/4] Writing missionCompletions to player documents...')

	if (!APPLY) {
		console.log('      DRY RUN — no writes performed.')
		console.log(`      Would update ${perPlayer.size.toLocaleString()} player(s).`)
		console.log('      Re-run with `-- --apply` to commit changes.')
	} else {
		let updated = 0
		let unchanged = 0
		const errors: string[] = []

		for (const [ownerId, map] of perPlayer) {
			try {
				const result = await Player.updateOne(
					{ _id: new Types.ObjectId(ownerId) },
					{ $set: { 'milestones.missionCompletions': map } },
				)
				if (result.matchedCount === 0) {
					errors.push(`Player ${ownerId} not found`)
				} else if (result.modifiedCount === 0) {
					unchanged += 1
				} else {
					updated += 1
				}
			} catch (err) {
				errors.push(`Player ${ownerId}: ${(err as Error).message}`)
			}
		}

		console.log(`      Updated:   ${updated.toLocaleString()}`)
		console.log(`      Unchanged: ${unchanged.toLocaleString()} (already in sync)`)
		if (errors.length) {
			console.log(`      Errors:    ${errors.length}`)
			for (const e of errors.slice(0, 10)) console.log(`        - ${e}`)
			if (errors.length > 10) console.log(`        ... and ${errors.length - 10} more`)
		}
	}

	// Players with no completed dungeon missions: ensure the field is at least an empty object
	// so downstream reads never hit an undefined Map. Cheap, only runs in apply mode.
	if (APPLY) {
		const initResult = await Player.updateMany(
			{ 'milestones.missionCompletions': { $exists: false } },
			{ $set: { 'milestones.missionCompletions': {} } },
		)
		console.log(
			`      Initialized empty maps on ${initResult.modifiedCount.toLocaleString()} additional players`,
		)
	}

	console.log('\n═══════════════════════════════════════════════════════════════')
	console.log('         BACKFILL COMPLETE')
	console.log('═══════════════════════════════════════════════════════════════')

	await mongoose.disconnect()
}

backfill().catch((err) => {
	console.error('\n❌ Backfill failed:', err)
	process.exit(1)
})
