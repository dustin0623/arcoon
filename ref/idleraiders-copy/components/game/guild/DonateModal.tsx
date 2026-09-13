'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

export const DonateModal = ({
	open,
	onClose,
	playerState,
	guildConstants,
	refreshGuild,
	actions,
}: {
	open: boolean
	onClose: () => void
	playerState: Record<string, any> | null
	guildConstants: Record<string, any>
	refreshGuild: () => void
	actions: Record<string, any>
}) => {
	const isMobile = useIsMobile()
	const materials = playerState?.materials ?? []
	const DONATION_RATES = guildConstants?.DONATION_RATES ?? {}
	const DONATION_AMOUNT = guildConstants?.DONATION_AMOUNT ?? 10
	const [selected, setSelected] = useState<Record<string, number>>({})

	const totalXp = useMemo(() => {
		let xp = 0
		for (const [id, qty] of Object.entries(selected)) {
			if (qty <= 0) continue
			const rate = DONATION_RATES[id]
			if (!rate) continue
			const mat = materials.find((m: Record<string, any>) => m.id === id)
			const isBoss = mat?.type === 'boss'
			const amt = isBoss ? 1 : DONATION_AMOUNT
			xp += isBoss ? rate * qty : Math.floor((rate * amt) / 10) * qty
		}
		return xp
	}, [selected, materials, DONATION_RATES, DONATION_AMOUNT])

	const handleDonateAll = async () => {
		let totalEarned = 0
		let anyFailed = false

		for (const [id, batches] of Object.entries(selected)) {
			if (batches <= 0) continue
			const result = await actions.donateMaterial(id, batches)
			if (result?.xpGained > 0) {
				totalEarned += result.xpGained
			} else {
				anyFailed = true
			}
		}

		if (totalEarned > 0) {
			toast.success(`Donated! +${totalEarned} Guild XP`)
			setSelected({})
			await refreshGuild()
			onClose()
		} else if (anyFailed) {
			toast.error('Not enough materials')
		}
	}

	// Shared material-list body — rendered inside both the desktop modal and
	// the mobile drawer so the two code paths don't duplicate JSX.
	const materialList = (
		<div className="space-y-1.5">
			{materials
				.filter((mat: Record<string, any>) => mat.type === 'core')
				.map((mat: Record<string, any>) => {
					const rate = DONATION_RATES[mat.id]
					if (!rate) return null
					const isBoss = mat.type === 'boss'
					const amt = isBoss ? 1 : DONATION_AMOUNT
					const maxBatches = Math.floor(mat.quantity / amt)
					const currentQty = selected[mat.id] || 0
					const xpPerBatch = isBoss ? rate : Math.floor((rate * amt) / 10)

					return (
						<div
							key={mat.id}
							className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-2.5 py-2"
						>
							<span className="text-sm">{mat.icon}</span>
							<div className="flex-1 min-w-0">
								<p className="text-[10px] font-medium text-foreground truncate">{mat.name}</p>
								<p className="text-[9px] text-muted-foreground">
									{mat.quantity} owned · {xpPerBatch} XP per donation ({amt} materials)
								</p>
							</div>
							<div className="flex items-center gap-1 shrink-0">
								<button
									onClick={() =>
										setSelected((s) => ({
											...s,
											[mat.id]: Math.max(0, (s[mat.id] || 0) - 1),
										}))
									}
									disabled={currentQty <= 0}
									className="w-6 h-6 rounded-md bg-secondary border border-border text-xs font-bold text-foreground flex items-center justify-center disabled:opacity-30"
								>
									−
								</button>
								<input
									type="text"
									inputMode="numeric"
									value={currentQty}
									onChange={(e) => {
										const val = e.target.value.replace(/[^0-9]/g, '')
										const num =
											val === ''
												? 0
												: Math.min(maxBatches, Math.max(0, parseInt(val, 10)))
										setSelected((s) => ({
											...s,
											[mat.id]: isNaN(num) ? 0 : num,
										}))
									}}
									onFocus={(e) => e.target.select()}
									className="w-12 h-6 rounded-md bg-background border border-border text-xs font-bold text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<button
									onClick={() =>
										setSelected((s) => ({
											...s,
											[mat.id]: Math.min(maxBatches, (s[mat.id] || 0) + 1),
										}))
									}
									disabled={currentQty >= maxBatches}
									className="w-6 h-6 rounded-md bg-secondary border border-border text-xs font-bold text-foreground flex items-center justify-center disabled:opacity-30"
								>
									+
								</button>
								{maxBatches > 0 && (
									<button
										onClick={() =>
											setSelected((s) => ({
												...s,
												[mat.id]: maxBatches,
											}))
										}
										className="ml-0.5 px-1.5 h-6 rounded-md bg-primary/20 border border-primary/30 text-[9px] font-semibold text-primary hover:bg-primary/30 transition-colors"
									>
										Max
									</button>
								)}
							</div>
						</div>
					)
				})}
		</div>
	)

	// Shared footer — Total XP + Donate CTA
	const footerRow = (
		<div className="fantasy-card flex items-center justify-between">
			<div>
				<p className="text-[10px] text-muted-foreground">Total Guild XP</p>
				<p className="font-display text-lg font-bold text-primary">+{formatNumber(totalXp)}</p>
			</div>
			<button
				onClick={handleDonateAll}
				disabled={totalXp === 0}
				className="fantasy-btn px-4 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Donate
			</button>
		</div>
	)

	if (!open) return null

	// ── Mobile: bottom drawer (default max-h-[80vh]) ─────────────────────────
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
				<DrawerContent className="border-border p-0 flex flex-col">
					<DrawerHeader className="px-4 pt-2 pb-3 text-left">
						<DrawerTitle className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
							<Gift size={14} className="text-primary" />
							Donate Materials
						</DrawerTitle>
						<DrawerDescription className="text-[10px] text-muted-foreground">
							Select materials to donate. Each step costs{' '}
							<span className="text-primary font-semibold">{DONATION_AMOUNT} materials</span>.
						</DrawerDescription>
					</DrawerHeader>

					<div className="flex-1 overflow-y-auto px-4">{materialList}</div>

					<div className="p-4 pt-3 border-t border-border">{footerRow}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	// ── Desktop: original centered modal ─────────────────────────────────────
	if (typeof document === 'undefined') return null

	return createPortal(
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.9, opacity: 0 }}
					className="w-full max-w-sm space-y-3"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex items-center justify-between">
						<h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
							<Gift size={14} className="text-primary" /> Donate Materials
						</h3>
						<button
							onClick={onClose}
							className="p-1 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
						>
							<X size={14} />
						</button>
					</div>

					<div className="fantasy-card space-y-2 max-h-[50vh] overflow-y-auto">
						<p className="text-[10px] text-muted-foreground">
							Select materials to donate. Each step costs{' '}
							<span className="text-primary font-semibold">{DONATION_AMOUNT} materials</span>.
						</p>
						{materialList}
					</div>

					{footerRow}
				</motion.div>
			</motion.div>
		</AnimatePresence>,
		document.body,
	)
}
