'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Coins, TrendingUp, Lock, Check, ChevronRight, Loader2, Shield } from 'lucide-react'
import { formatNumber } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GuildTabLoader } from '@/components/game/guild/GuildTabLoader'
import type { IGuildPerkBranch, IGuildPerkTier } from '@/public/data/progression/progression'

interface UnlockedPerk {
  perkId: string
  branch: string
  tier: number
}

interface PerksData {
  availablePoints: number
  totalPointsSpent: number
  unlockedPerks: UnlockedPerk[]
  branches: IGuildPerkBranch[]
}

const BRANCH_ICONS: Record<string, React.ReactNode> = {
  combat: <Swords size={20} />,
  economy: <Coins size={20} />,
  progression: <TrendingUp size={20} />,
  war: <Shield size={20} />,
}

const BRANCH_COLORS: Record<string, { gradient: string; border: string; bg: string }> = {
  combat: {
    gradient: 'from-red-500/20 to-red-600/5',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
  },
  economy: {
    gradient: 'from-yellow-500/20 to-yellow-600/5',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
  },
  progression: {
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
  },
  war: {
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
}

export const PerksTab = ({
  guildData,
  actions,
  userRole,
}: {
  guildData: Record<string, unknown> | null
  actions: {
    getGuildPerks: () => Promise<{ success?: boolean; perks?: PerksData }>
    unlockPerk: (branchId: string, tier: number) => Promise<{ success?: boolean; message?: string }>
  }
  userRole: 'leader' | 'officer' | 'member'
}) => {
  const [perksData, setPerksData] = useState<PerksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)

  const canManagePerks = userRole === 'leader' || userRole === 'officer'

  const fetchPerks = useCallback(async () => {
    setLoading(true)
    try {
      const result = await actions.getGuildPerks()
      if (result.success && result.perks) {
        setPerksData(result.perks)
        // Set initial branch only on first load
        if (result.perks.branches.length > 0) {
          setSelectedBranch(prev => prev ?? result.perks!.branches[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [actions])

  // Only fetch once on mount
  useEffect(() => {
    fetchPerks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUnlockPerk = async (branchId: string, tier: number) => {
    if (!canManagePerks || unlocking) return
    
    setUnlocking(`${branchId}-${tier}`)
    try {
      const result = await actions.unlockPerk(branchId, tier)
      if (result.success) {
        await fetchPerks()
      }
    } finally {
      setUnlocking(null)
    }
  }

  const isPerkUnlocked = (perkId: string): boolean => {
    return perksData?.unlockedPerks.some(p => p.perkId === perkId) ?? false
  }

  const canUnlockPerk = (branch: IGuildPerkBranch, tier: IGuildPerkTier): { canUnlock: boolean; reason?: string } => {
    if (!perksData) return { canUnlock: false, reason: 'Loading...' }
    if (isPerkUnlocked(tier.id)) return { canUnlock: false, reason: 'Already unlocked' }
    
    // Check prerequisite
    if (tier.tier > 1) {
      const prevTier = branch.tiers.find(t => t.tier === tier.tier - 1)
      if (prevTier && !isPerkUnlocked(prevTier.id)) {
        return { canUnlock: false, reason: `Unlock ${prevTier.name} first` }
      }
    }
    
    // Check points
    if (perksData.availablePoints < tier.pointsCost) {
      return { canUnlock: false, reason: `Need ${formatNumber(tier.pointsCost)} points` }
    }
    
    return { canUnlock: true }
  }

if (loading) {
  return <GuildTabLoader tab="perks" />
  }

  if (!perksData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load perks data</p>
        <Button variant="outline" size="sm" onClick={fetchPerks} className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  const selectedBranchData = perksData.branches.find(b => b.id === selectedBranch)

  return (
    <div className="space-y-4">
      {/* Points Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-primary/30 p-4"
        style={{ background: 'linear-gradient(160deg, hsl(230 15% 15%), hsl(230 12% 8%))' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Available Guild Points</p>
            <p className="font-display text-2xl font-bold text-primary">
              {formatNumber(perksData.availablePoints)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="font-display text-lg font-bold text-foreground">
              {formatNumber(perksData.totalPointsSpent)}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Earn points from leaderboard rankings. All perks affect Guild War only.
        </p>
      </motion.div>

      {/* Branch Selector */}
      <div className="flex gap-2">
        {perksData.branches.map((branch, i) => {
          const colors = BRANCH_COLORS[branch.id] ?? BRANCH_COLORS.combat
          const isSelected = selectedBranch === branch.id
          const unlockedCount = perksData.unlockedPerks.filter(p => p.branch === branch.id).length
          
          return (
            <motion.button
              key={branch.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => setSelectedBranch(branch.id)}
              className={cn(
                'flex-1 relative overflow-hidden rounded-xl border p-3 transition-all',
                isSelected ? `${colors.border} ${colors.bg}` : 'border-border hover:border-muted-foreground/50'
              )}
              style={{ background: isSelected ? undefined : 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
            >
              <div className={cn(
                'flex items-center justify-center gap-2',
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {BRANCH_ICONS[branch.id]}
                <span className="font-display text-sm font-bold">{branch.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {unlockedCount}/{branch.tiers.length} unlocked
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* Perk Tiers */}
      <AnimatePresence mode="wait">
        {selectedBranchData && (
          <motion.div
            key={selectedBranchData.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('p-2 rounded-lg', BRANCH_COLORS[selectedBranchData.id]?.bg)}>
                {BRANCH_ICONS[selectedBranchData.id]}
              </div>
              <div>
                <h3 className="font-display text-sm font-bold">{selectedBranchData.name}</h3>
                <p className="text-[10px] text-muted-foreground">{selectedBranchData.description}</p>
              </div>
            </div>

            {selectedBranchData.tiers.map((tier, i) => {
              const isUnlocked = isPerkUnlocked(tier.id)
              const unlockStatus = canUnlockPerk(selectedBranchData, tier)
              const isUnlocking = unlocking === `${selectedBranchData.id}-${tier.tier}`
              const colors = BRANCH_COLORS[selectedBranchData.id] ?? BRANCH_COLORS.combat
              
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={cn(
                    'relative overflow-hidden rounded-xl border p-4',
                    isUnlocked ? colors.border : 'border-border'
                  )}
                  style={{ background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' }}
                >
                  {isUnlocked && (
                    <div className={cn('absolute inset-0 bg-gradient-to-br opacity-30', colors.gradient)} />
                  )}
                  
                  <div className="relative flex items-start gap-3">
                    {/* Tier indicator */}
                    <div className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border',
                      isUnlocked ? `${colors.border} ${colors.bg}` : 'border-border bg-secondary/50'
                    )}>
                      {isUnlocked ? (
                        <Check className="w-5 h-5 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Tier {tier.tier}
                        </span>
                        {isUnlocked && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <h4 className="font-display text-sm font-bold mt-0.5">{tier.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                      
                      {!isUnlocked && (
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            Cost: <span className="text-primary font-bold">{formatNumber(tier.pointsCost)}</span> points
                          </span>
                          
                          {canManagePerks ? (
                            <Button
                              size="sm"
                              variant={unlockStatus.canUnlock ? 'default' : 'outline'}
                              disabled={!unlockStatus.canUnlock || isUnlocking}
                              onClick={() => handleUnlockPerk(selectedBranchData.id, tier.tier)}
                              className="h-7 text-xs"
                            >
                              {isUnlocking ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : unlockStatus.canUnlock ? (
                                <>
                                  Unlock <ChevronRight className="w-3 h-3 ml-1" />
                                </>
                              ) : (
                                unlockStatus.reason
                              )}
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Officers/Leaders only
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  )
}
