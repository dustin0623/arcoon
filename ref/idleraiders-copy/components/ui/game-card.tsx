import { motion } from 'framer-motion'
import { getCardImage, CARD_BACK_FALLBACK } from '@/features/images/CardImages'
import { getMaterialImage } from '@/features/images/MaterialImages'
import { getFrameImage } from '@/features/images/FrameImages'
import { rarityText, rarityBadgeBg } from '@/lib/rarityStyles'
import { generateCardStats, BOOSTER_MULTIPLIERS } from '@/public/data/cards/cardConfig'

// Derive boost display info from a booster card's class and rarity
function getBoostInfo(item: Record<string, any>): { label: string; percent: number } | null {
	if (item.type !== 'booster' || !item.class || !item.rarity) return null
	const percent = BOOSTER_MULTIPLIERS[item.rarity] ?? 0
	const label =
		item.class === 'xpBoost' ? 'XP Boost' : item.class === 'materialBoost' ? 'Material Boost' : 'Energy Boost'
	return { label, percent }
}

/**
 * Universal GameCard component for cards, materials, lands, and any item display
 *
 * @param {Object} props
 * @param {Object} props.item - The item object (card, material, or land)
 * @param {'card'|'material'|'land'} props.type - The type of item
 * @param {'portrait'|'square'|'circular'} [props.layout='portrait'] - Card layout style
 * @param {number} [props.index=0] - Grid position for stagger animation
 * @param {Function} [props.onClick] - Click handler
 * @param {boolean} [props.clickable=true] - Whether card is clickable
 * @param {Object} [props.badges] - Badge configuration
 * @param {number} [props.badges.quantity] - Quantity badge (top-right)
 * @param {string} [props.badges.topLeft] - Custom top-left badge text
 * @param {string} [props.badges.topRight] - Custom top-right badge text (overrides quantity)
 * @param {boolean} [props.badges.active] - Active status badge
 * @param {string} [props.badges.seller] - Seller name badge
 * @param {string} [props.badges.typeLabel] - Type label (e.g., "MAT", "CORE")
 * @param {string} [props.badges.expiration] - Expiration time badge (top-right, above frame)
 * @param {Object} [props.actionButton] - Action button configuration
 * @param {string} [props.actionButton.label] - Button text
 * @param {React.ReactNode} [props.actionButton.icon] - Button icon
 * @param {Function} [props.actionButton.onClick] - Button click handler
 * @param {boolean} [props.actionButton.disabled] - Button disabled state
 * @param {Object} [props.customContent] - Custom content section
 * @param {React.ReactNode} [props.customContent.details] - Custom details below name
 * @param {React.ReactNode} [props.customContent.footer] - Custom footer above/instead button
 * @param {boolean} [props.showStats=true] - Show stats for cards
 * @param {string} [props.frameRarity] - Force a specific rarity frame on non-card items (e.g. 'common' for bag items)

 */
interface GameCardProps {
	item: Record<string, any>
	type?: string
	layout?: string
	index?: number
	onClick?: () => void
	clickable?: boolean
	badges?: {
		quantity?: number
		topLeft?: string
		topRight?: string
		active?: boolean
		seller?: string
		typeLabel?: string
		expiration?: string
	}
	actionButton?: {
		label: React.ReactNode
		icon?: React.ReactNode
		onClick?: () => void
		disabled?: boolean
		variant?: string
	}
	customContent?: {
		details?: React.ReactNode
		footer?: React.ReactNode
	}
	showStats?: boolean
	frameRarity?: string
}

const GameCard = ({
	item,
	type = 'card',
	layout = 'portrait',
	index = 0,
	onClick,
	clickable = true,
	badges = {},
	actionButton,
	customContent = {},
	showStats = true,
	frameRarity,
}: GameCardProps) => {
	// Determine item details based on type - check both prop and item.type
	const isCard = type === 'card'
	const isMaterial = type === 'material'
	const isPack = type === 'pack'

	// Get display properties
	const name = item.name || item.land?.name || 'Unknown'
	const rarity = item.rarity || item.land?.rarity || 'common'
	const icon = item.icon || item.land?.icon || '❓'

	// Compute stats — null for boosters (they show boost info instead)
	const isBooster = isCard && item.type === 'booster'
	const boostInfo = isBooster ? getBoostInfo(item) : null
	const cardStats =
		isCard && showStats && !isBooster
			? item.stats && Object.values(item.stats).some((v) => v)
				? item.stats
				: generateCardStats(item.type, item.rarity)
			: null

	// Get image
	let image = null
	if (isCard) {
		image = getCardImage(item.id, item.rarity, item.type)
	} else if (isMaterial) {
		image = getMaterialImage(item.id, item.name)
	} else if (isPack || type === 'potion') {
		// For packs and potions, use the image property that was set by inventory page
		image = item.image || null
	} else if (item.image) {
		// Fallback: use image property if present
		image = item.image
	}

	// Layout styles
	const aspectRatioClass = layout === 'square' ? 'aspect-square' : layout === 'circular' ? '' : 'aspect-[2/3]'

	// Hover behavior
	const hoverClass = clickable ? 'cursor-pointer' : ''

	// Rarity-based glow for hover effect
	const rarityGlow = {
		common: 'hover:shadow-[0_0_15px_rgba(156,163,175,0.3)]',
		uncommon: 'hover:shadow-[0_0_15px_rgba(74,222,128,0.4)]',
		rare: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.5)]',
		epic: 'hover:shadow-[0_0_20px_rgba(192,132,252,0.5)]',
		legendary: 'hover:shadow-[0_0_25px_rgba(251,191,36,0.6)]',
		special: 'hover:shadow-[0_0_25px_rgba(248,113,113,0.6)]',
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{
				delay: index * 0.025,
				type: layout === 'circular' ? 'tween' : 'spring',
				stiffness: 300,
				damping: 25,
			}}
			whileHover={clickable ? { y: -4, scale: layout === 'square' ? 1.04 : 1.02 } : {}}
			whileTap={clickable ? { scale: 0.97 } : {}}
			className={`group relative overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all duration-200 ${hoverClass} ${aspectRatioClass} ${clickable ? rarityGlow[rarity] || rarityGlow.common : ''}`}
			style={
				layout === 'square'
					? { background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }
					: undefined
			}
			onClick={clickable && onClick ? onClick : undefined}
		>
			{/* ═══ BADGES ═══ */}
			{/* Top-left badge (seller or custom) */}
			{badges.seller && (
				<div className="absolute top-2 left-2 z-50 flex items-center gap-1 rounded-md bg-background/80 border border-border/50 px-1.5 py-0.5 backdrop-blur-sm">
					<span className="text-[8px] font-semibold text-muted-foreground">{badges.seller}</span>
				</div>
			)}
			{badges.topLeft && !badges.seller && (
				<div className="absolute top-2 left-2 z-50 rounded-md bg-secondary/80 border border-border px-1.5 py-0.5 backdrop-blur-sm">
					<span className="text-[8px] font-semibold text-muted-foreground">{badges.topLeft}</span>
				</div>
			)}

			{/* Top-right badge (quantity, active, or custom) */}
			{badges.active && (
				<div className="absolute top-2 right-2 z-50 rounded-full bg-primary/90 px-2 py-0.5 text-[8px] font-bold text-primary-foreground">
					Active
				</div>
			)}
			{badges.topRight && !badges.active && (
				<div className="absolute top-2 right-2 z-50 rounded-md bg-background/90 border border-border px-2 py-0.5 text-[8px] font-bold text-foreground backdrop-blur-sm">
					{badges.topRight}
				</div>
			)}
			{!badges.active && !badges.topRight && badges.quantity && (
				<div className="absolute top-2 right-2 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 border border-border text-[9px] font-bold text-foreground backdrop-blur-sm">
					×{badges.quantity}
				</div>
			)}

			{/* Expiration badge - top right, above frame z-index */}
			{badges.expiration && (
				<div className="absolute top-2 right-2 z-50 flex items-center gap-1 rounded-md bg-black/80 border border-border/50 px-1.5 py-0.5 backdrop-blur-sm">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="10"
						height="10"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-muted-foreground"
					>
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
					<span className="text-[9px] font-medium text-muted-foreground">{badges.expiration}</span>
				</div>
			)}

			{/* ═══ IMAGE/ICON SECTION ═══ */}
			{layout === 'circular' ? (
				// Circular material layout
				<div className="flex flex-col items-center p-4 pt-8">
					<div className="flex h-16 w-16 items-center justify-center rounded-full ring-2 shadow-lg bg-secondary/60 ring-border/50">
						{image ? (
							<img
								src={image}
								alt={name}
								className="h-10 w-10 object-contain drop-shadow-md"
								onError={(e) => {
									const target = e.currentTarget
									if (isCard && target.src !== window.location.origin + CARD_BACK_FALLBACK) {
										target.src = CARD_BACK_FALLBACK
									}
								}}
							/>
						) : (
							<span className="text-2xl">{icon}</span>
						)}
					</div>
				</div>
			) : (
				// Portrait or square layout - Full image with overlay
				<>
					{/* Full background image */}
					{image ? (
						<img
							src={image}
							alt={name}
							className="absolute inset-0 w-full h-full object-contain"
							onError={(e) => {
								const target = e.currentTarget
								if (isCard && target.src !== window.location.origin + CARD_BACK_FALLBACK) {
									target.src = CARD_BACK_FALLBACK
								}
							}}
						/>
					) : (
						<div className="absolute inset-0 w-full h-full bg-secondary/30 flex items-center justify-center">
							<span className="text-5xl">{icon}</span>
						</div>
					)}

					{/* Gradient overlay at bottom */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

					{/* Card frame overlay - highest z-index */}
					{(isCard || frameRarity) && (
						<img
							src={getFrameImage(frameRarity || rarity)}
							alt="frame"
							className="absolute inset-0 w-full h-full object-contain z-40 pointer-events-none"
						/>
					)}
				</>
			)}

			{/* ═══ INFO SECTION - Absolute bottom overlay ═══ */}
			{layout === 'circular' ? (
				<div className="p-2.5 space-y-1.5">
					<div className="text-center">
						<p className="font-display text-xs font-bold text-foreground leading-tight truncate">{name}</p>
					</div>
					{customContent.details}
				</div>
			) : (
				<div className="absolute bottom-0 left-0 right-0 z-50 p-2.5 space-y-1.5">
					<div className="rounded-lg bg-black/60 px-1.5 py-1 text-center backdrop-blur-sm">
						<p className="font-display text-xs font-bold text-foreground leading-tight truncate">{name}</p>
					</div>

					{/* Combined Stats + Action Button Container for marketplace mode */}
					{actionButton ? (
						<div className="rounded-lg bg-black/70 px-2 py-2 space-y-2 backdrop-blur-sm">
							{/* Card stats */}
							{isCard && cardStats && (
								<div
									className={
										layout === 'square'
											? 'grid grid-cols-2 gap-1 text-[8px]'
											: 'grid grid-cols-4 gap-0.5 text-[9px]'
									}
								>
									<span className="flex flex-col items-center gap-0.5">
										<span className="text-xs text-muted-foreground/60">⚔️</span>
										<span className="font-bold text-foreground">{cardStats.raidPower}</span>
									</span>
									<span className="flex flex-col items-center gap-0.5">
										<span className="text-xs text-muted-foreground/60">🎯</span>
										<span className="font-bold text-foreground">{cardStats.mastery}</span>
									</span>
									{layout !== 'square' && (
										<>
											<span className="flex flex-col items-center gap-0.5">
												<span className="text-xs text-muted-foreground/60">🍀</span>
												<span className="font-bold text-foreground">{cardStats.luck}</span>
											</span>
											<span className="flex flex-col items-center gap-0.5">
												<span className="text-xs text-muted-foreground/60">👑</span>
												<span className="font-bold text-primary">{cardStats.gm}</span>
											</span>
										</>
									)}
								</div>
							)}

							{/* Booster boost info */}
							{boostInfo && showStats && (
								<p className="font-bold uppercase tracking-wider text-primary text-center text-[9px]">
									+{boostInfo.percent}% {boostInfo.label}
								</p>
							)}

							{/* Supply bar (card pool only) */}
							{customContent.details && <div>{customContent.details}</div>}

							{/* Material type */}
							{isMaterial && !customContent.details && (
								<p className="text-[9px] font-bold uppercase tracking-wider text-green-400 text-center">
									{item.type} material
								</p>
							)}

							{/* Custom footer content */}
							{customContent.footer}

							{/* Action button inside the same container */}
							<button
								disabled={actionButton.disabled}
								className={`w-full flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
									actionButton.variant === 'destructive'
										? 'bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30 hover:border-destructive'
										: 'bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 hover:border-primary'
								}`}
								onClick={(e) => {
									if (actionButton.onClick) {
										e.stopPropagation()
										actionButton.onClick()
									}
								}}
							>
								{actionButton.icon}
								{actionButton.label}
							</button>
						</div>
					) : (
						<>
							{/* Inventory mode: Stats only (no action button) */}
							{isCard && cardStats && (
								<div
									className={
										layout === 'square'
											? 'grid grid-cols-2 gap-1 text-[8px]'
											: 'grid grid-cols-4 gap-0.5 text-[9px] rounded-lg bg-black/60 px-1.5 py-1.5'
									}
								>
									<span className="flex flex-col items-center gap-0.5">
										<span className="text-xs text-muted-foreground/60">⚔️</span>
										<span className="font-bold text-foreground">{cardStats.raidPower}</span>
									</span>
									<span className="flex flex-col items-center gap-0.5">
										<span className="text-xs text-muted-foreground/60">🎯</span>
										<span className="font-bold text-foreground">{cardStats.mastery}</span>
									</span>
									{layout !== 'square' && (
										<>
											<span className="flex flex-col items-center gap-0.5">
												<span className="text-xs text-muted-foreground/60">🍀</span>
												<span className="font-bold text-foreground">{cardStats.luck}</span>
											</span>
											<span className="flex flex-col items-center gap-0.5">
												<span className="text-xs text-muted-foreground/60">👑</span>
												<span className="font-bold text-primary">{cardStats.gm}</span>
											</span>
										</>
									)}
								</div>
							)}

							{/* Booster boost info */}
							{boostInfo && showStats && (
								<div className="rounded-lg bg-black/60 px-1.5 py-1.5 text-center">
									<p className="font-bold uppercase tracking-wider text-primary mb-0.5 text-[9px]">
										+{boostInfo.percent}% {boostInfo.label}
									</p>
								</div>
							)}

							{/* Supply bar (card pool only) - shown under stats in black bg */}
							{customContent.details && (
								<div className="rounded-lg bg-black/60 px-1.5 py-1.5">{customContent.details}</div>
							)}

							{/* Material type */}
							{isMaterial && !customContent.details && (
								<p className="text-[9px] font-bold uppercase tracking-wider text-green-400">
									{item.type} material
								</p>
							)}

							{/* Custom footer content */}
							{customContent.footer}
						</>
					)}
				</div>
			)}
		</motion.div>
	)
}

export default GameCard
