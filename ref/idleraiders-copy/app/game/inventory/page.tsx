'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '@/context/GameContext'
import { Layers, Backpack, ChevronLeft, ChevronRight } from 'lucide-react'
import { InventoryCardsFilter, InventoryMaterialsFilter } from '@/components/GlobalFilter'
import { GAME_UI_IMAGES, MATERIAL_IMAGES } from '@/features/images'
import GameCard from '@/components/ui/game-card'

const PAGE_SIZE = 15

const InventoryPage = () => {
	const { playerState, gameData } = useGame()
	const cards = playerState?.cards ?? []
	const materials = playerState?.materials ?? []
	const potions = playerState?.potions ?? []
	const packs = playerState?.packs ?? []
	const [tab, setTab] = useState('cards')
	const [cardsFilters, setCardsFilters] = useState({ search: '', rarity: 'all', type: 'all' })
	const [bagFilters, setBagFilters] = useState({ search: '', materialType: 'all' })
	const [cardsPage, setCardsPage] = useState(1)
	const [bagPage, setBagPage] = useState(1)

	// Get full card definitions
	const CARDS_DATA = useMemo(() => gameData?.CARDS ?? [], [gameData])

	const filtered = useMemo(
		() =>
			cards
				.map((c) => {
					// Enrich with full card definition (includes boost data)
					const cardDef = CARDS_DATA.find((def) => def.id === c.id)
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return { ...cardDef, ...c, quantity: c.quantity } as Record<string, any>
				})
				.filter((c) => {
					if (cardsFilters.rarity !== 'all' && c.rarity !== cardsFilters.rarity) return false
					if (cardsFilters.type !== 'all' && c.type !== cardsFilters.type) return false
					if (cardsFilters.search && !c.name.toLowerCase().includes(cardsFilters.search.toLowerCase()))
						return false
					return true
				}),
		[cards, cardsFilters, CARDS_DATA],
	)

	// Combine all inventory items
	const allItems = useMemo(() => [...materials, ...potions, ...packs], [materials, potions, packs])

	// Get item metadata (name, icon, etc) from gameData
	const getItemMetadata = (itemId: string) => {
		const itemsData = gameData?.ITEMS ?? []
		return itemsData.find((item) => item.id === itemId)
	}

	const filteredItems = useMemo(
		() =>
			allItems
				.filter((item) => (item.quantity ?? 0) > 0) // Only show items with quantity > 0
				.filter((item) => {
					const metadata = getItemMetadata(item.id)
					if (bagFilters.search && !metadata?.name?.toLowerCase().includes(bagFilters.search.toLowerCase()))
						return false
					// Filter by material type
					if (bagFilters.materialType !== 'all') {
						const filterType = bagFilters.materialType
						// Check if item matches the selected type
						if (filterType === 'potion' && item.itemType !== 'potion') return false
						if (filterType === 'pack' && item.itemType !== 'pack') return false
						// For materials, check the material type (core, component, catalyst)
						if (['core', 'component', 'catalyst'].includes(filterType)) {
							if (item.itemType !== 'material' || metadata?.type !== filterType) return false
						}
					}
					return true
				})
				.map((item) => {
					const metadata = getItemMetadata(item.id)
					let enhancedMetadata = { ...metadata }

					// Add pack images for pack items
					if (item.itemType === 'pack') {
						if (item.id === 'booster_pack') {
							enhancedMetadata.image = GAME_UI_IMAGES.boosterPack
						} else if (item.id === 'standard_pack') {
							enhancedMetadata.image = GAME_UI_IMAGES.heroesPack
						}
					}

					// Add material images
					if (item.itemType === 'material' && MATERIAL_IMAGES[item.id]) {
						enhancedMetadata.image = MATERIAL_IMAGES[item.id]
					}

					return {
						...item,
						...enhancedMetadata,
						_id: `${item.itemType}-${item.id}`, // Unique key for React
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					} as Record<string, any>
				}),
		[allItems, bagFilters, gameData],
	)

	// Reset pages when filters change
	useEffect(() => { setCardsPage(1) }, [cardsFilters])
	useEffect(() => { setBagPage(1) }, [bagFilters])

	// Pagination
	const cardsTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
	const paginatedCards = useMemo(
		() => filtered.slice((cardsPage - 1) * PAGE_SIZE, cardsPage * PAGE_SIZE),
		[filtered, cardsPage],
	)

	const bagTotalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
	const paginatedItems = useMemo(
		() => filteredItems.slice((bagPage - 1) * PAGE_SIZE, bagPage * PAGE_SIZE),
		[filteredItems, bagPage],
	)

	const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
	const totalItems = allItems.filter((i) => (i.quantity ?? 0) > 0).length
	const activeFilters = (cardsFilters.rarity !== 'all' ? 1 : 0) + (cardsFilters.type !== 'all' ? 1 : 0)

	return (
		<div className="flex flex-col gap-4 py-4">
			{/* Header */}
			<div className="flex items-end justify-between">
				<div>
					<h1 className="font-display text-xl font-bold text-foreground">Inventory</h1>
					<p className="text-[10px] text-muted-foreground mt-0.5">
						{tab === 'cards' ? `${totalCards} cards · ${cards.length} unique` : `${totalItems} items`}
					</p>
				</div>
			</div>

			{/* Tab bar */}
			<div className="flex rounded-xl bg-secondary p-1 gap-1">
				{[
					{ id: 'cards', label: 'Cards', icon: Layers, count: cards.length },
					{ id: 'bag', label: 'Bag', icon: Backpack, count: totalItems },
				].map((t) => {
					const Icon = t.icon
					const isActive = tab === t.id
					return (
						<button
							key={t.id}
							onClick={() => setTab(t.id)}
							className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all ${
								isActive
									? 'bg-primary text-primary-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							<Icon size={14} />
							{t.label}
							<span
								className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
									isActive
										? 'bg-primary-foreground/20 text-primary-foreground'
										: 'bg-secondary text-muted-foreground'
								}`}
							>
								{t.count}
							</span>
						</button>
					)
				})}
			</div>

			<AnimatePresence mode="wait">
				{/* ═══ CARDS TAB ═══ */}
				{tab === 'cards' && (
					<motion.div
						key="cards"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.18 }}
						className="space-y-3"
					>
						{/* Filters */}
						<InventoryCardsFilter
							filters={cardsFilters}
							onChange={setCardsFilters}
							activeFiltersCount={activeFilters}
						/>
						{/* Card grid */}
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{paginatedCards.map((card, i) => (
								<GameCard
									key={card.id}
									item={card}
									type="card"
									layout="portrait"
									index={i}
									clickable={false}
									badges={{ typeLabel: card.type, quantity: card.quantity }}
									showStats={true}
								/>
							))}
						</div>

						{filtered.length === 0 && (
							<div className="flex flex-col items-center justify-center py-16 gap-2">
								<Layers size={32} className="text-muted-foreground/30" />
								<p className="text-sm text-muted-foreground">No cards found</p>
								{(cardsFilters.rarity !== 'all' ||
									cardsFilters.type !== 'all' ||
									cardsFilters.search) && (
									<button
										onClick={() => setCardsFilters({ search: '', rarity: 'all', type: 'all' })}
										className="text-[10px] text-primary font-medium hover:underline"
									>
										Clear filters
									</button>
								)}
							</div>
						)}

						{/* Pagination */}
						{cardsTotalPages > 1 && (
							<div className="flex items-center justify-center gap-3 pt-2 pb-1">
								<button
									onClick={() => setCardsPage((p) => Math.max(1, p - 1))}
									disabled={cardsPage === 1}
									className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-secondary/80 transition-all"
								>
									<ChevronLeft size={16} />
								</button>
								<span className="text-xs text-muted-foreground">
									<span className="text-foreground font-semibold">{cardsPage}</span>
									{' / '}
									{cardsTotalPages}
								</span>
								<button
									onClick={() => setCardsPage((p) => Math.min(cardsTotalPages, p + 1))}
									disabled={cardsPage === cardsTotalPages}
									className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-secondary/80 transition-all"
								>
									<ChevronRight size={16} />
								</button>
							</div>
						)}
					</motion.div>
				)}

				{/* ═══ BAG TAB ═══ */}
				{tab === 'bag' && (
					<motion.div
						key="bag"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.18 }}
						className="space-y-3"
					>
						{/* Search */}
						<InventoryMaterialsFilter filters={bagFilters} onChange={setBagFilters} />

						{/* Items grid */}
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{paginatedItems.map((item, i) => (
								<GameCard
									key={item._id || `item-${i}`}
									item={item}
									type={item.itemType}
									layout="portrait"
									index={i}
									clickable={false}
									badges={{
										quantity: item.quantity,
									}}
									showStats={false}
									frameRarity="common"
								/>
							))}
						</div>

						{filteredItems.length === 0 && (
							<div className="flex flex-col items-center justify-center py-16 gap-2">
								<Backpack size={32} className="text-muted-foreground/30" />
								<p className="text-sm text-muted-foreground">No items found</p>
							</div>
						)}

						{/* Pagination */}
						{bagTotalPages > 1 && (
							<div className="flex items-center justify-center gap-3 pt-2 pb-1">
								<button
									onClick={() => setBagPage((p) => Math.max(1, p - 1))}
									disabled={bagPage === 1}
									className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-secondary/80 transition-all"
								>
									<ChevronLeft size={16} />
								</button>
								<span className="text-xs text-muted-foreground">
									<span className="text-foreground font-semibold">{bagPage}</span>
									{' / '}
									{bagTotalPages}
								</span>
								<button
									onClick={() => setBagPage((p) => Math.min(bagTotalPages, p + 1))}
									disabled={bagPage === bagTotalPages}
									className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-secondary/80 transition-all"
								>
									<ChevronRight size={16} />
								</button>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default InventoryPage
