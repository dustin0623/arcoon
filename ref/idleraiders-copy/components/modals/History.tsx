'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
	Clock,
	Loader2,
	Swords,
	ScrollText,
	Skull,
	ArrowDownToLine,
	ArrowUpFromLine,
	Users,
	Gift,
	Package,
	CheckCircle2,
	AlertCircle,
	XCircle,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
} from '@/components/ui/drawer'
import { GameSelect } from '@/components/ui/game-select'
import { useHistoryActions } from '@/features/actions'
import CurrencyIcon from '@/components/CurrencyIcon'
import { timeAgo } from '@/lib/formatters'
import { useIsMobile } from '@/hooks/use-mobile'

// ── Config ────────────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = [
	{ value: 'mission', label: 'Missions' },
	{ value: 'market', label: 'Market' },
	{ value: 'wallet', label: 'Wallet' },
	{ value: 'guild', label: 'Guild' },
	{ value: 'packs', label: 'Packs' },
	{ value: 'inventory', label: 'Inventory' },
]

const SUB_FILTER_OPTIONS = {
	mission: [
		{ value: 'all', label: 'All Missions' },
		{ value: 'dungeon', label: 'Dungeons' },
		{ value: 'story', label: 'Story Quests' },
		{ value: 'boss', label: 'Boss Raids' },
	],
	market: [
		{ value: 'all', label: 'All Trades' },
		{ value: 'card', label: 'Cards' },
		{ value: 'material', label: 'Materials' },
	],
	wallet: [
		{ value: 'all', label: 'All Transactions' },
		{ value: 'deposit', label: 'Deposits' },
		{ value: 'withdraw', label: 'Withdrawals' },
		{ value: 'pack_purchase', label: 'Pack Purchases' },
		{ value: 'credit_purchase', label: 'Dollar Purchases' },
		{ value: 'registration', label: 'Registration' },
	],
	guild: [{ value: 'all', label: 'All Activity' }],
	packs: [{ value: 'all', label: 'All Purchases' }],
	inventory: [{ value: 'all', label: 'All Pulls' }],
}

const MISSION_ICONS = { dungeon: Swords, story: ScrollText, boss: Skull }

const TX_LABELS = {
	deposit: 'Deposit',
	withdraw: 'Withdrawal',
	pack_purchase: 'Pack Purchase',
	credit_purchase: 'Dollar Purchase',
	registration: 'Registration Bonus',
}

const TX_STATUS = {
	completed: { icon: CheckCircle2, color: 'text-green-400' },
	pending: { icon: AlertCircle, color: 'text-amber-400' },
	failed: { icon: XCircle, color: 'text-destructive' },
}

const GUILD_ICONS = { donate: Gift, boss: Swords }

// ── Row renderers ─────────────────────────────────────────────────────────────

function MissionRow({ entry, index }: { entry: Record<string, any>; index: number }) {
	const d = entry.data ?? {}
	const missionType = entry.type ?? d.type ?? 'dungeon'
	const MIcon = MISSION_ICONS[missionType as keyof typeof MISSION_ICONS] ?? Swords
	const ts = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now()

// Extract rewards based on mission type
		let rewardText = ''
		if (missionType === 'story') {
			if (d.cardDropped && d.rewardCard) {
				rewardText = `Card: ${d.rewardCard.name || d.rewardCard.cardId}`
				if (d.rewardCard.previousCount !== undefined && d.rewardCard.currentCount !== undefined) {
					rewardText += ` (${d.rewardCard.previousCount} → ${d.rewardCard.currentCount})`
				}
				if (d.rewardCard.isNew) {
					rewardText += ' NEW'
				}
			} else if (d.materialDropCount) {
				rewardText = `${d.materialDropCount} Materials`
			}
			if (d.xp) rewardText = rewardText ? `${rewardText} · ${d.xp} XP` : `${d.xp} XP`
		} else if (missionType === 'dungeon') {
		const rewards = []
		if (d.tokens) rewards.push(`${d.tokens} Tokens`)
		if (d.materials) rewards.push(`${d.materials} Materials`)
		if (d.xp) rewards.push(`${d.xp} XP`)
		rewardText = rewards.join(' · ')
	} else if (missionType === 'boss') {
		const rewards = []
		if (d.totalMaterialDrops) rewards.push(`${d.totalMaterialDrops} Materials`)
		if (d.componentDrops) rewards.push(`${d.componentDrops} Components`)
		if (d.catalystDrops) rewards.push(`${d.catalystDrops} Catalysts`)
		if (d.xp) rewards.push(`${d.xp} XP`)
		rewardText = rewards.join(' · ')
	}

	return (
		<HistoryRow index={index}>
			<div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
				<MIcon size={18} className="text-primary" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5">
					<p className="text-sm font-bold text-foreground truncate">
						{entry.sourceName ?? d.sourceName ?? 'Mission'}
					</p>
					<CheckCircle2 size={12} className="text-primary shrink-0" />
				</div>
				<div className="flex items-center gap-2 mt-0.5">
					<span className="text-[10px] text-muted-foreground">{timeAgo(ts)}</span>
					{(entry.duration ?? d.duration) != null && (
						<>
							<span className="text-[9px] text-muted-foreground/50">•</span>
							<span className="text-[10px] text-muted-foreground">
								{Math.floor((entry.duration ?? d.duration) / 60)}min
							</span>
						</>
					)}
				</div>
				{rewardText && <p className="text-[9px] text-primary/70 mt-1 truncate">{rewardText}</p>}
			</div>
		</HistoryRow>
	)
}

function MarketRow({ entry, index }: { entry: Record<string, any>; index: number }) {
	const event = entry.data ?? {}
	const itemName = event.cardId ?? event.materialName ?? entry.target?.label ?? 'Market trade'
	const marketAction =
		event.action ||
		(entry.eventKey?.startsWith('market.') ? entry.eventKey.split('.').at(-1)?.replaceAll('_', ' ') : null)
	const ts = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now()
	const rarityColors = {
		common: 'text-muted-foreground',
		uncommon: 'text-green-400',
		rare: 'text-blue-400',
		epic: 'text-purple-400',
		legendary: 'text-yellow-400',
	}
	const rarityColor = rarityColors[event.rarity?.toLowerCase() as keyof typeof rarityColors] ?? 'text-green-400'
	return (
		<HistoryRow index={index}>
			<span className="text-xl">🃏</span>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5">
					<p className="text-[11px] font-bold text-foreground truncate">{itemName}</p>
					{event.quantity > 1 && (
						<span className="text-[9px] px-1 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
							×{event.quantity}
						</span>
					)}
				</div>
				<p className={`text-[9px] font-bold uppercase tracking-wider ${rarityColor}`}>
					{marketAction || entry.eventType || 'trade'}
				</p>
			</div>
			<div className="text-right shrink-0">
				<p className="text-[10px] font-bold text-foreground flex items-center justify-end gap-1">
					<CurrencyIcon type="token" size={12} /> {(event.price ?? event.totalCost ?? 0).toLocaleString()}
				</p>
				<p className="text-[8px] text-muted-foreground/50">{timeAgo(ts)}</p>
			</div>
		</HistoryRow>
	)
}

function WalletRow({ entry, index }: { entry: Record<string, any>; index: number }) {
	const tx = entry.data ?? {}
	const txType = tx.action ?? entry.eventKey?.split('.').at(-1) ?? 'deposit'
	const isIncoming = txType === 'deposit' || txType === 'registration' || txType === 'credit_purchase'
	const ts = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now()
	const status = TX_STATUS[(entry.status || tx.status) as keyof typeof TX_STATUS] ?? TX_STATUS.completed
	const StatusIcon = status.icon
	return (
		<HistoryRow index={index}>
			<div
				className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isIncoming ? 'bg-primary/10' : 'bg-destructive/10'}`}
			>
				{isIncoming ? (
					<ArrowDownToLine size={18} className="text-primary" />
				) : (
					<ArrowUpFromLine size={18} className="text-destructive" />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5">
					<p className="text-sm font-bold text-foreground">
						{TX_LABELS[txType as keyof typeof TX_LABELS] ?? txType}
					</p>
					<StatusIcon size={12} className={status.color} />
				</div>
				<div className="flex items-center gap-2 mt-0.5">
					<span className="text-[10px] text-muted-foreground">{timeAgo(ts)}</span>
					{tx.txId && (
						<span className="text-[9px] text-muted-foreground/50 font-mono truncate max-w-[80px]">
							{tx.txId}
						</span>
					)}
				</div>
			</div>
			<div className="text-right shrink-0">
				<p className={`text-sm font-bold tabular-nums ${isIncoming ? 'text-primary' : 'text-foreground'}`}>
					{isIncoming ? '+' : '-'}
					{(tx.amount ?? 0).toLocaleString()}
				</p>
				<p className="text-[10px] text-muted-foreground font-medium">{tx.symbol ?? ''}</p>
			</div>
		</HistoryRow>
	)
}

function PacksRow({ entry, index }: { entry: Record<string, any>; index: number }) {
	const d = entry.data ?? {}
	const ts = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now()
	return (
		<HistoryRow index={index}>
			<div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
				<Package size={18} className="text-primary" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-bold text-foreground truncate">
					Bought {d.packName || d.packId || 'Pack'} x{d.quantity ?? 1}
				</p>
				<p className="text-[10px] text-muted-foreground mt-0.5">
					{d.currencyType === 'dollar'
						? `${Number(d.totalCost ?? 0).toFixed(2)} Dollars`
							: `${(d.totalCost ?? 0).toLocaleString()} ${d.currencyType === 'shard' ? 'Soul Shards' : 'Realm Coins'}`}
				</p>
				<p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(ts)}</p>
			</div>
		</HistoryRow>
	)
}

function InventoryRow({ entry, index }: { entry: Record<string, any>; index: number }) {
		const d = entry.data ?? {}
		const ts = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now()
		const cardsCount = d.cardsCount ?? (Array.isArray(d.cards) ? d.cards.length : 0)
		const cardsAdded = d.cardsAdded ?? cardsCount
		const cardsFailed = d.cardsFailed ?? 0
		const cards = Array.isArray(d.cards) ? d.cards : []
		
		const rarityColors: Record<string, string> = {
			common: 'text-muted-foreground',
			uncommon: 'text-green-400',
			rare: 'text-blue-400',
			epic: 'text-purple-400',
			legendary: 'text-yellow-400',
			special: 'text-amber-400',
		}
		
		return (
			<HistoryRow index={index}>
				<div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
					<Gift size={18} className="text-primary" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-foreground truncate">Opened {d.packName || d.packId || 'Pack'}</p>
					<p className="text-[10px] text-muted-foreground">
						{timeAgo(ts)}
						{cardsFailed > 0 && (
							<span className="text-red-400 ml-1">({cardsFailed} failed)</span>
						)}
					</p>
					{cards.length > 0 && (
						<div className="mt-1.5 space-y-1">
							{cards.map((card: any, i: number) => {
								const rarityColor = card.failed 
									? 'text-red-400 line-through' 
									: (rarityColors[card.rarity?.toLowerCase()] ?? 'text-muted-foreground')
								return (
									<div key={i} className="flex items-center gap-2 text-[10px]">
										<span className={`font-medium ${rarityColor}`}>{card.name || card.cardId}</span>
										{card.failed ? (
											<span className="px-1 py-0.5 rounded bg-red-500/20 text-red-400 text-[8px] font-bold uppercase">
												Failed
											</span>
										) : (
											<>
												{card.previousCount !== undefined && card.currentCount !== undefined && (
													<span className="text-muted-foreground/70">
														({card.previousCount} → {card.currentCount})
													</span>
												)}
												{card.isNew && (
													<span className="px-1 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-bold uppercase">
														New
													</span>
												)}
											</>
										)}
									</div>
								)
							})}
						</div>
					)}
				</div>
			</HistoryRow>
		)
	}

function GuildRow({ entry, index }: { entry: Record<string, any>; index: number }) {
	const d = entry.data ?? {}
	const EntryIcon = GUILD_ICONS[(d.type ?? entry.eventType) as keyof typeof GUILD_ICONS] ?? Users
	const ts = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now()
	return (
		<HistoryRow index={index}>
			<div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
				<EntryIcon size={18} className="text-primary" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-bold text-foreground truncate">{d.action ?? 'Guild activity'}</p>
				<div className="flex items-center gap-2 mt-0.5">
					{d.member && (
						<>
							<span className="text-[10px] text-muted-foreground">{d.member}</span>
							<span className="text-[9px] text-muted-foreground/50">•</span>
						</>
					)}
					<span className="text-[10px] text-muted-foreground">{timeAgo(ts)}</span>
				</div>
			</div>
		</HistoryRow>
	)
}

const ROW_RENDERERS = {
	mission: MissionRow,
	market: MarketRow,
	wallet: WalletRow,
	guild: GuildRow,
	packs: PacksRow,
	inventory: InventoryRow,
}

// ── Standalone History Modal ──────────────────────────────────────────────────

/**
 * When called with no children/title props → standalone self-contained modal.
 * When called with children/title/icon → legacy wrapper (packs, inventory pages).
 */
export const HistoryModal = ({
	open,
	onOpenChange,
	children,
	title,
	...rest
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	children?: React.ReactNode
	title?: string
	[key: string]: unknown
}) => {
	if (title !== undefined || children !== undefined) {
		return (
			<LegacyHistoryModal open={open} onOpenChange={onOpenChange} title={title} {...rest}>
				{children}
			</LegacyHistoryModal>
		)
	}
	return <StandaloneHistoryModal open={open} onOpenChange={onOpenChange} />
}

function StandaloneHistoryModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
	const { getUserHistory } = useHistoryActions()
	const isMobile = useIsMobile()
	const [eventType, setEventType] = useState('mission')
	const [subFilter, setSubFilter] = useState('all')
	const [history, setHistory] = useState<Record<string, any>[]>([])
	const [isLoading, setIsLoading] = useState(false)

	const fetchHistory = useCallback(
		(type: string) => {
			let cancelled = false
			setIsLoading(true)
			setHistory([])
			getUserHistory({ eventType: type, limit: 50 })
				.then((data: any) => {
					if (!cancelled) setHistory(Array.isArray(data?.history) ? data.history : [])
				})
				.catch(() => {
					if (!cancelled) setHistory([])
				})
				.finally(() => {
					if (!cancelled) setIsLoading(false)
				})
			return () => {
				cancelled = true
			}
		},
		[getUserHistory],
	)

	useEffect(() => {
		if (!open) return
		return fetchHistory(eventType)
	}, [open, eventType]) // eslint-disable-line react-hooks/exhaustive-deps

	const handleEventTypeChange = (val: string) => {
		setEventType(val)
		setSubFilter('all')
	}

	const subOptions = SUB_FILTER_OPTIONS[eventType as keyof typeof SUB_FILTER_OPTIONS] ?? []
	const showSubFilter = subOptions.length > 1

	const filtered =
		subFilter === 'all'
			? history
			: eventType === 'mission'
				? history.filter((e) => (e.type ?? e.data?.type) === subFilter)
				: eventType === 'market'
					? history.filter((e) => (e.listingType ?? e.data?.listingType) === subFilter)
					: eventType === 'wallet'
						? history.filter((e) => (e.data?.action ?? e.eventKey?.split('.')?.at(-1)) === subFilter)
						: history

	const RowComponent = ROW_RENDERERS[eventType as keyof typeof ROW_RENDERERS]
	const typeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label ?? 'item'

	// Shared filter/search row — identical markup in both drawer and dialog shells
	const filterRow = (
		<div className="flex gap-2">
			<GameSelect
				value={eventType}
				onValueChange={handleEventTypeChange}
				options={EVENT_TYPE_OPTIONS}
				className="flex-1"
			/>
			{showSubFilter && (
				<GameSelect value={subFilter} onValueChange={setSubFilter} options={subOptions} className="flex-1" />
			)}
		</div>
	)

	const scrollBody = (
		<div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 size={24} className="text-muted-foreground/50 animate-spin" />
				</div>
			) : filtered.length === 0 ? (
				<div className="text-center py-12">
					<Clock size={32} className="mx-auto text-muted-foreground/30 mb-2" />
					<p className="text-sm text-muted-foreground">No activity found</p>
				</div>
			) : (
				filtered.map((entry, i) => <RowComponent key={entry._id ?? i} entry={entry} index={i} />)
			)}
		</div>
	)

	const countRow = (
		<div className="px-5 py-3">
			<span className="text-[10px] text-muted-foreground">
				{filtered.length} {typeLabel}
				{filtered.length !== 1 ? 's' : ''}
			</span>
		</div>
	)

	// ── Mobile: bottom sheet (vaul drawer) ─────────────────────────────────────
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange}>
				<DrawerContent className="max-h-[90vh] border-border p-0 gap-0 flex flex-col">
					<DrawerHeader className="px-5 pt-2 pb-3 gap-3 text-left">
						<DrawerTitle className="flex items-center gap-2 text-base">
							<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
								<Clock size={16} className="text-primary" />
							</div>
							History
						</DrawerTitle>
						<DrawerDescription className="text-xs">Browse your recent activity</DrawerDescription>
						{filterRow}
					</DrawerHeader>
					<div className="h-px bg-border" />
					{scrollBody}
					<div className="h-px bg-border" />
					{countRow}
				</DrawerContent>
			</Drawer>
		)
	}

	// ── Desktop: centered dialog ───────────────────────────────────────────────
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-border">
				<div className="px-5 pt-5 pb-3 space-y-3">
					<DialogHeader className="space-y-1">
						<DialogTitle className="flex items-center gap-2 text-base">
							<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
								<Clock size={16} className="text-primary" />
							</div>
							History
						</DialogTitle>
						<DialogDescription className="text-xs">Browse your recent activity</DialogDescription>
					</DialogHeader>
					{filterRow}
				</div>

				<div className="h-px bg-border" />
				{scrollBody}
				<div className="h-px bg-border" />
				{countRow}
			</DialogContent>
		</Dialog>
	)
}

// ── Legacy wrapper (packs / inventory pages pass children + count) ─────────────

function LegacyHistoryModal({
	open,
	onOpenChange,
	title,
	description,
	icon: Icon,
	eventType,
	filter,
	count,
	countLabel = 'item',
	emptyMessage = 'Nothing found',
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	title?: string
	description?: string
	icon?: React.ComponentType<{ size?: number; className?: string }>
	eventType?: string
	filter?: { value: string; onValueChange: (v: string) => void; options: { value: string; label: string }[] }
	count?: number
	countLabel?: string
	emptyMessage?: string
	children?: React.ReactNode | ((history: Record<string, any>[], isLoading: boolean) => React.ReactNode)
}) {
	const { getUserHistory } = useHistoryActions()
	const isMobile = useIsMobile()
	const [history, setHistory] = useState<Record<string, any>[]>([])
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if (!open || !eventType) return
		let cancelled = false
		setIsLoading(true)
		setHistory([])
		getUserHistory({ eventType, limit: 50 })
			.then((data: any) => {
				if (!cancelled) setHistory(Array.isArray(data?.history) ? data.history : [])
			})
			.catch(() => {
				if (!cancelled) setHistory([])
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [open, eventType]) // eslint-disable-line react-hooks/exhaustive-deps

	const displayCount = eventType != null ? history.length : (count ?? 0)
	const content = typeof children === 'function' ? children(history, isLoading) : children

	const filterRow = filter && (
		<GameSelect
			value={filter.value}
			onValueChange={filter.onValueChange}
			options={filter.options}
			className="w-full"
		/>
	)

	const scrollBody = (
		<div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 size={24} className="text-muted-foreground/50 animate-spin" />
				</div>
			) : displayCount === 0 ? (
				<div className="text-center py-12">
					<Clock size={32} className="mx-auto text-muted-foreground/30 mb-2" />
					<p className="text-sm text-muted-foreground">{emptyMessage}</p>
				</div>
			) : (
				content
			)}
		</div>
	)

	const countRow = (
		<div className="px-5 py-3">
			<span className="text-[10px] text-muted-foreground">
				{displayCount} {countLabel}
				{displayCount !== 1 ? 's' : ''}
			</span>
		</div>
	)

	// ── Mobile: bottom sheet ───────────────────────────────────────────────────
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange}>
				<DrawerContent className="max-h-[90vh] border-border p-0 gap-0 flex flex-col">
					<DrawerHeader className="px-5 pt-2 pb-3 gap-3 text-left">
						<DrawerTitle className="flex items-center gap-2 text-base">
							<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
								{Icon && <Icon size={16} className="text-primary" />}
							</div>
							{title}
						</DrawerTitle>
						{description && <DrawerDescription className="text-xs">{description}</DrawerDescription>}
						{filterRow}
					</DrawerHeader>
					<div className="h-px bg-border" />
					{scrollBody}
					<div className="h-px bg-border" />
					{countRow}
				</DrawerContent>
			</Drawer>
		)
	}

	// ── Desktop: centered dialog ───────────────────────────────────────────────
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-border">
				<div className="px-5 pt-5 pb-3 space-y-3">
					<DialogHeader className="space-y-1">
						<DialogTitle className="flex items-center gap-2 text-base">
							<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
								{Icon && <Icon size={16} className="text-primary" />}
							</div>
							{title}
						</DialogTitle>
						{description && <DialogDescription className="text-xs">{description}</DialogDescription>}
					</DialogHeader>
					{filterRow}
				</div>
				<div className="h-px bg-border" />
				{scrollBody}
				<div className="h-px bg-border" />
				{countRow}
			</DialogContent>
		</Dialog>
	)
}

/** Reusable animated row */
export const HistoryRow = ({
	index,
	children,
	className,
}: {
	index: number
	children: React.ReactNode
	className?: string
}) => (
	<motion.div
		initial={{ opacity: 0, y: 6 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ delay: index * 0.025 }}
		className={`rounded-xl border border-border bg-card/60 p-3.5 flex items-center gap-3 hover:bg-card transition-colors ${className ?? ''}`}
	>
		{children}
	</motion.div>
)

export default HistoryModal
