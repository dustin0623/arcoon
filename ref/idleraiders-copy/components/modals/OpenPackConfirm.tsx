'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Sparkles, Loader2, Package } from 'lucide-react'
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

type OpenPackConfirmProps = {
	open: boolean
	onClose: () => void
	packName: string
	packImage: string
	ownedCount: number
	isOpening?: boolean
	onConfirm: (quantity: number) => void
}

// Pre-open confirmation — mirrors the Buy flow's quantity stepper so multi-pack
// opening can be dropped in later by just changing what `onConfirm` does in the
// parent. The modal itself is already qty-aware.
export default function OpenPackConfirm({
	open,
	onClose,
	packName,
	packImage,
	ownedCount,
	isOpening = false,
	onConfirm,
}: OpenPackConfirmProps) {
	const isMobile = useIsMobile()
	const [qty, setQty] = useState(1)

	// Clamp qty to what's actually owned whenever the modal (re)opens or the
	// underlying ownedCount changes (e.g. after a successful open).
	useEffect(() => {
		if (!open) return
		setQty(1)
	}, [open])

	// Hard cap: backend/UX only supports opening up to 10 packs at a time.
	const MAX_PER_OPEN = 10
	const safeMax = Math.min(MAX_PER_OPEN, Math.max(1, ownedCount))
	const clampedQty = Math.min(Math.max(1, qty), safeMax)

	const quickOptions = [1, 5, 10].filter((n) => n <= safeMax)

	const handleConfirm = () => {
		if (isOpening || ownedCount <= 0) return
		onConfirm(clampedQty)
	}

	// Loading panel shown while the server is rolling cards. Matches the
	// crafting/trading modals' in-modal phase-swap pattern.
	const openingBody = (
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
				<p className="font-display text-base font-bold text-foreground">Setting up packs...</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{clampedQty > 1 ? `Preparing ${clampedQty} packs` : 'Preparing your pack'}
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
					<p className="font-display text-base font-bold text-foreground truncate">{packName}</p>
					<p className="text-xs text-muted-foreground flex items-center gap-1">
						<Package size={12} />
						{ownedCount} available
					</p>
				</div>
			</div>

			{/* Quantity stepper — inline chips matching the Buy selector style */}
			<div className="space-y-2">
				<div className="flex items-baseline justify-between">
					<p className="text-[10px] uppercase tracking-wider text-muted-foreground">
						Open how many?
					</p>
					{ownedCount > MAX_PER_OPEN && (
						<p className="text-[10px] text-muted-foreground">
							Max {MAX_PER_OPEN} per open
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setQty(Math.max(1, clampedQty - 1))}
						disabled={clampedQty <= 1 || isOpening}
						className="rounded-lg bg-secondary p-2 hover:bg-muted transition-colors disabled:opacity-40"
						aria-label="Decrease quantity"
					>
						<Minus size={14} className="text-foreground" />
					</button>
					<div className="flex-1 flex items-center justify-center">
						<span className="font-mono text-2xl font-bold text-foreground">{clampedQty}</span>
					</div>
					<button
						type="button"
						onClick={() => setQty(Math.min(safeMax, clampedQty + 1))}
						disabled={clampedQty >= safeMax || isOpening}
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
								disabled={isOpening}
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
		</div>
	)

	// Phase-aware body: swap between picker (idle) and loader (opening).
	const body = (
		<AnimatePresence mode="wait">
			<motion.div
				key={isOpening ? 'opening' : 'idle'}
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -6 }}
				transition={{ duration: 0.2 }}
			>
				{isOpening ? openingBody : idleBody}
			</motion.div>
		</AnimatePresence>
	)

	const titleContent = (
		<span className="flex items-center gap-2">
			<Sparkles size={16} className="text-primary" />
			Open {packName}?
		</span>
	)

	const descriptionCopy = 'Revealed cards will be added to your collection once flipped.'

	const confirmLabel = isOpening ? (
		<>
			<Loader2 size={14} className="animate-spin" />
			Opening...
		</>
	) : (
		<>
			<Sparkles size={14} />
			Open {clampedQty}
		</>
	)

	if (isMobile) {
		return (
			<Drawer
				open={open}
				onOpenChange={(v) => {
					// Prevent swipe-to-close while an open is in flight.
					if (isOpening) return
					if (!v) onClose()
				}}
				dismissible={!isOpening}
			>
				<DrawerContent className="border-border">
					<DrawerHeader className="text-left">
						<DrawerTitle>{titleContent}</DrawerTitle>
						<DrawerDescription>{descriptionCopy}</DrawerDescription>
					</DrawerHeader>
					<div className="px-4">{body}</div>
					{!isOpening && (
						<DrawerFooter className="gap-2 pt-4">
							<Button
								onClick={handleConfirm}
								disabled={ownedCount <= 0}
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
				// Block outside-click / Esc close while opening so the loader can't be dismissed.
				if (isOpening) return
				if (!v) onClose()
			}}
		>
			<DialogContent
				className="sm:max-w-md"
				// Belt-and-suspenders: block Radix's built-in close triggers while opening.
				onEscapeKeyDown={(e) => {
					if (isOpening) e.preventDefault()
				}}
				onInteractOutside={(e) => {
					if (isOpening) e.preventDefault()
				}}
				onPointerDownOutside={(e) => {
					if (isOpening) e.preventDefault()
				}}
			>
				<DialogHeader>
					<DialogTitle>{titleContent}</DialogTitle>
					<DialogDescription>{descriptionCopy}</DialogDescription>
				</DialogHeader>
				{body}
				{!isOpening && (
					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirm}
							disabled={ownedCount <= 0}
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
