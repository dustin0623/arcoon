import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCardImage, CARD_BACK_FALLBACK } from '@/features/images/CardImages'
import { getMaterialImage } from '@/features/images/MaterialImages'
import CurrencyIcon from '@/components/CurrencyIcon'
import { Plus, Package } from 'lucide-react'

const rarityText = {
	common: 'text-muted-foreground',
	uncommon: 'text-green-400',
	rare: 'text-blue-400',
	epic: 'text-purple-400',
	legendary: 'text-primary',
	special: 'text-red-400',
}

const materialTypeStyles = {
	common: 'text-green-400',
	boss: 'text-purple-400',
}

const MarketSell = ({
	open,
	item,
	qty,
	price,
	onQtyChange,
	onPriceChange,
	onConfirm,
	onClose,
	type = 'card',
	priceGuidance = null,
}: {
	open: boolean
	item: Record<string, any> | null
	qty: number
	price: number
	onQtyChange?: (value: number) => void
	onPriceChange: (value: number) => void
	onConfirm: () => void | Promise<void>
	onClose: () => void
	type?: string
	priceGuidance?: Record<string, any> | null
}) => {
	if (!item) return null

	const isCard = type === 'card'

	// Calculate suggested price range
	const suggestedMin = priceGuidance?.floor ? Math.round(priceGuidance.floor * 0.95) : null
	const suggestedMax = priceGuidance?.avg ? Math.round(priceGuidance.avg * 1.05) : null
	const suggestedMid = suggestedMin && suggestedMax ? Math.round((suggestedMin + suggestedMax) / 2) : null

	if (isCard) {
		// SELL CARD
		const card = item
		const cardImg = getCardImage(card.id, card.rarity, card.type)

		return createPortal(
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
						onClick={onClose}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.9, opacity: 0, y: 20 }}
							transition={{ type: 'spring', stiffness: 300, damping: 25 }}
							className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl border border-border"
							style={{ background: 'linear-gradient(160deg, hsl(230 12% 16%), hsl(230 12% 9%))' }}
							onClick={(e) => e.stopPropagation()}
						>
							{/* Top accent */}
							<div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

							<div className="p-6 space-y-5">
								{/* Card preview */}
								<div className="text-center">
									<div className="mx-auto w-20 h-20 rounded-xl overflow-hidden border border-border">
										{cardImg ? (
											<img
												src={cardImg}
												alt={card.name}
												className="w-full h-full object-cover"
												onError={(e) => {
													const target = e.currentTarget
													if (target.src !== window.location.origin + CARD_BACK_FALLBACK) {
														target.src = CARD_BACK_FALLBACK
													}
												}}
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center bg-secondary">
												<span className="text-4xl">{card.icon}</span>
											</div>
										)}
									</div>
									<h3 className="mt-3 font-display text-base font-bold text-foreground">
										{card.name}
									</h3>
									<p
										className={`text-xs font-bold uppercase tracking-wider ${rarityText[card.rarity as keyof typeof rarityText]}`}
									>
										{card.rarity}
									</p>
									<div className="mt-2 flex justify-center gap-3 text-[10px] text-muted-foreground">
										<span>⚔️ {card.stats.raidPower}</span>
										<span>🎯 {card.stats.mastery}</span>
										<span>🍀 {card.stats.luck}</span>
										<span className="text-primary">👑 {card.stats.gm}</span>
									</div>
									<p className="mt-1 text-[10px] text-muted-foreground/60">
										Available: ×{card.quantity}
									</p>
								</div>

								{/* Quantity */}
								<div className="space-y-2">
									<label className="block text-xs text-muted-foreground">Quantity</label>
									<div className="flex items-center justify-center gap-4">
										<button
											onClick={() => onQtyChange?.(Math.max(1, qty - 1))}
											className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 font-bold"
										>
											−
										</button>
										<span className="min-w-[2.5rem] text-center font-mono text-xl font-bold text-foreground">
											{qty}
										</span>
										<button
											onClick={() => onQtyChange?.(Math.min(card.quantity, qty + 1))}
											className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 font-bold"
										>
											+
										</button>
									</div>
									<p className="text-center text-[10px] text-muted-foreground/50">
										Each card listed individually
									</p>
								</div>

								{/* Price */}
								<div className="space-y-2">
									<label className="block text-xs text-muted-foreground">Price per card</label>

									{/* Price Guidance */}
									{priceGuidance && (
										<div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-1.5">
											<div className="flex items-center justify-between text-[10px]">
												<span className="text-muted-foreground">Floor:</span>
												<span className="font-semibold text-primary flex items-center gap-0.5">
													<CurrencyIcon type="token" size={10} />
													{priceGuidance.floor.toLocaleString()}
												</span>
											</div>
											<div className="flex items-center justify-between text-[10px]">
												<span className="text-muted-foreground">Avg:</span>
												<span className="font-semibold text-foreground flex items-center gap-0.5">
													<CurrencyIcon type="token" size={10} />
													{priceGuidance.avg.toLocaleString()}
												</span>
											</div>
											{suggestedMin && suggestedMax && (
												<div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/50">
													<span className="text-green-400 font-medium">Suggested:</span>
													<span className="font-semibold text-green-400">
														{suggestedMin.toLocaleString()} -{' '}
														{suggestedMax.toLocaleString()}
													</span>
												</div>
											)}
											{suggestedMid && (
												<button
													onClick={() => onPriceChange(suggestedMid)}
													className="w-full mt-1 px-2 py-1 rounded bg-primary/10 border border-primary/30 text-[9px] font-semibold text-primary hover:bg-primary/20 transition-colors"
												>
													Use Suggested: {suggestedMid.toLocaleString()}
												</button>
											)}
										</div>
									)}

									<div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2">
										<CurrencyIcon type="token" size={16} />
										<input
											type="number"
											min={100}
											step={100}
											value={price}
											onChange={(e) =>
												onPriceChange(Math.max(100, parseInt(e.target.value) || 100))
											}
											className="w-full bg-transparent text-sm text-foreground outline-none"
										/>
									</div>
									<p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
										Total: <CurrencyIcon type="token" size={12} /> {(price * qty).toLocaleString()}
									</p>
								</div>

								{/* Actions */}
								<div className="flex gap-2 pt-1">
									<button
										onClick={onClose}
										className="flex-1 rounded-lg bg-secondary border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
									>
										Cancel
									</button>
									<button
										onClick={onConfirm}
										className="fantasy-btn flex-1 flex items-center justify-center gap-1 px-4 py-2.5 text-xs"
									>
										<Plus size={12} />
										List {qty} card{qty > 1 ? 's' : ''}
									</button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>,
			document.body,
		)
	} else {
		// SELL MATERIAL
		const material = item
		const matImg = getMaterialImage(material.name)
		const totalPrice = price * qty

		return createPortal(
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
						onClick={onClose}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0, y: 20 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.9, opacity: 0, y: 20 }}
							transition={{ type: 'spring', stiffness: 300, damping: 25 }}
							className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl border border-border"
							style={{ background: 'linear-gradient(160deg, hsl(230 12% 16%), hsl(230 12% 9%))' }}
							onClick={(e) => e.stopPropagation()}
						>
							<div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

							<div className="p-6 space-y-5">
								{/* Material preview */}
								<div className="text-center">
									<div className="mx-auto w-20 h-20 rounded-xl overflow-hidden border border-border relative">
										{matImg ? (
											<img
												src={matImg}
												alt={material.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center bg-secondary">
												<span className="text-4xl">{material.icon}</span>
											</div>
										)}
									</div>
									<div className="mt-2 flex items-center justify-center gap-1.5">
										<Package size={12} className="text-muted-foreground" />
										<span className="text-[10px] font-semibold text-muted-foreground uppercase">
											Material
										</span>
									</div>
									<h3 className="mt-1 font-display text-base font-bold text-foreground">
										{material.name}
									</h3>
									<p
										className={`text-xs font-bold uppercase tracking-wider ${materialTypeStyles[material.type as keyof typeof materialTypeStyles]}`}
									>
										{material.type}
									</p>
									<p className="mt-1 text-[10px] text-muted-foreground/60">
										Available: ×{material.quantity}
									</p>
								</div>

								{/* Quantity */}
								<div className="space-y-2">
									<label className="block text-xs text-muted-foreground">Quantity to sell</label>
									<div className="flex items-center justify-center gap-4">
										<button
											onClick={() => onQtyChange?.(Math.max(1, qty - 10))}
											className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 text-[10px] font-bold"
										>
											-10
										</button>
										<button
											onClick={() => onQtyChange?.(Math.max(1, qty - 1))}
											className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 font-bold"
										>
											−
										</button>
										<span className="min-w-[3rem] text-center font-mono text-xl font-bold text-foreground">
											{qty}
										</span>
										<button
											onClick={() => onQtyChange?.(Math.min(material.quantity, qty + 1))}
											className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 font-bold"
										>
											+
										</button>
										<button
											onClick={() => onQtyChange?.(Math.min(material.quantity, qty + 10))}
											className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 text-[10px] font-bold"
										>
											+10
										</button>
									</div>
									<div className="flex justify-center gap-2">
										<button
											onClick={() => onQtyChange?.(1)}
											className="text-[9px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-secondary/50 border border-border transition-colors"
										>
											Min
										</button>
										<button
											onClick={() => onQtyChange?.(Math.floor(material.quantity / 2))}
											className="text-[9px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-secondary/50 border border-border transition-colors"
										>
											Half
										</button>
										<button
											onClick={() => onQtyChange?.(material.quantity)}
											className="text-[9px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-secondary/50 border border-border transition-colors"
										>
											Max
										</button>
									</div>
									<p className="text-center text-[10px] text-muted-foreground/50">
										Materials are sold as a stack (bundle)
									</p>
								</div>

								{/* Price */}
								<div className="space-y-2">
									<label className="block text-xs text-muted-foreground">
										Price for entire stack
									</label>
									<div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2">
										<CurrencyIcon type="token" size={16} />
										<input
											type="number"
											min={10}
											step={10}
											value={totalPrice}
											onChange={(e) =>
												onPriceChange(Math.max(10, parseInt(e.target.value) || 10))
											}
											className="w-full bg-transparent text-sm text-foreground outline-none"
										/>
									</div>
									<p className="text-[10px] text-muted-foreground/60">
										≈ {Math.round(totalPrice / qty).toLocaleString()} per unit
									</p>
								</div>

								{/* Actions */}
								<div className="flex gap-2 pt-1">
									<button
										onClick={onClose}
										className="flex-1 rounded-lg bg-secondary border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
									>
										Cancel
									</button>
									<button
										onClick={onConfirm}
										className="fantasy-btn flex-1 flex items-center justify-center gap-1 px-4 py-2.5 text-xs"
									>
										<Plus size={12} />
										List ×{qty} {material.name}
									</button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>,
			document.body,
		)
	}
}

export default MarketSell
