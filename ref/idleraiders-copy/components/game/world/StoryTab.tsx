import { useState } from 'react'
import { BookOpen, Loader2, Info } from 'lucide-react'
import { rarityText as rarityColors } from '@/lib/rarityStyles'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Zap } from 'lucide-react'
import { CardDetailModal } from '@/components/ui/game-card-detail'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface StoryTabProps {
	territory: Record<string, any>
	storyProgress: number
	playerLevel: number
	energy: number
	playerState: Record<string, any> | null
	selectedQuest: number | null
	onSelectQuest: (questNum: number) => void
	onStartQuest: (territoryId: string, questNumber: number) => void
	getRewardCard: (cardId: string) => Record<string, any>
	activeMission: Record<string, any> | null
	startingMission: boolean
}

export function StoryTab({
	territory,
	storyProgress,
	playerLevel,
	energy,
	playerState,
	selectedQuest,
	onSelectQuest,
	onStartQuest,
	getRewardCard,
	activeMission,
	startingMission,
}: StoryTabProps) {
	const [cardDetailQuest, setCardDetailQuest] = useState<Record<string, any> | null>(null)
	const levelRange = territory.levelRange || [territory.requiredLevel, territory.requiredLevel + 27]
	const territoryUnlockLevel = levelRange[0]
	const territoryLocked = playerLevel < territoryUnlockLevel
	const storyQuestMission = { duration: 3600, energyCost: 60 }
	const expBoostPct = playerState?.boosts?.expBoost ?? 0
	const expPotionMultiplier = playerState?.missionStats?.isExpBoostActive ? 2 : 1
	const storyXp = Math.round(Math.floor(storyQuestMission.duration / 60) * (1 + expBoostPct / 100) * expPotionMultiplier)

	// Gating: a quest is accessible when storyProgress >= globalQuestNumber - 1
	// storyProgress=0 → only globalQuestNumber=1 accessible
	// storyProgress=5 → globalQuestNumbers 1-6 accessible (t1 done, t2 quest 1 current)
	const isQuestAccessible = (q: Record<string, any>) => {
		const gqn = q.globalQuestNumber ?? q.questNumber
		return !territoryLocked && gqn <= storyProgress + 1
	}

	// Determine which quest is selected for the action card
	const firstAccessible = territory.quests.find((q: Record<string, any>) => isQuestAccessible(q))
	const lastAccessibleNum = territory.quests
		.filter((q: Record<string, any>) => isQuestAccessible(q))
		.at(-1)?.questNumber ?? territory.quests[0].questNumber
	const defaultSelQuestNum = selectedQuest ?? lastAccessibleNum
	const selQuestNum = firstAccessible ? defaultSelQuestNum : territory.quests[0].questNumber
	const selQuest =
		territory.quests.find((q: Record<string, any>) => q.questNumber === selQuestNum) || territory.quests[0]
	const isQuestLocked = !isQuestAccessible(selQuest)
	const canAffordQuest = energy >= storyQuestMission.energyCost
	const rc = getRewardCard(selQuest.reward?.id || selQuest.rewardCard?.id)

	return (
		<div className="space-y-2">
			{/* Selected quest action card */}
			<div className="rounded-xl border border-primary/20 bg-background/40 p-3 md:p-4">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
						<BookOpen size={18} className="text-primary" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="font-display text-sm md:text-base font-bold text-foreground truncate">
							{isQuestLocked ? '???' : selQuest.title}
						</p>
					</div>
				</div>

				{/* Stats grid */}
				<div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-background/40 px-2 py-1.5 text-[10px] md:text-xs text-muted-foreground">
					<span className="flex flex-col items-center gap-0.5">
						<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Time</span>
						<span className="font-semibold text-foreground">{storyQuestMission.duration / 60} min</span>
					</span>
					<span className="flex flex-col items-center gap-0.5">
						<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Energy</span>
						<span className="flex items-center gap-0.5 font-semibold text-foreground">
							{storyQuestMission.energyCost} <Zap size={10} className="text-primary" />
						</span>
					</span>
					<span className="flex flex-col items-center gap-0.5">
						<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">XP</span>
						<span className="font-semibold text-foreground">{storyXp}</span>
					</span>
				</div>

				{/* Reward card row */}
				{!isQuestLocked && (
					<div className="mt-2 flex items-center justify-between rounded-lg border border-border/30 bg-background/30 px-3 py-2">
						<div className="flex items-center gap-2">
							<span className="text-sm">{rc.icon}</span>
							<div>
								<p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">
									Reward Card
								</p>
								<button
									onClick={() => setCardDetailQuest(selQuest)}
									className={`font-display text-xs md:text-sm font-bold transition-colors hover:underline ${
										rarityColors[rc.rarity as keyof typeof rarityColors] || 'text-foreground'
									}`}
								>
									{rc.name}
								</button>
							</div>
						</div>
						<span
							className={`rounded-md bg-background/50 px-2 py-0.5 text-[10px] md:text-xs font-bold capitalize ${
								rarityColors[rc.rarity as keyof typeof rarityColors] || 'text-foreground'
							}`}
						>
							{rc.rarity}
						</span>
					</div>
				)}

				{/* Action row: Details on left, Start on right */}
				<div className="mt-3 flex items-center justify-between">
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
								{(selQuest.globalQuestNumber ?? selQuest.questNumber) === storyProgress + 1 ? (
									<>
										<p className="text-yellow-400 font-semibold">
											First Completion (Blocking Gate):
										</p>
										<p>• {territory.dropRate.card}% Card Drop</p>
										<p className="text-[9px] text-muted-foreground/80 mt-1">
											Must obtain to progress to next quest
										</p>
									</>
								) : (
									<>
										<p className="text-emerald-400 font-semibold">Repeat Completion:</p>
										<p>• {territory.dropRate.material}% Materials</p>
										<p>• {territory.dropRate.card}% Card Drop</p>
										<p className="text-[9px] text-muted-foreground/80 mt-1">
											One reward per completion
										</p>
									</>
								)}
								{!isQuestLocked && (
									<>
										<p className="mt-2 font-bold text-foreground">Reward Card</p>
										<p>
											<span
												className={`font-bold ${
													rarityColors[rc.rarity as keyof typeof rarityColors] ||
													'text-foreground'
												}`}
											>
												{rc.name}
											</span>{' '}
											({rc.rarity})
										</p>
									</>
								)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<button
						onClick={() => onStartQuest(territory.id, selQuest.questNumber)}
						disabled={!!activeMission || isQuestLocked || !canAffordQuest || startingMission}
						className="fantasy-btn px-6 py-2 text-xs md:text-sm disabled:opacity-40"
					>
						{startingMission ? (
							<Loader2 size={14} className="animate-spin" />
						) : activeMission ? (
							'Busy'
						) : territoryLocked ? (
							`Lv. ${territoryUnlockLevel}`
						) : isQuestLocked ? (
							'Locked'
						) : !canAffordQuest ? (
							'No Energy'
						) : (
							'Start'
						)}
					</button>
				</div>
			</div>

			{/* Quest list */}
			<div className="space-y-1.5">
			{(territory.quests || []).map((q: Record<string, any>) => {
				const gqn = q.globalQuestNumber ?? q.questNumber
				const isCompleted = gqn <= storyProgress
				const isCurrent = gqn === storyProgress + 1
				const isLocked = territoryLocked || (!isCompleted && !isCurrent)
				const isSelected = q.questNumber === selQuestNum
					return (
						<button
							key={q.questNumber}
							onClick={() => !isLocked && onSelectQuest(q.questNumber)}
							disabled={isLocked}
							className={`group w-full rounded-xl border px-4 py-3 text-left transition-all ${
								isSelected
									? 'border-primary/50 bg-primary/15 ring-1 ring-primary/30'
									: isCompleted
										? 'border-primary/25 bg-primary/5'
										: isCurrent
											? 'border-primary/40 bg-primary/10'
											: 'border-border/30 bg-background/20 opacity-40'
							}`}
						>
							<div className="flex items-start gap-3">
								<div
									className={`mt-0.5 flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full text-xs md:text-sm font-bold ${
										isCompleted
											? 'bg-primary text-primary-foreground'
											: isCurrent
												? 'border border-primary/50 bg-primary/15 text-primary'
												: 'bg-secondary/50 text-muted-foreground'
									}`}
								>
									{isCompleted ? '✓' : q.questNumber}
								</div>
								<div className="min-w-0 flex-1">
									<p
										className={`font-display text-sm md:text-base font-bold ${
											isCompleted
												? 'text-primary'
												: isCurrent
													? 'text-foreground'
													: 'text-muted-foreground'
										}`}
									>
										{isLocked ? '???' : q.title}
									</p>
									{!isLocked && (
										<p className="mt-1 text-[11px] md:text-xs leading-relaxed text-muted-foreground/80 line-clamp-2">
											{q.lore.split('\n')[0]}
										</p>
									)}
								</div>
							</div>
						</button>
					)
				})}
			</div>

			{/* View Lore Button */}
			<Dialog>
				<DialogTrigger asChild>
					<button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/30 py-2.5 md:py-3 text-xs md:text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
						<BookOpen size={14} />
						View Full Lore
					</button>
				</DialogTrigger>
				<DialogContent className="max-h-[80vh] overflow-y-auto scrollbar-none">
					<DialogHeader>
						<DialogTitle className="font-display text-primary">
							The Chronicles of {territory.name}
						</DialogTitle>
					</DialogHeader>
					<p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
						{territory.intro}
					</p>
					<div className="space-y-4">
						{(territory.quests || []).map((q: Record<string, any>) => {
							const gqn2 = q.globalQuestNumber ?? q.questNumber
							const isCompleted = gqn2 <= storyProgress
							const isQuestLocked2 = gqn2 > storyProgress + 1
							return (
								<div key={q.questNumber} className={isQuestLocked2 ? 'opacity-30' : ''}>
									<p
										className={`text-xs font-bold ${isCompleted ? 'text-primary' : 'text-foreground'}`}
									>
										Chapter {q.questNumber} - {isQuestLocked2 ? '???' : q.title}
									</p>
									{!isQuestLocked2 && (
										<p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
											{q.lore}
										</p>
									)}
								</div>
							)
						})}
					</div>
				</DialogContent>
			</Dialog>

			<CardDetailModal
				open={!!cardDetailQuest}
				onOpenChange={(open: boolean) => !open && setCardDetailQuest(null)}
				card={
					cardDetailQuest ? getRewardCard(cardDetailQuest.reward?.id || cardDetailQuest.rewardCard?.id) : null
				}
				footer={
					cardDetailQuest && (
						<p className="text-center text-xs text-muted-foreground">
							Reward from: <span className="text-foreground font-semibold">{cardDetailQuest.title}</span>
						</p>
					)
				}
			/>
		</div>
	)
}
