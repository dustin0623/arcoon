'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { rarityText as rarityColors, rarityCardBg, rarityBorderGlow, rarityGlowStrong } from '@/lib/rarityStyles'
import { getCardImage } from '@/features/images'
import { CARD_BACK_FALLBACK } from '@/features/images/CardImages'
import { BOOSTER_MULTIPLIERS } from '@/public/data/cards/cardConfig'

function getBoostInfo(card: Record<string, any>): { label: string; emoji: string; percent: number } | null {
	if (card.type !== 'booster' || !card.class || !card.rarity) return null
	const percent = BOOSTER_MULTIPLIERS[card.rarity] ?? 0
	if (card.class === 'xpBoost') return { label: 'XP Boost', emoji: '✨', percent }
	if (card.class === 'materialBoost') return { label: 'Material Boost', emoji: '💎', percent }
	if (card.class === 'energyBoost') return { label: 'Energy Boost', emoji: '⚡', percent }
	return null
}

export function CardDetailModal({ open, onOpenChange, card, footer }) {
	const isMobile = useIsMobile()

	if (!card) return null

	const textColor = rarityColors[card.rarity] || 'text-foreground'
	const borderColor = rarityBorderGlow[card.rarity] || 'border-border'
	const bgColor = rarityCardBg[card.rarity] || 'bg-card'
	const glowColor = rarityGlowStrong[card.rarity] || ''
	const cardImg = getCardImage(card.id, card.rarity, card.type)

	const boostInfo = getBoostInfo(card)

	// Shared body rendered inside both the mobile drawer and the desktop dialog
	const body = (
		<div className="flex flex-col items-center gap-4 py-4">
			{/* Card Image/Icon */}
			<div className={`relative rounded-2xl border-2 ${borderColor} ${bgColor} p-1 ${glowColor}`}>
				{cardImg ? (
					<img
						src={cardImg}
						alt={card.name}
						className="h-48 w-32 rounded-xl object-cover"
						onError={(e) => {
							const target = e.currentTarget
							if (target.src !== window.location.origin + CARD_BACK_FALLBACK) {
								target.src = CARD_BACK_FALLBACK
							}
						}}
					/>
				) : (
					<div className="flex h-48 w-32 items-center justify-center rounded-xl bg-background/50">
						<span className="text-6xl">{card.icon}</span>
					</div>
				)}
			</div>

			{/* Card Info */}
			<div className="text-center space-y-2">
				<p className={`font-display text-2xl font-bold ${textColor}`}>{card.name}</p>
				<p className={`text-sm font-bold uppercase tracking-wider ${textColor}`}>{card.type}</p>
				<span
					className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${rarityCardBg[card.rarity]}`}
				>
					{card.rarity}
				</span>
			</div>

			{/* Card Stats */}
			{card.stats && Object.values(card.stats).some((v) => v) && (
				<div className="w-full rounded-xl bg-black/40 p-3 space-y-2">
					<div className="grid grid-cols-4 gap-2 text-center text-xs">
						<div>
							<p className="text-muted-foreground text-[10px] uppercase">⚔️</p>
							<p className="font-bold text-foreground">{card.stats.raidPower}</p>
						</div>
						<div>
							<p className="text-muted-foreground text-[10px] uppercase">🎯</p>
							<p className="font-bold text-foreground">{card.stats.mastery}</p>
						</div>
						<div>
							<p className="text-muted-foreground text-[10px] uppercase">🍀</p>
							<p className="font-bold text-foreground">{card.stats.luck}</p>
						</div>
						<div>
							<p className="text-muted-foreground text-[10px] uppercase">👑</p>
							<p className="font-bold text-primary">{card.stats.gm}</p>
						</div>
					</div>
				</div>
			)}

			{/* Booster Description */}
			{boostInfo && (
				<div className="w-full rounded-xl bg-black/40 p-3 text-center">
					<p className="text-lg font-bold text-primary mb-1">
						{boostInfo.emoji} {boostInfo.label}
					</p>
					<p className="font-bold text-foreground text-lg">+{boostInfo.percent}%</p>
				</div>
			)}

			{/* Footer - custom content passed by parent */}
			{footer}
		</div>
	)

	// Mobile: bottom drawer (default max-h-[80vh])
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange}>
				<DrawerContent className="border-border">
					<DrawerHeader className="sr-only">
						<DrawerTitle>{card.name}</DrawerTitle>
					</DrawerHeader>
					<div className="px-5 pb-6 overflow-y-auto">{body}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	// Desktop: centered dialog
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm border-2">{body}</DialogContent>
		</Dialog>
	)
}

export default CardDetailModal
