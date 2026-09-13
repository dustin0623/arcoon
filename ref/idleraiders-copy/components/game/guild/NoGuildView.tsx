'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Star, Lock, Clock, X, Swords, BarChart3, ChevronDown, Trophy, HelpCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'
import { CreateGuildModal } from './CreateGuildModal'

type SortOption = 'reputation' | 'level' | 'raidPower' | 'members' | 'xp'

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
	{ value: 'reputation', label: 'Reputation', icon: <BarChart3 size={12} /> },
	{ value: 'level', label: 'Level', icon: <Star size={12} /> },
	{ value: 'raidPower', label: 'Raid Power', icon: <Swords size={12} /> },
	{ value: 'members', label: 'Members', icon: <Users size={12} /> },
	{ value: 'xp', label: 'XP', icon: <Star size={12} /> },
]

const GUILD_MIN_LEVEL = 16

export const NoGuildView = ({
	actions,
	refreshGuild,
	playerState,
	browseMode = false,
	onBack,
}: {
	actions: Record<string, any>
	refreshGuild: () => void
	playerState: Record<string, any> | null
	browseMode?: boolean
	onBack?: () => void
}) => {
	const [guilds, setGuilds] = useState<Record<string, any>[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [createModalOpen, setCreateModalOpen] = useState(false)
	const [pendingApplications, setPendingApplications] = useState<{ guildId: string; guildName: string; appliedAt: Date }[]>([])
	const [cancellingGuild, setCancellingGuild] = useState<string | null>(null)
	const [sortBy, setSortBy] = useState<SortOption>('reputation')
	const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
	const [showRankingTooltip, setShowRankingTooltip] = useState(false)
	const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null)
	const [timeUntilUpdate, setTimeUntilUpdate] = useState<string>('')

	const playerCoins = playerState?.coins ?? 0
	const playerLevel = playerState?.level ?? 0
	const isLevelLocked = playerLevel < GUILD_MIN_LEVEL

	// Check if guild has pending application
	const hasPendingApplication = (guildName: string) => {
		return pendingApplications.some(app => app.guildName.toLowerCase() === guildName.toLowerCase())
	}

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true)
				const [guildsData, applicationsData] = await Promise.all([
					actions.getGuilds(sortBy),
					actions.getMyApplications?.() ?? []
				])
				setGuilds(guildsData?.guilds || [])
				setPendingApplications(applicationsData || [])
				
				// Set next update time from API response
				if (guildsData?.rankingUpdate?.nextUpdate) {
					setNextUpdateTime(new Date(guildsData.rankingUpdate.nextUpdate))
				}
			} catch (error) {
				console.error('Error loading guilds:', error)
				toast.error('Failed to load guilds')
			} finally {
				setIsLoading(false)
			}
		}
		loadData()
	}, [actions, sortBy])

	// Update countdown timer every second
	useEffect(() => {
		if (!nextUpdateTime) return

		const updateCountdown = () => {
			const now = new Date()
			const diff = nextUpdateTime.getTime() - now.getTime()
			
			if (diff <= 0) {
				setTimeUntilUpdate('Updating...')
				return
			}
			
			const minutes = Math.floor(diff / (1000 * 60))
			const seconds = Math.floor((diff % (1000 * 60)) / 1000)
			setTimeUntilUpdate(`${minutes}m ${seconds}s`)
		}

		updateCountdown()
		const interval = setInterval(updateCountdown, 1000)
		return () => clearInterval(interval)
	}, [nextUpdateTime])

	const handleRequestJoin = async (guildName: string) => {
		if (isLevelLocked) {
			toast.error(`You must reach level ${GUILD_MIN_LEVEL} to join a guild`)
			return
		}
		try {
			const result = await actions.requestJoinGuild(guildName)
			toast.success(result.message || `Request sent to ${guildName}!`)
			// Add to pending applications locally
			setPendingApplications(prev => [...prev, { guildId: '', guildName, appliedAt: new Date() }])
		} catch (error) {
			toast.error((error as Error).message || 'Failed to send join request')
		}
	}

	const handleCancelRequest = async (guildName: string) => {
		setCancellingGuild(guildName)
		try {
			await actions.cancelJoinRequest(guildName)
			// Remove from pending applications locally
			setPendingApplications(prev => prev.filter(app => app.guildName.toLowerCase() !== guildName.toLowerCase()))
		} catch (error) {
			toast.error((error as Error).message || 'Failed to cancel request')
		} finally {
			setCancellingGuild(null)
		}
	}

	return (
		<div className="space-y-4 py-4">
			{/* Level Lock Warning */}
			{isLevelLocked && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3"
				>
					<Lock size={20} className="text-amber-500 shrink-0 mt-0.5" />
					<div>
						<p className="font-semibold text-sm text-amber-400">
							Guild Locked Until Level {GUILD_MIN_LEVEL}
						</p>
						<p className="text-xs text-amber-300/80 mt-1">
							Progress through story quests and dungeons to reach level {GUILD_MIN_LEVEL}. You are
							currently level {playerLevel}.
						</p>
					</div>
				</motion.div>
			)}

			{/* Header with Create Guild / Back Button */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-display text-xl md:text-2xl font-bold text-foreground">Guild Browser</h1>
					<p className="text-xs text-muted-foreground mt-1">
						{browseMode
							? 'Browse active guilds'
							: isLevelLocked
								? `Reach level ${GUILD_MIN_LEVEL} to create or join a guild`
								: 'Find a guild or create your own to start your journey'}
					</p>
				</div>
				{browseMode ? (
					<button
						onClick={onBack}
						className="px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shrink-0 transition-all bg-secondary text-foreground hover:bg-secondary/80 border border-border"
					>
						Back to Guild
					</button>
				) : (
					<button
						onClick={() => setCreateModalOpen(true)}
						disabled={isLevelLocked}
						className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shrink-0 transition-all ${
							isLevelLocked
								? 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
								: 'bg-primary text-primary-foreground hover:bg-primary/90'
						}`}
					>
						+ Create Guild
					</button>
				)}
			</div>

			{/* Sort Dropdown with Ranking Info Tooltip */}
			<div className="flex items-center justify-between">
				{/* Left side: Ranking Info + Next Update Timer */}
				<div className="flex items-center gap-3">
					{/* Ranking Info Tooltip */}
					<div className="relative">
						<button
							onClick={() => setShowRankingTooltip(!showRankingTooltip)}
							className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
						>
							<HelpCircle size={14} />
							<span className="hidden sm:inline">How Ranking Works</span>
						</button>
					{showRankingTooltip && (
						<div className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
							<div className="space-y-3">
								<div>
									<h4 className="font-semibold text-sm text-foreground mb-1">Guild Reputation Formula</h4>
									<p className="text-[10px] text-muted-foreground">
										Reputation determines guild ranking and is calculated as:
									</p>
								</div>
								<div className="space-y-2 text-[10px]">
									<div className="flex items-start gap-2">
										<span className="text-primary font-bold">Base Score</span>
										<span className="text-muted-foreground">= Guild Level x 500</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="text-green-400 font-bold">Activity Bonus</span>
										<span className="text-muted-foreground">= Activity Ratio x Avg Member Level x 100</span>
									</div>
									<div className="flex items-start gap-2">
										<span className="text-amber-400 font-bold">War Bonus</span>
										<span className="text-muted-foreground">= (Weekly Valor / 1000) x Activity Multiplier</span>
									</div>
								</div>
								<div className="border-t border-border pt-2">
									<p className="text-[10px] text-muted-foreground">
										<span className="text-red-400 font-semibold">Raid Power (RP)</span> is the combined power of all member cards - shown for bragging rights but does not affect ranking.
									</p>
								</div>
						<div className="text-[10px] text-muted-foreground/70 italic">
							Activity Multiplier: 2x (&gt;75% active), 1.5x (&gt;50%), 1x (&gt;25%), 0.5x (base)
						</div>
							</div>
						</div>
					)}
					</div>

					{/* Next Update Timer */}
					{timeUntilUpdate && (
						<div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs bg-secondary/30 border border-border/50">
							<RefreshCw size={12} className="text-muted-foreground" />
							<span className="text-muted-foreground">Next update:</span>
							<span className="font-semibold text-foreground">{timeUntilUpdate}</span>
						</div>
					)}
				</div>

				{/* Sort Dropdown */}
				<div className="relative">
					<button
						onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
						className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-secondary/50 border border-border hover:bg-secondary/80 transition-all"
					>
						<span className="text-muted-foreground">Sort by:</span>
						<span className="flex items-center gap-1 font-semibold text-foreground">
							{SORT_OPTIONS.find(o => o.value === sortBy)?.icon}
							{SORT_OPTIONS.find(o => o.value === sortBy)?.label}
						</span>
						<ChevronDown size={14} className={`text-muted-foreground transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
					</button>
					{sortDropdownOpen && (
						<div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
							{SORT_OPTIONS.map((option) => (
								<button
									key={option.value}
									onClick={() => {
										setSortBy(option.value)
										setSortDropdownOpen(false)
									}}
									className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary/50 transition-all ${
										sortBy === option.value ? 'text-primary font-semibold' : 'text-foreground'
									}`}
								>
									{option.icon}
									{option.label}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Guilds List */}
			<div className="space-y-2">
				{isLoading ? (
					<div className="text-center py-8">
						<p className="text-xs text-muted-foreground">Loading guilds...</p>
					</div>
				) : guilds.length === 0 ? (
					<div className="fantasy-card text-center py-8 space-y-2">
						<div className="text-3xl">🏰</div>
						<p className="font-display text-sm text-foreground">No Guilds Available</p>
						<p className="text-xs text-muted-foreground">
							{isLevelLocked
								? `Reach level ${GUILD_MIN_LEVEL} to create the first guild`
								: 'Be the first to create a guild!'}
						</p>
					</div>
				) : (
					guilds.map((guild, idx) => {
						const isPending = hasPendingApplication(guild.name)
						const isCancelling = cancellingGuild === guild.name
						
						return (
							<motion.div
								key={guild.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.05 }}
								className={`fantasy-card flex items-center justify-between p-4 ${isLevelLocked ? 'opacity-50' : ''} ${isPending ? 'border-amber-500/30' : ''}`}
							>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										{/* Rank Badge */}
										{guild.rank && guild.rank <= 3 && (
											<span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 ${
												guild.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
												guild.rank === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
												'bg-amber-600/20 text-amber-500 border border-amber-600/30'
											}`}>
												<Trophy size={12} />
											</span>
										)}
										{guild.rank && guild.rank > 3 && (
											<span className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 bg-secondary/50 text-muted-foreground">
												#{guild.rank}
											</span>
										)}
										<h3 className="font-display text-sm font-bold text-primary truncate">
											{guild.name}
										</h3>
										<span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold shrink-0">
											Lv. {guild.level}
										</span>
										{isPending && (
											<span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold shrink-0 flex items-center gap-1">
												<Clock size={10} /> Pending
											</span>
										)}
									</div>
									{guild.motto && (
										<p className="text-[10px] text-muted-foreground italic mt-0.5 truncate">
											&quot;{guild.motto}&quot;
										</p>
									)}
									<div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mt-2">
										<span className="flex items-center gap-1">
											<Users size={12} /> {guild.memberCount}/{guild.maxMembers}
										</span>
										<span className="flex items-center gap-1 text-red-400">
											<Swords size={12} /> {formatNumber(guild.totalRaidPower || 0)} RP
										</span>
										<span className="flex items-center gap-1 text-yellow-400">
											<Star size={12} /> {formatNumber(guild.xp)} XP
										</span>
										<span className="flex items-center gap-1 text-primary">
											<BarChart3 size={12} /> {formatNumber(guild.reputation || 0)} Rep
										</span>
									</div>
								</div>
								{!browseMode && (
									<>
										{isPending ? (
											<button
												onClick={() => handleCancelRequest(guild.name)}
												disabled={isCancelling || isLevelLocked}
												className="ml-4 px-3 py-2 rounded-lg font-bold text-xs transition-all shrink-0 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 flex items-center gap-1.5"
											>
												<X size={12} />
												{isCancelling ? 'Cancelling...' : 'Cancel'}
											</button>
										) : (
											<button
												onClick={() => handleRequestJoin(guild.name)}
												disabled={isLevelLocked}
												className={`ml-4 px-4 py-2 rounded-lg font-bold text-xs transition-all shrink-0 ${
													isLevelLocked
														? 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
														: 'bg-accent/20 text-accent-foreground border border-accent/30 hover:bg-accent/30'
												}`}
											>
												{isLevelLocked ? `Lv. ${GUILD_MIN_LEVEL}+` : 'Request to Join'}
											</button>
										)}
									</>
								)}
							</motion.div>
						)
					})
				)}
			</div>

			<CreateGuildModal
				open={createModalOpen}
				onClose={() => setCreateModalOpen(false)}
				onSuccess={() => {
					setCreateModalOpen(false)
					// Refresh guilds list after creating
					const loadGuilds = async () => {
						try {
							const data = await actions.getGuilds()
							setGuilds(data?.guilds || [])
						} catch (error) {
							console.error('Error loading guilds:', error)
						}
					}
					loadGuilds()
				}}
				actions={actions}
				refreshGuild={refreshGuild}
				playerCoins={playerCoins}
				playerLevel={playerLevel}
			/>
		</div>
	)
}
