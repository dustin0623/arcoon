'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '@/context/GameContext'
import { useCardActions } from '@/features/actions'
import { MATERIAL_IMAGES } from '@/features/images'
import { ArrowLeftRight } from 'lucide-react'
import Image from 'next/image'
import TradeMaterialModal, { type TradePhase } from '@/components/modals/TradeMaterial'

// Zone progression order for trading up
const ZONE_ORDER = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10']
const ZONE_NAMES: Record<string, string> = {
	d1: 'Goblin Cave',
	d2: 'Spider Den',
	d3: 'Graveyard of Souls',
	d4: 'Crypt of the Undying',
	d5: 'Ice Cavern',
	d6: 'Dark Forest',
	d7: 'Molten Quarry',
	d8: 'Ashen Fortress',
	d9: "Demon's Gate",
	d10: "Dragon's Lair",
}

const TraderPage = () => {
	const { playerState, gameData } = useGame()
	const cardActions = useCardActions()

	// Main-page state is now just which source material the user picked.
	// The target-picker + trade confirmation live inside the modal.
	const [selectedSourceId, setSelectedSourceId] = useState('')
	const [selectedTargetId, setSelectedTargetId] = useState('')
	const [tradeQuantity, setTradeQuantity] = useState(1)

	// Flow-phase state machine rendered inside the modal
	const [phase, setPhase] = useState<TradePhase>('idle')
	const [phaseMessage, setPhaseMessage] = useState('')
	const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Clean up any pending auto-dismiss timer on unmount
	useEffect(() => {
		return () => {
			if (successTimerRef.current) clearTimeout(successTimerRef.current)
		}
	}, [])

	const materials = playerState?.materials ?? []
	const itemsData = gameData?.ITEMS ?? []
	const playerCoins = playerState?.coins ?? 0

	// Build lookup maps
	const materialById = useMemo(() => {
		const map = new Map<string, { id: string; quantity: number }>()
		for (const mat of materials) map.set(mat.id, mat)
		return map
	}, [materials])

	const itemMetaById = useMemo(() => {
		const map = new Map<string, { id: string; name: string; zone: string; category: string }>()
		for (const item of itemsData) map.set(item.id, item)
		return map
	}, [itemsData])

	// Fixed 5:1 trading ratio
	const conversionRatio = 5

	// All material metadata from game data
	const allMaterialsMeta = useMemo(
		() => (Array.isArray(itemsData) ? itemsData : []).filter((item) => item.category === 'material'),
		[itemsData],
	)

	// Source materials: materials the player OWNS from zones D1-D9 (can trade up)
	const availableSources = useMemo(() => {
		return materials
			.map((mat) => {
				const meta = itemMetaById.get(mat.id)
				if (!meta || meta.category !== 'material') return null
				const zoneIndex = ZONE_ORDER.indexOf(meta.zone)
				// D10 has nothing above it, so it can't be a source
				if (zoneIndex < 0 || zoneIndex >= ZONE_ORDER.length - 1) return null
				return {
					...meta,
					quantity: mat.quantity,
					zoneIndex,
				}
			})
			.filter(Boolean)
			.sort((a, b) => a!.zoneIndex - b!.zoneIndex)
	}, [materials, itemMetaById])

	// Target materials derived from the currently selected source
	const availableTargets = useMemo(() => {
		if (!selectedSourceId) return []
		const sourceMeta = itemMetaById.get(selectedSourceId)
		if (!sourceMeta) return []

		const sourceZoneIndex = ZONE_ORDER.indexOf(sourceMeta.zone)
		if (sourceZoneIndex < 0 || sourceZoneIndex >= ZONE_ORDER.length - 1) return []

		const nextZone = ZONE_ORDER[sourceZoneIndex + 1]
		return allMaterialsMeta.filter((m) => m.zone === nextZone)
	}, [selectedSourceId, itemMetaById, allMaterialsMeta])

	// Coin fee: materialsNeeded × zoneIndex × 25
	const getCoinCost = (targetId: string, quantity: number = 1) => {
		if (!targetId) return 0
		const targetMeta = itemMetaById.get(targetId)
		if (!targetMeta) return 0
		const materialsNeeded = quantity * conversionRatio
		return materialsNeeded * ZONE_ORDER.indexOf(targetMeta.zone) * 25
	}

	const selectedSource = selectedSourceId ? materialById.get(selectedSourceId) : null
	const selectedSourceMeta = selectedSourceId ? itemMetaById.get(selectedSourceId) : null

	const handleSourceSelect = (sourceId: string) => {
		setSelectedSourceId(sourceId)
		setSelectedTargetId('')
		setTradeQuantity(1)
		setPhase('idle')
		setPhaseMessage('')
	}

	const closeModal = () => {
		// Block closing mid-trade so the success animation can play through
		if (phase === 'trading') return
		if (successTimerRef.current) {
			clearTimeout(successTimerRef.current)
			successTimerRef.current = null
		}
		setSelectedSourceId('')
		setSelectedTargetId('')
		setTradeQuantity(1)
		setPhase('idle')
		setPhaseMessage('')
	}

	const handleConvert = async () => {
		if (!selectedSourceId || !selectedTargetId) return
		const materialsNeeded = tradeQuantity * conversionRatio
		const coinCost = getCoinCost(selectedTargetId, tradeQuantity)
		if ((selectedSource?.quantity ?? 0) < materialsNeeded || playerCoins < coinCost) return

		// Resolve target name now so we can display it after the request returns,
		// even if the upstream state shifts the available target list.
		const targetName = availableTargets.find((t) => t.id === selectedTargetId)?.name ?? ''
		const remainingSource = (selectedSource?.quantity ?? 0) - materialsNeeded

		setPhase('trading')
		setPhaseMessage('')
		const result = await cardActions.convertMaterial(selectedSourceId, selectedTargetId, {
			silent: true,
			quantity: tradeQuantity,
		})

		if (result?.success === false) {
			setPhase('error')
			setPhaseMessage(result.message || 'Something went wrong. Please try again.')
			return
		}

		// Success → show check for a beat, then either reset or close
		setPhase('success')
		setPhaseMessage(targetName ? `Received ${tradeQuantity}x ${targetName}` : 'Trade complete')

		successTimerRef.current = setTimeout(() => {
			successTimerRef.current = null
			// If source dropped below the trade threshold, close the modal
			if (remainingSource < conversionRatio) {
				setSelectedSourceId('')
				setSelectedTargetId('')
				setTradeQuantity(1)
				setPhase('idle')
				setPhaseMessage('')
			} else {
				// Otherwise reset so the user can trade again
				setSelectedTargetId('')
				setTradeQuantity(1)
				setPhase('idle')
				setPhaseMessage('')
			}
		}, 1400)
	}

	const handleDismissError = () => {
		setPhase('idle')
		setPhaseMessage('')
	}

	return (
		<div className="flex flex-col gap-4 py-4">
			{/* Header */}
			<div className="flex items-center gap-2.5">
				<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
					<ArrowLeftRight className="text-primary" size={18} />
				</div>
				<div>
					<h1 className="font-display text-lg md:text-xl font-bold text-foreground leading-tight">
						Material Trader
					</h1>
					<p className="text-[10px] text-muted-foreground/60">
						Trade <span className="text-amber-400 font-semibold">5x</span> materials to get{' '}
						<span className="text-emerald-400 font-semibold">1x</span> from the next zone
					</p>
				</div>
			</div>

			{/* Source material list — single column now that the target picker moved into the modal */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-foreground">Select a material to trade</span>
					<span className="text-[9px] text-muted-foreground">5x required per trade</span>
				</div>

				{/* Flat list — no zone grouping, no outer wrapper. Filters/search
				    aren't needed here because only owned tradeable materials are
				    shown and clicking a row opens the target-picker modal. */}
				{availableSources.length === 0 ? (
					<div className="rounded-lg border border-border/40 bg-card p-10 text-center">
						<p className="text-sm text-muted-foreground">No tradeable materials</p>
						<p className="text-[10px] text-muted-foreground/60 mt-1">
							Collect materials from dungeons to trade
						</p>
					</div>
				) : (
					<div className="space-y-1.5">
						{availableSources.map((mat) => {
							if (!mat) return null
							const canTrade = mat.quantity >= conversionRatio
							const materialImage = MATERIAL_IMAGES[mat.id]
							// Surface the target zone inline so the user still knows
							// what they'll be trading up to without needing the old
							// zone group header.
							const nextZone = ZONE_ORDER[mat.zoneIndex + 1]

							return (
								<motion.button
									key={mat.id}
									whileTap={{ scale: 0.98 }}
									onClick={() => handleSourceSelect(mat.id)}
									disabled={!canTrade}
									className={`relative w-full flex items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition-all ${
										canTrade
											? 'border-border/60 hover:border-amber-500/50 hover:bg-card/90'
											: 'border-border/40 opacity-50 cursor-not-allowed'
									}`}
								>
									{materialImage && (
										<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
											<Image src={materialImage} alt={mat.name} fill className="object-cover" />
										</div>
									)}
									<div className="flex-1 min-w-0">
										<div className="flex items-baseline gap-2">
											<p className="text-xs font-medium truncate text-foreground">{mat.name}</p>
											<span className="shrink-0 text-[9px] text-muted-foreground/60">
												→ {ZONE_NAMES[nextZone]}
											</span>
										</div>
										<p className="text-[9px] text-muted-foreground">
											<span className={canTrade ? 'text-emerald-400' : 'text-amber-400'}>
												{mat.quantity}x
											</span>
											{canTrade && (
												<span className="text-muted-foreground/60 ml-1">
													({Math.floor(mat.quantity / conversionRatio)} trades available)
												</span>
											)}
										</p>
									</div>
								</motion.button>
							)
						})}
					</div>
				)}
			</div>

			{/* Trade modal */}
			<TradeMaterialModal
				open={!!selectedSourceId}
				onClose={closeModal}
				zoneNames={ZONE_NAMES}
				sourceMeta={selectedSourceMeta ?? null}
				sourceOwned={selectedSource?.quantity ?? 0}
				availableTargets={availableTargets}
				materialById={materialById}
				conversionRatio={conversionRatio}
				getCoinCost={getCoinCost}
				playerCoins={playerCoins}
				selectedTargetId={selectedTargetId}
				onSelectTarget={setSelectedTargetId}
				quantity={tradeQuantity}
				onQuantityChange={setTradeQuantity}
				onConfirmTrade={handleConvert}
				phase={phase}
				phaseMessage={phaseMessage}
				onDismissError={handleDismissError}
			/>
		</div>
	)
}

export default TraderPage
