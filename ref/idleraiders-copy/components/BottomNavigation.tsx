'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Globe, Store, Package, Compass } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { path: '/game/packs', label: 'Packs', icon: Package },
  { path: '/game/world', label: 'World', icon: Globe },
  { path: '/game/inventory', label: 'Inventory', icon: Store },
  { path: '/game/explore', label: 'Explore', icon: Compass },
]

const BottomNavigation = () => {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.path ||
            (tab.path === '/game/inventory' && (pathname === '/game/cards' || pathname === '/game/bag')) ||
            (tab.path === '/game/explore' && (pathname === '/game/guild' || pathname === '/game/leaderboard' || pathname === '/game/crafting' || pathname === '/game/marketplace' || pathname === '/game/trader'))
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 h-0.5 w-8 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon size={20} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
              <span
                className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
