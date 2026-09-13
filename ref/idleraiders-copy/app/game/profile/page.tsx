'use client'

import React from 'react'
import { useState, useRef, useCallback, useMemo, useEffect, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '@/context/GameContext'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
// leaderboard data loaded dynamically when viewing other players
import {
	BookOpen,
	Package,
	Zap,
	Clock,
	Target,
	Shield,
	Swords,
	Users,
	Map,
	Trophy,
	Camera,
	Download,
	Copy,
	Check,
	X,
	ChevronDown,
	ArrowLeft,
	Eye,
} from 'lucide-react'
import CurrencyIcon from '@/components/CurrencyIcon'
import { toast } from 'sonner'
import { PageLoader } from '@/components/ui/PageLoader'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useApiActions } from '@/features/actions/apiClient'
import { toPng } from 'html-to-image'
import { GAME_UI_IMAGES } from '@/features/images'

const idleRaidersLogo = GAME_UI_IMAGES.logo

import { formatMinutes } from '@/lib/formatters'

const formatDate = (ts: number) => {
	const d = new Date(ts)
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const StatCard = ({
	icon,
	value,
	label,
	delay = 0,
	highlight = false,
}: {
	icon: React.ReactNode
	value: React.ReactNode
	label: string
	delay?: number
	highlight?: boolean
}) => (
	<motion.div
		initial={{ opacity: 0, scale: 0.92 }}
		animate={{ opacity: 1, scale: 1 }}
		transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
		className="relative overflow-hidden rounded-xl border border-border p-3 md:p-4 text-center"
		style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
	>
		<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
		<div className="flex flex-col items-center gap-1">
			{icon}
			<p
				className={`text-sm md:text-base font-display font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}
			>
				{value}
			</p>
			<p className="text-[9px] md:text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
		</div>
	</motion.div>
)

const ProfilePage = () => {
	const { playerState, gameData } = useGame()
	const ownPlayer = playerState ?? {}
	const cards = playerState?.cards ?? []
	const materials = playerState?.materials ?? []

	// Ensure all required properties have defaults
	const playerWithDefaults: Record<string, any> = {
		username: playerState?.username ?? 'Raider',
		avatar: playerState?.avatar ?? '⚔️',
		level: playerState?.level ?? 1,
		xp: playerState?.xp ?? 0,
		xpToNextLevel: playerState?.xpToNextLevel ?? 100,
		coins: playerState?.coins ?? 0,
		shards: playerState?.shards ?? 0,
		totalMissions: playerState?.totalMissions ?? 0,
		totalBossDamage: playerState?.totalBossDamage ?? 0,
		totalMinutesPlayed: playerState?.totalMinutesPlayed ?? 0,
		joinedAt: playerState?.joinedAt ?? Date.now(),
		...ownPlayer,
	}
	// Computed stats derived from cards (server doesn't send these aggregates)
	const totalRaidPowerOwn = cards.reduce((a, c) => a + (c.stats?.raidPower ?? 0) * (c.quantity ?? 1), 0)
	const totalMasteryOwn = cards.reduce((a, c) => a + (c.stats?.mastery ?? 0) * (c.quantity ?? 1), 0)
	const totalLuckOwn = cards.reduce((a, c) => a + (c.stats?.luck ?? 0) * (c.quantity ?? 1), 0)
	const totalGMOwn = cards.reduce((a, c) => a + (c.stats?.gm ?? 0) * (c.quantity ?? 1), 0)
	const totalCardCountOwn = cards.reduce((a, c) => a + (c.quantity ?? 1), 0)
	// Guild from playerState
	const inGuild = !!playerState?.guild?.name
	const guildName: string = (playerState?.guild?.name as string | undefined) ?? ''
	const guildLevel: number = (playerState?.guild?.level as number | undefined) ?? 0
	const playerRole: string = (playerState?.guild?.role as string | undefined) ?? 'member'

	const router = useRouter()
	const searchParams = useSearchParams()
	const snapshotRef = useRef(null)
	const [showSnapshot, setShowSnapshot] = useState(false)
	const [generatingImage, setGeneratingImage] = useState(false)
	const [achOpen, setAchOpen] = useState(false)

	// ─── Viewing Mode ─────────────────────────────────────────
	const viewingUsername = searchParams.get('username')
	const isViewingOther = !!viewingUsername && viewingUsername !== ownPlayer.username

	// Fetch viewed player's profile from API
	const { authGet } = useApiActions()
	const [viewedProfile, setViewedProfile] = useState<Record<string, any> | null>(null)
	const [loadingProfile, setLoadingProfile] = useState(false)

	useEffect(() => {
		if (!isViewingOther || !viewingUsername) {
			setViewedProfile(null)
			return
		}

		const fetchProfile = async () => {
			setLoadingProfile(true)
			try {
				const response = await authGet(`/api/players/profile?username=${encodeURIComponent(viewingUsername)}`)
				if (response.success && response.profile) {
					setViewedProfile(response.profile)
				} else {
					toast.error(response.message || 'Failed to load profile')
				}
			} catch {
				toast.error('Failed to load profile')
			} finally {
				setLoadingProfile(false)
			}
		}

		fetchProfile()
	}, [isViewingOther, viewingUsername, authGet])

	// Use either own or viewed player data
	const player = isViewingOther && viewedProfile 
		? { ...playerWithDefaults, ...viewedProfile } 
		: playerWithDefaults

	const rank = '—'

	// Merge WORLD_DATA territory definitions with per-player progress
	const territoriesWithProgress: Record<string, any>[] = useMemo(() => {
		return (gameData?.WORLD?.TERRITORIES ?? []).map((def: Record<string, any>) => {
			return { ...def, progress: def.progress ?? 0 }
		})
	}, [gameData])
	const currentTerritory =
		territoriesWithProgress.find((t) => t.progress < t.maxProgress) ??
		territoriesWithProgress[territoriesWithProgress.length - 1]
	const totalProgress = territoriesWithProgress.reduce((a, t) => a + t.progress, 0)
	const totalMax = territoriesWithProgress.reduce((a, t) => a + t.maxProgress, 0)
	const territoriesCompleted = territoriesWithProgress.filter((t) => t.progress >= t.maxProgress).length

	const totalRaidPower = isViewingOther && viewedProfile ? viewedProfile.raidPower : totalRaidPowerOwn
	const totalMastery = isViewingOther && viewedProfile ? viewedProfile.mastery : totalMasteryOwn
	const totalLuck = isViewingOther && viewedProfile ? viewedProfile.luck : totalLuckOwn
	const totalGM = isViewingOther && viewedProfile ? viewedProfile.gm : totalGMOwn
	const totalCardCount = isViewingOther && viewedProfile ? viewedProfile.totalCards : totalCardCountOwn
	const uniqueCards = isViewingOther && viewedProfile ? viewedProfile.uniqueCards : cards.length
	const totalMaterials =
		isViewingOther && viewedProfile
			? viewedProfile.totalMaterials
			: materials.reduce((a, m) => a + m.quantity, 0)

	const boostCategories: { id: string; label: string; Icon: typeof BookOpen; key: 'expBoost' | 'matBoost' | 'energyBoost' }[] = [
		{ id: 'xp', label: 'XP', Icon: BookOpen, key: 'expBoost' },
		{ id: 'material', label: 'Material', Icon: Package, key: 'matBoost' },
		{ id: 'energy', label: 'Energy', Icon: Zap, key: 'energyBoost' },
	]

	// Live boosts from booster cards (already post-cap from the server via applyBoostCap)
	const playerBoosts = (playerState?.boosts ?? {}) as { expBoost?: number; matBoost?: number; energyBoost?: number }

	// Achievements come pre-evaluated from the server; allAchievements[i].unlocked is a boolean
	const allAchievements: Record<string, any>[] =
		(playerState?.achievements as Record<string, any>[] | undefined) ?? []
	const unlockedAchievements = useMemo(() => allAchievements.filter((a) => a.unlocked), [allAchievements])
	const lockedAchievements = useMemo(() => allAchievements.filter((a) => !a.unlocked), [allAchievements])

	const referralLink = `https://www.idleraiders.site?ref=${player.username}`

	const shareTemplate = `🏰 Idle Raiders — ${player.username}\n\n⚔️ Raid Power: ${totalRaidPower.toLocaleString()}\n🎯 Mastery: ${totalMastery.toLocaleString()}\n🍀 Luck: ${totalLuck.toLocaleString()}\n👑 GM: +${totalGM}\n📊 Level ${player.level} | ${player.totalMissions} Missions\n🃏 ${uniqueCards} Unique Cards | 🏆 ${unlockedAchievements.length}/${allAchievements.length} Achievements\n\n🔗 Join using my referral:\n${referralLink}`

	const generateSnapshotBlob = useCallback(async () => {
		if (!snapshotRef.current) return null
		const dataUrl = await toPng(snapshotRef.current, {
			pixelRatio: 2,
			backgroundColor: '#0d0f14',
		})
		const blob = await (await fetch(dataUrl)).blob()
		return { dataUrl, blob }
	}, [])

	const handleDownloadSnapshot = useCallback(async () => {
		setGeneratingImage(true)
		try {
			const result = await generateSnapshotBlob()
			if (!result) return
			// Download image
			const link = document.createElement('a')
			link.download = `idle-raiders-${player.username}.png`
			link.href = result.dataUrl
			link.click()
			// Copy template to clipboard
			await navigator.clipboard.writeText(shareTemplate)
			toast.success('Snapshot saved! Share template copied to clipboard.')
		} catch {
			toast.error('Failed to generate snapshot')
		} finally {
			setGeneratingImage(false)
		}
	}, [player.username, shareTemplate, generateSnapshotBlob])

	const handleCopyTemplate = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(shareTemplate)
			toast.success('Template copied to clipboard!')
		} catch {
			toast.error('Failed to copy template')
		}
	}, [shareTemplate])

	if (!playerState) return null

// Show loading spinner when fetching another player's profile
		if (isViewingOther && loadingProfile) {
			return <PageLoader page="profile" />
		}

	return (
		<div className="space-y-4 py-4">
			{/* Viewing banner */}
			{isViewingOther && (
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5"
				>
					<button
						onClick={() => router.back()}
						className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft size={16} />
					</button>
					<Eye size={14} className="text-primary shrink-0" />
					<p className="text-xs text-muted-foreground flex-1">
						Viewing <span className="font-bold text-primary">{viewingUsername}</span>'s profile
					</p>
				</motion.div>
			)}

			{/* Hero Banner */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="relative overflow-hidden rounded-2xl border border-primary/30"
				style={{ background: 'linear-gradient(160deg, hsl(230 15% 15%), hsl(230 12% 8%))' }}
			>
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

					<div className="relative p-5 md:p-8">
						<div className="flex items-start gap-4 w-full">
							<div className="relative">
								<Avatar className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border-2 border-primary/40 shadow-lg">
									<AvatarImage
										src={`https://images.hive.blog/u/${player.username}/avatar`}
										alt={`${player.username} avatar`}
										className="rounded-2xl object-cover"
									/>
									<AvatarFallback className="rounded-2xl bg-secondary/80 text-3xl md:text-4xl font-display font-bold text-primary">
										{player.username?.[0]?.toUpperCase() ?? '?'}
									</AvatarFallback>
								</Avatar>
								<div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background">
									{player.level}
								</div>
							</div>

						<div className="flex-1 min-w-0 pt-1">
							<h1 className="font-display text-xl md:text-2xl font-bold text-primary truncate">
								{player.username}
							</h1>
							<p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
								Level {player.level} Raider · Rank{' '}
								<span className="text-foreground font-semibold">#{rank}</span>
							</p>
							{!isViewingOther && inGuild && (
								<p className="text-[10px] md:text-[11px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
									<Shield size={10} className="text-primary/60" />
									<span className="text-foreground/80">{guildName}</span>
									<span className="capitalize">· {playerRole}</span>
								</p>
							)}
							<div className="mt-2.5">
								<div className="flex items-center justify-between mb-1">
									<span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
										Experience
									</span>
									<span className="text-[9px] text-muted-foreground">
										{player.xp.toLocaleString()} / {player.xpToNextLevel.toLocaleString()}
									</span>
								</div>
								<div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: `${(player.xp / player.xpToNextLevel) * 100}%` }}
										transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
										className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
									/>
								</div>
							</div>
						</div>
						{!isViewingOther && (
							<button
								onClick={() => setShowSnapshot(true)}
								className="shrink-0 self-start mt-1 p-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors"
								title="Profile Snapshot"
							>
								<Camera size={16} className="text-primary" />
							</button>
						)}
					</div>
					<p className="mt-3 text-[9px] text-muted-foreground/40 text-right">
						Joined {formatDate(player.joinedAt)}
					</p>
				</div>
			</motion.div>

			{/* Activity Stats */}
			<div>
				<h2 className="mb-2 font-display text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
					Activity
				</h2>
				<div className="grid grid-cols-3 gap-2">
					<StatCard
						icon={<Clock size={18} className="text-primary" />}
						value={formatMinutes(player.totalMinutesPlayed)}
						label="Mission Time"
						delay={0.05}
					/>
					<StatCard
						icon={<Target size={18} className="text-primary" />}
						value={player.totalMissions.toLocaleString()}
						label="Missions"
						delay={0.1}
					/>
					<StatCard
						icon={<Swords size={18} className="text-primary" />}
						value={player.totalBossDamage.toLocaleString()}
						label="Boss Damage"
						delay={0.15}
					/>
				</div>
			</div>

			{/* Wealth & Collection */}
			<div>
				<h2 className="mb-2 font-display text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
					Wealth & Collection
				</h2>
				<div className="grid grid-cols-2 gap-2">
					<StatCard
						icon={<CurrencyIcon type="token" size={20} />}
						value={player.coins.toLocaleString()}
						label="Realm Coins"
						delay={0.1}
						highlight
					/>
					<StatCard
						icon={<CurrencyIcon type="shard" size={20} />}
						value={player.shards.toLocaleString()}
						label="Soul Shards"
						delay={0.12}
						highlight
					/>
					<StatCard
						icon={<span className="text-lg">🃏</span>}
						value={`${totalCardCount} (${uniqueCards})`}
						label="Cards (Unique)"
						delay={0.14}
					/>
					<StatCard
						icon={<span className="text-lg">📦</span>}
						value={totalMaterials.toLocaleString()}
						label="Materials"
						delay={0.16}
					/>
				</div>
			</div>

			{/* Combat Stats */}
			<div>
				<h2 className="mb-2 font-display text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
					Combat Stats
				</h2>
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="relative rounded-xl border border-border overflow-hidden"
					style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
				>
					<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
					{[
						{
							icon: '⚔️',
							label: 'Raid Power',
							value: totalRaidPower.toLocaleString(),
							color: 'text-foreground',
						},
						{
							icon: '🎯',
							label: 'Mastery',
							value: totalMastery.toLocaleString(),
							color: 'text-foreground',
						},
						{ icon: '🍀', label: 'Luck', value: totalLuck.toLocaleString(), color: 'text-foreground' },
						{ icon: '👑', label: 'GM Bonus', value: `+${totalGM}`, color: 'text-primary' },
					].map((stat, i) => (
						<div
							key={stat.label}
							className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-border/50' : ''}`}
						>
							<div className="flex items-center gap-2.5">
								<span className="text-lg">{stat.icon}</span>
								<span className="text-xs md:text-sm text-muted-foreground">{stat.label}</span>
							</div>
							<span className={`font-display text-sm md:text-base font-bold ${stat.color}`}>
								{stat.value}
							</span>
						</div>
					))}
				</motion.div>
			</div>

			{!isViewingOther && (
				<>
					{/* Active Boosts */}
					<div>
						<h2 className="mb-2 font-display text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider">
							Active Boosts
						</h2>
						<div className="grid grid-cols-3 gap-2">
							{boostCategories.map((cat, i) => {
								// Effective (post-cap) bonus percent sent by the server
								const eff = playerBoosts[cat.key] ?? 0
								const mult = 1 + eff / 100
								const hasBoost = eff > 0
								return (
									<motion.div
										key={cat.id}
										initial={{ opacity: 0, scale: 0.92 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: 0.25 + i * 0.04 }}
										className="relative overflow-hidden rounded-xl border border-border p-3 md:p-4 text-center"
										style={{
											background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))',
										}}
									>
										<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
										<cat.Icon
											size={18}
											className={`mx-auto ${hasBoost ? 'text-primary' : 'text-muted-foreground/60'}`}
										/>
										<p
											className={`mt-1.5 text-sm md:text-base font-display font-bold ${hasBoost ? 'text-primary' : 'text-foreground'}`}
										>
											{mult.toFixed(2)}x
										</p>
										<p className="text-[9px] md:text-[10px] uppercase tracking-wider text-muted-foreground">
											{cat.label}
										</p>
										{hasBoost && (
											<p className="text-[8px] text-primary/80 mt-0.5 font-semibold">
												+{eff.toFixed(1)}%
											</p>
										)}
									</motion.div>
								)
							})}
						</div>
					</div>

					{/* Quest Progress */}
					<div>
						<h2 className="mb-2 font-display text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
							<Map size={13} /> Quest Progress
						</h2>
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="rounded-xl border border-border overflow-hidden"
							style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
						>
							<div className="p-4 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-[10px] md:text-xs text-muted-foreground">Overall</span>
									<span className="text-xs md:text-sm font-bold text-primary">
										{totalProgress}/{totalMax}
									</span>
								</div>
								<div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: `${(totalProgress / totalMax) * 100}%` }}
										transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
										className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
									/>
								</div>
								<div className="flex items-center justify-between text-[10px] md:text-xs">
									<span className="text-muted-foreground">Current</span>
									<span className="text-foreground font-semibold">
										{currentTerritory.icon} {currentTerritory.name}
									</span>
								</div>
								<div className="space-y-1.5 pt-1 border-t border-border/50">
									{territoriesWithProgress.map((t) => {
										const pct = t.maxProgress > 0 ? (t.progress / t.maxProgress) * 100 : 0
										const complete = t.progress >= t.maxProgress
										return (
											<div key={t.id} className="flex items-center gap-2">
												<span className="text-sm w-5 text-center">{t.icon}</span>
												<span className="text-[10px] md:text-xs text-muted-foreground flex-1 truncate">
													{t.name}
												</span>
												<div className="w-16 md:w-20 h-1.5 rounded-full bg-secondary/80 overflow-hidden">
													<div
														className={`h-full rounded-full ${complete ? 'bg-primary' : 'bg-primary/50'}`}
														style={{ width: `${pct}%` }}
													/>
												</div>
												<span
													className={`text-[9px] md:text-[10px] w-10 text-right font-mono ${complete ? 'text-primary font-bold' : 'text-muted-foreground'}`}
												>
													{t.progress}/{t.maxProgress}
												</span>
											</div>
										)
									})}
								</div>
							</div>
						</motion.div>
					</div>

					{/* Guild Info */}
					{inGuild && (
						<div>
							<h2 className="mb-2 font-display text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
								<Users size={13} /> Guild
							</h2>
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.35 }}
								className="rounded-xl border border-border p-4"
								style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
							>
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
										<Shield size={18} className="text-primary" />
									</div>
									<div>
										<p className="text-sm md:text-base font-display font-bold text-foreground">
											{guildName}
										</p>
										<p className="text-[10px] text-muted-foreground">
											Level {guildLevel} ·{' '}
											<span className="capitalize text-primary">{playerRole}</span>
										</p>
									</div>
								</div>
							</motion.div>
						</div>
					)}

					{/* ═══ ACHIEVEMENTS ACCORDION ═══ */}
					<div>
						<button
							onClick={() => setAchOpen(!achOpen)}
							className="w-full flex items-center justify-between rounded-xl border border-border p-3 md:p-4 transition-colors hover:border-primary/30"
							style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
						>
							<div className="flex items-center gap-2">
								<Trophy size={16} className="text-primary" />
								<span className="font-display text-xs md:text-sm font-bold text-foreground">
									Achievements
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-primary font-mono text-[11px] font-bold">
									{unlockedAchievements.length}/{allAchievements.length}
								</span>
								<div className="w-16 h-1.5 rounded-full bg-secondary/80 overflow-hidden">
									<div
										className="h-full rounded-full bg-primary"
										style={{
											width: `${allAchievements.length > 0 ? (unlockedAchievements.length / allAchievements.length) * 100 : 0}%`,
										}}
									/>
								</div>
								<motion.div animate={{ rotate: achOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
									<ChevronDown size={16} className="text-muted-foreground" />
								</motion.div>
							</div>
						</button>

						<AnimatePresence>
							{achOpen && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: 'auto', opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.25 }}
									className="overflow-hidden"
								>
									<div className="pt-2 space-y-2">
										{unlockedAchievements.length > 0 && (
											<div className="grid grid-cols-2 gap-2">
												{unlockedAchievements.map((ach) => (
													<div
														key={ach.id}
														className="relative overflow-hidden rounded-xl border border-primary/30 p-3"
														style={{
															background:
																'linear-gradient(145deg, hsl(230 12% 16%), hsl(230 12% 11%))',
														}}
													>
														<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
														<div className="flex items-start gap-2">
															<span className="text-xl">{ach.icon}</span>
															<div className="flex-1 min-w-0">
																<p className="text-[11px] font-display font-bold text-primary truncate">
																	{ach.title}
																</p>
																<p className="text-[9px] text-muted-foreground leading-tight">
																	{ach.description}
																</p>
															</div>
															<Check
																size={12}
																className="text-primary flex-shrink-0 mt-0.5"
															/>
														</div>
													</div>
												))}
											</div>
										)}
										{lockedAchievements.length > 0 && (
											<div className="grid grid-cols-2 gap-2 opacity-50">
												{lockedAchievements.map((ach) => (
													<div
														key={ach.id}
														className="relative overflow-hidden rounded-xl border border-border/50 p-3"
														style={{
															background:
																'linear-gradient(145deg, hsl(230 12% 12%), hsl(230 12% 9%))',
														}}
													>
														<div className="flex items-start gap-2">
															<span className="text-xl grayscale">{ach.icon}</span>
															<div className="flex-1 min-w-0">
																<p className="text-[11px] font-display font-bold text-muted-foreground truncate">
																	{ach.title}
																</p>
																<p className="text-[9px] text-muted-foreground/60 leading-tight">
																	{ach.description}
																</p>
															</div>
															<span className="text-[9px] text-muted-foreground/40">
																🔒
															</span>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</>
			)}

			{/* ═══ SNAPSHOT MODAL ═══ */}
			{!isViewingOther &&
				createPortal(
					<AnimatePresence>
						{showSnapshot && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
								onClick={() => setShowSnapshot(false)}
							>
								<motion.div
									initial={{ scale: 0.9, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.9, opacity: 0 }}
									className="w-full max-w-[380px] space-y-3 flex flex-col items-center"
									onClick={(e) => e.stopPropagation()}
								>
									<button
										onClick={() => setShowSnapshot(false)}
										className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
									>
										<X size={16} />
									</button>

									{/* Snapshot card — NO referral link, pure inline styles */}
									<div
										ref={snapshotRef}
										style={{
											width: '360px',
											background: 'linear-gradient(160deg, #14161e, #0d0f14)',
											borderRadius: '16px',
											overflow: 'hidden',
											border: '2px solid rgba(202, 165, 60, 0.4)',
											fontFamily: "'Cinzel', serif",
											display: 'flex',
											flexDirection: 'column',
										}}
									>
										{/* Header */}
										<div
											style={{
												padding: '14px 20px',
												display: 'flex',
												alignItems: 'center',
												gap: '10px',
												borderBottom: '1px solid rgba(202, 165, 60, 0.2)',
												background:
													'linear-gradient(90deg, rgba(202, 165, 60, 0.15), transparent)',
											}}
										>
											<img
												src={idleRaidersLogo}
												alt="Idle Raiders"
												style={{ height: '28px', objectFit: 'contain' }}
											/>
										</div>

										{/* Player */}
											<div style={{ padding: '20px 20px 14px' }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
													<div
														style={{
															width: '60px',
															height: '60px',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															borderRadius: '14px',
															background: '#1e2130',
															border: '2px solid rgba(202, 165, 60, 0.4)',
															overflow: 'hidden',
															flexShrink: 0,
														}}
													>
														<Avatar className="h-full w-full rounded-[12px]">
															<AvatarImage
																src={`https://images.hive.blog/u/${player.username}/avatar`}
																alt={`${player.username} avatar`}
																className="rounded-[12px] object-cover"
															/>
															<AvatarFallback className="rounded-[12px] bg-transparent text-[26px] font-display font-bold text-primary">
																{player.username?.[0]?.toUpperCase() ?? '?'}
															</AvatarFallback>
														</Avatar>
													</div>
												<div>
													<p
														style={{
															fontSize: '20px',
															fontWeight: 700,
															color: '#caa53c',
															margin: 0,
														}}
													>
														{player.username}
													</p>
													<p
														style={{
															fontSize: '12px',
															color: '#6b6f85',
															margin: '2px 0 0',
															fontFamily: 'Inter, sans-serif',
														}}
													>
														Level {player.level} · Rank #{rank} · {player.totalMissions}{' '}
														Missions
													</p>
												</div>
											</div>
										</div>

										{/* Guild */}
										{inGuild && (
											<div
												style={{
													padding: '0 20px 14px',
													display: 'flex',
													alignItems: 'center',
													gap: '6px',
												}}
											>
												<span style={{ fontSize: '12px' }}>🛡️</span>
												<p
													style={{
														fontSize: '11px',
														color: '#6b6f85',
														margin: 0,
														fontFamily: 'Inter, sans-serif',
													}}
												>
													<span style={{ color: '#caa53c' }}>{guildName}</span>
													<span style={{ color: '#555a70' }}> · {playerRole}</span>
												</p>
											</div>
										)}

										<div
											style={{
												padding: '0 20px 20px',
												display: 'grid',
												gridTemplateColumns: '1fr 1fr',
												gap: '8px',
											}}
										>
											{[
												{
													icon: '⚔️',
													label: 'RAID POWER',
													value: totalRaidPower.toLocaleString(),
												},
												{ icon: '🎯', label: 'MASTERY', value: totalMastery.toLocaleString() },
												{ icon: '🍀', label: 'LUCK', value: totalLuck.toLocaleString() },
												{ icon: '👑', label: 'GM BONUS', value: `+${totalGM}` },
												{ icon: '🃏', label: 'CARDS', value: `${uniqueCards} unique` },
												{
													icon: '🏆',
													label: 'ACHIEVEMENTS',
													value: `${unlockedAchievements.length}/${allAchievements.length}`,
												},
											].map((s) => (
												<div
													key={s.label}
													style={{
														background: '#181a26',
														border: '1px solid #262a3a',
														borderRadius: '10px',
														padding: '10px 14px',
														display: 'flex',
														alignItems: 'center',
														gap: '10px',
													}}
												>
													<span style={{ fontSize: '18px' }}>{s.icon}</span>
													<div>
														<p
															style={{
																fontSize: '9px',
																letterSpacing: '1.5px',
																color: '#555a70',
																margin: 0,
																fontFamily: 'Inter, sans-serif',
															}}
														>
															{s.label}
														</p>
														<p
															style={{
																fontSize: '14px',
																fontWeight: 700,
																color: '#caa53c',
																margin: '2px 0 0',
															}}
														>
															{s.value}
														</p>
													</div>
												</div>
											))}
										</div>

										{/* Footer */}
										<div
											style={{
												padding: '12px 20px',
												textAlign: 'center',
												borderTop: '1px solid rgba(202, 165, 60, 0.15)',
												background: '#111320',
												marginTop: 'auto',
											}}
										>
											<p
												style={{
													fontSize: '10px',
													letterSpacing: '2px',
													color: '#555a70',
													margin: 0,
													fontFamily: 'Inter, sans-serif',
												}}
											>
												idleraiders.site
											</p>
										</div>
									</div>

									{/* How to share instructions */}
									<div
										className="rounded-xl border border-border/50 p-3 space-y-2"
										style={{ background: 'hsl(230 12% 11%)' }}
									>
										<p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider font-semibold">
											How to share on Discord
										</p>
										<div className="space-y-1.5 text-[10px] text-muted-foreground leading-relaxed">
											<p className="flex items-start gap-1.5">
												<span className="text-primary font-bold">1.</span> Download the snapshot
												image below
											</p>
											<p className="flex items-start gap-1.5">
												<span className="text-primary font-bold">2.</span> Copy the template
												with the button below
											</p>
											<p className="flex items-start gap-1.5">
												<span className="text-primary font-bold">3.</span> Paste the template in
												Discord & attach the image
											</p>
										</div>
									</div>

									{/* Action buttons */}
									<div className="flex gap-2">
										<button
											onClick={handleDownloadSnapshot}
											disabled={generatingImage}
											className="fantasy-btn flex-1 flex items-center justify-center gap-2 py-2.5 text-xs disabled:opacity-50"
										>
											<Download size={14} /> {generatingImage ? 'Generating...' : 'Download'}
										</button>
										<button
											onClick={handleCopyTemplate}
											className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors font-semibold"
											style={{ color: 'hsl(43 80% 55%)' }}
										>
											<Copy size={14} /> Copy Template
										</button>
									</div>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body,
				)}
		</div>
	)
}

const ProfilePageWrapper = () => (
	<Suspense fallback={null}>
		<ProfilePage />
	</Suspense>
)

export default ProfilePageWrapper
