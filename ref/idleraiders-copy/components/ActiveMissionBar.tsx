'use client'

import { useCallback, useState } from 'react'
import { useGame } from '@/context/GameContext'
import { useMissionActions } from '@/features/actions'
import MissionTimer from './MissionTimer'
import { toast } from 'sonner'
import { Loader2, Dumbbell } from 'lucide-react'

const missionTypeIcons = {
	dungeon: '⚔️',
	story: '📖',
	boss: '💀',
	training: 'dumbbell',
	war_outpost: '🏰',
	war_stronghold: '⚔️',
}

const ActiveMissionBar = () => {
	const { playerState, apiRequest, fetchPlayerState } = useGame()
	const { completeMission } = useMissionActions()
	const activeMission = playerState?.activeMission as
		| {
				id?: string
				type?: string
				sourceName?: string
				missionLabel?: string
				startTime?: number
				duration?: number
		  }
		| null
		| undefined
	const [completing, setCompleting] = useState(false)
	const hasValidMissionTimer =
		activeMission && Number.isFinite(activeMission.startTime) && Number.isFinite(activeMission.duration)

	const handleMissionComplete = useCallback(async () => {
		if (completing) return
		setCompleting(true)
		try {
			// War missions still have their own endpoint — they touch guild-scoped state
			if (activeMission?.type === 'war_outpost' || activeMission?.type === 'war_stronghold') {
				const result = await apiRequest('/api/guilds/war/complete', {
					method: 'POST',
					body: JSON.stringify({ missionId: activeMission?.id }),
				})
				if (!result.success) {
					throw new Error(result.error || 'Failed to complete war mission')
				}
				const data = result.data as { message?: string; damage?: number }
				toast.success(data?.message || 'War mission completed!')
				await fetchPlayerState()
			} else {
				// Dungeon, story, boss, AND training all go through completeMission now
				await completeMission(activeMission?.id as string)
			}
		} catch (err) {
			const errorMessage = (err as Error)?.message || 'Failed to complete mission'
			toast.error(errorMessage)
		} finally {
			setCompleting(false)
		}
	}, [completing, completeMission, activeMission, apiRequest, fetchPlayerState])

	if (!activeMission || !hasValidMissionTimer) return null

	const iconKey = missionTypeIcons[activeMission.type as keyof typeof missionTypeIcons] || '⚔️'
	const isTraining = activeMission.type === 'training'

	return (
		<div className="mx-3 mt-2 mb-2 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-background/80 backdrop-blur-sm px-3 py-2.5 shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)]">
			<div className="flex min-w-0 items-center gap-2.5">
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base">
					{completing ? (
						<Loader2 size={16} className="animate-spin text-primary" />
					) : isTraining ? (
						<Dumbbell size={16} className="text-rose-400" />
					) : (
						iconKey
					)}
				</div>
				<div className="min-w-0">
					<p className="truncate font-display text-sm font-semibold text-foreground leading-tight">
						{activeMission.sourceName}
					</p>
					<p className="text-[11px] text-muted-foreground">
						{completing ? 'Completing…' : activeMission.missionLabel}
					</p>
				</div>
			</div>
			<MissionTimer
				endTime={(activeMission.startTime as number) + (activeMission.duration as number) * 1000}
				onComplete={handleMissionComplete}
			/>
		</div>
	)
}

export default ActiveMissionBar
