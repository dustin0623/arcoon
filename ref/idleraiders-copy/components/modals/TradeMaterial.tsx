'use client'

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ArrowLeftRight, ArrowRight, Check, Coins, Loader2, X, AlertTriangle } from 'lucide-react'
import { MATERIAL_IMAGES } from '@/features/images'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

interface MaterialMeta {
	id: string
	name: string
	zone: string
	category?: string
}

interface OwnedMaterial {
	id: string
	quantity: number
}

export type TradePhase = 'idle' | 'trading' | 'success' | 'error'

interface TradeMaterialModalProps {
	open: boolean
	onClose: () => void
	/** Zone name lookup, e.g. { d1: 'Goblin Cave', ... } */
	zoneNames: Record<string, string>
	/** Source material the player is trading away (required — opens the modal) */
	sourceMeta: MaterialMeta | null
	sourceOwned: number
	/** Target materials the player can receive (next zone up) */
	availableTargets: MaterialMeta[]
	/** Owned quantity lookup for target display */
	materialById: Map<string, OwnedMaterial>
	/** Fixed trade ratio (5:1) */
	conversionRatio: number
	/** Coin fee for the selected target's zone (takes quantity into account) */
	getCoinCost: (targetMaterialId: string, quantity: number) => number
	playerCoins: number
	/** Currently selected target id (modal owns this via parent) */
	selectedTargetId: string
	onSelectTarget: (targetId: string) => void
	/** Number of conversions to perform */
	quantity: number
	onQuantityChange: (quantity: number) => void
	/** Confirm trade handler */
	onConfirmTrade: () => Promise<void> | void
	/** Flow phase driven by the parent — drives the in-modal status UI */
	phase: TradePhase
	/** Optional subtext shown under the success/error status */
	phaseMessage?: string
	/** Called from the error screen's "Try Again" button */
	onDismissError?: () => void
}

/**
 * TradeMaterialModal — pops up when a source material is selected on the
 * Material Trader page. Drives a four-phase UX inside the modal itself
 * (idle → trading → success|error) instead of emitting toast notifications.
 * Becomes a bottom drawer on mobile.
 */
const TradeMaterialModal = ({
	open,
	onClose,
	zoneNames,
	sourceMeta,
	sourceOwned,
	availableTargets,
	materialById,
	conversionRatio,
	getCoinCost,
	playerCoins,
	selectedTargetId,
	onSelectTarget,
	quantity,
	onQuantityChange,
	onConfirmTrade,
	phase,
	phaseMessage,
	onDismissError,
}: TradeMaterialModalProps) => {
	const isMobile = useIsMobile()

	if (typeof document === 'undefined') return null
	if (!sourceMeta) return null

	const materialsNeeded = quantity * conversionRatio
	const coinCost = selectedTargetId ? getCoinCost(selectedTargetId, quantity) : 0
	const targetMeta = availableTargets.find((t) => t.id === selectedTargetId) ?? null
	const maxQuantity = Math.floor(sourceOwned / conversionRatio)
	const canConvert =
		!!selectedTargetId && sourceOwned >= materialsNeeded && playerCoins >= coinCost
	const nextZoneName =
		zoneNames[getNextZone(sourceMeta.zone, Object.keys(zoneNames))] ?? 'Next Zone'

	// ── Transient phase panels (trading / success / error) ────────────────────
	const phasePanel = (
		<AnimatePresence mode="wait">
			{phase === 'trading' && (
				<motion.div
					key="trading"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.2 }}
					className="flex flex-col items-center justify-center gap-4 py-14"
				>
					<div className="relative h-20 w-20">
						<div className="absolute inset-0 rounded-full border-2 border-primary/20" />
						<Loader2 size={80} className="absolute inset-0 text-primary animate-spin" strokeWidth={2.25} />
					</div>
					<div className="text-center">
						<p className="font-display text-lg font-bold text-foreground">Trading...</p>
						<p className="text-[11px] text-muted-foreground mt-1">
							Converting {conversionRatio}x {sourceMeta.name}
						</p>
					</div>
				</motion.div>
			)}

			{phase === 'success' && (
				<motion.div
					key="success"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="flex flex-col items-center justify-center gap-4 py-14"
				>
					<motion.div
						initial={{ scale: 0, rotate: -45 }}
						animate={{ scale: 1, rotate: 0 }}
						transition={{ type: 'spring', damping: 14, stiffness: 220 }}
						className="relative h-20 w-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/50 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.35)]"
					>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.12, type: 'spring', damping: 12, stiffness: 260 }}
						>
							<Check size={44} className="text-emerald-400" strokeWidth={3} />
						</motion.div>
					</motion.div>
					<div className="text-center">
						<p className="font-display text-xl font-bold text-foreground">Trade Successful!</p>
						{phaseMessage && (
							<p className="text-xs text-emerald-400 mt-1 font-medium">{phaseMessage}</p>
						)}
					</div>
				</motion.div>
			)}

			{phase === 'error' && (
				<motion.div
					key="error"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="flex flex-col items-center justify-center gap-4 py-12"
				>
					<div className="relative h-20 w-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
						<AlertTriangle size={40} className="text-red-400" strokeWidth={2.25} />
					</div>
					<div className="text-center max-w-sm">
						<p className="font-display text-lg font-bold text-foreground">Trade Failed</p>
						<p className="text-xs text-muted-foreground mt-1">
							{phaseMessage ?? 'Something went wrong. Please try again.'}
						</p>
					</div>
					<button
						onClick={onDismissError}
						className="h-10 px-6 rounded-lg bg-secondary/60 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
					>
						Try Again
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	)

	// ── Idle body (picker + summary + confirm) ────────────────────────────────
	const idleBody = (
		<>
			{/* Target material picker */}
			<div className="space-y-2 mb-4">
				{availableTargets.length === 0 ? (
					<div className="rounded-lg border border-border/60 bg-secondary/25 p-6 text-center">
						<p className="text-xs text-muted-foreground">
							No trade destinations available for this zone
						</p>
					</div>
				) : (
					availableTargets.map((mat) => {
						const isSelected = selectedTargetId === mat.id
						const owned = materialById.get(mat.id)?.quantity ?? 0
						const materialImage = MATERIAL_IMAGES[mat.id]

						return (
							<motion.button
								key={mat.id}
								whileTap={{ scale: 0.98 }}
								onClick={() => onSelectTarget(isSelected ? '' : mat.id)}
								className={`relative w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
									isSelected
										? 'border-emerald-500/50 bg-emerald-500/10'
										: 'border-border/50 bg-secondary/25 hover:border-emerald-500/30 hover:bg-secondary/40'
								}`}
							>
								{materialImage && (
									<div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
										<Image src={materialImage} alt={mat.name} fill className="object-cover" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p
										className={`text-sm font-medium truncate ${isSelected ? 'text-emerald-400' : 'text-foreground'}`}
									>
										{mat.name}
									</p>
									<p className="text-[10px] text-muted-foreground">{owned}x owned</p>
								</div>
								{isSelected && (
									<div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
										<Check size={12} className="text-white" />
									</div>
								)}
							</motion.button>
						)
					})
				)}
			</div>

			{/* Trade summary — only shown after a target is picked */}
			<AnimatePresence>
				{selectedTargetId && targetMeta && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden"
					>
						<div className="rounded-xl border border-primary/20 bg-secondary/20 p-4 space-y-3">
							<p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
								Trade Summary
							</p>

							{/* Quantity selector */}
							{maxQuantity > 1 && (
								<div className="flex items-center justify-center gap-3">
									<button
										onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
										disabled={quantity <= 1}
										className="h-8 w-8 rounded-lg bg-secondary/60 text-foreground font-bold transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
									>
										-
									</button>
									<div className="flex flex-col items-center min-w-[60px]">
										<span className="text-lg font-bold text-primary">{quantity}</span>
										<span className="text-[9px] text-muted-foreground">trades</span>
									</div>
									<button
										onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
										disabled={quantity >= maxQuantity}
										className="h-8 w-8 rounded-lg bg-secondary/60 text-foreground font-bold transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
									>
										+
									</button>
									{maxQuantity > 1 && (
										<button
											onClick={() => onQuantityChange(maxQuantity)}
											className="h-8 px-3 rounded-lg bg-primary/20 text-primary text-xs font-semibold transition-colors hover:bg-primary/30"
										>
											Max
										</button>
									)}
								</div>
							)}

							{/* Visual preview */}
							<div className="flex items-center justify-center gap-3">
								<div className="flex items-center gap-2">
									{MATERIAL_IMAGES[sourceMeta.id] && (
										<div className="relative w-11 h-11 rounded-lg bg-secondary/50 overflow-hidden">
											<Image
												src={MATERIAL_IMAGES[sourceMeta.id]}
												alt={sourceMeta.name}
												fill
												className="object-cover"
											/>
										</div>
									)}
									<div>
										<p className="text-sm font-bold text-amber-400 leading-tight">
											{materialsNeeded}x
										</p>
										<p className="text-[10px] text-muted-foreground truncate max-w-[90px]">
											{sourceMeta.name}
										</p>
									</div>
								</div>

								<ArrowRight size={18} className="text-primary shrink-0" />

								<div className="flex items-center gap-2">
									{MATERIAL_IMAGES[targetMeta.id] && (
										<div className="relative w-11 h-11 rounded-lg bg-secondary/50 overflow-hidden">
											<Image
												src={MATERIAL_IMAGES[targetMeta.id]}
												alt={targetMeta.name}
												fill
												className="object-cover"
											/>
										</div>
									)}
									<div>
										<p className="text-sm font-bold text-emerald-400 leading-tight">{quantity}x</p>
										<p className="text-[10px] text-muted-foreground truncate max-w-[90px]">
											{targetMeta.name}
										</p>
									</div>
								</div>
							</div>

							{/* Requirements */}
							<div className="flex items-center justify-center gap-5 text-[11px] pt-1 border-t border-border/40">
								<div className="flex items-center gap-1.5">
									<span className="text-muted-foreground">Materials:</span>
									<span
										className={
											sourceOwned >= materialsNeeded ? 'text-emerald-400' : 'text-amber-400'
										}
									>
										{sourceOwned}/{materialsNeeded}
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<Coins size={12} className="text-amber-400" />
									<span className="text-muted-foreground">Fee:</span>
									<span
										className={playerCoins >= coinCost ? 'text-emerald-400' : 'text-amber-400'}
									>
										{coinCost.toLocaleString()}
									</span>
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Confirm button */}
			<button
				onClick={onConfirmTrade}
				disabled={!canConvert}
				className={`mt-4 h-12 w-full rounded-lg text-sm font-bold transition-all ${
					canConvert
						? 'bg-primary text-primary-foreground shadow-[0_6px_24px_rgba(251,191,36,0.25)] hover:bg-primary/90 active:scale-[0.98]'
						: 'bg-secondary text-muted-foreground cursor-not-allowed'
				}`}
			>
				{selectedTargetId ? (
					<span className="flex items-center justify-center gap-2">
						<ArrowLeftRight size={16} />
						Confirm Trade
					</span>
				) : (
					<span className="text-muted-foreground">Select a material to receive</span>
				)}
			</button>

			{!canConvert && selectedTargetId && (
				<p className="mt-2 text-center text-[11px] text-amber-400/80">
					{sourceOwned < materialsNeeded
						? `Need ${materialsNeeded - sourceOwned} more ${sourceMeta.name}`
						: playerCoins < coinCost
							? `Need ${(coinCost - playerCoins).toLocaleString()} more coins`
							: ''}
				</p>
			)}
		</>
	)

	// Swap body based on phase — header/context stays visible throughout
	const body = phase === 'idle' ? idleBody : phasePanel

	// Mobile: bottom drawer
	if (isMobile) {
		return (
			<Drawer
				open={open}
				onOpenChange={(o) => {
					// Prevent closing while a trade is in-flight
					if (!o && phase !== 'trading') onClose()
				}}
				dismissible={phase !== 'trading'}
			>
				<DrawerContent className="border-border">
					<DrawerHeader className="text-left">
						<DrawerTitle className="flex items-center gap-2 text-base">
							{sourceMeta.name}
							<ArrowRight size={14} className="text-primary shrink-0" />
							<span className="text-emerald-400 text-sm font-medium">{nextZoneName}</span>
						</DrawerTitle>
						<DrawerDescription className="text-xs">
							Trade <span className="text-amber-400 font-semibold">{conversionRatio}x</span>{' '}
							{sourceMeta.name} to get{' '}
							<span className="text-emerald-400 font-semibold">1x</span> of any option below
						</DrawerDescription>
					</DrawerHeader>
					<div className="px-5 pb-6 overflow-y-auto">{body}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	// Desktop: centered portal modal
	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
					onClick={() => {
						if (phase !== 'trading') onClose()
					}}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						transition={{ type: 'spring', damping: 22, stiffness: 260 }}
						onClick={(e) => e.stopPropagation()}
						className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-primary/30 bg-linear-to-br from-background via-background to-primary/5 shadow-2xl"
					>
						{/* Close button — hidden while trading so the flow can't be interrupted */}
						{phase !== 'trading' && (
							<button
								onClick={onClose}
								aria-label="Close trade modal"
								className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
							>
								<X size={16} />
							</button>
						)}

						<div className="p-5 md:p-6">
							{/* Header */}
							<div className="mb-4">
								<p className="text-[10px] uppercase tracking-wider text-primary mb-1">
									Select Material to Receive
								</p>
								<div className="flex items-center gap-2 flex-wrap">
									<h2 className="font-display text-xl font-bold text-foreground leading-tight">
										{sourceMeta.name}
									</h2>
									<ArrowRight size={16} className="text-primary shrink-0" />
									<span className="text-xs font-medium text-emerald-400">{nextZoneName}</span>
								</div>
								<p className="text-[11px] text-muted-foreground mt-0.5">
									Trade <span className="text-amber-400 font-semibold">{conversionRatio}x</span>{' '}
									{sourceMeta.name} to get{' '}
									<span className="text-emerald-400 font-semibold">1x</span> of any option below
								</p>
							</div>

							{body}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	)
}

/** Resolve the next-zone id given the current zone and the ordered zone list. */
function getNextZone(currentZone: string, zoneOrder: string[]): string {
	const idx = zoneOrder.indexOf(currentZone)
	if (idx < 0 || idx >= zoneOrder.length - 1) return ''
	return zoneOrder[idx + 1]
}

export default TradeMaterialModal
