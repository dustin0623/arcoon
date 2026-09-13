'use client'

import { useMemo } from 'react'
import CurrencyIcon from '@/components/CurrencyIcon'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const GUILDS_PER_PAGE = 25

const RankBadge = ({ rank }: { rank: number }) => {
	const { Crown, Medal } = require('lucide-react')
	if (rank === 1)
		return <Crown className="h-5 w-5 text-[hsl(var(--gold-glow))] drop-shadow-[0_0_6px_hsl(var(--gold-glow))]" />
	if (rank === 2) return <Medal className="h-5 w-5 text-[hsl(220,15%,75%)]" />
	if (rank === 3) return <Medal className="h-5 w-5 text-[hsl(25,60%,50%)]" />
	return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{rank}</span>
}

export default function GuildTab({
	leaderboardData,
	guildRanksArray,
	guildPage,
	setGuildPage,
}: {
	leaderboardData: Record<string, any>
	guildRanksArray: Record<string, any>[]
	guildPage: number
	setGuildPage: (page: number) => void
}) {
	// Pagination
	const guildTotalPages = Math.ceil(guildRanksArray.length / GUILDS_PER_PAGE)

	const guildPaginatedData = useMemo(() => {
		const start = (guildPage - 1) * GUILDS_PER_PAGE
		return guildRanksArray.slice(start, start + GUILDS_PER_PAGE)
	}, [guildPage, guildRanksArray])

	return (
		<div className="space-y-3">
			{guildRanksArray.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">No guilds on leaderboard yet</div>
			) : (
				<>
					{/* Guild Rankings Table */}
					<div className="fantasy-card overflow-hidden p-0">
						<table className="w-full text-xs md:text-sm">
							<thead>
								<tr className="border-b border-border bg-secondary/50 text-muted-foreground">
									<th className="px-3 py-2 text-left w-10">#</th>
									<th className="px-2 py-2 text-left">Guild</th>
									<th className="px-2 py-2 text-right">Damage</th>
									<th className="px-2 py-2 text-right">Points</th>
									<th className="px-3 py-2 text-right">Reward</th>
								</tr>
							</thead>
							<tbody>
								{guildPaginatedData.map((entry: Record<string, any>) => {
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
											<td className="px-2 py-2.5 font-medium text-foreground">
												{entry.guildName}
											</td>
											<td className="px-2 py-2.5 text-right text-muted-foreground tabular-nums">
												{(entry.damage ?? 0).toLocaleString()}
											</td>
											<td className="px-2 py-2.5 text-right text-muted-foreground tabular-nums">
												{(entry.points ?? 0).toLocaleString()}
											</td>
											<td className="px-3 py-2.5 text-right">
												<div className="flex items-center justify-end gap-1">
													<CurrencyIcon type="shard" size={12} />
													<span className="font-semibold text-primary tabular-nums">
														{(entry.reward ?? 0).toLocaleString()}
													</span>
												</div>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>

						{/* Guild Pagination */}
						{guildTotalPages > 1 && (
							<div className="flex items-center justify-between border-t border-border px-3 py-2 bg-secondary/30">
								<span className="text-[10px] md:text-xs text-muted-foreground">
									Page {guildPage} of {guildTotalPages} · {guildRanksArray.length} guilds
								</span>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										disabled={guildPage <= 1}
										onClick={() => setGuildPage(guildPage - 1)}
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										disabled={guildPage >= guildTotalPages}
										onClick={() => setGuildPage(guildPage + 1)}
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	)
}
