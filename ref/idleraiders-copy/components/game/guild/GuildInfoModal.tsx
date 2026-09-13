'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Star, Zap, Package, Swords, Lock, Check, Users } from 'lucide-react'
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

const MEMBER_CAP_BY_LEVEL: Record<number, number> = {
	1: 5, 2: 8, 3: 10, 4: 12, 5: 15, 6: 17, 7: 20,
	8: 22, 9: 25, 10: 27, 11: 30, 12: 35, 13: 40, 14: 45, 15: 50,
}

interface GuildInfoModalProps {
	open: boolean
	onClose: () => void
	guildLevel: number
	guildTable: Record<string, any>[]
}

export function GuildInfoModal({ open, onClose, guildLevel, guildTable }: GuildInfoModalProps) {
	const isMobile = useIsMobile()

	if (!open) return null

	// Shared body — one source of truth for level cards in both mobile drawer and desktop modal.
	const body = (
		<>
			<p className="text-xs text-muted-foreground">
				Level up your guild by donating gold and materials. Higher levels unlock powerful buffs for all members.
			</p>

			<div className="space-y-2">
				{guildTable.map((level) => {
					const isUnlocked = guildLevel >= level.level
					const isCurrent = guildLevel === level.level

					return (
						<motion.div
							key={level.level}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: level.level * 0.03 }}
							className={`relative rounded-xl border p-3 transition-all ${
								isCurrent
									? 'border-primary/50 bg-primary/5'
									: isUnlocked
										? 'border-border/50 bg-secondary/30'
										: 'border-border/30 bg-secondary/10 opacity-60'
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-2">
									<div
										className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
											isCurrent
												? 'bg-primary text-primary-foreground'
												: isUnlocked
													? 'bg-secondary text-foreground'
													: 'bg-secondary/50 text-muted-foreground'
										}`}
									>
										{level.level}
									</div>
									<div>
										<p className="text-xs font-semibold text-foreground">Level {level.level}</p>
										<p className="text-[10px] text-muted-foreground">
											{level.xpRequired.toLocaleString()} XP required
										</p>
									</div>
								</div>
								{isUnlocked ? (
									<Check className="w-4 h-4 text-green-500 shrink-0" />
								) : (
									<Lock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
								)}
							</div>

							<div className="mt-2 grid grid-cols-2 gap-1.5">
								<div className="flex items-center gap-1.5 text-[10px]">
									<Users className="w-3 h-3 text-sky-400" />
									<span className="text-muted-foreground">Members:</span>
									<span className="font-semibold text-foreground">
										{MEMBER_CAP_BY_LEVEL[level.level] ?? 5}
									</span>
								</div>
								{(level.xpBonus ?? 0) > 0 && (
									<div className="flex items-center gap-1.5 text-[10px]">
										<Star className="w-3 h-3 text-yellow-500" />
										<span className="text-muted-foreground">XP:</span>
										<span className="font-semibold text-foreground">
											+{((level.xpBonus ?? 0) * 100).toFixed(0)}%
										</span>
									</div>
								)}
								{(level.materialBonus ?? 0) > 0 && (
									<div className="flex items-center gap-1.5 text-[10px]">
										<Package className="w-3 h-3 text-blue-500" />
										<span className="text-muted-foreground">Material:</span>
										<span className="font-semibold text-foreground">
											+{((level.materialBonus ?? 0) * 100).toFixed(0)}%
										</span>
									</div>
								)}
								{(level.energyRegen ?? 0) > 0 && (
									<div className="flex items-center gap-1.5 text-[10px]">
										<Zap className="w-3 h-3 text-green-500" />
										<span className="text-muted-foreground">Energy:</span>
										<span className="font-semibold text-foreground">
											+{((level.energyRegen ?? 0) * 100).toFixed(0)}%
										</span>
									</div>
								)}
								{(level.bossDamage ?? 0) > 0 && (
									<div className="flex items-center gap-1.5 text-[10px]">
										<Swords className="w-3 h-3 text-red-500" />
										<span className="text-muted-foreground">Boss DMG:</span>
										<span className="font-semibold text-foreground">
											+{((level.bossDamage ?? 0) * 100).toFixed(0)}%
										</span>
									</div>
								)}
							</div>

							{level.unlock && (
								<div className="mt-2 pt-2 border-t border-border/30">
									<p className="text-[10px] text-primary">Unlocks: {level.unlock}</p>
								</div>
							)}
						</motion.div>
					)
				})}
			</div>
		</>
	)

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(v) => !v && onClose()}>
				<DrawerContent className="border-border">
					<DrawerHeader className="text-left">
						<DrawerTitle className="flex items-center gap-2">
							<Crown className="w-5 h-5 text-primary" />
							Guild Progression
						</DrawerTitle>
						<DrawerDescription className="sr-only">
							Level-by-level breakdown of guild XP requirements, member caps, and unlocked buffs.
						</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-6 max-h-[70vh] overflow-y-auto space-y-4">{body}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	// Desktop — preserve existing centered framer-motion shell
	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
				onClick={onClose}
			>
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.95, opacity: 0 }}
					className="relative w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl border border-primary/30 bg-background shadow-2xl"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
						<div className="flex items-center gap-2">
							<Crown className="w-5 h-5 text-primary" />
							<h2 className="font-display text-lg font-bold">Guild Progression</h2>
						</div>
						<button
							onClick={onClose}
							className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
							aria-label="Close"
						>
							<X size={18} />
						</button>
					</div>

					<div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-60px)]">{body}</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	)
}
