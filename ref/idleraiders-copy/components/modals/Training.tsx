'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Dumbbell, Sword, Sparkles, Truck, Zap, Clock, Loader2, Info } from 'lucide-react'
import { useGame } from '@/context/GameContext'
import { useMissionActions } from '@/features/actions'
import { CARDS_BY_ID } from '@/lib/registries/card.registry'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

type TrainingType = 'weapons' | 'mount' | 'merchant'

interface TrainingTypeConfig {
	id: TrainingType
	title: string
	description: string
	icon: typeof Sword
	cardType: 'equipment' | 'mount' | 'transport'
	bgImage: string
	iconBg: string
	iconColor: string
}

const trainingTypes: TrainingTypeConfig[] = [
	{
		id: 'weapons',
		title: 'Weapons Training',
		description: 'Train combat skills with your equipment cards',
		icon: Sword,
		cardType: 'equipment',
		bgImage: '/assets/training/weapons.jpg',
		iconBg: 'bg-red-500/20 border-red-500/30',
		iconColor: 'text-red-400',
	},
	{
		id: 'mount',
		title: 'Mount Training',
		description: 'Master riding techniques with your mount cards',
		icon: Sparkles,
		cardType: 'mount',
		bgImage: '/assets/training/mount.jpg',
		iconBg: 'bg-amber-500/20 border-amber-500/30',
		iconColor: 'text-amber-400',
	},
	{
		id: 'merchant',
		title: 'Merchant Training',
		description: 'Learn trade skills with your transport cards',
		icon: Truck,
		cardType: 'transport',
		bgImage: '/assets/training/merchant.jpg',
		iconBg: 'bg-teal-500/20 border-teal-500/30',
		iconColor: 'text-teal-400',
	},
]

const TRAINING_ENERGY_COST = 40
const TRAINING_DURATION = 60 // minutes

interface TrainingModalProps {
	open: boolean
	onClose: () => void
}

const TrainingModal = ({ open, onClose }: TrainingModalProps) => {
	const isMobile = useIsMobile()
	const { playerState } = useGame()
	const { startTraining } = useMissionActions()
	const [startingTraining, setStartingTraining] = useState<TrainingType | null>(null)
	const [infoOpen, setInfoOpen] = useState(false)

	// Reset tooltip state when modal closes/opens to prevent auto-open from focus management
	useEffect(() => {
		if (!open) {
			setInfoOpen(false)
		}
	}, [open])

	// Calculate total luck for each card type from player's cards (no API call)
	const luckByType = useMemo(() => {
		if (!playerState?.cards) return { equipment: 0, mount: 0, transport: 0 }

		const totals = { equipment: 0, mount: 0, transport: 0 }
		for (const cardItem of playerState.cards) {
			const cardDef = CARDS_BY_ID[cardItem.cardId]
			if (!cardDef) continue
			const luck = cardDef.stats?.luck ?? 0
			const qty = cardItem.quantity ?? 1
			if (cardDef.type === 'equipment') totals.equipment += luck * qty
			if (cardDef.type === 'mount') totals.mount += luck * qty
			if (cardDef.type === 'transport') totals.transport += luck * qty
		}
		return totals
	}, [playerState?.cards])

	const hasActiveMission = !!playerState?.activeMission
	const currentEnergy = playerState?.energy ?? 0
	const hasEnoughEnergy = currentEnergy >= TRAINING_ENERGY_COST
	const canStartTraining = !hasActiveMission && hasEnoughEnergy

	// Calculate base XP and apply exp boost multiplier
	const baseXP = TRAINING_DURATION * 2 // 120 XP for 60 minutes
	const expBoost = playerState?.boosts?.expBoost ?? 0
	const boostedXP = Math.floor(baseXP * (1 + expBoost / 100))

	const handleStartTraining = useCallback(
		async (trainingType: TrainingType) => {
			if (startingTraining) return
			setStartingTraining(trainingType)
			try {
				const result = await startTraining(trainingType)
				// If training started successfully, close the modal so the user
				// can see the ActiveMissionBar take over.
				if (result?.success !== false) {
					onClose()
				}
			} finally {
				setStartingTraining(null)
			}
		},
		[startTraining, startingTraining, onClose],
	)

	// Shared body for both mobile drawer and desktop dialog
	const body = (
		<div className="flex flex-col gap-3 p-4">
			{trainingTypes.map((training, index) => {
				const Icon = training.icon
				const totalLuck = luckByType[training.cardType]
				const masteryReward = Math.floor(50 + totalLuck / 100)
				const isStarting = startingTraining === training.id

				return (
					<motion.div
						key={training.id}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.06 }}
						className="relative min-h-[120px] overflow-hidden rounded-xl border border-border"
					>
						<img
							src={training.bgImage || '/placeholder.svg'}
							alt={training.title}
							className="absolute inset-0 h-full w-full object-cover"
						/>
						<div className="absolute inset-0 bg-background/70" />

						<div className="relative flex h-full flex-col p-3">
							<div className="flex items-start gap-3">
								<div
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${training.iconBg}`}
								>
									<Icon className={`h-5 w-5 ${training.iconColor}`} />
								</div>
								<div className="min-w-0">
									<p className="font-display text-sm font-bold text-foreground drop-shadow-lg">
										{training.title}
									</p>
									<p className="text-[10px] text-muted-foreground">
										{training.description}
									</p>
								</div>
							</div>

							<div className="mt-auto flex flex-col gap-2 pt-3">
								<div className="grid grid-cols-5 gap-1 rounded-lg bg-background/40 px-2 py-1.5 text-[10px] text-muted-foreground">
									<span className="flex flex-col items-center gap-0.5">
										<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
											Time
										</span>
										<span className="flex items-center gap-0.5 font-semibold text-foreground">
											{TRAINING_DURATION}m
											<Clock size={10} className="text-primary" />
										</span>
									</span>
									<span className="flex flex-col items-center gap-0.5">
										<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
											Energy
										</span>
										<span className="flex items-center gap-0.5 font-semibold text-foreground">
											{TRAINING_ENERGY_COST}
											<Zap size={10} className="text-primary" />
										</span>
									</span>
									<span className="flex flex-col items-center gap-0.5">
										<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
											XP
										</span>
										<span className="font-semibold text-foreground">
											{boostedXP}
											{expBoost > 0 && (
												<span className="ml-1 text-[9px] text-primary">
													+{expBoost.toFixed(0)}%
												</span>
											)}
										</span>
									</span>
									<span className="flex flex-col items-center gap-0.5">
										<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
											Luck
										</span>
										<span className="font-semibold text-foreground">{totalLuck}</span>
									</span>
									<span className="flex flex-col items-center gap-0.5">
										<span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">
											Mastery
										</span>
										<span className="font-semibold text-primary">+{masteryReward}</span>
									</span>
								</div>

								<div className="flex items-center justify-end">
									<button
										onClick={() => handleStartTraining(training.id)}
										disabled={!canStartTraining || isStarting}
										className="fantasy-btn px-5 py-1.5 text-xs disabled:opacity-40"
									>
										{isStarting ? (
											<Loader2 size={14} className="animate-spin" />
										) : hasActiveMission ? (
											'Busy'
										) : !hasEnoughEnergy ? (
											'Low Energy'
										) : (
											'Start'
										)}
									</button>
								</div>
							</div>
						</div>
					</motion.div>
				)
			})}
		</div>
	)

	// Shared title + subtitle + info tooltip
		const titleNode = (
			<div className="flex items-center gap-2">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10">
					<Dumbbell className="text-rose-400" size={16} />
				</div>
				<span className="font-display text-base">Training</span>
				<TooltipProvider delayDuration={0}>
					<Tooltip open={infoOpen} onOpenChange={(isOpen) => {
						// Only allow opening via explicit click, not focus events
						// This prevents Dialog's focus management from auto-opening the tooltip
						if (!isOpen) setInfoOpen(false)
					}}>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									setInfoOpen((v) => !v)
								}}
								onFocus={(e) => {
									// Prevent focus from opening tooltip (Dialog focus management)
									e.preventDefault()
								}}
								onMouseDown={(e) => e.preventDefault()}
								className="flex items-center text-muted-foreground/50 transition-colors hover:text-primary"
								aria-label="How training works"
							>
								<Info size={14} />
							</button>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							onPointerDownOutside={() => setInfoOpen(false)}
							className="max-w-[240px] border border-border bg-background text-[10px] leading-relaxed text-foreground"
						>
							<p className="mb-1 font-bold text-foreground">How Training Works</p>
							<ul className="space-y-1 text-muted-foreground">
								<li>- Permanently increases your mastery stat</li>
								<li>- Mastery counters fatigue, which reduces mission bonus rewards</li>
								<li>- Formula: Mastery = 50 + (Total Luck / 100)</li>
								<li>- Collect more cards to earn more mastery per session</li>
								<li>- Shares the mission slot — one at a time</li>
							</ul>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		)

	// Mobile: bottom drawer with default max-h-[80vh]
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
				<DrawerContent className="flex flex-col border-border p-0">
					<DrawerHeader className="gap-1 px-5 pt-2 pb-3 text-left">
						<DrawerTitle>{titleNode}</DrawerTitle>
						<DrawerDescription className="text-xs">
							Increase mastery to counter fatigue from missions
						</DrawerDescription>
					</DrawerHeader>
					<div className="h-px bg-border" />
					<div className="flex-1 overflow-y-auto">{body}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	// Desktop: centered dialog
	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[85vh] max-w-xl flex-col gap-0 overflow-hidden border-border p-0">
				<DialogHeader className="space-y-1 px-5 pt-5 pb-3">
					<DialogTitle>{titleNode}</DialogTitle>
					<DialogDescription className="text-xs">
						Increase mastery to counter fatigue from missions
					</DialogDescription>
				</DialogHeader>
				<div className="h-px bg-border" />
				<div className="flex-1 overflow-y-auto">{body}</div>
			</DialogContent>
		</Dialog>
	)
}

export default TrainingModal
