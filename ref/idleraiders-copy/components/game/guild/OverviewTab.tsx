'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Crown, Users, Mail, Gift, Info } from 'lucide-react'
import { formatNumber } from '@/lib/formatters'
import { getGuildBuffsAtLevel } from '@/lib/modules/guilds/guild.logic'
import { GuildSettingsModal } from './GuildSettingsModal'
import { JoinRequestsModal } from './JoinRequestsModal'
import { DonateModal } from './DonateModal'
import { GuildInfoModal } from './GuildInfoModal'

export const OverviewTab = ({
	guildData,
	guildTable,
	guildConstants,
	refreshGuild,
	actions,
	playerState,
}: {
	guildData: Record<string, any> | null
	guildTable: Record<string, any>[]
	guildConstants: Record<string, any>
	refreshGuild: () => void
	actions: Record<string, any>
	playerState: Record<string, any> | null
}) => {
	const guildName = guildData?.name ?? ''
	const guildMotto = guildData?.motto ?? ''
	const guildLevel = guildData?.level ?? 1
	const guildXp = guildData?.xp ?? 0
	const members = guildData?.members ?? []
	const MAX_GUILD_LEVEL = guildConstants?.MAX_LEVEL ?? 10
	const [settingsOpen, setSettingsOpen] = useState(false)
	const [requestsOpen, setRequestsOpen] = useState(false)
	const [donateOpen, setDonateOpen] = useState(false)
	const [infoOpen, setInfoOpen] = useState(false)
	
	// Check if current player is leader or officer (can see join requests)
	const playerRole = guildData?._playerRole ?? 'member'
	const canManageRequests = playerRole === 'leader' || playerRole === 'officer'
	const joinRequests = guildData?.joinRequests ?? []
	const pendingRequestsCount = joinRequests.length
	const buffs = getGuildBuffsAtLevel(guildLevel, guildTable as any[])
	const activeOnline = members.filter((m: Record<string, any>) => {
		if (!m.lastActive) return false
		const diffMs = Date.now() - new Date(m.lastActive).getTime()
		return diffMs < 10 * 60 * 1000 // active within 10 minutes
	}).length
	const currentLevelInfo = guildTable.find((e: Record<string, any>) => e.level === guildLevel)
	const nextLevelInfo = guildTable.find((e: Record<string, any>) => e.level === guildLevel + 1)
	// Use cumulative XP thresholds for progress calculation
	const currentCumulative = currentLevelInfo?.cumulative ?? 0
	const nextCumulative = nextLevelInfo?.cumulative ?? currentCumulative
	const xpInLevel = nextLevelInfo ? guildXp - currentCumulative : 0
	const xpNeeded = nextLevelInfo ? nextCumulative - currentCumulative : 1
	const progress = guildLevel >= MAX_GUILD_LEVEL ? 100 : Math.min(100, Math.floor((xpInLevel / xpNeeded) * 100))

	const buffList = [
		{ label: 'XP Bonus', value: buffs.xpBonus, icon: '✨', color: 'from-yellow-500/20 to-yellow-600/5' },
		{ label: 'Material Bonus', value: buffs.materialBonus, icon: '📦', color: 'from-blue-500/20 to-blue-600/5' },
		{ label: 'Energy Regen', value: buffs.energyRegen, icon: '⚡', color: 'from-green-500/20 to-green-600/5' },
		{ label: 'Boss Damage', value: buffs.bossDamage, icon: '⚔️', color: 'from-red-500/20 to-red-600/5' },
	]

	return (
		<div className="space-y-3">
			{/* Guild Banner */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				className="relative overflow-hidden rounded-2xl border border-primary/30"
				style={{ background: 'linear-gradient(160deg, hsl(230 15% 15%), hsl(230 12% 8%))' }}
			>
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

				{/* Info icon — top left */}
				<div className="absolute top-3 left-3 z-10">
					<button
						onClick={() => setInfoOpen(true)}
						className="p-1.5 rounded-lg bg-secondary/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
					>
						<Info size={14} />
					</button>
				</div>

				{/* Settings and Mail icons — top right */}
				<div className="absolute top-3 right-3 z-10 flex items-center gap-2">
					{canManageRequests && (
						<button
							onClick={() => setRequestsOpen(true)}
							className="relative p-1.5 rounded-lg bg-secondary/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
						>
							<Mail size={14} />
							{pendingRequestsCount > 0 && (
								<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
									{pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
								</span>
							)}
						</button>
					)}
					<button
						onClick={() => setSettingsOpen(true)}
						className="p-1.5 rounded-lg bg-secondary/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
					>
						<Settings size={14} />
					</button>
				</div>

				<div className="relative p-5 text-center space-y-3">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: 'spring', delay: 0.1 }}
						className="mx-auto w-16 h-16 rounded-2xl border-2 border-primary/40 bg-secondary/80 flex items-center justify-center text-3xl shadow-lg"
					>
						🏰
					</motion.div>
					<div>
						<h2 className="font-display text-xl font-bold text-primary">{guildName}</h2>
						{guildMotto && (
							<p className="text-[10px] text-muted-foreground italic mt-0.5">&quot;{guildMotto}&quot;</p>
						)}
						<div className="flex items-center justify-center gap-3 mt-1 text-xs text-muted-foreground">
							<span className="flex items-center gap-1">
								<Crown size={10} className="text-primary" /> Lv.{guildLevel}
							</span>
							<span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
							<span className="flex items-center gap-1">
								<Users size={10} /> {members.length} Members
							</span>
							<span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
							<span className="flex items-center gap-1">
								<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {activeOnline}{' '}
								Online
							</span>
						</div>
					</div>

					{/* XP Bar */}
					<div className="max-w-xs mx-auto space-y-1">
						<div className="flex justify-between text-[10px] text-muted-foreground">
							<span>Guild XP</span>
							<span>
								{guildLevel >= MAX_GUILD_LEVEL
									? 'MAX'
									: `${formatNumber(xpInLevel)} / ${formatNumber(xpNeeded)}`}
							</span>
						</div>
						<div className="h-2.5 w-full rounded-full bg-secondary/80 overflow-hidden">
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${progress}%` }}
								transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
								className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
							/>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Guild Info Modal */}
			<GuildInfoModal
				open={infoOpen}
				onClose={() => setInfoOpen(false)}
				guildLevel={guildLevel}
				guildTable={guildTable}
			/>

			{/* Settings Modal */}
			<GuildSettingsModal
				open={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				guildData={guildData}
				refreshGuild={refreshGuild}
				actions={actions}
			/>

			{/* Join Requests Modal */}
			{canManageRequests && (
				<JoinRequestsModal
					open={requestsOpen}
					onClose={() => setRequestsOpen(false)}
					actions={actions}
					refreshGuild={refreshGuild}
					guildData={guildData}
				/>
			)}

			{/* Quick Stats */}
			<div className="grid grid-cols-2 gap-2">
				{[
					{ icon: '⭐', value: formatNumber(guildData?.points ?? 0), label: 'Points' },
					{
						icon: '⚔️',
						value: formatNumber(
							members.reduce((s: number, m: Record<string, any>) => s + (m.totalGuildDamage ?? 0), 0),
						),
						label: 'Total DMG',
					},
				].map((s, i) => (
					<motion.div
						key={s.label}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.05 * (i + 1) }}
						className="rounded-xl border border-border p-2.5 text-center"
						style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
					>
						<span className="text-base">{s.icon}</span>
						<p className="font-display text-sm font-bold text-primary mt-0.5">{s.value}</p>
						<p className="text-[9px] text-muted-foreground">{s.label}</p>
					</motion.div>
				))}
			</div>

			{/* Donate Button */}
			<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
				<button
					onClick={() => setDonateOpen(true)}
					className="w-full fantasy-btn flex items-center justify-center gap-2 py-2.5 text-xs"
				>
					<Gift size={14} /> Donate to Guild
				</button>
			</motion.div>

			<DonateModal
				open={donateOpen}
				onClose={() => setDonateOpen(false)}
				playerState={playerState}
				guildConstants={guildConstants}
				refreshGuild={refreshGuild}
				actions={actions}
			/>

			{/* Active Buffs */}
			<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
				<h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
					Active Buffs
				</h3>
				<div className="grid grid-cols-2 gap-2">
					{buffList.map((b, i) => (
						<motion.div
							key={b.label}
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.15 + i * 0.05 }}
							className={`relative overflow-hidden rounded-xl border p-3 ${
								b.value > 0 ? 'border-primary/20' : 'border-border'
							}`}
							style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
						>
							{b.value > 0 && (
								<div className={`absolute inset-0 bg-gradient-to-br ${b.color} opacity-50`} />
							)}
							<div className="relative flex items-center gap-2.5">
								<span className="text-lg">{b.icon}</span>
								<div>
									<p className="text-[10px] text-muted-foreground">{b.label}</p>
									<p
										className={`font-display text-sm font-bold ${b.value > 0 ? 'text-primary' : 'text-muted-foreground/50'}`}
									>
										{b.value > 0 ? `+${(b.value * 100).toFixed(0)}%` : '—'}
									</p>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</motion.div>

			{/* Next unlock */}
			{guildLevel < MAX_GUILD_LEVEL && nextLevelInfo && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="rounded-xl border border-dashed border-primary/20 p-3 text-center"
					style={{ background: 'hsl(230 12% 11%)' }}
				>
					<p className="text-[10px] text-muted-foreground">
						🔓 Next at <span className="text-primary font-bold">Lv.{nextLevelInfo.level}</span>:{' '}
						<span className="text-foreground">{nextLevelInfo.unlock}</span>
					</p>
				</motion.div>
			)}
		</div>
	)
}
