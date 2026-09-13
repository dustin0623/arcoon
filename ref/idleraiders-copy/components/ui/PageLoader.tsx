'use client'

import { 
  Shield, 
  Package, 
  Globe, 
  Backpack, 
  Trophy, 
  Store, 
  User, 
  Repeat, 
  Dumbbell, 
  Wallet,
  Compass,
  Lock
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type PageType = 
  | 'guild' 
  | 'packs' 
  | 'world' 
  | 'inventory' 
  | 'leaderboard' 
  | 'marketplace' 
  | 'profile' 
  | 'trader' 
  | 'training' 
  | 'wallet'
  | 'explore'
  | 'crafting'
  | 'auth'
  | 'default'

interface PageLoaderProps {
  page?: PageType
  message?: string
}

const pageConfig: Record<PageType, { icon: LucideIcon; defaultMessage: string; color: string }> = {
  guild: { icon: Shield, defaultMessage: 'Loading guild data...', color: 'text-purple-400' },
  packs: { icon: Package, defaultMessage: 'Loading pack data...', color: 'text-amber-400' },
  world: { icon: Globe, defaultMessage: 'Loading world data...', color: 'text-emerald-400' },
  inventory: { icon: Backpack, defaultMessage: 'Loading inventory...', color: 'text-blue-400' },
  leaderboard: { icon: Trophy, defaultMessage: 'Loading leaderboard...', color: 'text-yellow-400' },
  marketplace: { icon: Store, defaultMessage: 'Loading marketplace...', color: 'text-orange-400' },
  profile: { icon: User, defaultMessage: 'Loading profile...', color: 'text-cyan-400' },
  trader: { icon: Repeat, defaultMessage: 'Loading trader...', color: 'text-rose-400' },
  training: { icon: Dumbbell, defaultMessage: 'Loading training...', color: 'text-red-400' },
  wallet: { icon: Wallet, defaultMessage: 'Loading wallet...', color: 'text-green-400' },
  explore: { icon: Compass, defaultMessage: 'Loading exploration...', color: 'text-teal-400' },
  crafting: { icon: Package, defaultMessage: 'Loading crafting...', color: 'text-indigo-400' },
  auth: { icon: Lock, defaultMessage: 'Verifying access...', color: 'text-primary' },
  default: { icon: Shield, defaultMessage: 'Loading...', color: 'text-primary' },
}

export function PageLoader({ page = 'default', message }: PageLoaderProps) {
  const config = pageConfig[page] ?? pageConfig.default
  const Icon = config.icon
  const displayMessage = message ?? config.defaultMessage

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <Icon className={`absolute inset-0 m-auto ${config.color}`} size={24} />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{displayMessage}</p>
    </div>
  )
}
