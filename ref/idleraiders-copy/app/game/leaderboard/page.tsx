'use client'

import { useState, useEffect, useMemo } from 'react'
import { useGame } from '@/context/GameContext'
import { useTimer } from '@/hooks/useTimer'
import CurrencyIcon from '@/components/CurrencyIcon'
import GlobalTab from '@/components/game/leaderboard/GlobalTab'
import GuildTab from '@/components/game/leaderboard/GuildTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Swords, Clock, Info, History, ArrowLeft } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import LeaderboardHistoryModal from '@/components/modals/LeaderboardHistory'
import { useLeaderboardActions } from '@/features/actions/leaderboardActions'


const getNextMondayMidnightUTC = () => {
	const now = new Date()
	const day = now.getUTCDay()
	const daysUntilMonday = (8 - day) % 7 || 7
	const next = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 0, 0, 0),
	)
	if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 7)
	return next.getTime()
}

const PayoutTimer = () => {
	const endTime = useMemo(() => getNextMondayMidnightUTC(), [])
	const timer = useTimer(endTime, undefined)

	const pad = (n: number) => n.toString().padStart(2, '0')

	const timerParts = [
		...(timer.days > 0 ? [{ v: timer.days.toString(), l: 'd' }] : []),
		{ v: pad(timer.hours), l: 'h' },
		{ v: pad(timer.minutes), l: 'm' },
		{ v: pad(timer.seconds), l: 's' },
	]

	return (
		<div className="flex items-center gap-1.5">
			{timerParts.map((t, i) => (
				<div key={i} className="flex items-center gap-0.5">
					<span className="bg-secondary rounded px-1.5 py-0.5 font-mono text-sm md:text-base font-bold text-primary tabular-nums">
						{t.v}
					</span>
					<span className="text-[10px] text-muted-foreground">{t.l}</span>
				</div>
			))}
		</div>
	)
}

const LeaderboardPage = () => {
	const { playerState, gameData } = useGame()
	const { getCurrentLeaderboard, getLeaderboardByWeek } = useLeaderboardActions()
	const router = useRouter()
	const [activeTab, setActiveTab] = useState('global')
	const [globalPage, setGlobalPage] = useState(1)
	const [guildPage, setGuildPage] = useState(1)
	const [showHistoryModal, setShowHistoryModal] = useState(false)
	// When non-null, the page displays a specific (past or in-progress) week
	// fetched from the history endpoint instead of the live leaderboard.
	const [viewedWeek, setViewedWeek] = useState<number | null>(null)
	const [leaderboardData, setLeaderboardData] = useState<{
		weekNumber?: number
		startDate: string | null
		endDate: string | null
		isActive?: boolean
		expectedDamage?: number
		totalRaidPower?: number
		global: { pool: number; reward: number; ranks: Record<string, any> }
		guild: { pool: number; reward: number; ranks: Record<string, any> }
	}>({
		startDate: null,
		endDate: null,
		global: { pool: 0, reward: 0, ranks: {} },
		guild: { pool: 0, reward: 0, ranks: {} },
	})

	// Get leaderboard values - prefer dynamic values from API, fallback to ECONOMY payload
	const EXPECTED_DAMAGE = leaderboardData.expectedDamage || gameData?.ECONOMY?.LEADERBOARD?.EXPECTED_DAMAGE || 1_000_000
	const TOTAL_RAID_POWER = leaderboardData.totalRaidPower || 0
	const PREMIUM_POOL = gameData?.ECONOMY?.LEADERBOARD?.PREMIUM_POOL || 1_000
	const GUILD_POINTS_POOL = 10_000 // Guild rewards are guild points (separate from Soul Shards)
	const EXPECTED_GUILD_WAR_POINTS = 100_000 // Guild pool scales based on total war points
	// Cap displayed in the progress bar/tooltip depends on which tab is active
	const activePoolCap = activeTab === 'global' ? PREMIUM_POOL : GUILD_POINTS_POOL

	// Fetch leaderboard data, switching source based on viewedWeek:
	// - null: live computed leaderboard for the current week
	// - number: that specific week from the history endpoint (finalized or live-active)
	useEffect(() => {
		let cancelled = false

		const load = async () => {
			try {
				if (viewedWeek == null) {
					const d = await getCurrentLeaderboard()
					if (cancelled || !d) return
					setLeaderboardData({
						weekNumber: d.weekNumber,
						startDate: d.startDate ?? null,
						endDate: d.endDate ?? null,
						isActive: true,
						expectedDamage: d.expectedDamage,
						totalRaidPower: d.totalRaidPower,
						global: d.global ?? { pool: 0, reward: 0, ranks: {} },
						guild: d.guild ?? { pool: 0, reward: 0, ranks: {} },
					})
					return
				}

				const payload = await getLeaderboardByWeek(viewedWeek)
				if (cancelled) return
				const snapshot = payload?.snapshot
				if (!snapshot) {
					// Requested week has no data — fall back to live.
					setViewedWeek(null)
					return
				}
				setLeaderboardData({
					weekNumber: snapshot.weekNumber,
					startDate: snapshot.weekStart ?? null,
					endDate: snapshot.weekEnd ?? null,
					isActive: !!snapshot.isActive,
					global: snapshot.data?.global ?? { pool: 0, reward: 0, ranks: {} },
					guild: snapshot.data?.guild ?? { pool: 0, reward: 0, ranks: {} },
				})
			} catch (err) {
				if (cancelled) return
				console.error('Failed to fetch leaderboard:', err)
				setLeaderboardData({
					startDate: null,
					endDate: null,
					global: { pool: 0, reward: 0, ranks: {} },
					guild: { pool: 0, reward: 0, ranks: {} },
				})
			}
		}

		void load()
		// Reset pagination whenever the viewed week changes.
		setGlobalPage(1)
		setGuildPage(1)

		return () => {
			cancelled = true
		}
	}, [getCurrentLeaderboard, getLeaderboardByWeek, viewedWeek])

	// True when the page is showing a past/historical (non-live) week.
	const isViewingHistory = viewedWeek != null && leaderboardData.isActive === false

	// Convert ranks objects to arrays for easier display
	const globalRanksArray = useMemo(() => {
		return Object.entries(leaderboardData.global.ranks || {})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.map(([rank, data]) => ({ rank: parseInt(rank), ...(data as Record<string, any>) }))
			.sort((a, b) => a.rank - b.rank)
	}, [leaderboardData.global.ranks])

	const guildRanksArray = useMemo(() => {
		return (
			Object.entries(leaderboardData.guild.ranks || {})
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.map(([rank, data]) => ({ rank: parseInt(rank), ...(data as Record<string, any>) }))
				.sort((a, b) => a.rank - b.rank)
		)
	}, [leaderboardData.guild.ranks])

	// Current active data
	const currentRanksArray = activeTab === 'global' ? globalRanksArray : guildRanksArray
	const currentPool = activeTab === 'global' ? leaderboardData.global.pool : leaderboardData.guild.pool
	const currentPage = activeTab === 'global' ? globalPage : guildPage
	const setCurrentPage = activeTab === 'global' ? setGlobalPage : setGuildPage

	// Show nothing while game data loads (layout handles the loader)
	if (!gameData) {
		return null
	}

	// Get current player's damage from global rankings if they're in top 100
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const playerRankData = (Object.values(leaderboardData.global.ranks || {}) as Record<string, any>[]).find(
		(r) => r.username === playerState?.username,
	)
	const playerLeaderboardDamage = playerRankData?.damage ?? 0

	// Get current player's guild data from guild rankings
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const playerGuildRankData = playerState?.guildId
		? (Object.values(leaderboardData.guild.ranks || {}) as Record<string, any>[]).find(
				(r) => r.guildId?.toString() === playerState?.guildId?.toString(),
			)
		: null
	const playerGuildPoints = playerGuildRankData?.points ?? 0

	// Pool fill percent for global rankings (based on damage)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const globalTotalDamage = (Object.values(leaderboardData.global.ranks || {}) as Record<string, any>[]).reduce(
		(s, e) => s + (e.damage ?? 0),
		0,
	)
	const globalPoolFillPercent = Math.min(100, (globalTotalDamage / EXPECTED_DAMAGE) * 100)

	// Pool fill percent for guild rankings (based on points)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const guildTotalPoints = (Object.values(leaderboardData.guild.ranks || {}) as Record<string, any>[]).reduce(
		(s, e) => s + (e.points ?? 0),
		0,
	)
	const guildPoolFillPercent = Math.min(100, (guildTotalPoints / EXPECTED_GUILD_WAR_POINTS) * 100)

	// Pagination
	const globalTotalPages = Math.ceil(globalRanksArray.length / 25)
	const guildTotalPages = Math.ceil(guildRanksArray.length / 25)
	const currentTotalPages = activeTab === 'global' ? globalTotalPages : guildTotalPages

	return (
		<div className="space-y-3 py-4">
			{/* Title */}
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
					<h1 className="font-display text-xl md:text-2xl font-bold text-foreground truncate">
						Leaderboard
						{viewedWeek != null ? ` Week ${viewedWeek}` : ''}
					</h1>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					{viewedWeek != null && (
						<button
							onClick={() => setViewedWeek(null)}
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-semibold text-primary transition-colors"
						>
							<ArrowLeft size={14} />
							<span className="hidden sm:inline">Current</span>
						</button>
					)}
					<button
						onClick={() => setShowHistoryModal(true)}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
					>
						<History size={14} />
						<span className="hidden sm:inline">History</span>
					</button>
				</div>
			</div>

			{/* History Modal */}
			<LeaderboardHistoryModal
				open={showHistoryModal}
				onClose={() => setShowHistoryModal(false)}
				onSelectWeek={(weekNumber) => setViewedWeek(weekNumber)}
				currentWeekNumber={viewedWeek}
			/>

			{/* Stats Row */}
			<div className="grid grid-cols-2 gap-2">
				{/* Reward Pool */}
				<div className="fantasy-card p-3 space-y-1.5">
					<div className="flex items-center gap-1">
						<p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
							{activeTab === 'global' ? 'Global' : 'Guild'} Pool
						</p>
						<TooltipProvider delayDuration={200}>
							<Tooltip>
								<TooltipTrigger asChild>
									<button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
										<Info size={11} />
									</button>
								</TooltipTrigger>
								<TooltipContent
									side="top"
									className="max-w-[260px] text-[10px] leading-relaxed bg-background text-foreground border border-border"
								>
									<p className="font-semibold text-foreground mb-1">How the pool is calculated</p>
									{activeTab === 'global' ? (
										<>
											<p>
												The pool scales based on total damage vs. a{' '}
												<span className="text-primary font-semibold">{EXPECTED_DAMAGE.toLocaleString()}</span> damage target, capped at{' '}
												{PREMIUM_POOL.toLocaleString()} Soul Shards.
											</p>
											{TOTAL_RAID_POWER > 0 && (
												<p className="mt-1.5 pt-1.5 border-t border-border/50 text-muted-foreground">
													Target is dynamic based on total raid power ({TOTAL_RAID_POWER.toLocaleString()} RP).
												</p>
											)}
										</>
									) : (
										<p>
											The guild pool scales based on total war points vs. a{' '}
											{EXPECTED_GUILD_WAR_POINTS.toLocaleString()} points target, capped at{' '}
											{GUILD_POINTS_POOL.toLocaleString()} Guild Points. Points are earned from
											guild war damage (1000 dmg = 1 pt) and capturing outposts.
										</p>
									)}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<div className="flex items-center gap-1">
						<CurrencyIcon type="shard" size={14} />
						<span className="font-display text-sm md:text-lg font-bold text-primary">
							{currentPool.toLocaleString()}
						</span>
						<span className="text-[10px] text-muted-foreground">/ {activePoolCap.toLocaleString()}</span>
					</div>
					<div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
						<div
							className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--gold-dim))] to-[hsl(var(--gold-glow))] transition-all"
							style={{ width: `${activeTab === 'global' ? globalPoolFillPercent : guildPoolFillPercent}%` }}
						/>
					</div>
				</div>

				{/* Your Stats - changes based on tab */}
				<div className="fantasy-card p-3 space-y-1.5">
					<p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
						{activeTab === 'global' ? 'Your Damage' : 'Your Guild Points'}
					</p>
					<div className="flex items-center gap-1">
						<Swords className="h-3.5 w-3.5 text-primary" />
						<span className="font-display text-sm md:text-lg font-bold text-primary">
							{activeTab === 'global'
								? playerLeaderboardDamage.toLocaleString()
								: playerGuildPoints.toLocaleString()}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<CurrencyIcon type="shard" size={10} />
						<span className="text-[10px] md:text-xs text-muted-foreground">
							{activeTab === 'global'
								? playerRankData
									? `Rank ${playerRankData.rank}`
									: 'Not ranked'
								: playerGuildRankData
									? `Rank ${playerGuildRankData.rank}`
									: 'Not ranked'}
						</span>
					</div>
				</div>
			</div>

			{/* Payout Timer / Historical Week Chip */}
			<div className="fantasy-card glow-gold flex items-center justify-between p-3">
				{isViewingHistory ? (
					<>
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<div>
								<p className="text-[10px] md:text-xs text-muted-foreground">Week Ended</p>
								<p className="font-display text-xs md:text-sm font-semibold text-foreground">
									{leaderboardData.endDate
										? new Date(leaderboardData.endDate).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})
										: '—'}
								</p>
							</div>
						</div>
						<span className="text-[10px] uppercase tracking-wider rounded-full bg-secondary border border-border px-2 py-0.5 text-muted-foreground">
							Finalized
						</span>
					</>
				) : (
					<>
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-primary" />
							<div>
								<p className="text-[10px] md:text-xs text-muted-foreground">Next Payout</p>
								<p className="font-display text-xs md:text-sm font-semibold text-primary">
									Monday 12:00 AM UTC
								</p>
							</div>
						</div>
						<PayoutTimer />
					</>
				)}
			</div>

			{/* Ranking Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="w-full grid grid-cols-2">
					<TabsTrigger value="global">Global Rankings</TabsTrigger>
					<TabsTrigger value="guild" disabled={!isViewingHistory && !playerState?.guildId}>
						Guild Rankings
					</TabsTrigger>
				</TabsList>

				{/* Global Rankings Tab */}
				<TabsContent value="global" className="space-y-3">
					<GlobalTab
						leaderboardData={leaderboardData}
						globalRanksArray={globalRanksArray}
						globalPage={globalPage}
						setGlobalPage={setGlobalPage}
						EXPECTED_DAMAGE={EXPECTED_DAMAGE}
						PREMIUM_POOL={PREMIUM_POOL}
					/>
				</TabsContent>

				{/* Guild Rankings Tab */}
				<TabsContent value="guild" className="space-y-3">
					<GuildTab
						leaderboardData={leaderboardData}
						guildRanksArray={guildRanksArray}
						guildPage={guildPage}
						setGuildPage={setGuildPage}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

export default LeaderboardPage
