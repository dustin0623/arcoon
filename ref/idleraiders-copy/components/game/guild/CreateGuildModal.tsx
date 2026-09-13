'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Castle } from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
} from '@/components/ui/drawer'

const GUILD_MIN_LEVEL = 16

export const CreateGuildModal = ({
	open,
	onClose,
	onSuccess,
	actions,
	refreshGuild,
	playerCoins = 0,
	playerLevel = 0,
}: {
	open: boolean
	onClose: () => void
	onSuccess?: () => void
	actions: Record<string, any>
	refreshGuild: () => void
	playerCoins?: number
	playerLevel?: number
}) => {
	const isMobile = useIsMobile()
	const [guildName, setGuildName] = useState('')
	const [motto, setMotto] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const CREATION_FEE = 10000
	const canAfford = playerCoins >= CREATION_FEE
	const isLevelLocked = playerLevel < GUILD_MIN_LEVEL
	const canCreate = canAfford && !isLevelLocked && guildName.trim()

	const handleCreate = async () => {
		if (!guildName.trim()) {
			toast.error('Guild name is required')
			return
		}
		try {
			setIsLoading(true)
			await actions.createGuild(guildName, motto)
			await refreshGuild()
			toast.success('Guild created!')
			setGuildName('')
			setMotto('')
			onSuccess?.()
		} catch (error) {
			toast.error((error as Error).message || 'Error creating guild')
		} finally {
			setIsLoading(false)
		}
	}

	if (!open) return null

	// ── Shared body ──────────────────────────────────────────────────────────
	const body = (
		<div className="space-y-3">
			{/* Level Lock Warning */}
			{isLevelLocked && (
				<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2">
					<Lock size={16} className="text-amber-500 shrink-0 mt-0.5" />
					<div>
						<p className="text-xs font-semibold text-amber-400">Level {GUILD_MIN_LEVEL} Required</p>
						<p className="text-[10px] text-amber-300/80 mt-0.5">
							You are level {playerLevel}. Progress through story quests to reach level {GUILD_MIN_LEVEL}.
						</p>
					</div>
				</div>
			)}

			{/* Creation fee notice */}
			<div
				className={`rounded-lg border px-3 py-2 text-[10px] ${canAfford ? 'border-primary/30 bg-primary/5 text-primary' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}
			>
				<span className="font-bold">Creation Fee: {CREATION_FEE.toLocaleString()} Realm Coins</span>
				{!canAfford && (
					<span className="block mt-0.5 text-destructive/80">
						You need {(CREATION_FEE - playerCoins).toLocaleString()} more tokens
					</span>
				)}
			</div>

			<div>
				<label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
					Guild Name
				</label>
				<input
					type="text"
					value={guildName}
					onChange={(e) => setGuildName(e.target.value.slice(0, 30))}
					className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
					placeholder="Enter guild name"
					maxLength={30}
					disabled={isLoading}
				/>
				<p className="text-[9px] text-muted-foreground mt-1">{guildName.length}/30 characters</p>
			</div>

			<div>
				<label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
					Motto (Optional)
				</label>
				<input
					type="text"
					value={motto}
					onChange={(e) => setMotto(e.target.value.slice(0, 100))}
					className="w-full mt-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
					placeholder="Enter guild motto"
					maxLength={100}
					disabled={isLoading}
				/>
				<p className="text-[9px] text-muted-foreground mt-1">{motto.length}/100 characters</p>
			</div>

			<button
				onClick={handleCreate}
				disabled={!canCreate || isLoading}
				className="w-full px-4 py-2.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading
					? 'Creating...'
					: isLevelLocked
						? `Reach Level ${GUILD_MIN_LEVEL}`
						: `Create Guild · ${CREATION_FEE.toLocaleString()}`}
			</button>
		</div>
	)

	// ── Mobile: bottom drawer (default max-h-[80vh]) ─────────────────────────
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
				<DrawerContent className="border-border p-0 flex flex-col">
					<DrawerHeader className="text-left px-4 pt-2 pb-3">
						<DrawerTitle className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
							<Castle size={14} className="text-primary" />
							Create Guild
						</DrawerTitle>
						<DrawerDescription className="sr-only">
							Create a new guild and invite your allies.
						</DrawerDescription>
					</DrawerHeader>
					<div className="flex-1 overflow-y-auto px-4 pb-6">{body}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	// ── Desktop: original centered portal modal ──────────────────────────────
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
					className="w-full max-w-sm"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="fantasy-card space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
								<Castle size={14} className="text-primary" />
								Create Guild
							</h3>
							<button
								onClick={onClose}
								className="p-1 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
							>
								<X size={14} />
							</button>
						</div>

						{body}
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>,
		document.body,
	)
}
