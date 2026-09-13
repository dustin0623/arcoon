'use client'

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserX, Crown, Shield, Users } from 'lucide-react'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

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

export const MemberProfileModal = ({
	member,
	open,
	onClose,
	guildData,
	refreshGuild,
	actions,
}: {
	member: Record<string, any> | null
	open: boolean
	onClose: () => void
	guildData: Record<string, any> | null
	refreshGuild: () => void
	actions: Record<string, any>
}) => {
	const isMobile = useIsMobile()
	const playerRole = guildData?._playerRole ?? 'member'
	const isLeader = playerRole === 'leader'

	if (!open || !member) return null
	if (typeof document === 'undefined') return null

	const RoleIcon = roleIcons[member.role as keyof typeof roleIcons]
	const canKick = isLeader && member.role !== 'leader'

	const handleKick = async () => {
		const memberId = member._id ?? member.id
		await actions.kickMember(memberId)
		await refreshGuild()
		toast.success(`${member.name} has been kicked from the guild`)
		onClose()
	}

	// Shared body rendered inside both drawer and modal shells
	const body = (
		<div className="space-y-4">
			{/* Avatar + Name */}
			<div className="flex items-center gap-4">
				<div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary/30">
					<img
						src={`https://images.hive.blog/u/${member.name}/avatar`}
						alt={member.name}
						className="w-full h-full object-cover"
						onError={(e) => {
							e.currentTarget.style.display = 'none'
						}}
					/>
				</div>
				<div>
					<div className="flex items-center gap-1.5">
						<RoleIcon size={14} className={roleColors[member.role as keyof typeof roleColors]} />
						<h3 className="font-display text-base font-bold text-foreground">{member.name}</h3>
					</div>
					<p className="text-[10px] text-muted-foreground capitalize">
						{member.role} · Joined {member.joinedAt}
					</p>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-2">
				{[
					{ icon: '⚔️', label: 'Raid Power', value: formatNumber(member.raidPower) },
					{ icon: '💥', label: 'Guild Damage', value: formatNumber(member.totalGuildDamage) },
				].map((s) => (
					<div
						key={s.label}
						className="rounded-lg border border-border bg-secondary/50 p-2.5 text-center"
					>
						<span className="text-sm">{s.icon}</span>
						<p className="font-display text-sm font-bold text-primary mt-0.5">{s.value}</p>
						<p className="text-[9px] text-muted-foreground">{s.label}</p>
					</div>
				))}
			</div>

			{/* Guild Contributions */}
			<div className="space-y-1.5">
				<h4 className="font-display text-xs font-bold text-foreground">Guild Contributions</h4>
				<div className="rounded-lg border border-border bg-secondary/50 p-2.5 space-y-1.5">
					<div className="flex items-center justify-between text-[10px]">
						<span className="text-muted-foreground">Total Damage Dealt</span>
						<span className="text-foreground font-bold">
							{formatNumber(member.totalGuildDamage)}
						</span>
					</div>
					<div className="flex items-center justify-between text-[10px]">
						<span className="text-muted-foreground">Est. Guild XP Earned</span>
						<span className="text-foreground font-bold">
							{formatNumber(Math.floor(member.totalGuildDamage / 100))}
						</span>
					</div>
					<div className="flex items-center justify-between text-[10px]">
						<span className="text-muted-foreground">Last Active</span>
						<span className="text-foreground font-bold">{member.lastActive}</span>
					</div>
				</div>
			</div>

			{/* Kick button for leaders */}
			{canKick && (
				<button
					onClick={handleKick}
					className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors"
				>
					<UserX size={14} /> Kick from Guild
				</button>
			)}
		</div>
	)

	// Mobile: bottom sheet drawer (default max-h-[80vh])
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
				<DrawerContent className="border-border">
					<DrawerHeader className="text-left">
						<DrawerTitle className="flex items-center gap-2 text-base">
							<RoleIcon size={14} className={roleColors[member.role as keyof typeof roleColors]} />
							{member.name}
						</DrawerTitle>
					</DrawerHeader>
					<div className="px-5 pb-6 overflow-y-auto">{body}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	// Desktop: existing centered portal modal
	return createPortal(
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.9, opacity: 0 }}
					className="w-full max-w-sm"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="fantasy-card">
						{/* Close */}
						<div className="flex justify-end mb-2">
							<button
								onClick={onClose}
								className="p-1 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
							>
								<X size={14} />
							</button>
						</div>
						{body}
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>,
		document.body,
	)
}
