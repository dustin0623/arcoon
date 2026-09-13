import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { startMission, startTraining } from '@/lib/modules/missions/mission.service'
import { buildPlayerStateById } from '@/lib/modules/players/player.builder'
import type { TrainingType } from '@/lib/modules/missions/mission.model'

const TRAINING_TYPES: readonly TrainingType[] = ['weapons', 'mount', 'merchant']

export async function POST(request: NextRequest) {
	return withAuth(request, async (playerId) => {
		const body = await request.json()
		const { type, dungeonId, missionTypeId, questNumber } = body as {
			type?: TrainingType
			dungeonId?: string
			missionTypeId?: string
			questNumber?: number
		}

		// Training start: payload is `{ type: TrainingType }`. Uses the same mission
		// slot as dungeon/story/boss, but has its own service entry for luck
		// calculation and energy rules.
		if (type) {
			if (!TRAINING_TYPES.includes(type)) {
				throw new Error('Invalid training type. Must be weapons, mount, or merchant')
			}

			const result = await startTraining(playerId, type)
			const updatedState = await buildPlayerStateById(playerId)

			return {
				trainingId: result.mission._id.toString(),
				type,
				totalLuck: result.totalLuck,
				masteryReward: result.masteryReward,
				completesAt: result.completesAt.toISOString(),
				message: 'Training started!',
				delta: {
					energy: updatedState.energy,
					lastCycleUpdate: updatedState.lastCycleUpdate,
					activeMission: updatedState.activeMission,
					missionStats: updatedState.missionStats,
				},
			}
		}

		// Regular mission start: payload is `{ dungeonId, missionTypeId, questNumber? }`.
		if (!dungeonId || !missionTypeId) {
			throw new Error('Missing dungeonId or missionTypeId')
		}

		const result = await startMission(playerId, dungeonId, missionTypeId, { questNumber })
		const updatedState = await buildPlayerStateById(playerId)

		return {
			...result,
			message: 'Mission started!',
			delta: {
				energy: updatedState.energy,
				lastCycleUpdate: updatedState.lastCycleUpdate,
				activeMission: updatedState.activeMission,
				missionStats: updatedState.missionStats,
			},
		}
	})
}
