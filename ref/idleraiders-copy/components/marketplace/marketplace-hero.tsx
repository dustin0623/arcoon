'use client'

import { motion } from 'framer-motion'
import { Search, Tag, Layers, ShoppingCart, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export type MarketplacePage = 'marketplace' | 'sell' | 'listings'

interface Tab {
  key: string
  label: string
  icon: React.ReactNode
  count: number
}

interface MarketplaceHeroProps {
  currentPage: MarketplacePage
  title: string
  description: string
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  isAuthenticated?: boolean
}

const pageConfig = {
  marketplace: {
    buttons: [
      { page: 'sell' as const, label: 'Sell', icon: Tag, primary: true },
      { page: 'listings' as const, label: 'Listings', icon: Layers, primary: false },
    ],
  },
  sell: {
    buttons: [
      { page: 'marketplace' as const, label: 'Market', icon: ShoppingCart, primary: true },
      { page: 'listings' as const, label: 'Listings', icon: Layers, primary: false },
    ],
  },
  listings: {
    buttons: [
      { page: 'marketplace' as const, label: 'Market', icon: ShoppingCart, primary: true },
      { page: 'sell' as const, label: 'Sell', icon: Tag, primary: false },
    ],
  },
}

const pageRoutes: Record<MarketplacePage, string> = {
  marketplace: '/marketplace',
  sell: '/marketplace/sell',
  listings: '/marketplace/listings',
}

export function MarketplaceHero({
  currentPage,
  title,
  description,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  tabs,
  activeTab,
  onTabChange,
  isAuthenticated = true,
}: MarketplaceHeroProps) {
  const router = useRouter()
  const buttons = pageConfig[currentPage].buttons

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-secondary/40 to-background px-4 py-5 md:py-6"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header with title and navigation buttons */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-display text-xl md:text-2xl font-bold text-foreground"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-0.5 text-xs md:text-sm text-muted-foreground"
            >
              {description}
            </motion.p>
          </div>
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2"
            >
              {buttons.map((btn) => {
                const Icon = btn.icon
                return (
                  <Button
                    key={btn.page}
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(pageRoutes[btn.page])}
                    className={
                      btn.primary
                        ? 'gap-1.5 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary'
                        : 'gap-1.5 border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }
                  >
                    <Icon size={14} />
                    <span>{btn.label}</span>
                  </Button>
                )
              })}
            </motion.div>
          )}
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 max-w-xl"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-secondary/50 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        </motion.div>

        {/* Tab Switch */}
        {tabs && tabs.length > 0 && onTabChange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-4 flex gap-2"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className="ml-0.5 text-[10px] opacity-70">({tab.count})</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
