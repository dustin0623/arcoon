'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '@/context/GameContext'
import { useMissionActions } from '@/features/actions'
import { ChevronDown, ChevronUp, ChevronRight, Swords, Skull, BookOpen, Clock, Info, Dumbbell } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import ProgressBar from '@/components/ProgressBar'
import { toast } from 'sonner'
import { usePlayer } from '@/hooks/usePlayer'

import { DungeonTab } from '@/components/game/world/DungeonTab'
import { BossTab } from '@/components/game/world/BossTab'
import { StoryTab } from '@/components/game/world/StoryTab'
import TrainingModal from '@/components/modals/Training'

// Calculate time until next 00:00 Asia/Manila (UTC+8)
function getTimeUntilManilaReset(): { hours: number; minutes: number; seconds: number } {
	const now = new Date()
	// Get current time in Manila timezone
	const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))

	// Calculate next midnight in Manila
	const nextMidnight = new Date(manilaTime)
	nextMidnight.setHours(24, 0, 0, 0) // Set to next midnight

	// Calculate difference in milliseconds
	const diffMs = nextMidnight.getTime() - manilaTime.getTime()

	const hours = Math.floor(diffMs / (1000 * 60 * 60))
	const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
	const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

	return { hours, minutes, seconds }
}

function formatCountdown(time: { hours: number; minutes: number; seconds: number }): string {
	const h = String(time.hours).padStart(2, '0')
	const m = String(time.minutes).padStart(2, '0')
	const s = String(time.seconds).padStart(2, '0')
	return `${h}:${m}:${s}`
}

// Helper to get territory image path from name
const getTerritoryImage = (territoryName: string) => {
	const slug = territoryName.toLowerCase().replace(/\s+/g, '_')
	const imagePath = `/assets/territories/${slug}.png`
	return imagePath
}

const tabsConfig = {
	stories: { icon: BookOpen, label: 'Stories' },
	dungeons: { icon: Swords, label: 'Dungeons' },
	bosses: { icon: Skull, label: 'Bosses' },
}

const WorldPage = () => {
	const { playerState, gameData } = useGame()
	const { startMission } = useMissionActions()
	const { milestones } = usePlayer()
	const WORLD_DATA = gameData?.WORLD
	const CARDS_DATA = gameData?.CARDS || []

	/**
	 * Find a reward card by ID from gameData.CARDS
	 */
	const getRewardCard = (cardId: string) => {
		const card = CARDS_DATA.find((c) => c.id === cardId)
		return card || { id: cardId, name: '???', rarity: 'common' }
	}

	const activeMission = playerState?.activeMission
	const energy = playerState?.energy ?? 0
	const player: Record<string, any> = playerState ?? {}
	const boosts = playerState?.boosts ?? { expBoost: 0, matBoost: 0, energyBoost: 0 }
	const storyProgress = milestones.storyProgress
	const [expandedTerritory, setExpandedTerritory] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<Record<string, string>>({})
	const [selectedDungeonMission, setSelectedDungeonMission] = useState<Record<string, any>>({})
	const [selectedQuest, setSelectedQuest] = useState<Record<string, any>>({})
	const [startingMission, setStartingMission] = useState(false)
	const [resetCountdown, setResetCountdown] = useState(getTimeUntilManilaReset())
	const [showTraining, setShowTraining] = useState(false)

	const getTab = (tId: string) => activeTab[tId] || 'stories'
	const setTab = (tId: string, tab: string) => setActiveTab((p) => ({ ...p, [tId]: tab }))

	// Update countdown every second
	useEffect(() => {
		const interval = setInterval(() => {
			setResetCountdown(getTimeUntilManilaReset())
		}, 1000)
		return () => clearInterval(interval)
	}, [])

	const handleStartDungeonMission = async (dungeonId: string, dungeonName: string, missionTypeId: string) => {
		if (activeMission || startingMission) {
			toast.error('A mission is already in progress!')
			return
		}
		setStartingMission(true)
		try {
			await startMission(dungeonId, missionTypeId)
		} catch (err) {
			toast.error((err as Error)?.message || 'Failed to start mission')
		} finally {
			setStartingMission(false)
		}
	}

	const handleStartBoss = async (bossId: string, bossName: string) => {
		if (activeMission || startingMission) {
			toast.error('A mission is already in progress!')
			return
		}
		setStartingMission(true)
		try {
			await startMission(bossId, 'boss_raid')
		} catch (err) {
			toast.error((err as Error)?.message || 'Failed to start boss raid')
		} finally {
			setStartingMission(false)
		}
	}

	const handleStartStoryQuest = async (territoryId: string, questNumber: number) => {
		if (activeMission || startingMission) {
			toast.error('A mission is already in progress!')
			return
		}
		setStartingMission(true)
		try {
			await startMission(territoryId, 'story_quest', questNumber)
		} catch (err) {
			toast.error((err as Error)?.message || 'Failed to start quest')
		} finally {
			setStartingMission(false)
		}
	}

	if (!gameData || !WORLD_DATA || !playerState) {
		return null
	}

	if (!Array.isArray(WORLD_DATA.TERRITORIES)) {
		return <div className="text-center py-8 text-destructive">Error: Invalid world data</div>
	}

	return (
		<div className="space-y-3 py-4">
			{/* Training Grounds — compact inline CTA that opens the training modal */}
			<button
				type="button"
				onClick={() => setShowTraining(true)}
				className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card/50 p-3 text-left transition-colors hover:border-rose-500/30 hover:bg-card"
			>
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10">
					<Dumbbell size={18} className="text-rose-400" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-display text-sm font-bold text-foreground">Training Grounds</p>
					<p className="text-[10px] text-muted-foreground">
						Gain mastery to counter fatigue from missions
					</p>
				</div>
				<ChevronRight
					size={16}
					className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
				/>
			</button>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h1 className="font-display text-xl font-bold text-foreground">Territories</h1>
					<TooltipProvider delayDuration={0}>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="flex items-center text-muted-foreground/50 hover:text-primary transition-colors"
								>
									<Info size={14} />
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="bottom"
								className="max-w-[220px] text-[10px] leading-relaxed bg-background text-foreground border border-border"
							>
								<p className="font-bold text-foreground mb-2">Active Boosts</p>
								<div className="space-y-1.5">
									<div className="flex items-center justify-between gap-4">
										<span className="text-muted-foreground">XP per mission</span>
										<span
											className={
												boosts.expBoost > 0
													? 'text-primary font-semibold'
													: 'text-muted-foreground'
											}
										>
											{boosts.expBoost > 0
												? `+${boosts.expBoost.toFixed(0)}% (${(1 + boosts.expBoost / 100).toFixed(2)}x)`
												: 'None'}
										</span>
									</div>
									<div className="flex items-center justify-between gap-4">
										<span className="text-muted-foreground">Materials</span>
										<span
											className={
												boosts.matBoost > 0
													? 'text-primary font-semibold'
													: 'text-muted-foreground'
											}
										>
											{boosts.matBoost > 0
												? `+${boosts.matBoost.toFixed(0)}% (${(1 + boosts.matBoost / 100).toFixed(2)}x)`
												: 'None'}
										</span>
									</div>
									<div className="flex items-center justify-between gap-4">
										<span className="text-muted-foreground">Energy regen</span>
										<span
											className={
												boosts.energyBoost > 0
													? 'text-primary font-semibold'
													: 'text-muted-foreground'
											}
										>
											{boosts.energyBoost > 0
												? `+${boosts.energyBoost.toFixed(0)}% (${(1 + boosts.energyBoost / 100).toFixed(2)}x)`
												: 'None'}
										</span>
									</div>
								</div>
								{boosts.expBoost === 0 && boosts.matBoost === 0 && boosts.energyBoost === 0 && (
									<p className="mt-2 text-muted-foreground/60 text-[9px]">
										Equip booster cards to gain bonuses.
									</p>
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Clock size={14} className="text-primary" />
					<span>Reset in</span>
					<span className="font-mono text-foreground">{formatCountdown(resetCountdown)}</span>
				</div>
			</div>

			<div className="space-y-3">
				{(WORLD_DATA.TERRITORIES || []).map((t, i) => {
					// Validate territory object
					if (!t || !t.id || !t.name) {
						console.error('[WorldPage] Invalid territory:', t)
						return null
					}

					const isExpanded = expandedTerritory === t.id
					const territoryDungeons = (WORLD_DATA.DUNGEONS || []).filter((d: Record<string, any>) =>
						(t.dungeonIds || []).includes(d.id),
					)
					const territoryBosses = (WORLD_DATA.BOSSES || []).filter((b: Record<string, any>) =>
						(t.bossIds || []).includes(b.id),
					)

					// Territory info from store includes levelRange, progress, maxProgress
					const levelRange = t.levelRange || [t.requiredLevel, t.requiredLevel + 27]
					const tIdx = ['t1', 't2', 't3', 't4', 't5'].indexOf(t.id)
					const progress = tIdx >= 0 ? Math.min(Math.max(storyProgress - tIdx * 5, 0), t.maxProgress || 5) : 0
					const maxProgress = t.maxProgress || 5

					return (
						<motion.div
							key={t.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.05 }}
							className={`fantasy-card relative flex flex-col overflow-hidden p-0 transition-all duration-300 ${isExpanded ? 'h-[700px]' : 'h-auto'}`}
						>
							{/* Full background image */}
							<img
								src={getTerritoryImage(t.name)}
								alt={t.name}
								className="absolute inset-0 h-full w-full object-cover"
							/>
							<div className="absolute inset-0 bg-background/75" />

							{/* Header */}
							<div
								className="relative flex cursor-pointer items-center justify-between px-4 py-3"
								onClick={() => setExpandedTerritory(isExpanded ? null : t.id)}
							>
								<div>
									<p className="font-display text-sm md:text-base font-bold text-foreground drop-shadow-lg">
										{t.name}
									</p>
									<p className="text-xs md:text-sm text-muted-foreground">
										Lv. {levelRange[0]}-{levelRange[1]}
									</p>
								</div>
								{isExpanded ? (
									<ChevronUp size={18} className="text-muted-foreground" />
								) : (
									<ChevronDown size={18} className="text-muted-foreground" />
								)}
							</div>

							<div className="relative flex flex-1 flex-col overflow-y-auto px-4 pb-4 scrollbar-none">
								<ProgressBar value={progress} max={maxProgress} label="Story Progress" />

								<AnimatePresence>
									{isExpanded && (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											className="mt-4 flex flex-1 flex-col gap-3"
										>
											{/* Tabs */}
											<div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary p-1 scrollbar-none">
												{['stories', 'dungeons', 'bosses'].map((tabId) => {
													const tabConfig = tabsConfig[tabId as keyof typeof tabsConfig]
													const TabIcon = tabConfig.icon
													return (
														<button
															key={tabId}
															onClick={() => setTab(t.id, tabId)}
															className={`flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-colors ${getTab(t.id) === tabId
																? 'bg-primary text-primary-foreground'
																: 'text-muted-foreground hover:text-foreground'
																}`}
														>
															<span className="text-sm md:text-base">
																<TabIcon size={16} />
															</span>
															{tabConfig.label}
														</button>
													)
												})}
											</div>

											{/* Stories Tab */}
											{getTab(t.id) === 'stories' && t.quests && (
												<StoryTab
													territory={t}
													storyProgress={storyProgress}
													playerLevel={player.level}
													energy={energy}
													playerState={playerState}
													selectedQuest={selectedQuest?.[t.id]}
													onSelectQuest={(questNum) =>
														setSelectedQuest((p) => ({
															...p,
															[t.id]: questNum,
														}))
													}
													onStartQuest={handleStartStoryQuest}
													getRewardCard={getRewardCard}
													activeMission={activeMission ?? null}
													startingMission={startingMission}
												/>
											)}

											{/* Dungeons Tab */}
											{getTab(t.id) === 'dungeons' && (
												<DungeonTab
													world={WORLD_DATA}
													dungeons={territoryDungeons}
													playerLevel={player.level}
													raidPower={(playerState?.raidPower as number | undefined) ?? 0}
													energy={energy}
													playerState={playerState}
													selectedDungeonMission={selectedDungeonMission}
													onSelectMission={(dungeonId, missionId) =>
														setSelectedDungeonMission((p) => ({
															...p,
															[dungeonId]: missionId,
														}))
													}
													onStartDungeon={handleStartDungeonMission}
													activeMission={activeMission ?? null}
													startingMission={startingMission}
												/>
											)}

											{/* Bosses Tab */}
											{getTab(t.id) === 'bosses' && (
												<BossTab
													bosses={territoryBosses}
													dungeons={territoryDungeons}
													playerLevel={player.level}
													energy={energy}
													playerState={playerState}
													onStartBoss={handleStartBoss}
													activeMission={activeMission ?? null}
													startingMission={startingMission}
												/>
											)}
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</motion.div>
					)
				})}
			</div>

			<TrainingModal open={showTraining} onClose={() => setShowTraining(false)} />
		</div>
	)
}

export default WorldPage
