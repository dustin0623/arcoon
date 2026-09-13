'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '@/context/GameContext'
import { useMarketActions } from '@/features/actions'
import { toast } from 'sonner'
import { Store, Tag, ShoppingCart, TrendingUp, X, ChevronLeft, ChevronRight } from 'lucide-react'
import CurrencyIcon from '@/components/CurrencyIcon'

// Import marketplace components
import MarketSell from '@/components/modals/MarketSell'
import MarketBuy from '@/components/modals/MarketBuy'
import { InventoryCardsFilter } from '@/components/GlobalFilter'
import GameCard from '@/components/ui/game-card'

const tabs = [
	{ id: 'buy', label: 'Browse', icon: ShoppingCart },
	{ id: 'sell', label: 'Sell', icon: Tag },
	{ id: 'listings', label: 'My Listings', icon: TrendingUp },
]

const ITEMS_PER_PAGE = 25

const formatTimeAgo = (timestamp: number) => {
	if (!timestamp) return ''
	const now = Date.now()
	const diff = now - timestamp
	const days = Math.floor(diff / (1000 * 60 * 60 * 24))
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
	if (days > 0) return `${days}d ${hours}h`
	if (hours > 0) return `${hours}h`
	const minutes = Math.floor(diff / (1000 * 60))
	return `${minutes}m`
}

const MarketplacePage = () => {
	const { playerState } = useGame()
	const { getListings, buyCard, sellCard, cancelListing } = useMarketActions()
	const player = playerState ?? {}
	const cards = playerState?.cards ?? []
	const [tab, setTab] = useState('buy')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [listings, setListings] = useState<Record<string, any>[]>([])
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [myListings, setMyListings] = useState<Record<string, any>[]>([])
	const [loadingListings, setLoadingListings] = useState(true)

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const splitMyListings = useCallback((cardRows: Record<string, any>[], username: string) => {
		const user = (username || '').toLowerCase()
		setMyListings(cardRows.filter((row) => (row.seller || '').toLowerCase() === user))
	}, [])

	// Card sell modal
	const [sellModalOpen, setSellModalOpen] = useState(false)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [selectedCard, setSelectedCard] = useState<Record<string, any> | null>(null)
	const [sellQty, setSellQty] = useState(1)
	const [sellPrice, setSellPrice] = useState(1000)

	// Buy confirmation
	const [buyConfirmOpen, setBuyConfirmOpen] = useState(false)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [pendingBuy, setPendingBuy] = useState<Record<string, any> | null>(null)

	// Filters
	const [browseFilters, setBrowseFilters] = useState({
		search: '',
		rarity: 'all',
		type: 'all',
		sort: 'newest',
	})
	const [sellFilters, setSellFilters] = useState({
		search: '',
		rarity: 'all',
		type: 'all',
	})
	const [listingsFilters, setListingsFilters] = useState({
		search: '',
		rarity: 'all',
		type: 'all',
		sort: 'newest',
	})

	// Pagination state for each tab
	const [browsePage, setBrowsePage] = useState(1)
	const [sellPage, setSellPage] = useState(1)
	const [listingsPage, setListingsPage] = useState(1)

	// Reset page when filters change
	useEffect(() => {
		setBrowsePage(1)
	}, [browseFilters])

	useEffect(() => {
		setSellPage(1)
	}, [sellFilters])

	useEffect(() => {
		setListingsPage(1)
	}, [listingsFilters])

	// ── Load listings from API on mount ──
	useEffect(() => {
		async function fetchListings() {
			setLoadingListings(true)
			try {
				const listingsRes = (await getListings()) as {
					cardListings?: Record<string, any>[]
				} | null
				const cardRows = listingsRes?.cardListings ?? []
				setListings(cardRows)
			} catch (err) {
				console.warn('Failed to load marketplace', err)
			} finally {
				setLoadingListings(false)
			}
		}
		fetchListings()
	}, [getListings])

	// ── Filter my listings when username or listings change ──
	useEffect(() => {
		if (player.username && listings.length > 0) {
			splitMyListings(listings, player.username)
		}
	}, [listings, player.username, splitMyListings])

	const filteredListings = useMemo(() => {
		let result = [...listings]
		// Filter out player's own listings from browse view
		const currentUser = (player.username || '').toLowerCase()
		if (currentUser) {
			result = result.filter((l) => (l.seller || '').toLowerCase() !== currentUser)
		}
		if (browseFilters.search) {
			const q = browseFilters.search.toLowerCase()
			result = result.filter((l) => l.card.name.toLowerCase().includes(q) || l.seller.toLowerCase().includes(q))
		}
		if (browseFilters.rarity !== 'all') result = result.filter((l) => l.card.rarity === browseFilters.rarity)
		if (browseFilters.type !== 'all') result = result.filter((l) => l.card.type === browseFilters.type)
		switch (browseFilters.sort) {
			case 'price-asc':
				result.sort((a, b) => a.price - b.price)
				break
			case 'price-desc':
				result.sort((a, b) => b.price - a.price)
				break
			case 'newest':
				result.sort((a, b) => b.listedAt - a.listedAt)
				break
			case 'raidPower':
				result.sort((a, b) => b.card.stats.raidPower - a.card.stats.raidPower)
				break
		}
		return result
	}, [listings, browseFilters, player.username])

	const browseTotalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE)
	const paginatedBrowseItems = useMemo(() => {
		const start = (browsePage - 1) * ITEMS_PER_PAGE
		return filteredListings.slice(start, start + ITEMS_PER_PAGE)
	}, [filteredListings, browsePage])

	const sellableItems = useMemo(() => {
		let items = cards
			.filter((c) => c.quantity > 0)
			.map((c) => ({
				...c,
				id: c.id || c.cardId,
				cardId: c.cardId || c.id,
			}))

		// Search filter
		if (sellFilters.search) {
			const q = sellFilters.search.toLowerCase()
			items = items.filter((item) => item.name.toLowerCase().includes(q))
		}

		// Card-specific filters
		if (sellFilters.rarity !== 'all') {
			items = items.filter((item) => item.rarity === sellFilters.rarity)
		}
		if (sellFilters.type !== 'all') {
			items = items.filter((item) => item.type === sellFilters.type)
		}

		return items
	}, [cards, sellFilters])

	// Paginated sell items
	const sellTotalPages = Math.ceil(sellableItems.length / ITEMS_PER_PAGE)
	const paginatedSellItems = useMemo(() => {
		const start = (sellPage - 1) * ITEMS_PER_PAGE
		return sellableItems.slice(start, start + ITEMS_PER_PAGE)
	}, [sellableItems, sellPage])

	const handleRequestBuy = useCallback((listing: Record<string, any>) => {
		setPendingBuy(listing)
		setBuyConfirmOpen(true)
	}, [])

	const handleConfirmBuy = useCallback(async () => {
		if (!pendingBuy) return
		if ((player.coins ?? 0) < pendingBuy.price) {
			toast.error('Not enough coins!')
			setBuyConfirmOpen(false)
			return
		}
		const result = (await buyCard(pendingBuy.id)) as Record<string, any>
		if (!result?.success) {
			toast.error(result?.error || 'Purchase failed')
			setBuyConfirmOpen(false)
			return
		}
		setListings((prev) => prev.filter((l) => l.id !== pendingBuy.id))
		toast.success(`Purchased ${pendingBuy.card.name}!`)
		setBuyConfirmOpen(false)
		setPendingBuy(null)
	}, [pendingBuy, player.coins, buyCard])

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleOpenSellCard = (card: Record<string, any>) => {
		setSelectedCard(card)
		setSellQty(1)
		setSellPrice(1000)
		setSellModalOpen(true)
	}

	const handleConfirmSellCard = useCallback(async () => {
		if (!selectedCard) return
		const selectedCardId = selectedCard.cardId || selectedCard.id
		const storeCard = cards.find((c) => (c.cardId || c.id) === selectedCardId)
		if (!storeCard || storeCard.quantity < sellQty) {
			toast.error('Not enough cards!')
			return
		}
		const result = (await sellCard(selectedCardId, sellQty, sellPrice)) as Record<string, any>
		if (!result?.success) {
			toast.error(result?.error || 'Failed to create listing')
			return
		}
		const createdId = result.listing?.id || result.listing?._id || `my-${Date.now()}`
		const createdListing = {
			id: createdId,
			card: { ...selectedCard, id: selectedCardId, cardId: selectedCardId, quantity: sellQty },
			quantity: sellQty,
			price: sellPrice,
			seller: player.username ?? '',
			listedAt: Date.now(),
		}
		setListings((prev) => [createdListing, ...prev])
		setMyListings((prev) => [createdListing, ...prev])
		toast.success(`Listed ${sellQty}× ${selectedCard.name}`)
		setSellModalOpen(false)
	}, [selectedCard, sellQty, sellPrice, player.username, cards, sellCard])

	const handleCancelCardListing = useCallback(
		async (listingId: string) => {
			const listing = myListings.find((l) => l.id === listingId)
			if (!listing) return
			const result = (await cancelListing(listingId)) as Record<string, any>
			if (!result?.success) {
				toast.error(result?.error || 'Failed to cancel listing')
				return
			}
			setListings((prev) => prev.filter((l) => l.id !== listingId))
			setMyListings((prev) => prev.filter((l) => l.id !== listingId))
			toast.info(`Cancelled listing for ${listing.card.name}`)
		},
		[myListings, cancelListing],
	)

	const totalMyListings = myListings.length

	// Filtered my listings
	const filteredMyListings = useMemo(() => {
		let result = [...myListings]
		if (listingsFilters.search) {
			const q = listingsFilters.search.toLowerCase()
			result = result.filter((l) => l.card.name.toLowerCase().includes(q))
		}
		if (listingsFilters.rarity !== 'all') {
			result = result.filter((l) => l.card.rarity === listingsFilters.rarity)
		}
		if (listingsFilters.type !== 'all') {
			result = result.filter((l) => l.card.type === listingsFilters.type)
		}
		// Sort
		switch (listingsFilters.sort) {
			case 'price-asc':
				result.sort((a, b) => a.price - b.price)
				break
			case 'price-desc':
				result.sort((a, b) => b.price - a.price)
				break
			case 'newest':
				result.sort((a, b) => b.listedAt - a.listedAt)
				break
			case 'raidPower':
				result.sort((a, b) => b.card.stats.raidPower - a.card.stats.raidPower)
				break
		}
		return result
	}, [myListings, listingsFilters])

	const listingsTotalPages = Math.ceil(filteredMyListings.length / ITEMS_PER_PAGE)
	const paginatedMyListingsItems = useMemo(() => {
		const start = (listingsPage - 1) * ITEMS_PER_PAGE
		return filteredMyListings.slice(start, start + ITEMS_PER_PAGE)
	}, [filteredMyListings, listingsPage])

	// Pagination component
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const Pagination = ({
		currentPage,
		totalPages,
		onPageChange,
		totalItems,
	}: {
		currentPage: number
		totalPages: number
		onPageChange: (p: number) => void
		totalItems: number
	}) => {
		if (totalPages <= 1) return null
		return (
			<div className="flex items-center justify-between pt-4 border-t border-border/50">
				<p className="text-[10px] text-muted-foreground">
					Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
					{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
				</p>
				<div className="flex items-center gap-1">
					<button
						onClick={() => onPageChange(currentPage - 1)}
						disabled={currentPage === 1}
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
					>
						<ChevronLeft size={14} />
					</button>
					<div className="flex items-center gap-1">
						{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
							let pageNum
							if (totalPages <= 5) {
								pageNum = i + 1
							} else if (currentPage <= 3) {
								pageNum = i + 1
							} else if (currentPage >= totalPages - 2) {
								pageNum = totalPages - 4 + i
							} else {
								pageNum = currentPage - 2 + i
							}
							return (
								<button
									key={pageNum}
									onClick={() => onPageChange(pageNum)}
									className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
										currentPage === pageNum
											? 'bg-primary text-primary-foreground'
											: 'border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary'
									}`}
								>
									{pageNum}
								</button>
							)
						})}
					</div>
					<button
						onClick={() => onPageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
					>
						<ChevronRight size={14} />
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-5 py-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2.5">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
						<Store className="text-primary" size={18} />
					</div>
					<div>
						<h1 className="font-display text-lg md:text-xl font-bold text-foreground leading-tight">
							Marketplace
						</h1>
						<p className="text-[10px] text-muted-foreground/60">Trade cards with other raiders</p>
					</div>
				</div>
			</div>

			{/* Stats - Always visible */}
			<div className="grid grid-cols-3 gap-2">
				{[
					{
						label: 'Listings',
						value: listings.length.toString(),
						highlight: false,
					},
					{
						label: 'Volume',
						value: listings.reduce((sum, l) => sum + l.price, 0).toLocaleString(),
						highlight: false,
					},
					{
						label: 'Sellers',
						value: new Set(listings.map((l) => l.seller)).size.toString(),
						highlight: false,
					},
				].map((stat) => (
					<div
						key={stat.label}
						className="relative overflow-hidden rounded-xl border border-border p-3 text-center"
						style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
					>
						<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
						<p className="text-[9px] md:text-[10px] text-muted-foreground/60 uppercase tracking-wider">
							{stat.label}
						</p>
						<p
							className={`mt-1 font-display text-sm md:text-base font-bold flex items-center justify-center gap-1 ${stat.highlight ? 'text-primary' : 'text-foreground'}`}
						>
							{stat.value}
						</p>
					</div>
				))}
			</div>

			{/* Tab bar */}
			<div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary p-1 scrollbar-none">
				{tabs.map((t) => {
					const Icon = t.icon
					const isActive = tab === t.id
					return (
						<button
							key={t.id}
							onClick={() => setTab(t.id)}
							className={`flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-colors ${
								isActive
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							<Icon size={14} className="md:w-4 md:h-4" />
							<span className="relative">
								{t.label}
								{t.id === 'listings' && totalMyListings > 0 && (
									<span className="absolute -top-1.5 -right-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[7px] font-bold text-destructive-foreground">
										{totalMyListings}
									</span>
								)}
							</span>
						</button>
					)
				})}
			</div>

			<AnimatePresence mode="wait">
				{/* ═══ BROWSE ═══ */}
				{tab === 'buy' && (
					<motion.div
						key="buy"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
						className="space-y-3"
					>
						<InventoryCardsFilter filters={browseFilters} onChange={setBrowseFilters} />
						{loadingListings ? (
							<div className="fantasy-card flex flex-col items-center gap-3 py-16">
								<div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
								<p className="text-sm text-muted-foreground">Loading marketplace...</p>
							</div>
						) : filteredListings.length === 0 ? (
							<div className="fantasy-card flex flex-col items-center gap-3 py-16">
								<div className="rounded-full bg-secondary p-4">
									<ShoppingCart className="text-muted-foreground" size={28} />
								</div>
								<p className="text-sm text-muted-foreground">
									{listings.length === 0 ? 'No listings available' : 'No results match your filters'}
								</p>
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
									{paginatedBrowseItems.map((listing, i) => {
										const canAfford = (player.coins ?? 0) >= listing.price
										return (
											<GameCard
												key={listing.id}
												item={listing.card}
												type="card"
												layout="portrait"
												index={i}
												onClick={() => canAfford && handleRequestBuy(listing)}
												clickable={canAfford}
												badges={{
													seller: listing.seller,
													expiration: formatTimeAgo(listing.listedAt),
												}}
												showStats={true}
												actionButton={{
													label: listing.price.toLocaleString(),
													icon: <CurrencyIcon type="token" size={11} />,
													disabled: !canAfford,
													onClick: () => handleRequestBuy(listing),
												}}
											/>
										)
									})}
								</div>
								<Pagination
									currentPage={browsePage}
									totalPages={browseTotalPages}
									onPageChange={setBrowsePage}
									totalItems={filteredListings.length}
								/>
							</>
						)}
					</motion.div>
				)}

				{/* ═══ SELL ═══ */}
				{tab === 'sell' && (
					<motion.div
						key="sell"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
						className="space-y-3"
					>
						<InventoryCardsFilter filters={sellFilters} onChange={setSellFilters} />
						{sellableItems.length === 0 ? (
							<div className="fantasy-card flex flex-col items-center gap-3 py-16">
								<div className="rounded-full bg-secondary p-4">
									<Tag className="text-muted-foreground" size={28} />
								</div>
								<p className="text-sm text-muted-foreground">Nothing to sell</p>
								<p className="text-[10px] text-muted-foreground/60">Open packs or complete quests</p>
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
									{paginatedSellItems.map((card, i) => (
										<GameCard
											key={`card-${card.id}`}
											item={card}
											type="card"
											layout="portrait"
											index={i}
											onClick={() => handleOpenSellCard(card)}
											badges={{ quantity: card.quantity }}
											showStats={true}
											actionButton={{
												label: 'Sell',
												icon: <Tag size={10} />,
												onClick: () => handleOpenSellCard(card),
											}}
										/>
									))}
								</div>
								<Pagination
									currentPage={sellPage}
									totalPages={sellTotalPages}
									onPageChange={setSellPage}
									totalItems={sellableItems.length}
								/>
							</>
						)}
					</motion.div>
				)}

				{/* ═══ MY LISTINGS ═══ */}
				{tab === 'listings' && (
					<motion.div
						key="listings"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.2 }}
						className="space-y-3"
					>
						<InventoryCardsFilter filters={listingsFilters} onChange={setListingsFilters} />
						{totalMyListings === 0 ? (
							<div className="fantasy-card flex flex-col items-center gap-3 py-16">
								<div className="rounded-full bg-secondary p-4">
									<TrendingUp className="text-muted-foreground" size={28} />
								</div>
								<p className="text-sm text-muted-foreground">No active listings</p>
								<p className="text-[10px] text-muted-foreground/60">Go to the Sell tab to list cards</p>
							</div>
						) : filteredMyListings.length === 0 ? (
							<div className="fantasy-card flex flex-col items-center gap-3 py-16">
								<div className="rounded-full bg-secondary p-4">
									<TrendingUp className="text-muted-foreground" size={28} />
								</div>
								<p className="text-sm text-muted-foreground">
									{listingsFilters.search
										? 'No results match your search'
										: 'No listings match your filters'}
								</p>
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
									{paginatedMyListingsItems.map((listing, i) => (
										<GameCard
											key={listing.id}
											item={listing.card}
											type="card"
											layout="portrait"
											index={i}
											badges={{
												expiration: formatTimeAgo(listing.listedAt),
											}}
											showStats={true}
											actionButton={{
												label: (
													<>
														Cancel <CurrencyIcon type="token" size={11} />{' '}
														{listing.price.toLocaleString()}
													</>
												),
												icon: <X size={10} />,
												variant: 'destructive',
												onClick: () => handleCancelCardListing(listing.id),
											}}
										/>
									))}
								</div>
								<Pagination
									currentPage={listingsPage}
									totalPages={listingsTotalPages}
									onPageChange={setListingsPage}
									totalItems={filteredMyListings.length}
								/>
							</>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			<MarketSell
				open={sellModalOpen}
				item={selectedCard}
				qty={sellQty}
				price={sellPrice}
				type="card"
				onQtyChange={setSellQty}
				onPriceChange={setSellPrice}
				onConfirm={handleConfirmSellCard}
				onClose={() => setSellModalOpen(false)}
			/>

			{/* Buy Card Confirmation */}
			<MarketBuy
				open={buyConfirmOpen}
				listing={pendingBuy}
				type="card"
				balance={player.coins ?? 0}
				onConfirm={handleConfirmBuy}
				onClose={() => {
					setBuyConfirmOpen(false)
					setPendingBuy(null)
				}}
			/>
		</div>
	)
}

export default MarketplacePage
