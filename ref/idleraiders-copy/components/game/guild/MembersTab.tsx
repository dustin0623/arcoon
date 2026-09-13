'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Crown, Shield, Users } from 'lucide-react'
import { formatNumber } from '@/lib/formatters'
import { GuildMembersFilter } from '@/components/GlobalFilter'
import { MemberProfileModal } from './MemberProfileModal'

const roleColors = {
	leader: 'text-primary',
	officer: 'text-accent-foreground',
	member: 'text-muted-foreground',
}

const roleIcons = {
	leader: Crown,
	officer: Shield,
	member: Users,
}

export const MembersTab = ({
	guildData,
	refreshGuild,
	actions,
	playerState,
	guildConstants,
}: {
	guildData: Record<string, any> | null
	refreshGuild: () => void
	actions: Record<string, any>
	playerState: Record<string, any> | null
	guildConstants: Record<string, any>
}) => {
	const members = guildData?.members ?? []
	const [memberFilters, setMemberFilters] = useState({ search: '', role: 'all' })
	const [selectedMember, setSelectedMember] = useState<Record<string, any> | null>(null)

	const filteredMembers = useMemo(() => {
		let list = [...members].sort((a: Record<string, any>, b: Record<string, any>) => {
			const roleOrder: Record<string, number> = { leader: 0, officer: 1, member: 2 }
			return roleOrder[a.role] - roleOrder[b.role] || b.totalGuildDamage - a.totalGuildDamage
		})
		if (memberFilters.role !== 'all') {
			list = list.filter((m: Record<string, any>) => m.role === memberFilters.role)
		}
		if (memberFilters.search.trim()) {
			const q = memberFilters.search.toLowerCase()
			list = list.filter((m: Record<string, any>) => m.name.toLowerCase().includes(q))
		}
		return list
	}, [members, memberFilters])

	const roles = [
		{ value: 'all', label: 'All' },
		{ value: 'leader', label: 'Leader' },
		{ value: 'officer', label: 'Officer' },
		{ value: 'member', label: 'Member' },
	]

	return (
		<div className="space-y-3">
			<GuildMembersFilter filters={memberFilters} onChange={setMemberFilters} />

			{/* Members List */}
			<div className="space-y-1">
				{filteredMembers.length === 0 ? (
					<p className="text-center text-xs text-muted-foreground py-4">No members found</p>
				) : (
					filteredMembers.map((m: Record<string, any>, i: number) => {
						const RoleIcon = roleIcons[m.role as keyof typeof roleIcons]
						const joinedDate = m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'N/A'
						return (
							<motion.div
								key={m._id || i}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: i * 0.03 }}
								className="fantasy-card flex items-center gap-3 py-2 px-3 cursor-pointer hover:border-primary/30 transition-colors"
								onClick={() => setSelectedMember(m)}
							>
								<div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
									<img
										src={`https://images.hive.blog/u/${m.name}/avatar`}
										alt={m.name}
										className="w-full h-full object-cover"
										onError={(e) => {
											e.currentTarget.src = ''
											e.currentTarget.style.display = 'none'
										}}
									/>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-1.5">
										<RoleIcon size={12} className={roleColors[m.role as keyof typeof roleColors]} />
										<span className="font-display text-xs font-bold text-foreground truncate">
											{m.name}
										</span>
									</div>
									<p className="text-[10px] text-muted-foreground">
										Joined {joinedDate}
									</p>
								</div>
								<span className="text-[10px] text-muted-foreground shrink-0">{formatNumber(m.donatedXp ?? 0)} XP donated</span>
							</motion.div>
						)
					})
				)}
			</div>

			<MemberProfileModal
				member={selectedMember}
				open={!!selectedMember}
				onClose={() => setSelectedMember(null)}
				guildData={guildData}
				refreshGuild={refreshGuild}
				actions={actions}
			/>
		</div>
	)
}
