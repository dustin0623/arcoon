'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useGame } from '@/context/GameContext'
import { useCraftActions } from '@/features/actions'
import { Loader2, Wand2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { getCardImage, CARD_BACK_FALLBACK } from '@/features/images/CardImages'
import { rarityBorder, rarityText } from '@/lib/rarityStyles'
import { WorkshopCraftFilter } from '@/components/GlobalFilter'
import ForgeCardModal, { type ForgePhase } from '@/components/modals/ForgeCard'

// Tiny thumb used in each recipe row. Keeps its own error flag so that when
// the mapped (or type/rarity-fallback) image 404s at the Next.js optimizer
// layer, the state flip re-renders with CARD_BACK_FALLBACK. Manually mutating
// `img.src` on next/image doesn't stick — it re-renders from its own state.
const RecipeThumb = ({ src, alt }: { src: string; alt: string }) => {
	const [errored, setErrored] = useState(false)
	return (
		<Image
			src={errored ? CARD_BACK_FALLBACK : src || CARD_BACK_FALLBACK}
			alt={alt}
			fill
			className="object-cover"
			sizes="40px"
			onError={() => setErrored(true)}
		/>
	)
}

const CraftingPage = () => {
	const { playerState, gameData } = useGame()
	const { craftCard } = useCraftActions()

	// State — selectedRecipe drives the modal; null = modal closed
	const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null)
	const [filters, setFilters] = useState({ search: '', type: 'all', rarity: 'all' })

	// Flow-phase state machine rendered inside the modal
	const [phase, setPhase] = useState<ForgePhase>('idle')
	const [phaseMessage, setPhaseMessage] = useState('')
	const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Clean up any pending auto-dismiss timer on unmount
	useEffect(() => {
		return () => {
			if (successTimerRef.current) clearTimeout(successTimerRef.current)
		}
	}, [])

	// Data
	const CARDS_DATA = useMemo(() => gameData?.CARDS ?? [], [gameData])
	const craftableCards = useMemo(() => CARDS_DATA.filter((c) => c?.source?.type === 'crafting'), [CARDS_DATA])

	// Filtered recipes
	const filteredRecipes = useMemo(() => {
		return craftableCards.filter((card) => {
			if (filters.search && !card.name?.toLowerCase().includes(filters.search.toLowerCase())) return false
			if (filters.type !== 'all' && card.type !== filters.type) return false
			if (filters.rarity !== 'all' && card.rarity !== filters.rarity) return false
			return true
		})
	}, [craftableCards, filters])

	const materials = useMemo(() => playerState?.materials ?? [], [playerState])

	// Inventory map lets us quickly answer "does the player have enough mats?"
	// for both the selected-card requirements and per-row craftability.
	const inventoryMapAll = useMemo(() => {
		const map = new Map<string, number>()
		for (const item of materials) {
			map.set(item.id, Number(item.quantity ?? 0))
		}
		return map
	}, [materials])

	// Per-row craftability check so each list row can label itself Craft/Missing.
	const cardCanCraft = useCallback(
		(card: { materials?: Record<string, number | string> | null }) => {
			if (!card?.materials) return false
			return Object.entries(card.materials).every(([materialId, required]) => {
				const available = inventoryMapAll.get(materialId) ?? 0
				return available >= Number(required)
			})
		},
		[inventoryMapAll],
	)



	const selectedCard = useMemo(
		() => CARDS_DATA.find((c) => c.id === selectedRecipe) ?? null,
		[CARDS_DATA, selectedRecipe],
	)

	// Specific material requirements for the card open in the preview modal.
	const selectedRequirements = useMemo(() => {
		if (!selectedCard?.materials) return []
		return Object.entries(selectedCard.materials).map(([materialId, required]) => ({
			materialId,
			required: Number(required),
			available: inventoryMapAll.get(materialId) ?? 0,
		}))
	}, [selectedCard, inventoryMapAll])

	// Whether the current selection can be crafted (reuses cardCanCraft).
	const canCraftSelected = useMemo(
		() => (selectedCard ? cardCanCraft(selectedCard as Record<string, any>) : false),
		[selectedCard, cardCanCraft],
	)

	// Close the modal — blocked while mid-forge so the success animation plays
	const closeModal = useCallback(() => {
		if (phase === 'forging') return
		if (successTimerRef.current) {
			clearTimeout(successTimerRef.current)
			successTimerRef.current = null
		}
		setSelectedRecipe(null)
		setPhase('idle')
		setPhaseMessage('')
	}, [phase])

	const handleDismissError = useCallback(() => {
		setPhase('idle')
		setPhaseMessage('')
	}, [])

	// Handle craft action — runs the full idle → forging → success/error cycle
	const handleCraft = useCallback(async () => {
		if (!selectedRecipe) {
			toast.error('Please select a recipe')
			return
		}

		// Grab the name now so we can show it on the success screen even if
		// the selected-recipe state is cleared before the animation finishes.
		const cardName = selectedCard?.name ?? 'card'

		setPhase('forging')
		setPhaseMessage('')
		const result = await craftCard(selectedRecipe, { silent: true })

		if (result.success === false) {
			setPhase('error')
			setPhaseMessage(result.message || 'Something went wrong. Please try again.')
			return
		}

		setPhase('success')
		setPhaseMessage(`Added 1x ${cardName} to your collection`)

		successTimerRef.current = setTimeout(() => {
			successTimerRef.current = null
			setSelectedRecipe(null)
			setPhase('idle')
			setPhaseMessage('')
		}, 1600)
	}, [selectedRecipe, selectedCard, craftCard])

	return (
		<div className="flex flex-col gap-4 py-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2.5">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
						<Loader2 className="text-primary" size={18} />
					</div>
					<div>
						<h1 className="font-display text-lg md:text-xl font-bold text-foreground leading-tight">
							Crafting
						</h1>
						<p className="text-[10px] text-muted-foreground/60">
							Tap a recipe to preview requirements and forge
						</p>
					</div>
				</div>
			</div>

			{/* Available Recipes Section */}
			<div className="space-y-3">
				{/* Header and Count */}
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold text-foreground">Available Recipes</h2>
					<span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
						{filteredRecipes.length}
					</span>
				</div>

				{/* Filter */}
				<WorkshopCraftFilter filters={filters} onChange={setFilters} />

					{/* Recipe list — flat, no grouping or outer container.
					    Filters above handle rarity/type narrowing. */}
					<div className="space-y-1.5">
						{filteredRecipes.map((card) => {
							const canCraft = cardCanCraft(card)
							const stats = (card.stats ?? {}) as Record<string, number | undefined>
							// getCardImage signature is (cardId, type, rarity). It always
							// returns a string (falling back to /assets/card_back.png).
							const cardImage = getCardImage(card.id, card.type, card.rarity)

							return (
								<motion.button
									key={card.id}
									whileTap={{ scale: 0.98 }}
									onClick={() => setSelectedRecipe(card.id)}
									className={`relative w-full flex items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition-all ${
										canCraft
											? 'border-border/60 hover:border-primary/50 hover:bg-card/90'
											: 'border-border/40 hover:border-border/70 hover:bg-card/90'
									}`}
								>
									<div
										className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-secondary ${rarityBorder[card.rarity as keyof typeof rarityBorder] ?? 'border-border/40'}`}
									>
										<RecipeThumb src={cardImage} alt={card.name ?? ''} />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-baseline gap-2">
											<p className="text-xs font-medium truncate text-foreground">
												{card.name}
											</p>
											<span
												className={`shrink-0 text-[9px] font-semibold uppercase tracking-wide ${rarityText[card.rarity as keyof typeof rarityText] ?? 'text-muted-foreground'}`}
											>
												{card.rarity}
											</span>
											<span className="shrink-0 text-[9px] text-muted-foreground/70 capitalize">
												{card.type}
											</span>
										</div>
										<div className="mt-0.5 flex items-center gap-2 text-[9px] text-muted-foreground">
											<span className="inline-flex items-center gap-1">
												<span className="text-muted-foreground/60">⚔️</span>
												<span className="font-bold text-foreground">
													{stats.raidPower ?? 0}
												</span>
											</span>
											<span className="inline-flex items-center gap-1">
												<span className="text-muted-foreground/60">🎯</span>
												<span className="font-bold text-foreground">
													{stats.mastery ?? 0}
												</span>
											</span>
											<span className="inline-flex items-center gap-1">
												<span className="text-muted-foreground/60">🍀</span>
												<span className="font-bold text-foreground">
													{stats.luck ?? 0}
												</span>
											</span>
											<span className="inline-flex items-center gap-1">
												<span className="text-muted-foreground/60">👑</span>
												<span className="font-bold text-primary">
													{stats.gm ?? 0}
												</span>
											</span>
										</div>
									</div>
									<span
										className={`shrink-0 inline-flex items-center gap-0.5 rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${
											canCraft
												? 'border-primary/40 bg-primary/10 text-primary'
												: 'border-border/40 bg-secondary/40 text-muted-foreground'
										}`}
									>
										{canCraft ? 'Craft' : 'Missing'}
										<ChevronRight size={12} />
									</span>
								</motion.button>
							)
						})}
					</div>

				{filteredRecipes.length === 0 && (
					<div className="flex flex-col items-center justify-center py-16 gap-2">
						<Wand2 size={32} className="text-muted-foreground/30" />
						<p className="text-sm text-muted-foreground">No recipes found</p>
						{(filters.rarity !== 'all' || filters.type !== 'all' || filters.search) && (
							<button
								onClick={() => setFilters({ search: '', type: 'all', rarity: 'all' })}
								className="text-[10px] text-primary font-medium hover:underline"
							>
								Clear filters
							</button>
						)}
					</div>
				)}
			</div>

			{/* Forge preview modal — opens when a recipe is tapped */}
			<ForgeCardModal
				open={selectedRecipe !== null}
				onClose={closeModal}
				selectedCard={selectedCard as Record<string, any> | null}
				requirements={selectedRequirements}
				gameData={gameData}
				canCraft={canCraftSelected}
				onCraft={handleCraft}
				phase={phase}
				phaseMessage={phaseMessage}
				onDismissError={handleDismissError}
			/>
		</div>
	)
}

export default CraftingPage
