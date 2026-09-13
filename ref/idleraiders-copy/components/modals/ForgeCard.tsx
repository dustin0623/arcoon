'use client'

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Layers, Loader2, Package, Sparkles, Wand2, X } from 'lucide-react'
import GameCard from '@/components/ui/game-card'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

export type ForgePhase = 'idle' | 'forging' | 'success' | 'error'

interface MaterialRequirement {
	materialId: string
	required: number
	available: number
}

interface ForgeCardModalProps {
	open: boolean
	onClose: () => void
	selectedCard: Record<string, any> | null
	requirements: MaterialRequirement[]
	gameData: { ITEMS?: Array<{ id: string; name?: string; type?: string }> } | null
	canCraft: boolean
	onCraft: () => void
	phase: ForgePhase
	phaseMessage?: string
	onDismissError?: () => void
}

/**
 * ForgeCardModal — four-phase in-modal flow:
 *   idle     → picker with material requirements and "Forge Card" button
 *   forging  → large spinner with "Forging..." subtext (modal becomes inert)
 *   success  → big animated check + "Card Forged!" + name of the card
 *   error    → red icon + server message + "Try Again" button
 * Renders as a bottom drawer on mobile, centered portal modal on desktop.
 */
const ForgeCardModal = ({
	open,
	onClose,
	selectedCard,
	requirements,
	gameData,
	canCraft,
	onCraft,
	phase,
	phaseMessage,
	onDismissError,
}: ForgeCardModalProps) => {
	const isMobile = useIsMobile()

	if (typeof document === 'undefined') return null
	if (!selectedCard) return null

	const busy = phase === 'forging'

	// ── Body fragments for each phase ─────────────────────────────────────────

	const idleBody = (
		<>
			{/* Two-column: card art + requirements */}
			<div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5">
				{/* Card art */}
				<div className="flex justify-center">
					<div className="w-full max-w-[180px]">
						<GameCard item={selectedCard} type="card" layout="portrait" />
					</div>
				</div>

				{/* Material requirements */}
				<div className="space-y-2">
					<p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
						Materials Required
					</p>
					{requirements.length > 0 ? (
						requirements.map((req) => {
							const materialData = gameData?.ITEMS?.find((item) => item.id === req.materialId)
							const complete = req.available >= req.required
							const percent = Math.min(100, Math.round((req.available / req.required) * 100))
							const materialName = materialData?.name ?? req.materialId
							const materialType = materialData?.type ?? 'material'

							const IconComponent =
								materialType === 'core'
									? Package
									: materialType === 'component'
										? Layers
										: materialType === 'catalyst'
											? Sparkles
											: Package

							return (
								<div
									key={req.materialId}
									className="rounded-lg border border-border/60 bg-secondary/25 p-2.5"
								>
									<div className="mb-1.5 flex items-center justify-between">
										<div className="flex items-center gap-1.5 flex-1 min-w-0">
											<IconComponent
												size={13}
												className={complete ? 'text-emerald-400' : 'text-amber-400'}
											/>
											<span className="text-xs font-medium text-foreground truncate">
												{materialName}
											</span>
										</div>
										<span
											className={`text-[11px] font-semibold ${complete ? 'text-emerald-400' : 'text-amber-400'} ml-2 shrink-0`}
										>
											{req.available}/{req.required}
										</span>
									</div>
									<div className="h-1.5 overflow-hidden rounded-full bg-secondary">
										<div
											className={`h-full rounded-full ${complete ? 'bg-emerald-400' : 'bg-amber-400'}`}
											style={{ width: `${percent}%` }}
										/>
									</div>
								</div>
							)
						})
					) : (
						<p className="text-xs text-muted-foreground text-center py-4">
							No materials required (or not configured)
						</p>
					)}
				</div>
			</div>

			{/* Craft button */}
			<Button
				onClick={onCraft}
				disabled={!canCraft}
				className="mt-5 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
			>
				<Wand2 size={16} className="mr-2" />
				Forge Card
			</Button>

			{!canCraft && (
				<p className="mt-2 text-center text-[11px] text-amber-400/80">
					Gather the remaining materials to forge this card
				</p>
			)}
		</>
	)

	const forgingBody = (
		<div className="flex flex-col items-center justify-center py-12 md:py-16 gap-4">
			<div className="relative flex h-24 w-24 items-center justify-center">
				<motion.div
					aria-hidden
					className="absolute inset-0 rounded-full bg-primary/10"
					animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
					transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
				/>
				<Loader2 size={56} className="relative text-primary animate-spin" />
			</div>
			<div className="text-center">
				<p className="font-display text-lg font-bold text-foreground">Forging...</p>
				<p className="mt-1 text-xs text-muted-foreground">Binding the materials together</p>
			</div>
		</div>
	)

	const successBody = (
		<div className="flex flex-col items-center justify-center py-10 md:py-14 gap-4">
			<motion.div
				initial={{ scale: 0, rotate: -30, opacity: 0 }}
				animate={{ scale: 1, rotate: 0, opacity: 1 }}
				transition={{ type: 'spring', damping: 12, stiffness: 220 }}
				className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-400/40"
			>
				<CheckCircle2 size={60} className="text-emerald-400" />
			</motion.div>
			<div className="text-center">
				<p className="font-display text-lg font-bold text-foreground">Card Forged!</p>
				{phaseMessage ? (
					<p className="mt-1 text-sm text-emerald-400/90">{phaseMessage}</p>
				) : (
					<p className="mt-1 text-xs text-muted-foreground">Added to your collection</p>
				)}
			</div>
		</div>
	)

	const errorBody = (
		<div className="flex flex-col items-center justify-center py-10 gap-4">
			<motion.div
				initial={{ scale: 0.85, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: 'spring', damping: 18, stiffness: 260 }}
				className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 ring-2 ring-red-400/40"
			>
				<AlertTriangle size={44} className="text-red-400" />
			</motion.div>
			<div className="text-center max-w-xs">
				<p className="font-display text-base font-bold text-foreground">Forge Failed</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{phaseMessage || 'Something went wrong. Please try again.'}
				</p>
			</div>
			<Button
				onClick={onDismissError}
				variant="secondary"
				className="mt-1 h-10 min-w-[140px] border border-border"
			>
				Try Again
			</Button>
		</div>
	)

	const body = (
		<AnimatePresence mode="wait">
			<motion.div
				key={phase}
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -6 }}
				transition={{ duration: 0.2 }}
			>
				{phase === 'forging' && forgingBody}
				{phase === 'success' && successBody}
				{phase === 'error' && errorBody}
				{phase === 'idle' && idleBody}
			</motion.div>
		</AnimatePresence>
	)

	// ── Mobile: bottom drawer ─────────────────────────────────────────────────
	if (isMobile) {
		return (
			<Drawer
				open={open}
				onOpenChange={(o) => {
					if (busy) return
					if (!o) onClose()
				}}
			>
				<DrawerContent className="border-border">
					<DrawerHeader className="text-left">
						<DrawerTitle className="text-lg">{selectedCard.name ?? 'Selected Recipe'}</DrawerTitle>
						<DrawerDescription className="capitalize text-xs">
							Forge Preview · {selectedCard.class} • {selectedCard.rarity}
						</DrawerDescription>
					</DrawerHeader>
					<div className="px-5 pb-6 overflow-y-auto">{body}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	// ── Desktop: centered portal modal ────────────────────────────────────────
	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
					onClick={() => {
						if (busy) return
						onClose()
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
						{/* Close button — hidden while forging so the user can't interrupt */}
						{!busy && (
							<button
								onClick={onClose}
								aria-label="Close forge preview"
								className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
							>
								<X size={16} />
							</button>
						)}

						<div className="p-5 md:p-6">
							{/* Header */}
							<div className="mb-4">
								<p className="text-[10px] uppercase tracking-wider text-primary mb-1">Forge Preview</p>
								<h2 className="font-display text-xl font-bold text-foreground leading-tight">
									{selectedCard.name ?? 'Selected Recipe'}
								</h2>
								<p className="text-xs text-muted-foreground capitalize mt-0.5">
									{selectedCard.class} • {selectedCard.rarity}
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

export default ForgeCardModal
