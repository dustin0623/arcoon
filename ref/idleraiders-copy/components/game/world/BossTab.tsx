import { Lock, Zap, Loader2, Info } from 'lucide-react'
import { getBossImage } from '@/features/images'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const isDungeonUnlocked = (dungeon: Record<string, any>, playerLevel: number) => {
	return playerLevel >= dungeon.requiredLevel
}

interface BossTabProps {
	bosses: Record<string, any>[]
	dungeons: Record<string, any>[]
	playerLevel: number
	energy: number
	playerState: Record<string, any> | null
	onStartBoss: (bossId: string, bossName: string) => void
	activeMission: Record<string, any> | null
	startingMission: boolean
}

export function BossTab({
	bosses,
	dungeons,
	playerLevel,
	energy,
	playerState,
	onStartBoss,
	activeMission,
	startingMission,
}: BossTabProps) {
	const bossMission = { duration: 1800 }
	const expBoostPct = playerState?.boosts?.expBoost ?? 0
	const expPotionMultiplier = playerState?.missionStats?.isExpBoostActive ? 2 : 1
	const bossXp = Math.round(Math.floor(bossMission.duration / 60) * (1 + expBoostPct / 100) * expPotionMultiplier)

	return (
		<div className="flex flex-1 flex-col gap-3">
			{bosses.map((boss, bIdx) => {
				const bossImg = getBossImage(boss.id)
				const bossEnergyCost = boss.energyCost ?? 30 // Fallback to 30 if not defined
				const canAfford = energy >= bossEnergyCost
				const correspondingDungeon = dungeons[bIdx]
				const bossUnlocked = correspondingDungeon ? isDungeonUnlocked(correspondingDungeon, playerLevel) : true

				return (
					<div
						key={boss.id}
						className={`relative min-h-[120px] md:min-h-[160px] flex-1 overflow-hidden rounded-xl border ${bossUnlocked ? 'border-destructive/20' : 'border-border/40'}`}
					>
						{bossImg && (
							<>
								<img
									src={bossImg}
									alt={boss.name}
									className="absolute inset-0 h-full w-full object-cover"
								/>
								<div
									className={`absolute inset-0 ${bossUnlocked ? 'bg-background/60' : 'bg-background/85'}`}
								/>
							</>
						)}
						<div className="relative flex h-full flex-col p-3 md:p-4">
							<div>
								<p
									className={`font-display text-sm md:text-base font-bold drop-shadow-lg ${bossUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}
								>
									{bossUnlocked ? boss.name : '???'}
								</p>
								{bossUnlocked ? (
									<p className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground/60"></p>
								) : (
									<p className="flex items-center gap-1 text-[10px] md:text-xs text-destructive/80">
										<Lock size={10} /> Unlock {correspondingDungeon?.name} first (Lv.{' '}
										{correspondingDungeon?.requiredLevel})
									</p>
								)}
							</div>
							{bossUnlocked && (
								<div className="mt-auto pt-3 flex flex-col gap-2">
									{/* Stats grid */}
									<div className="grid grid-cols-3 gap-1 rounded-lg bg-background/40 px-2 py-1.5 text-[10px] md:text-xs text-muted-foreground">
										<span className="flex flex-col items-center gap-0.5">
											<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
												Time
											</span>
											<span className="font-semibold text-foreground">30 min</span>
										</span>
										<span className="flex flex-col items-center gap-0.5">
											<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
												Energy
											</span>
											<span className="flex items-center gap-0.5 font-semibold text-foreground">
												{bossEnergyCost} <Zap size={10} className="text-primary" />
											</span>
										</span>
										<span className="flex flex-col items-center gap-0.5">
											<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
												XP
											</span>
											<span className="font-semibold text-foreground">{bossXp}</span>
										</span>
									</div>
									{/* Action row: Details on left, Raid on right */}
									<div className="flex items-center justify-between">
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
													className="max-w-[240px] text-[10px] md:text-xs leading-relaxed bg-background text-foreground border border-border"
												>
													<p className="font-bold text-foreground mb-1">Drop Rates</p>
													<p>Components: {boss.dropRate.component}%</p>
													<p>Catalysts: {boss.dropRate.catalyst}%</p>
													<p className="font-bold text-foreground mt-2 mb-1">
														Catalyst Rarity Distribution
													</p>
													<div className="space-y-1">
														<p>
															<span className="text-emerald-400">● Common:</span>{' '}
															{Math.round(boss.catalystDropRate.common * 100)}%
														</p>
														<p>
															<span className="text-blue-400">● Uncommon:</span>{' '}
															{Math.round(boss.catalystDropRate.uncommon * 100)}%
														</p>
														<p>
															<span className="text-purple-400">● Rare:</span>{' '}
															{Math.round(boss.catalystDropRate.rare * 100)}%
														</p>
														<p>
															<span className="text-yellow-400">● Epic:</span>{' '}
															{Math.round(boss.catalystDropRate.epic * 100)}%
														</p>
														<p>
															<span className="text-orange-500">● Legendary:</span>{' '}
															{Math.round(boss.catalystDropRate.legendary * 100)}%
														</p>
													</div>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<button
											onClick={() => onStartBoss(boss.id, boss.name)}
											disabled={!!activeMission || !canAfford || startingMission}
											className="fantasy-btn px-6 py-1.5 md:py-2 text-xs md:text-sm disabled:opacity-40"
										>
											{startingMission ? (
												<Loader2 size={14} className="animate-spin" />
											) : activeMission ? (
												'Busy'
											) : !canAfford ? (
												'No Energy'
											) : (
												'Raid'
											)}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}
