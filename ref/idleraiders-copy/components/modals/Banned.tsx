'use client'

import { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Ban, LogOut, ExternalLink } from 'lucide-react'

interface BannedModalProps {
	open: boolean
	username: string
	banReason?: string
	bannedAt?: string
	onLogout: () => void
}

const BannedModal = ({ open, username, banReason, bannedAt, onLogout }: BannedModalProps) => {
	const handleLogout = useCallback(() => {
		onLogout()
	}, [onLogout])

	const formattedDate = bannedAt
		? new Date(bannedAt).toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
		  })
		: null

	if (typeof document === 'undefined') return null

	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="fantasy-card w-full max-w-md space-y-5 p-6 border-destructive/50"
					>
						{/* Header */}
						<div className="text-center space-y-3">
							<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
								<Ban size={28} className="text-destructive" />
							</div>
							<h2 className="font-display text-2xl font-bold text-destructive">Account Suspended</h2>
							<p className="text-sm text-muted-foreground">
								<span className="text-foreground font-medium">@{username}</span> has been blocked from
								playing.
							</p>
						</div>

						{/* Reason */}
						<div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
							<p className="text-xs font-semibold uppercase tracking-wider text-destructive">
								Reason
							</p>
							<p className="text-sm text-foreground leading-relaxed">
								{banReason?.trim() ||
									"Your account has been suspended for violating the game's terms of service. If you believe this is a mistake, please contact support."}
							</p>
							{formattedDate && (
								<p className="text-xs text-muted-foreground pt-1 border-t border-destructive/20">
									Suspended on {formattedDate}
								</p>
							)}
						</div>

						{/* Appeal info */}
						<div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
							<p className="text-sm font-medium text-foreground">Think this is a mistake?</p>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Appeals can be submitted on our Discord. Please include your username and any relevant
								context.
							</p>
							<a
								href="https://discord.gg/PZzN2DKZxq"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
							>
								Open Discord
								<ExternalLink size={12} />
							</a>
						</div>

						{/* Sign out */}
						<button
							onClick={handleLogout}
							className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-2"
						>
							<LogOut size={12} />
							Sign out
						</button>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	)
}

export default BannedModal
