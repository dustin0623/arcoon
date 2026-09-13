'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Star, Search } from 'lucide-react'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'

export const GuildBrowserModal = ({
	open,
	onClose,
	actions,
}: {
	open: boolean
	onClose: () => void
	actions: Record<string, any>
}) => {
	const [guilds, setGuilds] = useState<Record<string, any>[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [search, setSearch] = useState('')

	useEffect(() => {
		if (!open) return
		const load = async () => {
			setIsLoading(true)
			try {
				const data = await actions.getGuilds()
				setGuilds(data?.guilds || [])
			} catch {
				toast.error('Failed to load guilds')
			} finally {
				setIsLoading(false)
			}
		}
		load()
	}, [open])

	const filtered = guilds.filter((g) =>
		g.name?.toLowerCase().includes(search.toLowerCase()),
	)

	if (!open) return null

	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						key="backdrop"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
						onClick={onClose}
					/>

					{/* Panel */}
					<motion.div
						key="panel"
						initial={{ opacity: 0, y: 40 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 40 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-2xl bg-background border-t border-border flex flex-col"
					>
						{/* Header */}
						<div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
							<div>
								<p className="font-display font-bold text-foreground text-base">Guild Browser</p>
								<p className="text-[10px] text-muted-foreground">View active guilds</p>
							</div>
							<button
								onClick={onClose}
								className="text-muted-foreground hover:text-foreground transition-colors"
							>
								<X size={18} />
							</button>
						</div>

						{/* Search */}
						<div className="px-4 pt-3 pb-2 shrink-0">
							<div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
								<Search size={13} className="text-muted-foreground shrink-0" />
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search guilds..."
									className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
								/>
							</div>
						</div>

						{/* List */}
						<div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
							{isLoading ? (
								<div className="py-10 text-center text-xs text-muted-foreground">Loading guilds...</div>
							) : filtered.length === 0 ? (
								<div className="py-10 text-center space-y-1">
									<p className="text-sm font-display text-foreground">No guilds found</p>
									<p className="text-xs text-muted-foreground">Try a different search term</p>
								</div>
							) : (
								filtered.map((guild, idx) => (
									<motion.div
										key={guild.id}
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: idx * 0.04 }}
										className="flex items-center justify-between rounded-lg bg-secondary/60 border border-border p-3"
									>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-display text-sm font-bold text-primary truncate">
													{guild.name}
												</span>
												<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold shrink-0">
													Lv.{guild.level}
												</span>
											</div>
											{guild.motto && (
												<p className="text-[10px] text-muted-foreground italic mt-0.5 truncate">
													&quot;{guild.motto}&quot;
												</p>
											)}
											<div className="flex gap-3 text-[10px] text-muted-foreground mt-1.5">
												<span className="flex items-center gap-1">
													<Users size={11} />
													{guild.memberCount}/{guild.maxMembers}
												</span>
												<span className="flex items-center gap-1">
													<Star size={11} />
													{formatNumber(guild.xp)} XP
												</span>
											</div>
										</div>
									</motion.div>
								))
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}
