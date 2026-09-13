'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Users, Trophy, ArrowLeftRight, Wand2, Compass, Store, Flame, ExternalLink } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

// Main features (internal pages)
const mainFeatures = [
	{
		id: 'guild',
		path: '/game/guild',
		title: 'Guild',
		description: 'Team up and conquer dungeons together',
		image: '/assets/explore-guild.jpg',
		icon: Users,
		borderColor: 'border-sky-500/30',
	},
	{
		id: 'rankings',
		path: '/game/leaderboard',
		title: 'Rankings',
		description: 'Compete for the most powerful cards',
		image: '/assets/explore-rankings.jpg',
		icon: Trophy,
		borderColor: 'border-amber-500/30',
	},
	{
		id: 'crafting',
		path: '/game/crafting',
		title: 'Crafting',
		description: 'Forge stronger cards using materials',
		image: '/assets/explore-crafting.jpg',
		icon: Wand2,
		borderColor: 'border-violet-500/30',
	},
]

// Phoenix Merchant Guild features
const merchantGuildFeatures = [
	{
		id: 'marketplace',
		path: '/game/marketplace',
		title: 'Marketplace',
		description: 'Trade cards with other raiders',
		image: '/assets/explore-marketplace.jpg',
		icon: Store,
		borderColor: 'border-orange-500/30',
	},
	{
		id: 'trader',
		path: '/game/trader',
		title: 'Trader',
		description: 'Upgrade materials to higher tiers',
		image: '/assets/explore-trader.jpg',
		icon: ArrowLeftRight,
		borderColor: 'border-orange-500/30',
	},
	{
		id: 'ember-tavern',
		path: 'https://ember-tavern.idleraiders.site',
		title: 'Ember Tavern',
		description: 'Test your luck at the casino',
		image: '/assets/explore-tavern.jpg',
		icon: Flame,
		borderColor: 'border-orange-500/30',
		external: true,
	},
]

// Reusable feature card component
const FeatureCard = ({
	feature,
	index,
	size = 'normal',
	onExternalClick,
}: {
	feature: (typeof mainFeatures)[0] | (typeof merchantGuildFeatures)[0]
	index: number
	size?: 'large' | 'normal'
	onExternalClick?: (feature: (typeof merchantGuildFeatures)[0]) => void
}) => {
	const router = useRouter()
	const Icon = feature.icon
	const isExternal = 'external' in feature && feature.external

	const handleClick = () => {
		if (isExternal && onExternalClick) {
			onExternalClick(feature as (typeof merchantGuildFeatures)[0])
		} else {
			router.push(feature.path)
		}
	}

	const isLarge = size === 'large'

	return (
		<motion.button
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.1 }}
			onClick={handleClick}
			className={`group relative ${isLarge ? 'h-32' : 'h-28'} w-full overflow-hidden rounded-2xl border transition-all duration-300 active:scale-[0.98] hover:shadow-lg ${feature.borderColor}`}
		>
			<Image
				src={feature.image}
				alt={feature.title}
				fill
				className="object-cover transition-transform duration-500 group-hover:scale-110"
			/>
			<div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/20 group-hover:from-black/40 group-hover:to-black/10 transition-all duration-300" />
			<div className={`relative h-full flex flex-col justify-between ${isLarge ? 'p-4' : 'p-3'}`}>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<div className={`rounded-lg border border-primary/40 bg-background/60 backdrop-blur-sm ${isLarge ? 'p-1.5' : 'p-1'}`}>
							<Icon className={`${isLarge ? 'h-5 w-5' : 'h-4 w-4'} text-primary`} />
						</div>
						<div className="text-left">
							<div className="flex items-center gap-1.5">
								<h3 className={`font-display font-bold text-primary uppercase tracking-wide ${isLarge ? 'text-lg' : 'text-sm'}`}>
									{feature.title}
								</h3>
								{isExternal && <ExternalLink className="h-3 w-3 text-primary/60" />}
							</div>
								<p className={`text-white mt-0.5 line-clamp-1 ${isLarge ? 'text-[11px]' : 'text-[9px]'}`}>
									{feature.description}
								</p>
						</div>
					</div>
				</div>
			</div>
		</motion.button>
	)
}

const ExplorePage = () => {
	const [travelDialogOpen, setTravelDialogOpen] = useState(false)
	const [selectedDestination, setSelectedDestination] = useState<(typeof merchantGuildFeatures)[0] | null>(null)
	const isMobile = useIsMobile()

	const handleExternalClick = (feature: (typeof merchantGuildFeatures)[0]) => {
		setSelectedDestination(feature)
		setTravelDialogOpen(true)
	}

	const handleConfirmTravel = () => {
		if (selectedDestination) {
			window.open(selectedDestination.path, '_blank', 'noopener,noreferrer')
		}
		setTravelDialogOpen(false)
		setSelectedDestination(null)
	}

	// Shared body so desktop Dialog and mobile Drawer render identical content.
	const destinationCard = (
		<div className="flex items-center gap-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
				<Flame className="h-5 w-5 text-orange-500" />
			</div>
			<div className="flex-1">
				<p className="text-sm font-medium text-foreground">{selectedDestination?.title}</p>
				<p className="text-xs text-muted-foreground">{selectedDestination?.description}</p>
			</div>
			<ExternalLink className="h-4 w-4 text-muted-foreground" />
		</div>
	)

	const bodyCopy = `You are about to leave Idle Raiders and travel to an external location. The Ember Tavern is a separate experience where you can test your luck at the casino.`

	return (
		<div className="space-y-6 py-4">
			{/* Page Header */}
			<div className="flex items-center gap-2.5">
				<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
					<Compass className="text-primary" size={18} />
				</div>
				<div>
					<h1 className="font-display text-xl font-bold text-foreground">Explore</h1>
					<p className="mt-0.5 text-[10px] text-muted-foreground">
						Discover features that will strengthen your adventure
					</p>
				</div>
			</div>

			{/* Guild - Full Width Featured */}
			<div>
				<FeatureCard feature={mainFeatures[0]} index={0} size="large" />
			</div>

			{/* Main Features Grid */}
			<div className="grid grid-cols-2 gap-3">
				{mainFeatures.slice(1).map((feature, index) => (
					<FeatureCard key={feature.id} feature={feature} index={index + 1} />
				))}
			</div>

			{/* Phoenix Merchant Guild Section */}
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
						<Flame className="text-orange-500" size={14} />
					</div>
					<div>
						<h2 className="font-display text-sm font-bold text-orange-400 uppercase tracking-wide">
							Phoenix Merchant Guild
						</h2>
						<p className="text-[9px] text-muted-foreground">From ashes, prosperity</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					{/* Marketplace and Trader - top row */}
					{merchantGuildFeatures.slice(0, 2).map((feature, index) => (
						<FeatureCard
							key={feature.id}
							feature={feature}
							index={index}
							onExternalClick={handleExternalClick}
						/>
					))}
					{/* Ember Tavern - full width bottom */}
					<div className="col-span-2">
						<FeatureCard
							feature={merchantGuildFeatures[2]}
							index={2}
							size="large"
							onExternalClick={handleExternalClick}
						/>
					</div>
				</div>
			</div>

			{/* Travel Confirmation — Drawer on mobile, Dialog on desktop */}
			{isMobile ? (
				<Drawer open={travelDialogOpen} onOpenChange={setTravelDialogOpen}>
					<DrawerContent className="border-border">
						<DrawerHeader className="text-left">
							<DrawerTitle className="flex items-center gap-2 text-orange-400">
								<Flame className="h-5 w-5" />
								Travel to {selectedDestination?.title}?
							</DrawerTitle>
							<DrawerDescription className="pt-2 text-center sm:text-left">
								{bodyCopy}
							</DrawerDescription>
						</DrawerHeader>
						<div className="px-4 pb-2">{destinationCard}</div>
						<DrawerFooter className="gap-3 pt-4">
							<Button
								onClick={handleConfirmTravel}
								className="bg-orange-500 hover:bg-orange-600 text-white"
							>
								Travel Now
							</Button>
							<Button variant="outline" onClick={() => setTravelDialogOpen(false)}>
								Stay Here
							</Button>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog open={travelDialogOpen} onOpenChange={setTravelDialogOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-orange-400">
								<Flame className="h-5 w-5" />
								Travel to {selectedDestination?.title}?
							</DialogTitle>
							<DialogDescription className="pt-2">{bodyCopy}</DialogDescription>
						</DialogHeader>
						{destinationCard}
						<DialogFooter className="gap-3">
							<Button variant="outline" onClick={() => setTravelDialogOpen(false)}>
								Stay Here
							</Button>
							<Button
								onClick={handleConfirmTravel}
								className="bg-orange-500 hover:bg-orange-600 text-white"
							>
								Travel Now
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	)
}

export default ExplorePage
