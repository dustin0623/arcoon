import { Info, Lock, Zap, Loader2, RefreshCw } from 'lucide-react'
import CurrencyIcon from '@/components/CurrencyIcon'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getDungeonImage } from '@/features/images'

// Scout cost is the baseline — every mission's bonus scales linearly with its energy cost.
const ENERGY_BASELINE = 15

/**
 * Calculate estimated token reward range.
 * Base reward is always guaranteed — fatigue/repeat penalties only affect the bonus.
 * Bonus scales with energy cost: a 60-energy mission rolls 4× the bonus of a 15-energy scout.
 */
function getEstimatedTokenRange(
	baseReward: number,
	raidPower: number,
	energyCost: number,
	repeatCount = 0,
	fatigue = 0,
	mastery = 0,
) {
	// Bonus is 10% of raid power, scaled by energy spent
	const energyScale = energyCost / ENERGY_BASELINE
	const bonusReward = raidPower * 0.1 * energyScale

	// Apply repeat penalty to bonus only (15% per run, min 10% remaining)
	let repeatMultiplier = 1 - repeatCount * 0.15
	if (repeatMultiplier < 0.1) repeatMultiplier = 0.1

	// Apply fatigue penalty to bonus only
	let fatigueMultiplier = 1
	if (fatigue > 0) {
		fatigueMultiplier = mastery > 0 ? Math.min(1, mastery / Math.max(1, fatigue)) : 0
	}

	const adjustedBonus = bonusReward * repeatMultiplier * fatigueMultiplier

	return {
		min: Math.floor(baseReward + adjustedBonus * 0.1),
		max: Math.floor(baseReward + adjustedBonus),
		bonusReward,
		energyScale,
	}
}

/**
 * Calculate estimated XP with boost applied
 */
function getEstimatedXp(missionDuration: number, expBoostPct = 0, expPotionActive = false) {
	const baseXp = Math.floor(missionDuration / 60)
	const expPotionMultiplier = expPotionActive ? 2 : 1
	return Math.round(baseXp * (1 + expBoostPct / 100) * expPotionMultiplier)
}

/**
 * Returns dungeon unlock gate state including War Campaign requirement from previous dungeon.
 */
function getDungeonUnlockGate(
	dungeon: Record<string, any>,
	playerLevel: number,
	completions: Record<string, number> | undefined,
	dungeonNames?: Record<string, string>,
): {
	unlocked: boolean
	levelMet: boolean
	warCampaignMet: boolean
	requiredLevel: number
	warCampaignReq: { dungeonId: string; dungeonName?: string; required: number; current: number } | null
} {
	const levelMet = playerLevel >= dungeon.requiredLevel
	const req = dungeon.requiredWarCampaigns

	if (!req) {
		return {
			unlocked: levelMet,
			levelMet,
			warCampaignMet: true,
			requiredLevel: dungeon.requiredLevel,
			warCampaignReq: null,
		}
	}

	const key = `${req.dungeonId}_war`
	const current = completions?.[key] ?? 0
	const warCampaignMet = current >= req.count

	return {
		unlocked: levelMet && warCampaignMet,
		levelMet,
		warCampaignMet,
		requiredLevel: dungeon.requiredLevel,
		warCampaignReq: {
			dungeonId: req.dungeonId,
			dungeonName: dungeonNames?.[req.dungeonId],
			required: req.count,
			current,
		},
	}
}

const isDungeonUnlocked = (dungeon: Record<string, any>, playerLevel: number) => {
	return playerLevel >= dungeon.requiredLevel
}

const isMissionUnlocked = (dungeon: Record<string, any>, missionTypeId: string, playerLevel: number) => {
	// Find the specific mission in dungeon.missions array which has per-mission requiredLevel
	const mission = dungeon.missions?.find((m: Record<string, any>) => m.id === missionTypeId)
	if (mission) {
		return playerLevel >= mission.requiredLevel
	}
	// Fallback to dungeon level if missions array not available
	return playerLevel >= dungeon.requiredLevel
}

const getMissionRequiredLevel = (dungeon: Record<string, any>, missionTypeId: string) => {
	// Find the specific mission in dungeon.missions array
	const mission = dungeon.missions?.find((m: Record<string, any>) => m.id === missionTypeId)
	if (mission) {
		return mission.requiredLevel
	}
	// Fallback to dungeon level
	return dungeon.requiredLevel
}

/**
 * Per-dungeon completion gate. Returns the prerequisite mission and progress, or null if no gate exists
 * (Scout has none) or the mission is already unlocked.
 */
function getCompletionGate(
	mission: Record<string, any>,
	dungeonId: string,
	completions: Record<string, number> | undefined,
): { gateMissionName: string; current: number; required: number } | null {
	const req = mission?.requiredCompletions
	if (!req) return null
	const key = `${dungeonId}_${req.missionId}`
	const current = completions?.[key] ?? 0
	if (current >= req.count) return null
	return {
		gateMissionName: req.missionId.charAt(0).toUpperCase() + req.missionId.slice(1),
		current,
		required: req.count,
	}
}

interface DungeonTabProps {
	world: Record<string, any> | null
	dungeons: Record<string, any>[]
	playerLevel: number
	raidPower: number
	energy: number
	playerState: Record<string, any> | null
	selectedDungeonMission: Record<string, string>
	onSelectMission: (dungeonId: string, missionTypeId: string) => void
	onStartDungeon: (dungeonId: string, dungeonName: string, missionTypeId: string) => void
	activeMission: Record<string, any> | null
	startingMission: boolean
}

export function DungeonTab({
	world,
	dungeons,
	playerLevel,
	raidPower,
	energy,
	playerState,
	selectedDungeonMission,
	onSelectMission,
	onStartDungeon,
	activeMission,
	startingMission,
}: DungeonTabProps) {
	const missionTypes = Object.values(world?.MISSION_TYPES || {}) as Record<string, any>[]

	return (
		<div className="flex flex-1 flex-col gap-3">
			{dungeons.map((dungeon) => {
				const dungeonImg = getDungeonImage(dungeon.id)
				const completions = playerState?.milestones?.missionCompletions as
					| Record<string, number>
					| undefined
				// Build dungeon name lookup for gate display
				const dungeonNames = dungeons.reduce(
					(acc, d) => ({ ...acc, [d.id]: d.name }),
					{} as Record<string, string>,
				)
				const dungeonGate = getDungeonUnlockGate(dungeon, playerLevel, completions, dungeonNames)
				const dungeonUnlocked = dungeonGate.unlocked
				const selMissionId = selectedDungeonMission[dungeon.id] || missionTypes[0]?.id
				const selMission =
					missionTypes.find((m: Record<string, any>) => m.id === selMissionId) || missionTypes[0]
				const missionUnlocked = isMissionUnlocked(dungeon, selMission.id, playerLevel)
				const baseReward = selMission?.baseTokenReward ?? 50
				const selCompletionGate = getCompletionGate(selMission, dungeon.id, completions)

				// Get daily repeat count and fatigue for accurate token calculation
				const dungeonKey = `${dungeon.id}_${selMission.id}`
				const repeatCount = playerState?.dailyDungeonStats?.[dungeonKey] ?? 0
				const fatigue = playerState?.missionStats?.fatigue ?? 0
				const mastery = playerState?.stats?.mastery ?? 0
				const playerRaidPower = playerState?.stats?.raidPower ?? 0

				// Calculate repeat penalty percentage for display
				let repeatMultiplier = 1 - repeatCount * 0.15
				if (repeatMultiplier < 0.1) repeatMultiplier = 0.1
				const repeatPenaltyPct = Math.round((1 - repeatMultiplier) * 100)

				const estTokens = getEstimatedTokenRange(
					baseReward,
					playerRaidPower,
					selMission.energyCost,
					repeatCount,
					fatigue,
					mastery,
				)
				const expBoostPct = playerState?.boosts?.expBoost ?? 0
				const expPotionActive = playerState?.missionStats?.isExpBoostActive ?? false
				const estimatedXp = getEstimatedXp(selMission.duration, expBoostPct, expPotionActive)
				const canAfford = energy >= selMission.energyCost

				return (
					<div
						key={dungeon.id}
						className={`relative min-h-[120px] md:min-h-[160px] flex-1 overflow-hidden rounded-xl border ${dungeonUnlocked ? 'border-border' : 'border-border/40'}`}
					>
						{dungeonImg && (
							<>
								<img
									src={dungeonImg}
									alt={dungeon.name}
									className="absolute inset-0 h-full w-full object-cover"
								/>
								<div
									className={`absolute inset-0 ${dungeonUnlocked ? 'bg-background/60' : 'bg-background/85'}`}
								/>
							</>
						)}
						<div className="relative flex h-full flex-col p-3 md:p-4">
							{/* Header: name + level */}
							<div className="flex items-start justify-between">
								<div>
									<p
										className={`font-display text-sm md:text-base font-bold drop-shadow-lg ${dungeonUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}
									>
										{dungeon.name}
									</p>
								{!dungeonUnlocked ? (
									<div className="flex flex-col gap-0.5">
										{!dungeonGate.levelMet && (
											<p className="flex items-center gap-1 text-[10px] md:text-xs text-destructive/80">
												<Lock size={10} /> Lv. {dungeon.requiredLevel} required
											</p>
										)}
										{dungeonGate.warCampaignReq && !dungeonGate.warCampaignMet && (
											<p className="flex items-center gap-1 text-[10px] md:text-xs text-amber-500">
												<Lock size={10} /> {dungeonGate.warCampaignReq.current}/{dungeonGate.warCampaignReq.required} War Campaigns in {dungeonGate.warCampaignReq.dungeonName || 'prev dungeon'}
											</p>
										)}
									</div>
								) : (
									<p className="text-[10px] md:text-xs text-muted-foreground">
										Lv. {dungeon.requiredLevel}-{dungeon.requiredLevel + 12}
									</p>
								)}
								</div>
							</div>

							{/* Mission type tabs */}
							{dungeonUnlocked && (
								<div className="mt-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
									{missionTypes.map((mt) => {
										const mtLevelUnlocked = isMissionUnlocked(dungeon, mt.id, playerLevel)
										const reqLv = getMissionRequiredLevel(dungeon, mt.id)
										const mtGate = mtLevelUnlocked
											? getCompletionGate(mt, dungeon.id, completions)
											: null
										// Tab is selectable as long as level is met — body explains the completion gate.
										const selectable = mtLevelUnlocked
										const tabLabel = !mtLevelUnlocked
											? `Lv.${reqLv}`
											: mtGate
												? `${mt.name} ${mtGate.current}/${mtGate.required}`
												: mt.name
										const tabTitle = !mtLevelUnlocked
											? `Unlocks at Lv. ${reqLv}`
											: mtGate
												? `Complete ${mtGate.required - mtGate.current} more ${mtGate.gateMissionName} to unlock`
												: mt.name
										return (
											<button
												key={mt.id}
												onClick={() => selectable && onSelectMission(dungeon.id, mt.id)}
												disabled={!selectable}
												title={tabTitle}
												className={`shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] md:text-xs font-bold transition-all ${
													!selectable
														? 'cursor-not-allowed bg-secondary/50 text-muted-foreground/50'
														: mtGate
															? selMissionId === mt.id
																? 'bg-amber-500/30 text-amber-100 ring-1 ring-amber-500/50'
																: 'bg-amber-500/10 text-amber-400/80 hover:text-amber-300'
															: selMissionId === mt.id
																? 'bg-primary text-primary-foreground'
																: 'text-muted-foreground hover:text-foreground'
												}`}
											>
												{(!mtLevelUnlocked || mtGate) && (
													<Lock size={10} className="opacity-60" />
												)}
												{tabLabel}
											</button>
										)
									})}
								</div>
							)}

							{/* Selected mission details + start button */}
							{dungeonUnlocked && (
								<div className="mt-auto pt-3">
									{missionUnlocked && selCompletionGate ? (
										// Level is met but completion gate is not — show progress bar
										<div className="flex flex-col gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 ring-1 ring-amber-500/30">
											<div className="flex items-center justify-between text-[10px] md:text-xs">
												<span className="flex items-center gap-1 font-bold text-amber-300">
													<Lock size={11} />
													Complete{' '}
													<span className="text-amber-100">
														{selCompletionGate.required} {selCompletionGate.gateMissionName}s
													</span>{' '}
													to unlock
												</span>
												<span className="font-mono text-amber-200">
													{selCompletionGate.current}/{selCompletionGate.required}
												</span>
											</div>
											<div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-950/40">
												<div
													className="h-full rounded-full bg-amber-400 transition-all"
													style={{
														width: `${Math.min(100, (selCompletionGate.current / selCompletionGate.required) * 100)}%`,
													}}
												/>
											</div>
											<p className="text-[9px] text-amber-200/70 leading-relaxed">
												Run {selCompletionGate.gateMissionName} in this dungeon to make progress.
												Completions are tracked per-dungeon.
											</p>
										</div>
									) : missionUnlocked ? (
										<div className="flex flex-col gap-2">
											{/* Stats row — mirrors BossTab grid pattern */}
											<div className="grid grid-cols-5 gap-1 rounded-lg bg-background/40 px-2 py-1.5 text-[10px] md:text-xs text-muted-foreground">
												<span className="flex flex-col items-center gap-0.5">
													<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
														Time
													</span>
													<span className="font-semibold text-foreground">
														{selMission.label}
													</span>
												</span>
												<span className="flex flex-col items-center gap-0.5">
													<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
														Energy
													</span>
													<span className="flex items-center gap-0.5 font-semibold text-foreground">
														{selMission.energyCost}{' '}
														<Zap size={10} className="text-primary" />
													</span>
												</span>
												<span className="flex flex-col items-center gap-0.5">
													<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
														XP
													</span>
													<span className="font-semibold text-foreground">{estimatedXp}</span>
												</span>
												<span className="flex flex-col items-center gap-0.5">
													<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
														Tokens
													</span>
													<span className="flex items-center gap-0.5 font-semibold text-primary">
														<CurrencyIcon type="token" size={10} />
														{estTokens.min}-{estTokens.max}
													</span>
												</span>
												<span className="flex flex-col items-center gap-0.5">
													<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
														Loot
													</span>
													<span className="font-semibold text-foreground">
														{selMission.materialRolls}
													</span>
												</span>
											</div>

											{/* Action row: Details + Runs on left, Start on right */}
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													{/* Details tooltip — matches original design */}
													<TooltipProvider delayDuration={0}>
														<Tooltip>
															<TooltipTrigger asChild>
																<button
																	type="button"
																	className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-primary transition-colors"
																>
																	<Info size={12} /> Details
																</button>
															</TooltipTrigger>
															<TooltipContent
																side="top"
																className="max-w-[260px] text-[10px] md:text-xs leading-relaxed bg-background text-foreground border border-border"
															>
																<p className="font-bold text-foreground mb-1">
																	Token Formula
																</p>
																<p>Base: {baseReward} tokens (guaranteed)</p>
																<p>
																	Bonus: RP × 0.1 × (Energy ÷ 15) ={' '}
																	<span className="text-foreground font-semibold">
																		{Math.floor(estTokens.bonusReward).toLocaleString()}
																	</span>
																</p>
																<p>Roll: 10%–100% of bonus</p>
																<p className="mt-1 text-muted-foreground">
																	RP = {(raidPower ?? 0).toLocaleString()} · Energy ={' '}
																	{selMission.energyCost} (×{estTokens.energyScale.toFixed(2)})
																</p>
																<p className="mt-1 font-bold text-primary">
																	Range: {estTokens.min}–{estTokens.max} tokens
																</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
													{/* Repeat penalty indicator */}
													<TooltipProvider delayDuration={0}>
														<Tooltip>
															<TooltipTrigger asChild>
																<span
																	className={`flex cursor-help items-center gap-1 text-[10px] font-medium ${
																		repeatCount === 0
																			? 'text-muted-foreground/50'
																			: repeatPenaltyPct >= 90
																				? 'text-destructive'
																				: repeatPenaltyPct >= 45
																					? 'text-amber-500'
																					: 'text-muted-foreground/70'
																	}`}
																>
																	<RefreshCw size={10} />
																	{repeatCount}x
																	{repeatPenaltyPct > 0 && (
																		<span className="text-[9px]">
																			-{repeatPenaltyPct}%
																		</span>
																	)}
																</span>
															</TooltipTrigger>
															<TooltipContent
																side="top"
																className="max-w-[200px] text-[10px] md:text-xs leading-relaxed bg-background text-foreground border border-border"
															>
																<p className="font-bold text-foreground mb-1">
																	Daily Repeat Penalty
																</p>
																<p>Runs today: {repeatCount}</p>
																<p
																	className={
																		repeatPenaltyPct > 0
																			? 'text-amber-500'
																			: 'text-emerald-500'
																	}
																>
																	Bonus reward penalty: -{repeatPenaltyPct}%
																</p>
																<p className="mt-1 text-[9px] text-muted-foreground">
																	-15% per run, max -90%. Resets daily. Switch
																	dungeons for full rewards.
																</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
												<button
													onClick={() =>
														onStartDungeon(dungeon.id, dungeon.name, selMission.id)
													}
													disabled={!!activeMission || !canAfford || startingMission}
													className="fantasy-btn px-5 md:px-6 py-1.5 md:py-2 text-xs md:text-sm disabled:opacity-40"
												>
													{startingMission ? (
														<Loader2 size={14} className="animate-spin" />
													) : activeMission ? (
														'Busy'
													) : !canAfford ? (
														'No Energy'
													) : (
														'Start'
													)}
												</button>
											</div>
										</div>
									) : (
										<p className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
											<Lock size={10} /> Reach Lv.{' '}
											{getMissionRequiredLevel(dungeon, selMission.id)} to unlock this mission
										</p>
									)}
								</div>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}
