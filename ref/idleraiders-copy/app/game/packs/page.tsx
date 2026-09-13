'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '@/context/GameContext'
import { usePackActions } from '@/features/actions'
import { playCardFlipStatic } from '@/context/AudioContext'
import { getCardImage, GAME_UI_IMAGES } from '@/features/images'
import { toast } from 'sonner'
import { Package, Sparkles, Zap, ChevronDown, ChevronUp, Loader2, Info, ChevronLeft, ChevronRight } from 'lucide-react'

const CATALOG_PAGE_SIZE = 15
// useAudioStore removed — using playCardFlipStatic from AudioContext
import CurrencyIcon from '@/components/CurrencyIcon'
import GameCard from '@/components/ui/game-card'
import { PacksPoolFilter } from '@/components/GlobalFilter'
import OpenPackConfirm from '@/components/modals/OpenPackConfirm'
import BuyPackConfirm from '@/components/modals/BuyPackConfirm'

const cardBackImg = GAME_UI_IMAGES.cardBack
const packImg = GAME_UI_IMAGES.heroesPack
const boosterPackImg = GAME_UI_IMAGES.boosterPack

// ─── Constants ─────────────────────────────────────────────
import {
	rarityOrder,
	rarityCardBg as rarityColors,
	rarityText as rarityTextColors,
	rarityGlowStrong as rarityGlows,
	rarityBorderGlow,
} from '@/lib/rarityStyles'

// RevealedCard structure:
// { id, name, rarity, type, subtype?, icon, image?, stats?, boostDescription?, boostPercent?, landData? }

// ─── Component ─────────────────────────────────────────────
const PacksPage = () => {
	const { playerState, gameData } = useGame()
	const router = useRouter()
	const {
		standardCardSupply,
		boosterCardSupply,
		availableBoosterSupply,
		openedCards,
		refreshCardSupply,
		isBuyingPacks,
		isOpeningPack,
		buyPacks: buyPacksAction,
		openPack: openPackAction,
		clearOpenedCards,
	} = usePackActions()
	const player = playerState ?? {}

	// Get data from gameData
	const ITEMS_DATA = useMemo(() => (Array.isArray(gameData?.ITEMS) ? gameData.ITEMS : []), [gameData])
	const CARDS_DATA = useMemo(() => gameData?.CARDS ?? [], [gameData])

	// Build card pools from gameData
	const packCardPool = useMemo(
		() => CARDS_DATA.filter((c) => c && c.id && c.source?.type === 'standard_pack') || [],
		[CARDS_DATA],
	)
	const boosterCardPool = useMemo(
		() => CARDS_DATA.filter((c) => c && c.id && c.source?.type === 'booster_pack') || [],
		[CARDS_DATA],
	)

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const getCardIcon = (card: Record<string, any>) => {
		return card?.icon || card?.image || '/assets/cards/default.png'
	}

	// Fetch card supply data on mount
	useEffect(() => {
		refreshCardSupply().catch((err) => {
			console.error('Error fetching card supply:', err)
		})
	}, [refreshCardSupply])

	// Build supply map for cards
	const currentSupplyMap = useMemo(() => {
		const map = new Map()
		packCardPool.forEach((card) => {
			const supply = standardCardSupply[card.id] ?? 0
			map.set(card.id, supply)
		})
		return map
	}, [packCardPool, standardCardSupply])

	// Build supply map for booster cards
	const boosterSupplyMap = useMemo(() => {
		const map = new Map()
		boosterCardPool.forEach((card) => {
			const supply = boosterCardSupply[card.id] ?? 0
			map.set(card.id, supply)
		})
		return map
	}, [boosterCardPool, boosterCardSupply])

	// Derive owned packs from player state
	const ownedPacks = useMemo(() => {
		const packsMap: Record<string, number> = {}
		for (const packItem of playerState?.packs ?? []) {
			packsMap[packItem.id] = packItem.quantity || 1
		}
		return packsMap
	}, [playerState])

	// Build available packs early
	const availablePacks = ITEMS_DATA.filter((p) => p?.catergory === 'pack' && p.id !== 'land_pack')

	// State for pack selection and filtering
	const [selectedPackId, setSelectedPackId] = useState(availablePacks[0]?.id || '')
	const [isCollecting, setIsCollecting] = useState(false)
	const [cardsFlipped, setCardsFlipped] = useState<boolean[]>([])
	const [isOpening, setIsOpening] = useState(false)
	const [packAnimating, setPackAnimating] = useState(false)
	const [openingPackId, setOpeningPackId] = useState<string | null>(null)
	const [showCatalog, setShowCatalog] = useState(false)
	const [poolFilters, setPoolFilters] = useState({ search: '', poolFilter: 'all' })
	const [catalogPage, setCatalogPage] = useState(1)
	const [confirmPackId, setConfirmPackId] = useState<string | null>(null)
	// Which currency the buy-confirm modal is opened with. `null` = modal closed.
	const [buyModalPayment, setBuyModalPayment] = useState<'token' | 'dollar' | null>(null)

	// Compute pack-related values early
	const activePackId = availablePacks.some((candidate) => candidate.id === selectedPackId)
		? selectedPackId
		: (availablePacks[0]?.id ?? '')
	const pack = availablePacks.find((candidate) => candidate.id === activePackId) || availablePacks[0] || null
	const isBoosterPack = pack?.id === 'booster_pack'

	// Reset catalog page when filters, pack type or catalog visibility changes
	useEffect(() => { setCatalogPage(1) }, [poolFilters, isBoosterPack, showCatalog])

	const filteredPool = useMemo(() => {
		const searchTerm = poolFilters.search.trim().toLowerCase()
		const sorted = [...packCardPool]
			.filter((c) => c && c.id)
			.filter((card) => {
				if (!searchTerm) return true
				return [card.name, card.type, card.subtype, card.rarity].some((value) =>
					String(value ?? '')
						.toLowerCase()
						.includes(searchTerm),
				)
			})
			.sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity))
		if (poolFilters.poolFilter === 'all') return sorted
		return sorted.filter((c) => c.rarity === poolFilters.poolFilter)
	}, [packCardPool, poolFilters.poolFilter, poolFilters.search])

	// Paginated slices for catalog
	const filteredBoosterPool = useMemo(
		() => boosterCardPool.filter((c) => c && c.id),
		[boosterCardPool],
	)
	const activeCatalogPool = isBoosterPack ? filteredBoosterPool : filteredPool
	const catalogTotalPages = Math.max(1, Math.ceil(activeCatalogPool.length / CATALOG_PAGE_SIZE))
	const paginatedCatalog = useMemo(
		() => activeCatalogPool.slice((catalogPage - 1) * CATALOG_PAGE_SIZE, catalogPage * CATALOG_PAGE_SIZE),
		[activeCatalogPool, catalogPage],
	)

	const revealedCards = openedCards.map((card) => {
		const sourcePack = availablePacks.find((candidate) => candidate.id === openingPackId)
		// Enrich with full card definition (includes boost data)
		const cardDef = CARDS_DATA.find((def) => def.id === card.id)
		return {
			...cardDef,
			id: card.id,
			name: card.name,
			rarity: card.rarity,
			type: card.type,
			subtype: card.subtype,
			icon: getCardIcon(card),
			image: getCardImage(card.id, card.rarity, card.type) || undefined,
			stats: card.stats,
			boost: cardDef?.boost,
			boostDescription: cardDef?.description,
			boostPercent: cardDef?.boostPercent,
			sourcePackId: sourcePack?.id,
			sourcePackName: sourcePack?.name,
		}
	})

	// Derived values from pack selection
	const packImage = isBoosterPack ? boosterPackImg : packImg
	const hasShardPrice = typeof pack?.buy?.shards === 'number'
	const currencyType = hasShardPrice ? 'shard' : 'token'
	const tokenUnitCost = hasShardPrice ? (pack?.buy?.shards ?? 0) : (pack?.buy?.coins ?? 0)
	const tokenPaymentMethod = hasShardPrice ? 'shards' : 'coins'
	const dollarCost = pack?.buy?.dollars ?? 0

	const playerBalance = currencyType === 'shard' ? (player.shards ?? 0) : (player.coins ?? 0)
	const playerDollars = player.dollars ?? 0

	const getOwnedCount = (packId: string) => (ownedPacks as Record<string, number>)[packId] || 0
	const totalOwned = Object.values(ownedPacks).reduce((a, b) => a + b, 0)

	// ─── Purchase handler ──────────────────────────────────
	// The BuyPackConfirm modal owns the idle/buying/success phase transitions
	// and auto-closes itself after showing the success state, so we just
	// return whether the API call succeeded.
	const handleBuyPacks = async (quantity: number): Promise<boolean> => {
		if (!pack || !buyModalPayment) return false
		const paymentMethod =
			buyModalPayment === 'dollar' ? 'dollars' : tokenPaymentMethod
		const res = (await buyPacksAction(pack.id, quantity, paymentMethod)) as Record<
			string,
			any
		>
		return res?.success !== false
	}

	// ─── Open handler ──────────────────────────────────────
	// NOTE: the caller keeps the OpenPackConfirm modal OPEN while this runs so
	// the modal can display its own "Setting up packs..." loader. We only
	// dismiss the confirm modal after the API returns and just before the
	// pack-opening reveal animation takes over.
	const handleOpenPack = async (packId: string, quantity: number = 1) => {
		if (isOpening || isOpeningPack) return
		const owned = ownedPacks[packId] || 0
		if (owned <= 0) {
			toast.error('No packs to open!')
			return
		}
		const qty = Math.max(1, Math.min(10, Math.floor(quantity), owned))
		setOpeningPackId(packId)
		setIsOpening(true)

		try {
			const result = (await openPackAction(packId, qty)) as Record<string, any>
			if (result?.success === false || !Array.isArray(result?.cards) || result.cards.length === 0) {
				setIsOpening(false)
				setOpeningPackId(null)
				setConfirmPackId(null)
				return
			}

			// Server finished rolling — close the confirm modal and hand off to
			// the full-screen reveal animation.
			setConfirmPackId(null)
			setPackAnimating(true)
			setCardsFlipped(new Array(result.cards.length).fill(false))
			setTimeout(() => setPackAnimating(false), 2500)
		} catch (err) {
			toast.error((err as Error)?.message || 'Failed to open pack')
			setIsOpening(false)
			setOpeningPackId(null)
			setConfirmPackId(null)
		}
	}

	const handleFlipCard = (index: number) => {
		playCardFlipStatic()
		setCardsFlipped((prev) => {
			const next = [...prev]
			next[index] = true
			return next
		})
	}

	const handleFlipAll = () => {
		if (revealedCards.length === 0) return
		revealedCards.forEach((_, i) => {
			setTimeout(() => playCardFlipStatic(), i * 150)
		})
		setCardsFlipped(new Array(revealedCards.length).fill(true))
	}

	const allFlipped = cardsFlipped.length > 0 && cardsFlipped.every(Boolean)

	const handleCollect = () => {
		clearOpenedCards()
		setCardsFlipped([])
		setIsOpening(false)
		setPackAnimating(false)
		setOpeningPackId(null)
	}

	const openingPackImage = openingPackId === 'booster_pack' ? boosterPackImg : packImg

if (!gameData || availablePacks.length === 0 || !pack) {
			return null
		}

	// ─── Render ─────────────────────────────────────────────
	return (
		<div className="pb-24">
			{/* Header */}
			<div className="flex items-center gap-2.5 px-1 py-3">
				<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
					<Package className="text-primary" size={18} />
				</div>
				<div>
					<h1 className="font-display text-lg md:text-xl font-bold text-foreground leading-tight">
						Card Packs
					</h1>
					<p className="text-[10px] text-muted-foreground/60">
						Open packs to collect powerful cards and build your raid team
					</p>
				</div>
			</div>

			{/* ═══ Pack Selector Tabs ═══ */}
			<div className="flex gap-1 rounded-xl bg-secondary p-1 mb-4">
				{availablePacks.map((p) => {
					const isSelected = activePackId === p.id
					return (
						<button
							key={p.id}
							onClick={() => {
								setSelectedPackId(p.id)
							}}
							className={`relative flex-1 flex items-center justify-center gap-1 rounded-lg py-2.5 text-xs font-semibold transition-all ${
								isSelected
									? 'bg-background text-foreground shadow-md'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							{isSelected && (
								<motion.div
									layoutId="pack-tab-indicator"
									className="absolute inset-0 rounded-lg bg-background shadow-md"
									style={{ zIndex: -1 }}
									transition={{ type: 'spring', stiffness: 500, damping: 30 }}
								/>
							)}
							{p.id === 'booster_pack' ? <Zap size={13} /> : <Package size={13} />}
							{p.name}
						</button>
					)
				})}
			</div>

			{/* ═══ Featured Pack Card ═══ */}
			<motion.div
				key={activePackId}
				initial={{ opacity: 0, scale: 0.97 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.25 }}
				className="rounded-2xl border border-border overflow-hidden"
				style={{ background: 'linear-gradient(160deg, hsl(var(--card)), hsl(var(--secondary)))' }}
			>
				{/* Pack hero */}
				<div className="flex items-center gap-5 p-5">
					<motion.img
						src={packImage}
						alt={pack.name}
						className="w-24 h-32 object-contain drop-shadow-2xl"
						whileHover={{ scale: 1.05, rotate: 2 }}
						transition={{ type: 'spring', stiffness: 300 }}
					/>
					<div className="flex-1 space-y-2">
						<div>
							<h2 className="font-display text-lg font-bold text-foreground">{pack.name}</h2>
							<p className="text-xs text-muted-foreground leading-relaxed">{pack.description}</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-foreground">
								🃏 {pack?.data?.cardCount ?? 0} card{(pack?.data?.cardCount ?? 0) > 1 ? 's' : ''}
							</span>
							{pack?.data?.guaranteedRarity && (
								<span
									className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${rarityColors[pack.data.guaranteedRarity as keyof typeof rarityColors]} ${rarityTextColors[pack.data.guaranteedRarity as keyof typeof rarityTextColors]}`}
								>
									✦ {pack.data.guaranteedRarity}+ guaranteed
								</span>
							)}
							{isBoosterPack && (
								<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
									⚡ Special Booster
								</span>
							)}
							{isBoosterPack && (
								<span
									className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
										availableBoosterSupply > 0
											? 'bg-green-500/10 border border-green-500/30 text-green-400'
											: 'bg-red-500/10 border border-red-500/30 text-red-400'
									}`}
								>
									{availableBoosterSupply > 0 ? '📦 ' : '🔒 '}
									{availableBoosterSupply.toLocaleString()} available
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Pricing & Purchase — two buttons, each opens the BuyPackConfirm
				    modal with the corresponding payment method. */}
					<div className="border-t border-border/50 p-5 space-y-3">
						<div className="grid grid-cols-2 gap-2">
							<button
								onClick={() => setBuyModalPayment('token')}
								disabled={isBuyingPacks || (isBoosterPack && availableBoosterSupply <= 0)}
								className="group relative flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background/60 p-3 transition-all hover:border-primary/60 hover:bg-background disabled:opacity-40"
							>
								<span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
									<Sparkles size={11} /> Buy with {currencyType === 'shard' ? 'Shards' : 'Tokens'}
								</span>
								<span className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
									<CurrencyIcon type={currencyType} size={16} />
									{tokenUnitCost.toLocaleString()}
								</span>
								<span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
									Balance <CurrencyIcon type={currencyType} size={10} />
									{playerBalance.toLocaleString()}
								</span>
							</button>
							<button
								onClick={() => setBuyModalPayment('dollar')}
								disabled={isBuyingPacks || (isBoosterPack && availableBoosterSupply <= 0)}
								className="group relative flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background/60 p-3 transition-all hover:border-primary/60 hover:bg-background disabled:opacity-40"
							>
								<span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
									<Sparkles size={11} /> Buy with Dollar
								</span>
								<span className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
									<CurrencyIcon type="dollar" size={16} />
									{dollarCost.toFixed(2)}
								</span>
								<span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
									Balance <CurrencyIcon type="dollar" size={10} />
									{playerDollars.toLocaleString()}
								</span>
							</button>
						</div>
						{isBoosterPack && availableBoosterSupply <= 0 && (
							<p className="text-center text-xs font-semibold text-red-400 flex items-center justify-center gap-1.5">
								<Zap size={12} /> Sold Out
							</p>
						)}
					</div>
			</motion.div>

			{/* ═══ Owned Packs ═══ */}
			<div className="mt-5 space-y-2">
				<div className="flex items-center justify-between px-1">
					<h3 className="font-display text-sm font-bold text-foreground">Your Packs</h3>
					<span className="text-[10px] text-muted-foreground">{totalOwned} total</span>
				</div>
				{availablePacks.map((p) => {
					const owned = getOwnedCount(p.id)
					const img = p.id === 'booster_pack' ? boosterPackImg : packImg
					return (
						<motion.div
							key={p.id}
							className="rounded-xl border border-border bg-card flex items-center gap-3 p-3"
							whileHover={{ scale: 1.01 }}
						>
							<img src={img} alt={p.name} className="w-12 h-16 object-contain" />
							<div className="flex-1 min-w-0">
								<p className="font-display text-sm font-bold text-foreground truncate">{p.name}</p>
								<p className="text-[10px] text-muted-foreground">
									{owned === 0
										? 'No packs available'
										: `${owned} pack${owned > 1 ? 's' : ''} ready to open`}
								</p>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								<span className="font-mono text-xl font-bold text-primary min-w-[2rem] text-right">
									{owned}
								</span>
								<button
									onClick={() => setConfirmPackId(p.id)}
									disabled={owned <= 0 || isOpening || isOpeningPack}
									className="fantasy-btn px-4 py-2 text-xs disabled:opacity-30 flex items-center gap-1"
								>
									{(isOpening || isOpeningPack) && openingPackId === p.id ? (
										<>
											<Loader2 size={13} className="animate-spin" /> Opening...
										</>
									) : (
										<>
											<Sparkles size={13} /> Open
										</>
									)}
								</button>
							</div>
						</motion.div>
					)
				})}
			</div>

			{/* ═══ Drop Rates ═══ */}
			<div className="mt-5 rounded-xl border border-border bg-card p-4">
				<div className="flex items-center gap-2 mb-3">
					<Info size={14} className="text-muted-foreground" />
					<h3 className="font-display text-sm font-bold text-foreground">Drop Rates</h3>
				</div>
				<div className="flex gap-1">
					{rarityOrder.map((r) => (
						<div key={r} className={`flex-1 rounded-lg p-2 text-center ${rarityColors[r]}`}>
							<p className={`text-[10px] font-bold capitalize ${rarityTextColors[r]}`}>{r}</p>
							<p className="text-sm font-bold text-foreground mt-0.5">
								{((pack?.data?.dropRates?.[r] || 0) * 100).toFixed(1)}%
							</p>
						</div>
					))}
				</div>
			</div>

			{/* ═══ Card Catalog (collapsible) ═══ */}
			<div className="mt-4">
				<button
					onClick={() => setShowCatalog(!showCatalog)}
					className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
				>
					<div className="flex items-center gap-2">
						<Package size={14} className="text-primary" />
						<span className="font-display text-sm font-bold text-foreground">
							{isBoosterPack ? 'Booster Card Pool' : 'Card Pool Catalog'}
						</span>
						<span className="text-[10px] text-muted-foreground">
							({isBoosterPack ? boosterCardPool.length : packCardPool.length} cards)
						</span>
					</div>
					{showCatalog ? (
						<ChevronUp size={16} className="text-muted-foreground" />
					) : (
						<ChevronDown size={16} className="text-muted-foreground" />
					)}
				</button>

				<AnimatePresence>
					{showCatalog && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.3 }}
							className="overflow-hidden"
						>
							<div className="pt-3 space-y-3">
								{/* Rarity filter (standard & land only) */}
								{!isBoosterPack && <PacksPoolFilter filters={poolFilters} onChange={setPoolFilters} />}
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
									{paginatedCatalog.map((card, i) => {
										const supplyMap = isBoosterPack ? boosterSupplyMap : currentSupplyMap
										const currentSupply = supplyMap.get(card.id) || 0
										const maxSupply = card.supply?.max || 1000
										const supplyPercent = Math.min(100, (currentSupply / maxSupply) * 100)
										return (
											<GameCard
												key={card.id}
												item={card}
												type="card"
												layout="portrait"
												index={i}
												showStats={true}
												clickable={false}
												badges={{ typeLabel: card.type }}
												customContent={{
													details: (
														<div className="space-y-1">
															<div className="text-[7px] font-bold text-muted-foreground/70 uppercase">
																Supply
															</div>
															<div className="h-1.5 w-full rounded-full bg-secondary/40 overflow-hidden">
																<div
																	className="h-full rounded-full bg-primary/80 transition-all"
																	style={{ width: `${supplyPercent}%` }}
																/>
															</div>
															<p className="text-[8px] font-semibold text-foreground/80 text-center">
																{currentSupply.toLocaleString()}/{maxSupply.toLocaleString()}
															</p>
														</div>
													),
												}}
											/>
										)
									})}
								</div>

								{/* Pagination */}
								{catalogTotalPages > 1 && (
									<div className="flex items-center justify-center gap-3 pt-2">
										<button
											onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
											disabled={catalogPage === 1}
											className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-secondary/80 transition-all"
										>
											<ChevronLeft size={16} />
										</button>
										<span className="text-xs text-muted-foreground">
											<span className="text-foreground font-semibold">{catalogPage}</span>
											{' / '}
											{catalogTotalPages}
										</span>
										<button
											onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))}
											disabled={catalogPage === catalogTotalPages}
											className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground disabled:opacity-30 hover:text-foreground hover:bg-secondary/80 transition-all"
										>
											<ChevronRight size={16} />
										</button>
									</div>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* ═══════════ PACK OPENING OVERLAY (portalled to body) ═══════════ */}
			{typeof document !== 'undefined' &&
				createPortal(
					<AnimatePresence>
						{isOpening && revealedCards.length > 0 && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background/95 backdrop-blur-md"
							>
								{packAnimating && (
									<motion.div
										initial={{ scale: 1, opacity: 1, rotateZ: 0 }}
										animate={{
											scale: [1, 1.05, 1, 1.05, 1, 1.05, 1, 1.3, 1.5, 0],
											opacity: [1, 1, 1, 1, 1, 1, 1, 1, 0.8, 0],
											rotateZ: [0, -3, 3, -3, 3, -3, 3, 0, 0, 0],
										}}
										transition={{
											duration: 2.5,
											ease: 'easeInOut',
											times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9, 1],
										}}
										className="absolute"
									>
										<img
											src={openingPackImage}
											alt="Opening pack"
											className="w-40 h-56 object-contain"
										/>
									</motion.div>
								)}

								{!packAnimating && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										className="flex flex-col items-center gap-6 px-4 w-full max-w-3xl max-h-[100dvh] overflow-y-auto py-8"
									>
										<h2 className="font-display text-lg font-bold text-primary">Pack Opened!</h2>

										<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 w-full px-4">
											{revealedCards.map((card, i) => (
												<motion.div
													key={i}
													initial={{ opacity: 0, y: 30 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: i * 0.15 }}
													className="cursor-pointer w-full"
													style={{ perspective: '600px' }}
													onClick={() => handleFlipCard(i)}
												>
													<motion.div
														animate={{ rotateY: cardsFlipped[i] ? 180 : 0 }}
														transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
														style={{ transformStyle: 'preserve-3d' }}
														className="relative w-full h-full"
													>
														{/* Card Back */}
														<div
															className="w-full rounded-xl overflow-hidden border-2 border-muted-foreground/30"
															style={{ backfaceVisibility: 'hidden' }}
														>
															<img
																src={cardBackImg}
																alt="Card back"
																className="w-full aspect-[2/3] object-cover"
															/>
														</div>

														{/* Card Front - Using GameCard */}
														<div
															style={{
																backfaceVisibility: 'hidden',
																transform: 'rotateY(180deg)',
															}}
															className="absolute inset-0 w-full"
														>
															<GameCard
																item={card}
																type="card"
																layout="portrait"
																clickable={false}
																showStats={true}
																badges={{ typeLabel: card.type }}
															/>
														</div>
													</motion.div>
												</motion.div>
											))}
										</div>

										<div className="flex gap-1.5">
											{revealedCards.map((card, i) => (
												<div
													key={i}
													className={`h-2 w-2 rounded-full transition-all ${cardsFlipped[i] ? `${(rarityTextColors[card.rarity as keyof typeof rarityTextColors] || 'text-amber-400').replace('text-', 'bg-')} scale-110` : 'bg-muted scale-75'}`}
												/>
											))}
										</div>

										{!allFlipped && (
											<p className="text-[10px] text-muted-foreground animate-pulse">
												Tap cards to reveal!
											</p>
										)}

										<div className="flex gap-3">
											{!allFlipped && (
												<button
													onClick={handleFlipAll}
													className="fantasy-btn px-6 py-2 text-xs"
												>
													<Sparkles size={14} className="mr-1 inline" /> Reveal All
												</button>
											)}
											{allFlipped && (
												<button
													onClick={handleCollect}
													disabled={isCollecting}
													className="fantasy-btn px-8 py-3 text-sm font-bold disabled:opacity-40"
												>
													{isCollecting ? (
														<Loader2 size={16} className="animate-spin inline mr-1" />
													) : null}
													{isCollecting
														? 'Collecting...'
														: `Collect ${revealedCards.length === 1 ? 'Card' : 'All'}`}
												</button>
											)}
										</div>
									</motion.div>
								)}
							</motion.div>
						)}
					</AnimatePresence>,
					document.body,
				)}

			{/* Buy confirmation — opened from the per-currency Buy buttons above.
			    Handles qty selection, affordability, and purchase loading state. */}
			<BuyPackConfirm
				open={buyModalPayment !== null}
				onClose={() => setBuyModalPayment(null)}
				packName={pack.name}
				packImage={packImage}
				currency={buyModalPayment === 'dollar' ? 'dollar' : currencyType}
				currencyLabel={
					buyModalPayment === 'dollar'
						? 'Dollars'
						: currencyType === 'shard'
						? 'Shards'
						: 'Tokens'
				}
				unitPrice={buyModalPayment === 'dollar' ? dollarCost : tokenUnitCost}
				balance={buyModalPayment === 'dollar' ? playerDollars : playerBalance}
				onConfirm={handleBuyPacks}
			/>

			{/* Open confirmation — qty stepper lives here so multi-pack opening can be
			    wired in later without touching the page's trigger button. */}
			<OpenPackConfirm
				open={confirmPackId !== null}
				onClose={() => setConfirmPackId(null)}
				packName={
					availablePacks.find((candidate) => candidate.id === confirmPackId)?.name || ''
				}
				packImage={confirmPackId === 'booster_pack' ? boosterPackImg : packImg}
				ownedCount={confirmPackId ? getOwnedCount(confirmPackId) : 0}
				isOpening={isOpening || isOpeningPack}
				onConfirm={(qty) => {
					if (!confirmPackId) return
					// Don't close the modal here — handleOpenPack will close it
					// only after the server responds, so the modal can keep
					// showing its "Setting up packs..." loader during the call.
					handleOpenPack(confirmPackId, qty)
				}}
			/>
		</div>
	)
}

export default PacksPage
