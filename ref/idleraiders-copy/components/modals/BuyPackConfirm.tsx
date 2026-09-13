'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import CurrencyIcon from '@/components/CurrencyIcon'

type Currency = 'shard' | 'token' | 'dollar'

type BuyPackConfirmProps = {
	open: boolean
	onClose: () => void
	packName: string
	packImage: string
	currency: Currency
	currencyLabel: string
	unitPrice: number
	balance: number
	/**
	 * The confirmation handler must resolve to `true` on success and `false`
	 * (or throw) on failure. The modal uses this to flip into the success
	 * phase and auto-close, or back to the idle phase on failure.
	 */
	onConfirm: (quantity: number) => Promise<boolean>
}

// Hard cap per purchase — keeps the stepper tidy and prevents runaway clicks.
const MAX_PER_BUY = 25

// How long to hold the success state before the modal auto-closes.
const SUCCESS_HOLD_MS = 1200

/**
 * Purchase confirmation modal — mirrors OpenPackConfirm's UX so the buy-flow
 * feels consistent with the open-flow. The parent provides which currency is
 * being used (token/shard/dollar) and the unit price; the modal handles the
 * quantity stepper, total-price math, and affordability checks.
 */
export default function BuyPackConfirm({
	open,
	onClose,
	packName,
	packImage,
	currency,
	currencyLabel,
	unitPrice,
	balance,
	onConfirm,
}: BuyPackConfirmProps) {
	const isMobile = useIsMobile()
	const [qty, setQty] = useState(1)
	// Internal phase machine — the parent only wires up onConfirm/onClose; the
	// modal decides when to show the loader vs. the success state.
	const [phase, setPhase] = useState<'idle' | 'buying' | 'success'>('idle')

	// Reset qty + phase each time the modal opens so the user always starts
	// from a clean idle state.
	useEffect(() => {
		if (!open) return
		setQty(1)
		setPhase('idle')
	}, [open])

	// When we enter the success phase, auto-close after a short hold so the
	// user gets a beat of positive feedback before the modal dismisses.
	useEffect(() => {
		if (phase !== 'success') return
		const t = setTimeout(() => onClose(), SUCCESS_HOLD_MS)
		return () => clearTimeout(t)
	}, [phase, onClose])

	const clampedQty = Math.max(1, Math.min(MAX_PER_BUY, qty))
	const totalPrice = unitPrice * clampedQty
	const canAfford = balance >= totalPrice
	const quickOptions = [5, 10, 25]
	const isBuying = phase === 'buying'
	const isBusy = phase !== 'idle'

	const formatPrice = (n: number) =>
		currency === 'dollar' ? n.toFixed(2) : n.toLocaleString()

	const handleConfirm = async () => {
		if (isBusy || !canAfford) return
		setPhase('buying')
		try {
			const ok = await onConfirm(clampedQty)
			setPhase(ok ? 'success' : 'idle')
		} catch {
			// Parent already surfaces an error toast; just fall back to idle so
			// the user can retry or cancel.
			setPhase('idle')
		}
	}

	// Success panel shown for a brief hold once the purchase confirms. The
	// green check + short label mirror the pattern used in the other confirm
	// modals so the feedback is recognisable across the app.
	const successBody = (
		<div className="flex flex-col items-center justify-center gap-4 py-10">
			<motion.div
				className="relative flex h-20 w-20 items-center justify-center"
				initial={{ scale: 0.6, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: 'spring', stiffness: 260, damping: 18 }}
			>
				<motion.div
					aria-hidden
					className="absolute inset-0 rounded-full bg-emerald-500/15"
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: [0.9, 1.2, 1], opacity: [0.6, 0.3, 0.5] }}
					transition={{ duration: 0.9, ease: 'easeOut' }}
				/>
				<CheckCircle2 size={56} className="relative text-emerald-500" strokeWidth={2} />
			</motion.div>
			<div className="text-center">
				<p className="font-display text-base font-bold text-foreground">
					Purchase successful!
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{clampedQty > 1
						? `${clampedQty} packs added to your inventory`
						: 'Pack added to your inventory'}
				</p>
			</div>
		</div>
	)

	// Loading panel shown while the purchase is being processed on the server.
	const buyingBody = (
		<div className="flex flex-col items-center justify-center gap-4 py-10">
			<div className="relative flex h-20 w-20 items-center justify-center">
				<motion.div
					aria-hidden
					className="absolute inset-0 rounded-full bg-primary/10"
					animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
					transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
				/>
				<Loader2 size={48} className="relative text-primary animate-spin" />
			</div>
			<div className="text-center">
				<p className="font-display text-base font-bold text-foreground">
					Confirming purchase...
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{clampedQty > 1 ? `Buying ${clampedQty} packs` : 'Buying your pack'}
				</p>
			</div>
		</div>
	)

	const idleBody = (
		<div className="space-y-4">
			{/* Pack hero */}
			<div className="flex items-center gap-4 rounded-xl border border-border bg-card/50 p-4">
				<img
					src={packImage || '/placeholder.svg'}
					alt={packName}
					className="w-16 h-20 object-contain drop-shadow-lg shrink-0"
				/>
				<div className="flex-1 min-w-0">
					<p className="font-display text-base font-bold text-foreground truncate">
						{packName}
					</p>
					<p className="text-xs text-muted-foreground flex items-center gap-1">
						<CurrencyIcon type={currency} size={12} />
						{formatPrice(unitPrice)} {currencyLabel} per pack
					</p>
				</div>
			</div>

			{/* Quantity stepper — matches the OpenPackConfirm layout */}
			<div className="space-y-2">
				<div className="flex items-baseline justify-between">
					<p className="text-[10px] uppercase tracking-wider text-muted-foreground">
						Buy how many?
					</p>
					<p className="text-[10px] text-muted-foreground">Max {MAX_PER_BUY} per buy</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setQty(Math.max(1, clampedQty - 1))}
						disabled={clampedQty <= 1 || isBuying}
						className="rounded-lg bg-secondary p-2 hover:bg-muted transition-colors disabled:opacity-40"
						aria-label="Decrease quantity"
					>
						<Minus size={14} className="text-foreground" />
					</button>
					<div className="flex-1 flex items-center justify-center">
						<span className="font-mono text-2xl font-bold text-foreground">
							{clampedQty}
						</span>
					</div>
					<button
						type="button"
						onClick={() => setQty(Math.min(MAX_PER_BUY, clampedQty + 1))}
						disabled={clampedQty >= MAX_PER_BUY || isBuying}
						className="rounded-lg bg-secondary p-2 hover:bg-muted transition-colors disabled:opacity-40"
						aria-label="Increase quantity"
					>
						<Plus size={14} className="text-foreground" />
					</button>
					<div className="flex gap-1 ml-2">
						{quickOptions.map((n) => (
							<button
								key={n}
								type="button"
								onClick={() => setQty(n)}
								disabled={isBuying}
								className={`rounded-lg px-3 py-2 text-[10px] font-bold transition-all ${
									clampedQty === n
										? 'bg-primary text-primary-foreground'
										: 'bg-secondary text-muted-foreground hover:text-foreground'
								} disabled:opacity-40`}
							>
								{n}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Total + balance */}
			<div className="rounded-xl bg-background/60 border border-border/50 p-3 flex items-center justify-between">
				<div>
					<p className="text-[10px] text-muted-foreground uppercase tracking-wider">
						Total
					</p>
					<p className="font-display text-lg font-bold text-primary flex items-center gap-1.5">
						<CurrencyIcon type={currency} size={18} /> {formatPrice(totalPrice)}
					</p>
				</div>
				<div className="text-right">
					<p className="text-[10px] text-muted-foreground uppercase tracking-wider">
						Balance
					</p>
					<p className="font-semibold text-foreground text-sm inline-flex items-center gap-1 mt-0.5">
						<CurrencyIcon type={currency} size={12} /> {formatPrice(balance)}
					</p>
				</div>
			</div>
			{!canAfford && (
				<p className="text-center text-xs text-red-400">
					Not enough {currencyLabel}!
				</p>
			)}
		</div>
	)

	// Phase-aware body swap (idle → buying → success), same pattern as
	// OpenPackConfirm but with an added success hold.
	const body = (
		<AnimatePresence mode="wait">
			<motion.div
				key={phase}
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -6 }}
				transition={{ duration: 0.2 }}
			>
				{phase === 'buying' ? buyingBody : phase === 'success' ? successBody : idleBody}
			</motion.div>
		</AnimatePresence>
	)

	const titleContent = (
		<span className="flex items-center gap-2">
			<Sparkles size={16} className="text-primary" />
			Buy {packName}?
		</span>
	)

	const descriptionCopy = `Purchase with ${currencyLabel}. Packs will be added to your inventory once the transaction completes.`

	const confirmLabel = isBuying ? (
		<>
			<Loader2 size={14} className="animate-spin" />
			Buying...
		</>
	) : (
		<>
			<Sparkles size={14} />
			Buy {clampedQty}
		</>
	)

	if (isMobile) {
		return (
			<Drawer
				open={open}
				onOpenChange={(v) => {
					// Block swipe/tap-outside close while processing OR showing the
					// success animation — the modal dismisses itself on success.
					if (isBusy) return
					if (!v) onClose()
				}}
				dismissible={!isBusy}
			>
				<DrawerContent className="border-border">
					<DrawerHeader className="text-left">
						<DrawerTitle>{titleContent}</DrawerTitle>
						<DrawerDescription>{descriptionCopy}</DrawerDescription>
					</DrawerHeader>
					<div className="px-4">{body}</div>
					{phase === 'idle' && (
						<DrawerFooter className="gap-2 pt-4">
							<Button
								onClick={handleConfirm}
								disabled={!canAfford}
								className="fantasy-btn flex items-center justify-center gap-2"
							>
								{confirmLabel}
							</Button>
							<Button variant="outline" onClick={onClose}>
								Cancel
							</Button>
						</DrawerFooter>
					)}
				</DrawerContent>
			</Drawer>
		)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				// Block outside/Esc close while a purchase is in flight or the
				// success animation is playing — the modal auto-closes itself.
				if (isBusy) return
				if (!v) onClose()
			}}
		>
			<DialogContent
				className="sm:max-w-md"
				onEscapeKeyDown={(e) => {
					if (isBusy) e.preventDefault()
				}}
				onInteractOutside={(e) => {
					if (isBusy) e.preventDefault()
				}}
				onPointerDownOutside={(e) => {
					if (isBusy) e.preventDefault()
				}}
			>
				<DialogHeader>
					<DialogTitle>{titleContent}</DialogTitle>
					<DialogDescription>{descriptionCopy}</DialogDescription>
				</DialogHeader>
				{body}
				{phase === 'idle' && (
					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirm}
							disabled={!canAfford}
							className="fantasy-btn flex items-center justify-center gap-2"
						>
							{confirmLabel}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	)
}
