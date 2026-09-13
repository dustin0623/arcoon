'use client'

import { useState, useCallback, useRef } from 'react'
import { useGame } from '@/context/GameContext'
import { useItemActions, usePlayerActions } from '@/features/actions'
import { useTimer } from '@/hooks/useTimer'
import { Zap, FlaskConical, Package, Sparkles, Info, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	PopoverHeader,
	PopoverTitle,
	PopoverDescription,
	PopoverBody,
} from '@/components/ui/popover'

interface InfoTipProps {
	children: React.ReactNode
}

const InfoTip = ({ children }: InfoTipProps) => (
	<TooltipProvider delayDuration={300}>
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					role="button"
					tabIndex={-1}
					className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ml-1 cursor-help"
				>
					<Info size={12} />
				</span>
			</TooltipTrigger>
			<TooltipContent
				side="top"
				className="max-w-[220px] text-[11px] leading-relaxed bg-background text-foreground border border-border"
			>
				{children}
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
)

const EnergyBar = () => {
	const { playerState, apiRequest } = useGame()
	const { usePotion } = useItemActions()
	const { upgradeStorageSlots } = usePlayerActions()
	const [justClaimed, setJustClaimed] = useState(false)
	const [isUpgrading, setIsUpgrading] = useState(false)

	const energy = playerState?.energy ?? 0
	const cardMastery = playerState?.stats?.mastery ?? 0
	const trainingMastery = playerState?.missionStats?.mastery ?? 0
	const mastery = cardMastery + trainingMastery
	// Transform potions array into object with counts by type
	const potionsArray = Array.isArray(playerState?.potions) ? playerState.potions : []
	const potions = {
		energy: potionsArray.find((p) => p.id === 'energy_potion')?.quantity ?? 0,
		exp: potionsArray.find((p) => p.id === 'exp_potion')?.quantity ?? 0,
	}
	const fatigue = playerState?.missionStats?.fatigue ?? 0
	const expBoostActive = playerState?.expBoostActive ?? playerState?.missionStats?.isExpBoostActive ?? false
	const storageSlots = playerState?.storageSlots ?? 3
	const dollars = playerState?.dollars ?? 0
	const luck = playerState?.luck ?? playerState?.stats?.luck ?? 0
	const lastCycleUpdate = playerState?.lastCycleUpdate ? new Date(playerState.lastCycleUpdate) : new Date()

	const storageUsed = potions.energy + potions.exp
	const storageMax = storageSlots

	// Boosts from cards
	const boosts = playerState?.boosts ?? { expBoost: 0, matBoost: 0, energyBoost: 0 }
	const cardBoostPercent = boosts.energyBoost ?? 0

	// Guild-level energy regen bonus (decimal on playerState, e.g. 0.04 = +4%)
	const guildBonuses = playerState?.guildBonuses ?? { xpBonus: 0, materialBonus: 0, energyRegen: 0, bossDamage: 0 }
	const guildBoostPercent = (guildBonuses.energyRegen ?? 0) * 100

	// Combined effective multiplier — matches the backend calculation in
	// lib/modules/players/player.service.ts getEnergy:
	//   multiplier = (1 + cardBoost) * (1 + guildBonus)
	const effectiveMultiplier = (1 + cardBoostPercent / 100) * (1 + guildBoostPercent / 100)
	const effectiveBoostPercent = (effectiveMultiplier - 1) * 100

	// Energy regen calculation (base: 5 energy per 15 min cycle = 0.333/min).
	const baseRegenPerMin = 5 / 15 // ~0.333 energy/min
	const boostedRegenPerMin = baseRegenPerMin * effectiveMultiplier

	// Computed drop chance for display (10% base, max 25% with luck)
	const BASE_DROP_CHANCE = 10
	const MAX_DROP_CHANCE = 25
	const luckBonus = Math.min(1.5, luck / 4000) // At 6000 luck = 1.5 bonus (maxes out)
	const currentChance = Math.min(MAX_DROP_CHANCE, BASE_DROP_CHANCE * (1 + luckBonus)).toFixed(1)

	// 15-minute cycle timer (energy regeneration)
	const CYCLE_MS = 15 * 60 * 1000 // 15 minutes (900 seconds, matching backend REGEN_INTERVAL)
	const nextCycleTime = lastCycleUpdate.getTime() + CYCLE_MS

	// Track if a claim is in progress to prevent multiple simultaneous claims
	const claimingRef = useRef(false)

	const handleClaimEnergy = useCallback(async () => {
		// Guard: don't claim if already claiming
		if (claimingRef.current) return

		claimingRef.current = true
		setJustClaimed(true)

		try {
			await apiRequest('/api/players/energy', { method: 'POST' })
			setTimeout(() => setJustClaimed(false), 2000)
		} catch (err) {
			console.error('Failed to regenerate energy:', err)
			setJustClaimed(false)
		} finally {
			claimingRef.current = false
		}
	}, [apiRequest])

	const timer = useTimer(nextCycleTime, handleClaimEnergy)

	const handleUsePotion = async (type: 'energy_potion' | 'exp_potion') => {
		if (type === 'energy_potion' && Math.floor(energy) >= 100) {
			toast.error('Energy is already full!')
			return
		}
		if (type === 'exp_potion' && expBoostActive) {
			toast.error('EXP boost already active!')
			return
		}
		// usePotion already handles toast notifications
		await usePotion(type)
	}

	return (
		<div
			className="relative flex items-center gap-1.5 rounded-full border border-border bg-secondary pl-2.5 pr-7 py-1"
			style={{ height: 28 }}
		>
			<Zap size={14} className="text-primary" />
			<span className="font-body text-xs font-semibold tabular-nums text-foreground select-none">
				{Math.floor(energy)}
				<span className="text-muted-foreground">/100</span>
			</span>
			<Popover>
				<PopoverTrigger asChild>
					<button className="absolute right-0 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-secondary text-sm text-muted-foreground shadow-md transition-colors hover:text-primary focus:outline-none">
						+
					</button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-72 p-0">
					<PopoverHeader>
						<Zap size={18} className="text-primary" />
						<div>
							<PopoverTitle>Energy & Potions</PopoverTitle>
							<PopoverDescription>Manage energy, potions & fatigue</PopoverDescription>
						</div>
					</PopoverHeader>
					<PopoverBody className="space-y-3 px-4 py-3">
						{/* Energy info */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Zap size={16} className="text-primary" />
								<span className="text-xs text-muted-foreground">Energy</span>
								<InfoTip>
									<p className="font-semibold mb-1">Energy System</p>
									<p>Max: 100. Refills +5 every 15 min cycle.</p>
									<div className="mt-2 space-y-1">
										<div className="flex justify-between text-[10px]">
											<span className="text-muted-foreground">Base rate:</span>
											<span>~0.33/min</span>
										</div>
										<div className="flex justify-between text-[10px]">
											<span className="text-muted-foreground">Card boost:</span>
											<span className={cardBoostPercent > 0 ? 'text-primary' : ''}>
												+{cardBoostPercent.toFixed(0)}%
											</span>
										</div>
										<div className="flex justify-between text-[10px]">
											<span className="text-muted-foreground">Guild bonus:</span>
											<span className={guildBoostPercent > 0 ? 'text-primary' : ''}>
												+{guildBoostPercent.toFixed(0)}%
											</span>
										</div>
										<div className="flex justify-between text-[10px] font-semibold border-t border-border pt-1 mt-1">
											<span>Current rate:</span>
											<span className={effectiveBoostPercent > 0 ? 'text-primary' : ''}>
												{boostedRegenPerMin.toFixed(2)}/min
											</span>
										</div>
									</div>
								</InfoTip>
							</div>
							<span className="font-body text-sm font-bold text-foreground">
								{Math.floor(energy)}
								<span className="text-muted-foreground font-normal">/100</span>
							</span>
						</div>

						{/* Fatigue indicator */}
						<div className="border-t border-border pt-3">
							<div className="flex items-center justify-between mb-1.5">
								<div className="flex items-center">
									<span className="text-xs font-semibold text-foreground">Fatigue</span>
									<InfoTip>
										<p className="font-semibold mb-1">😴 Fatigue System</p>
										<p>
											Fatigue is <span className="font-semibold">permanent</span> and accumulates
											with every mission.
										</p>
										<p className="mt-1">
											Your <span className="font-semibold">Mastery</span> offsets fatigue and
											protects full rewards.
										</p>
										<div className="mt-2 space-y-1 border-t border-border pt-2">
											<p className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Mastery Breakdown</p>
											<div className="flex justify-between text-[10px]">
												<span className="text-muted-foreground">From cards:</span>
												<span className={cardMastery > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}>{cardMastery}</span>
											</div>
											<div className="flex justify-between text-[10px]">
												<span className="text-muted-foreground">From training (permanent):</span>
												<span className={trainingMastery > 0 ? 'text-yellow-500 font-semibold' : 'text-muted-foreground'}>{trainingMastery}</span>
											</div>
											<div className="flex justify-between text-[10px] font-bold border-t border-border pt-1">
												<span>Total Mastery:</span>
												<span>{mastery}</span>
											</div>
										</div>
										<p className="mt-2">When fatigue exceeds mastery, token rewards are reduced.</p>
										<p className="mt-1 text-muted-foreground">Formula: min(1, Mastery / Fatigue)</p>
									</InfoTip>
								</div>
								<span
									className={`font-body text-xs font-bold ${fatigue > mastery && fatigue > 0 ? 'text-destructive' : fatigue > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}
								>
									{fatigue} / {mastery}
								</span>
							</div>
							<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
								<div
									className={`h-full rounded-full transition-all ${fatigue > mastery && fatigue > 0 ? 'bg-destructive' : fatigue > 0 ? 'bg-yellow-500' : 'bg-muted-foreground'}`}
									style={{
										width: `${Math.min(100, mastery > 0 ? (fatigue / mastery) * 100 : fatigue > 0 ? 100 : 0)}%`,
									}}
								/>
							</div>
							<p className="text-[10px] text-muted-foreground mt-1">
								{fatigue > 0 && fatigue > mastery
									? `−${Math.round((1 - Math.min(1, mastery / Math.max(1, fatigue))) * 100)}% token rewards. Get more mastery cards!`
									: fatigue > 0
										? 'Mastery covers fatigue. Full rewards!'
										: "No fatigue. You're good!"}
							</p>
						</div>

						{/* Energy Claim Countdown */}
						{justClaimed && (
							<div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
								<div className="text-center">
									<p className="text-sm font-bold text-primary">✨ Just Claimed!</p>
								</div>
							</div>
						)}
						{!justClaimed && (
							<div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Clock size={16} className="text-primary" />
										<span className="text-[11px] font-semibold text-foreground">Next Cycle</span>
										<InfoTip>
											<p className="font-semibold mb-1">Cycle Update</p>
											<p>Energy regenerates every 15 minutes.</p>
											<div className="mt-2 space-y-1">
												<div className="flex justify-between text-[10px]">
													<span className="text-muted-foreground">Base gain:</span>
													<span>+5 energy</span>
												</div>
												<div className="flex justify-between text-[10px]">
													<span className="text-muted-foreground">Card boost:</span>
													<span className={cardBoostPercent > 0 ? 'text-primary' : ''}>
														+{cardBoostPercent.toFixed(0)}%
													</span>
												</div>
												<div className="flex justify-between text-[10px]">
													<span className="text-muted-foreground">Guild bonus:</span>
													<span className={guildBoostPercent > 0 ? 'text-primary' : ''}>
														+{guildBoostPercent.toFixed(0)}%
													</span>
												</div>
												<div className="flex justify-between text-[10px] font-semibold border-t border-border pt-1 mt-1">
													<span>Per cycle:</span>
													<span className={effectiveBoostPercent > 0 ? 'text-primary' : ''}>
														+{(5 * effectiveMultiplier).toFixed(2)} energy
													</span>
												</div>
											</div>
										</InfoTip>
									</div>
									<span className="font-body text-sm font-bold text-primary">
										{timer.isComplete ? 'Ready to claim!' : timer.formattedShort}
									</span>
								</div>
							</div>
						)}

						{/* Storage slots */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Package size={16} className="text-muted-foreground" />
								<span className="text-xs text-muted-foreground">Storage Slots</span>
								<InfoTip>
									<p className="font-semibold mb-1">📦 Potion Storage</p>
									<p>You can hold up to {storageMax} potions total across all types.</p>
									<p className="mt-1">Start with 3 slots. Increase for 1 Dollar per slot.</p>
									<p className="mt-1 text-muted-foreground">
										If storage is full, potion drops are lost!
									</p>
								</InfoTip>
							</div>
							<span className="font-body text-sm font-bold text-foreground">
								{storageUsed}
								<span className="text-muted-foreground font-normal">/{storageMax}</span>
							</span>
						</div>
						<Button
							variant="outline"
							className="w-full"
							size="sm"
							disabled={dollars < 1}
							onClick={async () => {
								if (dollars < 1) {
									toast.error('Not enough Dollars')
									return
								}
								await upgradeStorageSlots()
							}}
						>
							Increase Storage — 1 Dollar
						</Button>

						{/* Potions */}
						<div className="border-t border-border pt-3 space-y-2">
							<div className="flex items-center">
								<p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
									Potions
								</p>
								<InfoTip>
									<p className="font-semibold mb-1">Potion Drop System</p>
									<p>Potions drop randomly after missions based on your Luck stat.</p>
									<p className="mt-1 font-semibold">Drop Formula:</p>
									<p className="text-muted-foreground">
										Base 10% + Luck bonus, capped at 25%
									</p>
									<div className="mt-2 space-y-1">
										<div className="flex justify-between text-[10px]">
											<span className="text-muted-foreground">Your Luck:</span>
											<span className="font-semibold">{luck}</span>
										</div>
										<div className="flex justify-between text-[10px]">
											<span className="text-muted-foreground">Current drop chance:</span>
											<span className="font-semibold text-primary">{currentChance}%</span>
										</div>
									</div>
									<p className="mt-2 font-semibold">Drop Distribution:</p>
									<p className="text-muted-foreground">EXP 60% · Energy 40%</p>
								</InfoTip>
							</div>

							{/* Energy Potion */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<FlaskConical size={15} className="text-primary" />
									<div className="flex items-center">
										<div>
											<p className="text-xs font-semibold text-foreground">Energy Potion</p>
											<p className="text-[10px] text-muted-foreground">
												Fully refills energy to 100
											</p>
										</div>
										<InfoTip>
											<p className="font-semibold mb-1">⚡ Energy Potion</p>
											<p>Instantly restores energy to 100/100.</p>
											<p className="mt-1 text-muted-foreground">Drop rate: 40% of potion drops</p>
											<p className="text-muted-foreground">Cannot use when energy is full.</p>
										</InfoTip>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-body text-xs font-bold text-foreground">
										×{potions.energy}
									</span>
									<Button
										variant="outline"
										size="sm"
										className="h-6 px-2 text-[10px]"
										disabled={potions.energy < 1}
										onClick={() => handleUsePotion('energy_potion')}
									>
										Use
									</Button>
								</div>
							</div>

							{/* EXP Potion */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Sparkles size={15} className="text-accent-foreground" />
									<div className="flex items-center">
										<div>
											<p className="text-xs font-semibold text-foreground">
												EXP Potion
												{expBoostActive && (
													<span className="ml-1 text-[10px] text-primary">(Active)</span>
												)}
											</p>
											<p className="text-[10px] text-muted-foreground">2× XP on next mission</p>
										</div>
										<InfoTip>
											<p className="font-semibold mb-1">⭐ EXP Potion</p>
											<p>Doubles XP gained on your next completed mission.</p>
											<p className="mt-1 text-muted-foreground">Drop rate: 60% of potion drops</p>
											<p className="text-muted-foreground">
												Consumed after one mission. Only one can be active.
											</p>
										</InfoTip>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-body text-xs font-bold text-foreground">×{potions.exp}</span>
									<Button
										variant="outline"
										size="sm"
										className="h-6 px-2 text-[10px]"
										disabled={potions.exp < 1 || expBoostActive}
										onClick={() => handleUsePotion('exp_potion')}
									>
										Use
									</Button>
								</div>
							</div>
						</div>
					</PopoverBody>
				</PopoverContent>
			</Popover>
		</div>
	)
}

export default EnergyBar
