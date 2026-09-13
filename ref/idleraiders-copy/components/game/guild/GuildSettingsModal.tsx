'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Crown, LogOut, X } from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
} from '@/components/ui/drawer'

export const GuildSettingsModal = ({
	open,
	onClose,
	guildData,
	refreshGuild,
	actions,
}: {
	open: boolean
	onClose: () => void
	guildData: Record<string, any> | null
	refreshGuild: () => void
	actions: Record<string, any>
}) => {
	const isMobile = useIsMobile()
	const playerRole =
		guildData?.members?.find((m: Record<string, any>) => m._self)?.role ?? guildData?._playerRole ?? 'member'
	const guildName = guildData?.name ?? ''
	const guildMotto = guildData?.motto ?? ''
	const members = guildData?.members ?? []
	const isLeader = playerRole === 'leader'
	const [editName, setEditName] = useState(guildName)
	const [editMotto, setEditMotto] = useState(guildMotto)
	const [transferTarget, setTransferTarget] = useState<string | null>(null)
	const [leaveConfirm, setLeaveConfirm] = useState(false)

	const handleSaveName = async () => {
		const trimmed = editName.trim()
		if (trimmed.length > 0 && trimmed !== guildName) {
			await actions.setGuildName(trimmed)
			await refreshGuild()
			toast.success('Guild name updated!')
		}
	}

	const handleSaveMotto = async () => {
		if (editMotto.trim() !== guildMotto) {
			await actions.setGuildMotto(editMotto.trim())
			await refreshGuild()
			toast.success('Guild motto updated!')
		}
	}

	const handleTransfer = async () => {
		if (transferTarget) {
			const member = members.find((m: Record<string, any>) => m._id === transferTarget || m.id === transferTarget)
			await actions.transferLeadership(transferTarget)
			await refreshGuild()
			toast.success(`Leadership transferred to ${member?.name}!`)
			setTransferTarget(null)
			onClose()
		}
	}

	const handleLeave = async () => {
		await actions.leaveGuild()
		await refreshGuild()
		toast.info('You left the guild.')
		onClose()
	}

	if (!open) return null

	const nonLeaderMembers = members.filter((m: Record<string, any>) => m.role !== 'leader')

	// ── Shared body — rendered identically inside the Drawer (mobile) or the
	// centered modal (desktop). Keeps behaviour and markup in one place.
	const body = (
		<div className="space-y-3">
			{isLeader && (
				<>
					{/* Guild Name */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
							Guild Name
						</label>
						<div className="flex gap-2">
							<input
								value={editName}
								onChange={(e) => setEditName(e.target.value.slice(0, 30))}
								className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
								placeholder="Guild name"
								maxLength={30}
							/>
							<button
								onClick={handleSaveName}
								disabled={editName.trim() === guildName || editName.trim().length === 0}
								className="px-3 py-2 text-[10px] font-bold rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
							>
								Save
							</button>
						</div>
						<p className="text-[9px] text-muted-foreground">{editName.length}/30 characters</p>
					</div>

					{/* Motto */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
							Guild Motto
						</label>
						<div className="flex gap-2">
							<input
								value={editMotto}
								onChange={(e) => setEditMotto(e.target.value.slice(0, 100))}
								className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
								placeholder="Enter a motto..."
								maxLength={100}
							/>
							<button
								onClick={handleSaveMotto}
								disabled={editMotto.trim() === guildMotto}
								className="px-3 py-2 text-[10px] font-bold rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
							>
								Save
							</button>
						</div>
						<p className="text-[9px] text-muted-foreground">{editMotto.length}/100 characters</p>
					</div>

					{/* Transfer Leadership */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
							Transfer Leadership
						</label>
						<p className="text-[9px] text-muted-foreground">This will make you a regular member.</p>
						{!transferTarget ? (
							<div className="space-y-1">
								{nonLeaderMembers.map((m: Record<string, any>) => (
									<button
										key={m.id}
										onClick={() => setTransferTarget(m.id)}
										className="w-full flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-left hover:bg-secondary/60 transition-colors"
									>
										<Crown size={10} className="text-muted-foreground" />
										<span className="text-xs text-foreground font-medium">{m.name}</span>
										<span className="text-[9px] text-muted-foreground capitalize ml-auto">
											{m.role}
										</span>
									</button>
								))}
							</div>
						) : (
							<div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
								<p className="text-[10px] text-primary font-semibold">
									Transfer leadership to{' '}
									<span className="text-foreground">
										{members.find((m: Record<string, any>) => m.id === transferTarget)?.name}
									</span>
									?
								</p>
								<div className="flex gap-2">
									<button
										onClick={() => setTransferTarget(null)}
										className="flex-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-border bg-secondary text-foreground"
									>
										Cancel
									</button>
									<button
										onClick={handleTransfer}
										className="flex-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-primary/20 text-primary border border-primary/30"
									>
										Confirm
									</button>
								</div>
							</div>
						)}
					</div>

					<div className="border-t border-border pt-3" />
				</>
			)}

			{/* Leave Guild */}
			{!leaveConfirm ? (
				<button
					onClick={() => setLeaveConfirm(true)}
					className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-all"
				>
					<LogOut size={14} />
					Leave Guild
				</button>
			) : (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
					<p className="text-[10px] text-destructive font-semibold">
						Are you sure? You will lose all guild buffs and progress.
					</p>
					<div className="flex gap-2">
						<button
							onClick={() => setLeaveConfirm(false)}
							className="flex-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-border bg-secondary text-foreground"
						>
							Cancel
						</button>
						<button
							onClick={handleLeave}
							className="flex-1 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-destructive text-destructive-foreground"
						>
							Leave
						</button>
					</div>
				</div>
			)}
		</div>
	)

	// ── Mobile: bottom drawer (default max-h-[80vh]) ─────────────────────────
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
				<DrawerContent className="border-border p-0 flex flex-col">
					<DrawerHeader className="text-left px-4 pt-2 pb-3">
						<DrawerTitle className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
							<Settings size={14} className="text-primary" />
							Guild Settings
						</DrawerTitle>
						<DrawerDescription className="sr-only">
							Manage your guild&apos;s settings, leadership, and membership.
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
								<Settings size={14} className="text-primary" /> Guild Settings
							</h3>
							<button
								onClick={onClose}
								className="p-1 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
							>
								<X size={14} />
							</button>
						</div>

						<div className="max-h-[60vh] overflow-y-auto">{body}</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>,
		document.body,
	)
}
