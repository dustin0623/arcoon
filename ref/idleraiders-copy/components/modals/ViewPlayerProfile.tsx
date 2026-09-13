'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
	X,
	Loader2,
	Clock,
	Target,
	Swords,
	Crown,
	BookOpen,
	Package,
	Zap,
	Shield,
	Crosshair,
	Clover,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import CurrencyIcon from '@/components/CurrencyIcon'
import { useApiActions } from '@/features/actions/apiClient'

interface ViewedProfile {
	username: string
	level: number
	xp: number
	xpToNextLevel: number
	coins: number
	shards: number
	totalMissions: number
	totalBossDamage: number
	totalMinutesPlayed: number
	joinedAt: number
	raidPower: number
	mastery: number
	luck: number
	gm: number
	totalCards: number
	uniqueCards: number
	totalMaterials: number
	boosts?: { expBoost?: number; matBoost?: number; energyBoost?: number }
	guild?: { name: string; level: number; role: string } | null
}

interface Props {
	open: boolean
	onClose: () => void
	username: string | null
}

const formatMinutes = (minutes: number) => {
	if (!minutes) return '0m'
	const days = Math.floor(minutes / (60 * 24))
	const hours = Math.floor((minutes % (60 * 24)) / 60)
	const mins = Math.floor(minutes % 60)
	if (days > 0) return `${days}d ${hours}h`
	if (hours > 0) return `${hours}h ${mins}m`
	return `${mins}m`
}

const formatDate = (ts: number) => {
	if (!ts) return '—'
	return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const ViewPlayerProfileModal = ({ open, onClose, username }: Props) => {
	const { authGet } = useApiActions()
	const [profile, setProfile] = useState<ViewedProfile | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!open || !username) return
		let cancelled = false

		const load = async () => {
			setLoading(true)
			setError(null)
			setProfile(null)
			try {
				const response = await authGet(`/api/players/profile?username=${encodeURIComponent(username)}`)
				if (cancelled) return
				if (response?.success && response.profile) {
					setProfile(response.profile as ViewedProfile)
				} else {
					setError(response?.message || 'Failed to load profile')
				}
			} catch {
				if (!cancelled) setError('Failed to load profile')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		void load()
		return () => {
			cancelled = true
		}
	}, [open, username, authGet])

	if (typeof document === 'undefined') return null

	const boosts = profile?.boosts ?? {}
	const boostTiles: { key: 'expBoost' | 'matBoost' | 'energyBoost'; label: string; Icon: typeof BookOpen }[] = [
		{ key: 'expBoost', label: 'XP', Icon: BookOpen },
		{ key: 'matBoost', label: 'Material', Icon: Package },
		{ key: 'energyBoost', label: 'Energy', Icon: Zap },
	]

	const combatStats = profile
		? [
				{ label: 'Raid Power', value: profile.raidPower, Icon: Swords },
				{ label: 'Mastery', value: profile.mastery, Icon: Crosshair },
				{ label: 'Luck', value: profile.luck, Icon: Clover },
				{ label: 'GM Bonus', value: profile.gm, Icon: Crown, isGM: true },
			]
		: []

	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.92, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.92, opacity: 0 }}
						className="fantasy-card glow-gold w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="flex items-center justify-between p-3 border-b border-border">
							<h3 className="font-display text-base font-bold text-primary truncate">
								{username ? `@${username}` : 'Player Profile'}
							</h3>
							<button
								onClick={onClose}
								aria-label="Close"
								className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
							>
								<X size={18} />
							</button>
						</div>

						{/* Body */}
						<div className="flex-1 overflow-y-auto">
							{loading && (
								<div className="flex items-center justify-center py-16">
									<Loader2 size={24} className="text-muted-foreground/50 animate-spin" />
								</div>
							)}

							{error && !loading && (
								<div className="text-center py-12 px-4">
									<p className="text-sm text-muted-foreground">{error}</p>
								</div>
							)}

							{profile && !loading && (
								<div className="p-4 space-y-4">
									{/* Hero banner */}
									<div
										className="relative overflow-hidden rounded-xl border border-primary/30 p-4"
										style={{
											background: 'linear-gradient(160deg, hsl(230 15% 15%), hsl(230 12% 8%))',
										}}
									>
										<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
										<div className="flex items-center gap-3">
											<div className="relative shrink-0">
												<Avatar className="h-14 w-14 rounded-xl border-2 border-primary/40 shadow-lg">
													<AvatarImage
														src={`https://images.hive.blog/u/${profile.username}/avatar`}
														alt={`${profile.username} avatar`}
														className="rounded-xl object-cover"
													/>
													<AvatarFallback className="rounded-xl bg-secondary/80 text-2xl font-display font-bold text-primary">
														{profile.username?.[0]?.toUpperCase() ?? '?'}
													</AvatarFallback>
												</Avatar>
												<div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground border-2 border-background">
													{profile.level}
												</div>
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="font-display text-lg font-bold text-primary truncate">
													{profile.username}
												</h4>
												<p className="text-[10px] text-muted-foreground">
													Level {profile.level} Raider
												</p>
												{profile.guild && (
													<p className="mt-0.5 text-[10px] text-muted-foreground/80 flex items-center gap-1">
														<Shield size={10} className="text-primary/60" />
														<span className="text-foreground/80 truncate">
															{profile.guild.name}
														</span>
														<span className="capitalize">· {profile.guild.role}</span>
													</p>
												)}
												<div className="mt-2">
													<div className="flex items-center justify-between mb-1">
														<span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
															Experience
														</span>
														<span className="text-[9px] text-muted-foreground">
															{profile.xp.toLocaleString()} /{' '}
															{profile.xpToNextLevel.toLocaleString()}
														</span>
													</div>
													<div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/80">
														<motion.div
															initial={{ width: 0 }}
															animate={{
																width: `${(profile.xp / profile.xpToNextLevel) * 100}%`,
															}}
															transition={{ delay: 0.2, duration: 0.6 }}
															className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
														/>
													</div>
												</div>
											</div>
										</div>
										<p className="mt-2 text-[9px] text-muted-foreground/40 text-right">
											Joined {formatDate(profile.joinedAt)}
										</p>
									</div>

									{/* Activity */}
									<div>
										<h5 className="mb-2 font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
											Activity
										</h5>
										<div className="grid grid-cols-3 gap-2">
											<StatTile
												Icon={Clock}
												value={formatMinutes(profile.totalMinutesPlayed)}
												label="Mission Time"
											/>
											<StatTile
												Icon={Target}
												value={profile.totalMissions.toLocaleString()}
												label="Missions"
											/>
											<StatTile
												Icon={Swords}
												value={profile.totalBossDamage.toLocaleString()}
												label="Boss Damage"
											/>
										</div>
									</div>

									{/* Wealth & Collection */}
									<div>
										<h5 className="mb-2 font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
											Wealth & Collection
										</h5>
										<div className="grid grid-cols-2 gap-2">
												<WealthTile
													iconNode={<CurrencyIcon type="coin" size={14} />}
													value={profile.coins.toLocaleString()}
													label="Realm Coins"
												/>
												<WealthTile
													iconNode={<CurrencyIcon type="shard" size={14} />}
													value={profile.shards.toLocaleString()}
													label="Soul Shards"
												/>
											<WealthTile
												iconNode={<span className="text-sm">🃏</span>}
												value={`${profile.totalCards} (${profile.uniqueCards})`}
												label="Cards (Unique)"
											/>
											<WealthTile
												iconNode={<Package size={14} className="text-primary" />}
												value={profile.totalMaterials.toLocaleString()}
												label="Materials"
											/>
										</div>
									</div>

									{/* Combat Stats */}
									<div>
										<h5 className="mb-2 font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
											Combat Stats
										</h5>
										<div className="fantasy-card p-0 overflow-hidden">
											{combatStats.map((s, i) => (
												<div
													key={s.label}
													className={`flex items-center justify-between px-3 py-2.5 ${
														i < combatStats.length - 1 ? 'border-b border-border/40' : ''
													}`}
												>
													<div className="flex items-center gap-2">
														<s.Icon
															size={16}
															className={s.isGM ? 'text-primary' : 'text-primary/80'}
														/>
														<span className="text-xs text-foreground">{s.label}</span>
													</div>
													<span
														className={`font-display text-sm font-bold tabular-nums ${s.isGM ? 'text-primary' : 'text-foreground'}`}
													>
														{s.isGM ? `+${s.value}` : s.value.toLocaleString()}
													</span>
												</div>
											))}
										</div>
									</div>

									{/* Active Boosts */}
									<div>
										<h5 className="mb-2 font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
											Active Boosts
										</h5>
										<div className="grid grid-cols-3 gap-2">
											{boostTiles.map((b) => {
												const eff = boosts[b.key] ?? 0
												const mult = 1 + eff / 100
												const hasBoost = eff > 0
												return (
													<div
														key={b.key}
														className="rounded-xl border border-border p-3 text-center"
														style={{
															background:
																'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))',
														}}
													>
														<b.Icon
															size={16}
															className={`mx-auto ${hasBoost ? 'text-primary' : 'text-muted-foreground/60'}`}
														/>
														<p
															className={`mt-1 text-xs font-display font-bold ${hasBoost ? 'text-primary' : 'text-foreground'}`}
														>
															{mult.toFixed(2)}x
														</p>
														<p className="text-[9px] uppercase tracking-wider text-muted-foreground">
															{b.label}
														</p>
														{hasBoost && (
															<p className="text-[8px] text-primary/80 mt-0.5 font-semibold">
																+{eff.toFixed(1)}%
															</p>
														)}
													</div>
												)
											})}
										</div>
									</div>
								</div>
							)}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body
	)
}

const StatTile = ({
	Icon,
	value,
	label,
}: {
	Icon: typeof Clock
	value: string
	label: string
}) => (
	<div
		className="rounded-xl border border-border p-2.5 text-center"
		style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
	>
		<Icon size={16} className="mx-auto text-primary" />
		<p className="mt-1 text-sm font-display font-bold text-foreground">{value}</p>
		<p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
	</div>
)

const WealthTile = ({
	iconNode,
	value,
	label,
}: {
	iconNode: React.ReactNode
	value: string
	label: string
}) => (
	<div
		className="rounded-xl border border-border p-3 text-center"
		style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
	>
		<div className="flex items-center justify-center">{iconNode}</div>
		<p className="mt-1 text-sm font-display font-bold text-foreground">{value}</p>
		<p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
	</div>
)

export default ViewPlayerProfileModal
