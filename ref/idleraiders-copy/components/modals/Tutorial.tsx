'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
	X,
	Swords,
	Zap,
	Package,
	FlaskConical,
	RotateCcw,
	Trophy,
	Users,
	ChevronLeft,
	ChevronRight,
	Sparkles,
	Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

interface TutorialModalProps {
	open: boolean
	onClose: () => void
	initialTab?: number
}

const TUTORIAL_SECTIONS = [
	{
		id: 'missions',
		title: 'Missions & Energy',
		icon: Swords,
		content: [
			{
				heading: 'How Missions Work',
				points: [
					'Missions are your primary way to earn rewards - tokens, XP, and items',
					'Each mission has a duration and energy cost displayed before you start',
					'Assign cards to missions to increase your Raid Power and boost rewards',
					'Higher difficulty missions offer better rewards but require more energy',
				],
			},
			{
				heading: 'Energy System',
				points: [
					'Energy regenerates over time (1 energy per 3 minutes)',
					'Maximum energy is 100',
					'Plan your missions around your available energy',
					'Energy Potions can restore energy instantly',
				],
			},
		],
	},
	{
		id: 'fatigue',
		title: 'Fatigue & Mastery',
		icon: Zap,
		content: [
			{
				heading: 'Understanding Fatigue',
				points: [
					'Fatigue accumulates as you complete missions and reduces bonus rewards',
					'The fatigue penalty only affects bonus tokens - base rewards are always guaranteed',
					'Fatigue Potions reduce your current fatigue by 30%',
				],
			},
			{
				heading: 'Card Mastery',
				points: [
					'Each card has a Mastery stat that counters fatigue penalties',
					'Higher mastery = less penalty from fatigue',
					'Formula: Effective Penalty = Fatigue / max(1, Mastery)',
					'Level up your cards to increase their mastery and maintain higher rewards',
				],
			},
		],
	},
	{
		id: 'cards',
		title: 'Getting Cards',
		icon: Package,
		content: [
			{
				heading: 'Card Sources',
				points: [
					'Standard Packs: Contains 5 cards with rarity-based drop rates',
					'Booster Packs: Contains 1 booster card that provides passive bonuses',
					'Story Missions: Complete story chapters to unlock unique story cards',
					'Crafting: Combine materials from dungeons and bosses to craft powerful cards',
					'Marketplace: Buy cards directly from other players',
				],
			},
			{
				heading: 'Card Types',
				points: [
					'Heroes: Main combat cards with high stats',
					'Equipment: Boost your heroes\' power',
					'Mounts: Provide speed and mobility bonuses',
					'Artifacts & Relics: Special effects and passive bonuses',
				],
			},
		],
	},
	{
		id: 'potions',
		title: 'Potions & Storage',
		icon: FlaskConical,
		content: [
			{
				heading: 'Potion Types',
				points: [
					'Energy Potion: Instantly restores energy to maximum',
					'EXP Potion: Grants +100% XP bonus for your next mission',
					'Fatigue Potion: Reduces your current fatigue by 30%',
					'Potions drop randomly from missions based on your Luck stat',
				],
			},
			{
				heading: 'Storage System',
				points: [
					'Your inventory has limited storage slots',
					'Upgrade storage capacity using shards',
					'Stack identical items to save space',
					'Sell excess items at the marketplace or to NPCs',
				],
			},
		],
	},
	{
		id: 'dungeons',
		title: 'Daily Dungeons',
		icon: RotateCcw,
		content: [
			{
				heading: 'Repeat Penalties',
				points: [
					'Running the same dungeon multiple times per day reduces bonus rewards',
					'Penalty: 15% reduction per run (up to 90% max penalty)',
					'Base rewards are never affected - only the bonus',
					'Penalties reset daily at server reset',
				],
			},
			{
				heading: 'Token Formula',
				points: [
					'Base tokens are guaranteed for completing the dungeon',
					'Bonus tokens = 10% of your Raid Power',
					'Roll range: 10% to 100% of the calculated bonus',
					'Maximize Raid Power to maximize bonus token rewards',
				],
			},
		],
	},
	{
		id: 'bosses',
		title: 'Boss Raids',
		icon: Trophy,
		content: [
			{
				heading: 'How Boss Raids Work',
				points: [
					'Boss raids are weekly competitive events',
					'Deal as much damage as possible to climb the leaderboard',
					'Your damage is based on your Raid Power and card selection',
					'Boss health pools are massive - coordinate with your guild!',
				],
			},
			{
				heading: 'Leaderboard Rewards',
				points: [
					'Top players receive premium rewards including shards and rare cards',
					'Rewards are distributed at the end of each boss cycle',
					'Guild rankings also provide bonus rewards to all members',
					'Check the leaderboard tab to see current standings',
				],
			},
		],
	},
	{
		id: 'guilds',
		title: 'Guild Benefits',
		icon: Users,
		content: [
			{
				heading: 'Why Join a Guild?',
				points: [
					'Access to guild-exclusive missions and rewards',
					'Shared guild treasury for group purchases',
					'Bonus rewards from guild boss raid rankings',
					'Social features and coordinated gameplay',
				],
			},
			{
				heading: 'Guild Progression',
				points: [
					'Contribute to your guild to earn guild XP',
					'Higher guild levels unlock better perks',
					'Guild officers can manage members and treasury',
					'Active guilds grow faster - participate daily!',
				],
			},
		],
	},
]

const TutorialModal = ({ open, onClose, initialTab = 0 }: TutorialModalProps) => {
	const [activeTab, setActiveTab] = useState(initialTab)
	const isMobile = useIsMobile()

	const currentSection = TUTORIAL_SECTIONS[activeTab]
	const Icon = currentSection.icon

	const goNext = () => {
		if (activeTab < TUTORIAL_SECTIONS.length - 1) setActiveTab(activeTab + 1)
	}
	const goPrev = () => {
		if (activeTab > 0) setActiveTab(activeTab - 1)
	}

	// Shared tab strip — horizontally scrollable on all widths
	const tabStrip = (
		<div className="flex overflow-x-auto border-b border-border shrink-0 scrollbar-hide">
			{TUTORIAL_SECTIONS.map((section, index) => {
				const TabIcon = section.icon
				return (
					<button
						key={section.id}
						onClick={() => setActiveTab(index)}
						className={`flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
							activeTab === index
								? 'border-primary text-primary bg-primary/5'
								: 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
						}`}
					>
						<TabIcon className="h-4 w-4 shrink-0" />
						<span className="hidden sm:inline">{section.title}</span>
					</button>
				)
			})}
		</div>
	)

	// Shared animated content body
	const contentBody = (
		<div className="flex-1 overflow-y-auto p-4 md:p-6">
			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -20 }}
					transition={{ duration: 0.2 }}
				>
					<div className="flex items-center gap-3 mb-4">
						<div className="p-2.5 rounded-xl bg-primary/20">
							<Icon className="h-6 w-6 text-primary" />
						</div>
						<h4 className="font-display text-xl md:text-2xl font-bold text-foreground">
							{currentSection.title}
						</h4>
					</div>
					<div className="space-y-6">
						{currentSection.content.map((block, blockIndex) => (
							<div key={blockIndex} className="space-y-3">
								<h5 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-2">
									<Heart className="h-4 w-4 text-primary/70" />
									{block.heading}
								</h5>
								<ul className="space-y-2 pl-6">
									{block.points.map((point, pointIndex) => (
										<li
											key={pointIndex}
											className="text-sm text-muted-foreground leading-relaxed list-disc marker:text-primary/50"
										>
											{point}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	)

	// Shared footer navigation (prev / dots / next)
	const footerNav = (
		<div className="flex items-center justify-between p-4 border-t border-border shrink-0 bg-secondary/20">
			<Button variant="outline" size="sm" onClick={goPrev} disabled={activeTab === 0} className="gap-1">
				<ChevronLeft className="h-4 w-4" />
				Prev
			</Button>
			<div className="flex gap-1.5">
				{TUTORIAL_SECTIONS.map((_, index) => (
					<button
						key={index}
						onClick={() => setActiveTab(index)}
						aria-label={`Go to section ${index + 1}`}
						className={`h-2 w-2 rounded-full transition-colors ${
							index === activeTab ? 'bg-primary' : 'bg-secondary hover:bg-primary/50'
						}`}
					/>
				))}
			</div>
			{activeTab < TUTORIAL_SECTIONS.length - 1 ? (
				<Button variant="default" size="sm" onClick={goNext} className="gap-1">
					Next
					<ChevronRight className="h-4 w-4" />
				</Button>
			) : (
				<Button variant="default" size="sm" onClick={onClose} className="gap-1">
					Got it!
					<Sparkles className="h-4 w-4" />
				</Button>
			)}
		</div>
	)

	if (typeof document === 'undefined') return null

	// ── Mobile: bottom drawer (default max-h-[80vh]) ─────────────────────────
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
				<DrawerContent className="border-border p-0 flex flex-col">
					<DrawerHeader className="px-4 pb-2 text-left">
						<DrawerTitle className="flex items-center gap-2 font-display text-base font-bold text-primary">
							<div className="p-1.5 rounded-lg bg-primary/20">
								<Sparkles className="h-4 w-4 text-primary" />
							</div>
							Game Tutorial
						</DrawerTitle>
					</DrawerHeader>
					{tabStrip}
					{contentBody}
					{footerNav}
				</DrawerContent>
			</Drawer>
		)
	}

	// ── Desktop: centered card modal ─────────────────────────────────────────
	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="fantasy-card glow-gold w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="flex items-center justify-between p-4 md:p-6 border-b border-border shrink-0">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-primary/20">
									<Sparkles className="h-5 w-5 text-primary" />
								</div>
								<h3 className="font-display text-lg md:text-xl font-bold text-primary">
									Game Tutorial
								</h3>
							</div>
							<button
								onClick={onClose}
								aria-label="Close tutorial"
								className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
							>
								<X size={18} />
							</button>
						</div>
						{tabStrip}
						{contentBody}
						{footerNav}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	)
}

export default TutorialModal
