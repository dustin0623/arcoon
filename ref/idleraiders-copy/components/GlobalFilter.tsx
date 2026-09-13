import { Search, X, SlidersHorizontal } from 'lucide-react'
import { GameSelect } from '@/components/ui/game-select'
import React, { useState } from 'react'

// ──────────────────────────────────────────────────────────
// GLOBAL FILTER OPTIONS
// ──────────────────────────────────────────────────────────

const filterOptions = {
	rarity: [
		{ value: 'all', label: 'All Rarities' },
		{ value: 'common', label: 'Common' },
		{ value: 'uncommon', label: 'Uncommon' },
		{ value: 'rare', label: 'Rare' },
		{ value: 'epic', label: 'Epic' },
		{ value: 'legendary', label: 'Legendary' },
		{ value: 'special', label: 'Special' },
	],
	type: [
		{ value: 'all', label: 'All Types' },
		{ value: 'hero', label: 'Hero' },
		{ value: 'equipment', label: 'Equipment' },
		{ value: 'transport', label: 'Transport' },
		{ value: 'mount', label: 'Mount' },
		{ value: 'artifact', label: 'Artifact' },
		{ value: 'booster', label: 'Booster' },
	],

	sort: [
		{ value: 'newest', label: 'Newest' },
		{ value: 'price-asc', label: 'Price ↑' },
		{ value: 'price-desc', label: 'Price ↓' },
		{ value: 'raidPower', label: 'Raid Power' },
	],
	materialType: [
		{ value: 'all', label: 'All Items' },
		{ value: 'core', label: 'Core Materials' },
		{ value: 'component', label: 'Components' },
		{ value: 'catalyst', label: 'Catalysts' },
		{ value: 'potion', label: 'Potions' },
		{ value: 'pack', label: 'Packs' },
	],
	missionType: [
		{ value: 'all', label: 'All Missions' },
		{ value: 'story', label: 'Story' },
		{ value: 'daily', label: 'Daily' },
		{ value: 'raid', label: 'Raid' },
	],
	guildRole: [
		{ value: 'all', label: 'All Roles' },
		{ value: 'leader', label: 'Leader' },
		{ value: 'officer', label: 'Officer' },
		{ value: 'member', label: 'Member' },
	],
	transactionType: [
		{ value: 'all', label: 'All Transactions' },
		{ value: 'earn', label: 'Earnings' },
		{ value: 'spend', label: 'Spending' },
		{ value: 'trade', label: 'Trades' },
	],
}

// ──────────────────────────────────────────────────────────
// GLOBAL FILTER COMPONENT
// ──────────────────────────────────────────────────────────

const GlobalFilter = ({
	filters,
	onChange,
	layout = 'grid',
	config = [],
	searchPlaceholder = 'Search...',
	button,
	activeFiltersCount = 0,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
	layout?: string
	config?: Array<{ key: string; options?: Array<{ value: string; label: string }>; optionsKey?: string }>
	searchPlaceholder?: string
	button?: React.ReactNode
	activeFiltersCount?: number
}) => {
	const [showConfig, setShowConfig] = useState(true)

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange({ ...filters, search: e.target.value })
	}

	const handleClearSearch = () => {
		onChange({ ...filters, search: '' })
	}

	const handleFilterChange = (key: string, value: string) => {
		onChange({ ...filters, [key]: value })
	}

	const hasConfigOptions = config.length > 0

	return (
		<div className="space-y-4">
			{/* Search & Filter Toggle Row */}
			<div className="flex items-center gap-3">
				<div className="flex-1 flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 px-4 py-3">
					<Search size={16} className="text-muted-foreground shrink-0" />
					<input
						type="text"
						placeholder={searchPlaceholder}
						value={filters.search || ''}
						onChange={handleSearchChange}
						className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
					/>
					{filters.search && (
						<button
							onClick={handleClearSearch}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<X size={16} />
						</button>
					)}
				</div>
				{hasConfigOptions && (
					<button
						onClick={() => setShowConfig(!showConfig)}
						className={`relative shrink-0 flex items-center justify-center rounded-lg border transition-all ${
							showConfig
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary/60'
						}`}
						style={{ padding: '10px 14px' }}
					>
						<SlidersHorizontal size={18} />
						{activeFiltersCount > 0 && (
							<span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
								{activeFiltersCount}
							</span>
						)}
					</button>
				)}
			</div>

			{/* Filter Selects & Button Row */}
			{showConfig && hasConfigOptions && (
				<div className={layout === 'vertical' ? 'space-y-3' : `flex flex-wrap items-center gap-3`}>
					<div className={layout === 'vertical' ? 'space-y-3' : `flex flex-wrap items-center gap-3 flex-1`}>
						{config.map((filterConfig) => (
							<GameSelect
								key={filterConfig.key}
								value={filters[filterConfig.key] || 'all'}
								onValueChange={(v: string) => handleFilterChange(filterConfig.key, v)}
								options={
									filterConfig.options ||
									filterOptions[filterConfig.optionsKey as keyof typeof filterOptions]
								}
							/>
						))}
					</div>
					{button && button}
				</div>
			)}
		</div>
	)
}

// ──────────────────────────────────────────────────────────
// PRESET CONFIGURATIONS
// ──────────────────────────────────────────────────────────

export const InventoryCardsFilter = ({
	filters,
	onChange,
	button = null,
	activeFiltersCount = 0,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
	button?: React.ReactNode
	activeFiltersCount?: number
}) => (
	<GlobalFilter
		filters={filters}
		onChange={onChange}
		searchPlaceholder="Search cards..."
		button={button}
		activeFiltersCount={activeFiltersCount}
		config={[
			{ key: 'rarity', optionsKey: 'rarity' },
			{ key: 'type', optionsKey: 'type' },
		]}
	/>
)

export const InventoryMaterialsFilter = ({
	filters,
	onChange,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
}) => (
	<GlobalFilter
		filters={filters}
		onChange={onChange}
		searchPlaceholder="Search items..."
		config={[{ key: 'materialType', optionsKey: 'materialType' }]}
	/>
)

export const InventoryLandsFilter = ({
	filters,
	onChange,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
}) => (
	<GlobalFilter
		filters={filters}
		onChange={onChange}
		searchPlaceholder="Search lands..."
		config={[{ key: 'rarity', optionsKey: 'rarity' }]}
	/>
)

export const PacksPoolFilter = ({
	filters,
	onChange,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
}) => (
	<GlobalFilter
		filters={filters}
		onChange={onChange}
		layout="vertical"
		searchPlaceholder="Search pack contents..."
		config={[{ key: 'poolFilter', optionsKey: 'rarity' }]}
	/>
)

export const MissionHistoryFilter = ({
	filters,
	onChange,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
}) => (
	<GlobalFilter
		filters={filters}
		onChange={onChange}
		searchPlaceholder="Search missions..."
		config={[{ key: 'type', optionsKey: 'missionType' }]}
	/>
)

export const GuildMembersFilter = ({
	filters,
	onChange,
	button,
	activeFiltersCount = 0,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
	button?: React.ReactNode
	activeFiltersCount?: number
}) => (
	<GlobalFilter
		filters={filters}
		onChange={onChange}
		searchPlaceholder="Search members..."
		button={button}
		activeFiltersCount={activeFiltersCount}
		config={[{ key: 'role', optionsKey: 'guildRole' }]}
	/>
)

export const GuildWorkshopFilter = ({
	filters,
	onChange,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
}) => (
	<GlobalFilter
		filters={filters}
		onChange={onChange}
		searchPlaceholder="Search recipes..."
		config={[{ key: 'type', optionsKey: 'type' }]}
	/>
)

export const WalletTransactionFilter = ({
	filters,
	onChange,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
}) => (
	<GlobalFilter
		filters={filters}
		onChange={onChange}
		searchPlaceholder="Search transactions..."
		config={[{ key: 'transactionType', optionsKey: 'transactionType' }]}
	/>
)

export const WorkshopCraftFilter = ({
	filters,
	onChange,
}: {
	filters: Record<string, string | undefined>
	onChange: (filters: any) => void
}) => (
	<GlobalFilter
		filters={filters}
		onChange={onChange}
		searchPlaceholder="Search recipes..."
		config={[
			{ key: 'type', optionsKey: 'type' },
			{ key: 'rarity', optionsKey: 'rarity' },
		]}
	/>
)

export default GlobalFilter
