'use client'

import { useMemo, useState } from 'react'
import CurrencyIcon from '@/components/CurrencyIcon'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ViewPlayerProfileModal from '@/components/modals/ViewPlayerProfile'

const PLAYERS_PER_PAGE = 25

const RankBadge = ({ rank }: { rank: number }) => {
	const { Crown, Medal } = require('lucide-react')
	if (rank === 1)
		return <Crown className="h-5 w-5 text-[hsl(var(--gold-glow))] drop-shadow-[0_0_6px_hsl(var(--gold-glow))]" />
	if (rank === 2) return <Medal className="h-5 w-5 text-[hsl(220,15%,75%)]" />
	if (rank === 3) return <Medal className="h-5 w-5 text-[hsl(25,60%,50%)]" />
	return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{rank}</span>
}

export default function GlobalTab({
	leaderboardData,
	globalRanksArray,
	globalPage,
	setGlobalPage,
	EXPECTED_DAMAGE,
	PREMIUM_POOL,
}: {
	leaderboardData: Record<string, any>
	globalRanksArray: Record<string, any>[]
	globalPage: number
	setGlobalPage: (page: number) => void
	EXPECTED_DAMAGE: number
	PREMIUM_POOL: number
}) {
	const [viewingUsername, setViewingUsername] = useState<string | null>(null)

	// Calculate pool fill percent based on total damage
	const globalTotalDamage = Object.values(leaderboardData.global.ranks || {}).reduce(
		(s: number, e: any) => s + ((e as Record<string, any>).damage ?? 0),
		0,
	)
	const poolFillPercent = Math.min(100, (globalTotalDamage / EXPECTED_DAMAGE) * 100)

	// Pagination
	const globalTotalPages = Math.ceil(globalRanksArray.length / PLAYERS_PER_PAGE)

	const globalPaginatedData = useMemo(() => {
		const start = (globalPage - 1) * PLAYERS_PER_PAGE
		return globalRanksArray.slice(start, start + PLAYERS_PER_PAGE)
	}, [globalPage, globalRanksArray])

	const top3 = globalRanksArray.slice(0, 3)

	return (
		<div className="space-y-3">
			{/* Top 3 Podium */}
			<div className="grid grid-cols-3 gap-2">
				{[top3[1], top3[0], top3[2]]
					.map((entry, idx) => (entry ? { ...entry, position: idx } : null))
					.filter((e): e is Record<string, any> & { position: number } => e !== null)
					.map(({ position, ...entry }) => {
						const isFirst = position === 1
						return (
							<div
								key={entry?.rank || `rank-${position}`}
								className={`fantasy-card flex flex-col items-center p-2 md:p-3 text-center ${
									isFirst ? 'glow-gold -mt-2 pb-3' : 'mt-1'
								}`}
							>
								<RankBadge rank={entry?.rank ?? position + 1} />
								<div
									className={`mt-1 w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary flex items-center justify-center border ${
										isFirst ? 'border-primary' : 'border-border'
									}`}
								>
									<span className="text-xs md:text-sm font-bold text-foreground">
										{entry?.username?.charAt(0) ?? '?'}
									</span>
								</div>
								<p
									onClick={entry?.username ? () => setViewingUsername(entry.username) : undefined}
									className="mt-1 text-[10px] md:text-xs font-semibold text-foreground truncate w-full hover:text-primary transition-colors"
									style={{ cursor: entry?.username ? 'pointer' : 'default' }}
								>
									{entry?.username ?? 'N/A'}
								</p>
								<p className="text-[9px] md:text-[10px] text-muted-foreground">
									{entry?.points ? `${(entry.points / 1000).toFixed(0)}K pts` : entry?.damage ? `${(entry.damage / 1000).toFixed(0)}K dmg` : '0 pts'}
								</p>
								<div className="flex items-center gap-0.5 mt-0.5">
									<CurrencyIcon type="shard" size={10} />
									<span className="text-[10px] md:text-xs font-bold text-primary">
										{(entry?.reward ?? 0).toLocaleString()}
									</span>
								</div>
							</div>
						)
					})}
			</div>

			{/* Global Rankings Table */}
			<div className="fantasy-card overflow-hidden p-0">
				<table className="w-full text-xs md:text-sm">
					<thead>
						<tr className="border-b border-border bg-secondary/50 text-muted-foreground">
							<th className="px-3 py-2 text-left w-10">#</th>
							<th className="px-2 py-2 text-left">Player</th>
							<th className="px-2 py-2 text-right">Points</th>
							<th className="px-2 py-2 text-right hidden md:table-cell">Damage</th>
							<th className="px-2 py-2 text-right hidden md:table-cell">GM</th>
							<th className="px-3 py-2 text-right">
								<span className="flex items-center justify-end gap-1">
									<CurrencyIcon type="shard" size={10} /> Reward
								</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{globalPaginatedData.map((entry: Record<string, any>) => {
							const isTop3 = entry.rank <= 3
							return (
								<tr
									key={entry.rank}
									className={`border-b border-border/30 last:border-0 transition-colors hover:bg-secondary/30 ${
										isTop3 ? 'bg-primary/[0.03]' : ''
									}`}
								>
									<td className="px-3 py-2.5">
										<RankBadge rank={entry.rank} />
									</td>
									<td
										className="px-2 py-2.5 font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
										onClick={() => setViewingUsername(entry.username)}
									>
										{entry.username}
									</td>
									<td className="px-2 py-2.5 text-right font-medium text-foreground tabular-nums">
										{(entry.points ?? entry.damage).toLocaleString()}
									</td>
									<td className="px-2 py-2.5 text-right text-muted-foreground tabular-nums hidden md:table-cell">
										{entry.damage.toLocaleString()}
									</td>
									<td
										className={`px-2 py-2.5 text-right tabular-nums hidden md:table-cell ${entry.gm > 0 ? 'text-primary' : 'text-muted-foreground/50'}`}
									>
										+{entry.gm}
									</td>
									<td className="px-3 py-2.5 text-right font-semibold text-foreground tabular-nums">
										{(entry.reward ?? 0).toLocaleString()}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>

				{/* Pagination */}
				{globalTotalPages > 1 && (
					<div className="flex items-center justify-between border-t border-border px-3 py-2 bg-secondary/30">
						<span className="text-[10px] md:text-xs text-muted-foreground">
							Page {globalPage} of {globalTotalPages} · {globalRanksArray.length} players
						</span>
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								disabled={globalPage <= 1}
								onClick={() => setGlobalPage(globalPage - 1)}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								disabled={globalPage >= globalTotalPages}
								onClick={() => setGlobalPage(globalPage + 1)}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Player profile modal — opened by clicking a username on the podium or table */}
			<ViewPlayerProfileModal
				open={viewingUsername !== null}
				onClose={() => setViewingUsername(null)}
				username={viewingUsername}
			/>
		</div>
	)
}
