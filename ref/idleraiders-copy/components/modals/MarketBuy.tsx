import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCardImage, CARD_BACK_FALLBACK } from '@/features/images/CardImages'
import { getMaterialImage } from '@/features/images/MaterialImages'
import CurrencyIcon from '@/components/CurrencyIcon'
import { ShieldAlert, Package } from 'lucide-react'

const rarityText = {
	common: 'text-muted-foreground',
	uncommon: 'text-green-400',
	rare: 'text-blue-400',
	epic: 'text-purple-400',
	legendary: 'text-primary',
	special: 'text-red-400',
}

const MarketBuy = ({
	open,
	listing,
	balance,
	onConfirm,
	onClose,
	type = 'card',
}: {
	open: boolean
	listing: Record<string, any> | null
	balance: number
	onConfirm: (...args: any[]) => void
	onClose: () => void
	type?: string
}) => {
	const [qty, setQty] = useState(1)

	// Reset qty when listing changes
	useEffect(() => {
		if (listing && type === 'material') {
			setQty(listing.quantity)
		}
	}, [listing, type])

	if (!listing) return null

	const isCard = type === 'card'

	if (isCard) {
		// CARD PURCHASE
		const { card } = listing
		const cardImg = getCardImage(card.id, card.rarity, card.type)
		const remaining = balance - listing.price

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

							<div className="p-6 space-y-4">
								{/* Icon */}
								<div className="flex justify-center">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
										<ShieldAlert className="text-primary" size={22} />
									</div>
								</div>

								<h3 className="text-center font-display text-base font-bold text-foreground">
									Confirm Purchase
								</h3>

								{/* Card preview */}
								<div
									className="flex items-center gap-3 rounded-xl border border-border p-3"
									style={{ background: 'hsl(230 12% 12%)' }}
								>
									<div className="flex-shrink-0 rounded-lg overflow-hidden border border-border w-14 h-14">
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
												<span className="text-2xl">{card.icon}</span>
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-display font-bold text-foreground truncate">
											{card.name}
										</p>
										<p
											className={`text-[10px] font-bold uppercase tracking-wider ${rarityText[card.rarity as keyof typeof rarityText]}`}
										>
											{card.rarity} {card.type}
										</p>
										<div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
											<span>⚔️{card.stats.raidPower}</span>
											<span>🎯{card.stats.mastery}</span>
											<span>🍀{card.stats.luck}</span>
											<span className="text-primary">👑{card.stats.gm}</span>
										</div>
									</div>
								</div>

								{/* Price breakdown */}
								<div
									className="space-y-2 rounded-xl border border-border p-3 text-xs"
									style={{ background: 'hsl(230 12% 12%)' }}
								>
									<div className="flex items-center justify-between text-muted-foreground">
										<span>Price</span>
										<span className="flex items-center gap-1 font-bold text-foreground">
											<CurrencyIcon type="token" size={14} /> {listing.price.toLocaleString()}
										</span>
									</div>
									<div className="h-px bg-border" />
									<div className="flex items-center justify-between text-muted-foreground">
										<span>Your Balance</span>
										<span className="flex items-center gap-1 font-semibold text-primary">
											<CurrencyIcon type="token" size={14} /> {balance.toLocaleString()}
										</span>
									</div>
									<div className="flex items-center justify-between text-muted-foreground">
										<span>After Purchase</span>
										<span
											className={`flex items-center gap-1 font-semibold ${remaining >= 0 ? 'text-green-400' : 'text-destructive'}`}
										>
											<CurrencyIcon type="token" size={14} /> {remaining.toLocaleString()}
										</span>
									</div>
								</div>

								<p className="text-center text-[10px] text-muted-foreground/50">
									Sold by <span className="text-muted-foreground">{listing.seller}</span>
								</p>

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
										className="fantasy-btn flex-1 px-4 py-2.5 text-xs font-bold"
									>
										Confirm Buy
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
		// MATERIAL PURCHASE
		const { material } = listing
		const matImg = getMaterialImage(material.name)
		const unitPrice = listing.price / listing.quantity
		const totalPrice = Math.round(unitPrice * qty)
		const remaining = balance - totalPrice
		const canAfford = remaining >= 0

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

							<div className="p-6 space-y-4">
								<div className="flex justify-center">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
										<ShieldAlert className="text-primary" size={22} />
									</div>
								</div>

								<h3 className="text-center font-display text-base font-bold text-foreground">
									Buy Materials
								</h3>

								{/* Material preview */}
								<div
									className="flex items-center gap-3 rounded-xl border border-border p-3"
									style={{ background: 'hsl(230 12% 12%)' }}
								>
									<div className="flex-shrink-0 rounded-lg overflow-hidden border border-border w-14 h-14">
										{matImg ? (
											<img
												src={matImg}
												alt={material.name}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center bg-secondary">
												<span className="text-2xl">{material.icon}</span>
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-1.5">
											<p className="text-sm font-display font-bold text-foreground truncate">
												{material.name}
											</p>
											<span className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
												<Package size={8} /> MAT
											</span>
										</div>
										<p className="text-[10px] text-green-400 capitalize">
											{material.type} Material
										</p>
										<p className="text-[10px] text-muted-foreground mt-0.5">
											Available: ×{listing.quantity}
										</p>
									</div>
								</div>

								{/* Quantity selector */}
								<div className="space-y-2">
									<label className="block text-xs text-muted-foreground">Quantity to buy</label>
									<div className="flex items-center justify-center gap-3">
										<button
											onClick={() => setQty(Math.max(1, qty - 10))}
											className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 text-[10px] font-bold"
										>
											−10
										</button>
										<button
											onClick={() => setQty(Math.max(1, qty - 1))}
											className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 font-bold"
										>
											−
										</button>
										<span className="min-w-[2.5rem] text-center font-mono text-xl font-bold text-foreground">
											{qty}
										</span>
										<button
											onClick={() => setQty(Math.min(listing.quantity, qty + 1))}
											className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 font-bold"
										>
											+
										</button>
										<button
											onClick={() => setQty(Math.min(listing.quantity, qty + 10))}
											className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border text-foreground transition-colors hover:bg-secondary/80 text-[10px] font-bold"
										>
											+10
										</button>
									</div>
									<div className="flex justify-center gap-2">
										<button
											onClick={() => setQty(1)}
											className="text-[9px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-secondary/50 border border-border transition-colors"
										>
											Min
										</button>
										<button
											onClick={() => setQty(Math.floor(listing.quantity / 2))}
											className="text-[9px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-secondary/50 border border-border transition-colors"
										>
											Half
										</button>
										<button
											onClick={() => setQty(listing.quantity)}
											className="text-[9px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded bg-secondary/50 border border-border transition-colors"
										>
											Max
										</button>
									</div>
								</div>

								{/* Price breakdown */}
								<div
									className="space-y-2 rounded-xl border border-border p-3 text-xs"
									style={{ background: 'hsl(230 12% 12%)' }}
								>
									<div className="flex items-center justify-between text-muted-foreground">
										<span>Unit Price</span>
										<span className="flex items-center gap-1 text-muted-foreground">
											<CurrencyIcon type="token" size={14} />{' '}
											{Math.round(unitPrice).toLocaleString()}
										</span>
									</div>
									<div className="flex items-center justify-between text-muted-foreground">
										<span>Total ({qty}×)</span>
										<span className="flex items-center gap-1 font-bold text-foreground">
											<CurrencyIcon type="token" size={14} /> {totalPrice.toLocaleString()}
										</span>
									</div>
									<div className="h-px bg-border" />
									<div className="flex items-center justify-between text-muted-foreground">
										<span>Your Balance</span>
										<span className="flex items-center gap-1 font-semibold text-primary">
											<CurrencyIcon type="token" size={14} /> {balance.toLocaleString()}
										</span>
									</div>
									<div className="flex items-center justify-between text-muted-foreground">
										<span>After Purchase</span>
										<span
											className={`flex items-center gap-1 font-semibold ${canAfford ? 'text-green-400' : 'text-destructive'}`}
										>
											<CurrencyIcon type="token" size={14} /> {remaining.toLocaleString()}
										</span>
									</div>
								</div>

								<p className="text-center text-[10px] text-muted-foreground/50">
									Sold by <span className="text-muted-foreground">{listing.seller}</span>
								</p>

								<div className="flex gap-2 pt-1">
									<button
										onClick={onClose}
										className="flex-1 rounded-lg bg-secondary border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
									>
										Cancel
									</button>
									<button
										onClick={() => onConfirm(qty)}
										disabled={!canAfford}
										className="fantasy-btn flex-1 px-4 py-2.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
									>
										Buy {qty}× Materials
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

export default MarketBuy
