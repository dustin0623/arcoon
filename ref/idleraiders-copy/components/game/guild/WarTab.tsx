'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Swords, 
  Clock, 
  Trophy, 
  Loader2,
  Flag,
  Castle,
  Users,
  Heart,
  Info,
  Lock,
  Package,
  Shield,
  ShieldCheck,
  Target,
  Wrench,
  Flame,
  ChevronDown,
  ChevronUp,
  Zap,
  Crosshair,
  Crown,
  BarChart3,
  Hammer,
} from 'lucide-react'
import { formatNumber } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { GuildTabLoader } from '@/components/game/guild/GuildTabLoader'

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const WAR_MISSION_ENERGY_COST = 100
const WAR_MISSION_DURATION_BASE = 5 // minutes

// Outpost level requirements - matches guildwar.logic.ts
const OUTPOST_REQUIRED_LEVELS: Record<string, number> = {
  'outpost_1': 0,  // Available from start
  'outpost_2': 3,  // Unlock at level 3
  'outpost_3': 6,  // Unlock at level 6
  'outpost_4': 9,  // Unlock at level 9
  'outpost_5': 12, // Central Keep - unlock at level 12
}

// Outpost damage multipliers - matches guildwar.logic.ts
// Valor = floor(damage / 1000) * multiplier
const OUTPOST_DAMAGE_MULTIPLIERS: Record<string, number> = {
  'outpost_1': 1.0,
  'outpost_2': 1.5,
  'outpost_3': 2.0,
  'outpost_4': 2.5,
  'outpost_5': 3.0,
}

// Supplies generated per hour per outpost - matches guildwar.logic.ts SUPPLY_RATES
const OUTPOST_SUPPLY_RATES: Record<string, number> = {
  'outpost_1': 10,
  'outpost_2': 25,
  'outpost_3': 50,
  'outpost_4': 100,
  'outpost_5': 200,
}

// Supply stealing constants - matches guildwar.logic.ts
const SUPPLY_STEAL_BASE_CHANCE = 0.25 // 25% base chance to steal supplies
const SUPPLY_STEAL_DESTROY_BONUS = 0.25 // +25% chance if stronghold destroyed (total 50%)
const SUPPLY_STEAL_MAX_PERCENT = 0.05 // Steal up to 5% of target's supplies
const SUPPLY_STEAL_MIN_AMOUNT = 10 // Minimum steal amount

// Counter-attack constants - matches guildwar.logic.ts
const REINFORCE_COUNTER_CHANCE = 0.15 // 15% chance to counter-attack
const REINFORCE_COUNTER_DAMAGE_PERCENT = 0.5 // Counter deals 50% of original damage back

/** Returns ms until the next top-of-hour supply drop */
function msUntilNextSupplyDrop(): number {
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setMinutes(0, 0, 0)
  nextHour.setHours(nextHour.getHours() + 1)
  return nextHour.getTime() - now.getTime()
}

/** Format milliseconds as "Xm Ys" countdown */
function formatSupplyCountdown(ms: number): string {
  if (ms <= 0) return '0m 0s'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

// Hours after destruction before a stronghold auto-revives.
// Must stay in sync with STRONGHOLD_AUTO_REVIVE_HOURS in guildwar.logic.ts.
const STRONGHOLD_AUTO_REVIVE_HOURS = 24

/**
 * Format a stronghold revival countdown as "Xh Ym" (or "Xm" under 1h,
 * "Ready" at or past revival time).
 */
function formatRevivalCountdown(destroyedAt: string | undefined): string {
  if (!destroyedAt) return 'Ready'
  const revivalMs = new Date(destroyedAt).getTime() + STRONGHOLD_AUTO_REVIVE_HOURS * 60 * 60 * 1000
  const remaining = revivalMs - Date.now()
  if (remaining <= 0) return 'Ready'
  const totalMinutes = Math.floor(remaining / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

// Outpost theme configurations - using background images with overlays
const OUTPOST_THEMES: Record<string, {
  bgImage: string
  overlay: string
  iconBg: string
  iconColor: string
  borderColor: string
}> = {
  'outpost_1': {
    bgImage: '/assets/war/outpost_1.jpg',
    overlay: 'bg-black/70',
    iconBg: 'bg-slate-500/20 border-slate-500/30',
    iconColor: 'text-slate-400',
    borderColor: 'border-border',
  },
  'outpost_2': {
    bgImage: '/assets/war/outpost_2.jpg',
    overlay: 'bg-black/70',
    iconBg: 'bg-red-500/20 border-red-500/30',
    iconColor: 'text-red-400',
    borderColor: 'border-border',
  },
  'outpost_3': {
    bgImage: '/assets/war/outpost_3.jpg',
    overlay: 'bg-black/70',
    iconBg: 'bg-amber-500/20 border-amber-500/30',
    iconColor: 'text-amber-400',
    borderColor: 'border-border',
  },
  'outpost_4': {
    bgImage: '/assets/war/outpost_4.jpg',
    overlay: 'bg-black/70',
    iconBg: 'bg-indigo-500/20 border-indigo-500/30',
    iconColor: 'text-indigo-400',
    borderColor: 'border-border',
  },
  'outpost_5': {
    bgImage: '/assets/war/outpost_5.jpg',
    overlay: 'bg-black/70',
    iconBg: 'bg-primary/20 border-primary/30',
    iconColor: 'text-primary',
    borderColor: 'border-border',
  },
}

// Default theme for unknown outposts
const DEFAULT_THEME = {
  bgImage: '/assets/war/outpost_1.jpg',
  overlay: 'bg-black/70',
  iconBg: 'bg-slate-500/20 border-slate-500/30',
  iconColor: 'text-slate-400',
  borderColor: 'border-border',
}

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface WarOutpost {
  outpostId: string
  name: string
  controlledBy?: string
  controlledByName?: string
  capturedAt?: string
  garrison: number // Current HP (0 to maxGarrison)
  maxGarrison: number // Max HP varies by outpost tier
  // Points calculated from damage dealt with multiplier
}

interface WarStronghold {
  guildId: string
  guildName: string
  maxHp: number
  currentHp: number
  isDestroyed: boolean
  destroyedAt?: string
}

interface WarBuff {
  type: 'warCry' | 'reinforce' | 'rally' | 'shieldWall'
  activatedAt: string
  expiresAt: string
}

interface MemberContribution {
  playerId: string
  username: string
  damageDealt: number
  missionsCompleted: number
  outpostsCaptured: number
  strongholdsDestroyed: number
  valorEarned: number
}

interface GuildWarEntry {
  guildId: string
  guildName: string
  valor: number
  outpostsCaptured: number
  strongholdsDestroyed: number
  totalDamageDealt: number
  // War Economy
  damageReceived: number
  warSupplies: number
  suppliesGenerated: number
  suppliesSpent: number
  attacksSurvived: number
  strongholdDefenses: number
  activeBuffs: WarBuff[]
  memberContributions?: MemberContribution[]
}

interface GuildWarOverview {
  season: {
    weekNumber: number
    weekStart: string
    weekEnd: string
    status: 'active' | 'finalized'
  }
  outposts: WarOutpost[]
  strongholds: WarStronghold[]
  leaderboard: (GuildWarEntry & { rank: number })[]
  guildEntry: GuildWarEntry | null
  guildStronghold: WarStronghold | null
}

type SupplyActionType = 'repairGarrison' | 'repairOutpost' | 'warCry' | 'reinforce' | 'rally' | 'shieldWall'

interface WarTabActions {
  getWarOverview: () => Promise<{ success?: boolean } & Partial<GuildWarOverview>>
  joinWar: () => Promise<{ success?: boolean; message?: string }>
  attackOutpost: (outpostId: string) => Promise<{ success?: boolean; message?: string; missionId?: string; duration?: number }>
  attackStronghold: (targetGuildId: string) => Promise<{ success?: boolean; message?: string; missionId?: string; duration?: number }>
  spendSupplies?: (action: SupplyActionType, targetOutpostId?: string) => Promise<{ success?: boolean; message?: string }>
  reviveStronghold?: () => Promise<{ success?: boolean; message?: string; newHp?: number; maxHp?: number; coinsRemaining?: number }>
  }

// Supply action definitions for the UI
const SUPPLY_ACTIONS: {
  action: SupplyActionType
  label: string
  description: string
  cost: number
  duration?: string
  buffType?: WarBuff['type']
}[] = [
  { action: 'warCry',        label: 'War Cry',      description: '+10% damage',       cost: 75,  duration: '1h',  buffType: 'warCry' },
  { action: 'reinforce',     label: 'Reinforce',    description: '15% counter-attack', cost: 100, duration: '2h',  buffType: 'reinforce' },
  { action: 'rally',         label: 'Rally',        description: 'Free attacks',      cost: 150, duration: '1h',  buffType: 'rally' },
  { action: 'shieldWall',    label: 'Shield Wall',  description: '-25% dmg received', cost: 200, duration: '2h',  buffType: 'shieldWall' },
  { action: 'repairGarrison', label: 'Repair SH', description: 'Restore 10% stronghold HP', cost: 50 },
]

// ═══════════════════════════════════════════��════���════════���═════════��═══���═══════
// Component
// ═══════════════════════════════════════════════════════════════════════════════

export const WarTab = ({
  guildData,
  actions,
  hasActiveMission,
  guildLevel = 1,
}: {
  guildData: Record<string, unknown> | null
  actions: WarTabActions
  hasActiveMission?: boolean
  guildLevel?: number
}) => {
  const [warData, setWarData] = useState<GuildWarOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [attacking, setAttacking] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'outposts' | 'strongholds' | 'leaderboard'>('outposts')
  const [supplyCountdown, setSupplyCountdown] = useState(() => msUntilNextSupplyDrop())
  const [spending, setSpending] = useState<SupplyActionType | null>(null)
  const [supplyError, setSupplyError] = useState<string | null>(null)
  const [showSupplyPanel, setShowSupplyPanel] = useState(false)
  const [reviving, setReviving] = useState(false)
  const [showContributions, setShowContributions] = useState(false)
  const isMobile = useIsMobile()

  // Calculate war mission duration with guild perks
  const warMissionDuration = useMemo(() => {
    const perks = (guildData as { perks?: Array<{ perkId: string; branch: string; tier: number }> })?.perks || []
    // Calculate warMissionDuration effect from perks
    let durationReduction = 0
    for (const perk of perks) {
      // War branch tier 3 gives -10% war mission duration
      if (perk.branch === 'war' && perk.tier >= 3) {
        durationReduction += 0.10 // -10%
      }
    }
    const multiplier = 1 - durationReduction
    return Math.max(1, Math.floor(WAR_MISSION_DURATION_BASE * multiplier))
  }, [guildData])

  // Tick the supply-drop countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSupplyCountdown(msUntilNextSupplyDrop())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchWar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await actions.getWarOverview()
      if (result.success === false) {
        setError(result.message || 'Failed to load war data')
        setWarData(null)
      } else if (result.season && result.outposts) {
        setWarData(result as GuildWarOverview)
      } else {
        setError('Invalid war data received')
      }
    } catch {
      setError('Failed to load war data')
    } finally {
      setLoading(false)
    }
  }, [actions])

  useEffect(() => {
    fetchWar()
  }, [fetchWar])

  const handleJoinWar = async () => {
    if (joining) return
    setJoining(true)
    try {
      const result = await actions.joinWar()
      if (result.success) {
        await fetchWar()
      }
    } finally {
      setJoining(false)
    }
  }

  const handleAttackOutpost = async (outpostId: string) => {
    if (attacking || hasActiveMission) return
    setAttacking(outpostId)
    try {
      const result = await actions.attackOutpost(outpostId)
      if (result.success) {
        // Mission started - refresh will happen via parent state
        await fetchWar()
      }
    } finally {
      setAttacking(null)
    }
  }

  const handleSpendSupplies = async (action: SupplyActionType, targetOutpostId?: string) => {
    if (spending || !actions.spendSupplies) return
    setSpending(action)
    setSupplyError(null)
    try {
      const result = await actions.spendSupplies(action, targetOutpostId)
      if (result.success) {
        await fetchWar()
      } else {
        setSupplyError(result.message || 'Failed to spend supplies')
      }
    } catch {
      setSupplyError('Failed to spend supplies')
    } finally {
      setSpending(null)
    }
  }

  const handleAttackStronghold = async (targetGuildId: string) => {
    if (attacking || hasActiveMission) return
    setAttacking(targetGuildId)
    try {
      const result = await actions.attackStronghold(targetGuildId)
      if (result.success) {
        // Mission started - refresh will happen via parent state
        await fetchWar()
      }
    } finally {
      setAttacking(null)
    }
  }

  const handleReviveStronghold = async () => {
    if (reviving || !actions.reviveStronghold) return
    setReviving(true)
    try {
      const result = await actions.reviveStronghold()
      if (result.success) {
        await fetchWar()
      }
    } finally {
      setReviving(false)
    }
  }

  const formatTimeRemaining = (endTime: string) => {
    const remaining = new Date(endTime).getTime() - Date.now()
    if (remaining <= 0) return 'Ending soon...'
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h ${minutes}m`
  }

  // Shorter format for buff countdowns (shows seconds when under 1 minute)
  const formatBuffCountdown = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now()
    if (remaining <= 0) return 'Expired'
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
    
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  const getOutpostTheme = (outpostId: string) => {
    return OUTPOST_THEMES[outpostId] || DEFAULT_THEME
  }

if (loading) {
  return <GuildTabLoader tab="war" />
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <Swords size={32} className="text-red-500" />
        </div>
        <h3 className="font-display text-lg font-bold text-red-500">Error Loading War</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchWar}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    )
  }

  // No guild
  if (!guildData) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-secondary/50 flex items-center justify-center">
          <Users size={32} className="text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-bold">Join a Guild</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          You need to be in a guild to participate in Guild Wars.
        </p>
      </div>
    )
  }

  // Guild not participating yet
  if (!warData?.guildEntry) {
    return (
      <div className="space-y-4">
        {/* Season Info */}
        {warData?.season && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary/30 p-4"
            style={{ background: 'linear-gradient(160deg, hsl(230 15% 15%), hsl(230 12% 8%))' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Swords size={18} className="text-primary" />
                <span className="font-display text-sm font-bold">War Season {warData.season.weekNumber}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatTimeRemaining(warData.season.weekEnd)} remaining
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Join War */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center py-8 space-y-3"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <Flag size={32} className="text-primary" />
          </div>
          <h3 className="font-display text-lg font-bold">Join the War!</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Your guild has not joined this week&apos;s war yet. Join now to capture outposts and earn rewards!
          </p>
          <Button
            onClick={handleJoinWar}
            disabled={joining}
            className="mt-4"
          >
            {joining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Joining...
              </>
            ) : (
              <>
                <Swords className="w-4 h-4 mr-2" />
                Join War
              </>
            )}
          </Button>
        </motion.div>
      </div>
    )
  }

  // Active war view
  const myGuildId = warData.guildEntry?.guildId
  const myOutposts = warData.outposts.filter(o => o.controlledBy === myGuildId)
  const enemyStrongholds = warData.strongholds.filter(s => s.guildId !== myGuildId && !s.isDestroyed)
  const rebuildingStrongholds = warData.strongholds.filter(s => s.guildId !== myGuildId && s.isDestroyed)
  
  // Total damage dealt by guild this war
  const totalDamage = warData.guildEntry?.totalDamageDealt ?? 0

  return (
    <div className="space-y-4">
      {/* Season Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl border border-primary/30 p-4 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, hsl(230 15% 15%), hsl(230 12% 8%))' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-primary" />
            <span className="font-display text-sm font-bold">War Season {warData.season.weekNumber}</span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground/50 hover:text-primary transition-colors">
                    <Info size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px] text-[10px] leading-relaxed bg-background text-foreground border border-border">
                  <p className="font-bold text-foreground mb-1">Guild War Mechanics</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>- Damage dealt = Valor (1000 dmg = 1 valor)</li>
                    <li>- Defenders earn 0.3x valor from damage received</li>
                    <li>- Higher tier outposts have better multipliers</li>
                    <li>- Capture outposts to generate supplies/hour</li>
                    <li>- Spend supplies on buffs and repairs</li>
                    <li>- Each attack costs {WAR_MISSION_ENERGY_COST} energy</li>
                  </ul>
<p className="font-bold text-amber-500 mt-2 mb-1">Supply Stealing (Strongholds)</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>- {Math.round(SUPPLY_STEAL_BASE_CHANCE * 100)}% chance per attack ({Math.round((SUPPLY_STEAL_BASE_CHANCE + SUPPLY_STEAL_DESTROY_BONUS) * 100)}% if destroyed)</li>
                    <li>- Steals {Math.round(SUPPLY_STEAL_MAX_PERCENT * 100)}% of target supplies (min {SUPPLY_STEAL_MIN_AMOUNT})</li>
                  </ul>
                  <p className="font-bold text-cyan-500 mt-2 mb-1">Reinforce Buff (Counter-Attack)</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>- {Math.round(REINFORCE_COUNTER_CHANCE * 100)}% chance to counter-attack when hit</li>
                    <li>- Deals {Math.round(REINFORCE_COUNTER_DAMAGE_PERCENT * 100)}% of received damage back</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatTimeRemaining(warData.season.weekEnd)} remaining
            </span>
          </div>
        </div>

        {/* Guild Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center mb-2">
          <div className="rounded-lg bg-secondary/50 p-2">
            <p className="font-display text-lg font-bold text-primary">{formatNumber(warData.guildEntry.valor)}</p>
            <p className="text-[10px] text-muted-foreground">Valor</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-2">
            <p className="font-display text-lg font-bold text-amber-500">{formatNumber(warData.guildEntry.warSupplies)}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Package size={10} /> Supplies
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-2">
            <p className="font-display text-lg font-bold text-emerald-500">{myOutposts.length}</p>
            <p className="text-[10px] text-muted-foreground">Outposts</p>
          </div>
        </div>
        
        {/* Secondary Stats Row */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="rounded-lg bg-secondary/30 p-1.5">
            <p className="font-display text-sm font-bold text-foreground">{formatNumber(totalDamage)}</p>
            <p className="text-[9px] text-muted-foreground">Dealt</p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-1.5">
            <p className="font-display text-sm font-bold text-cyan-500">{formatNumber(warData.guildEntry.damageReceived)}</p>
            <p className="text-[9px] text-muted-foreground flex items-center justify-center gap-0.5">
              <ShieldCheck size={9} /> Received
            </p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-1.5">
            <p className="font-display text-sm font-bold text-amber-500">{warData.guildEntry.outpostsCaptured}</p>
            <p className="text-[9px] text-muted-foreground">Captured</p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-1.5">
            <p className="font-display text-sm font-bold text-red-500">{warData.guildEntry.strongholdsDestroyed}</p>
            <p className="text-[9px] text-muted-foreground">Destroyed</p>
          </div>
        </div>
        
        {/* Supply Drop Countdown (only shown when holding outposts) */}
        {myOutposts.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
              <Package size={11} />
              <span className="font-semibold">
                +{myOutposts.reduce((sum, o) => sum + (OUTPOST_SUPPLY_RATES[o.outpostId] ?? 0), 0)} supplies/hr
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock size={10} />
              <span>Next drop in <span className="text-amber-400 font-semibold tabular-nums">{formatSupplyCountdown(supplyCountdown)}</span></span>
            </div>
          </div>
        )}

        {/* Active Buffs */}
        {warData.guildEntry.activeBuffs && warData.guildEntry.activeBuffs.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground mb-1">Active Buffs:</p>
            <div className="flex flex-wrap gap-1">
              {warData.guildEntry.activeBuffs.map((buff, i) => (
                <span 
                  key={i} 
                  className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium flex items-center gap-1"
                >
                  <span>
                    {buff.type === 'warCry' && '+10% Damage'}
                    {buff.type === 'reinforce' && '15% Counter'}
                    {buff.type === 'rally' && 'Free Attacks'}
                    {buff.type === 'shieldWall' && '-25% Dmg Taken'}
                  </span>
                  <span className="text-primary/70">({formatBuffCountdown(buff.expiresAt)})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Spend Supplies toggle */}
        {actions.spendSupplies && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <button
              onClick={() => { setShowSupplyPanel(p => !p); setSupplyError(null) }}
              className="flex w-full items-center justify-between text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Package size={12} />
                Spend Supplies
                <span className="font-normal text-muted-foreground">({warData.guildEntry.warSupplies} available)</span>
              </span>
              {showSupplyPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showSupplyPanel && (
              <div className="mt-2 space-y-1.5">
                {supplyError && (
                  <p className="text-[10px] text-red-400 bg-red-500/10 rounded px-2 py-1">{supplyError}</p>
                )}
                {/* Buff actions */}
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">Buffs</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SUPPLY_ACTIONS.filter(a => a.buffType).map(({ action, label, description, cost, duration }) => {
                    const isActive = warData.guildEntry!.activeBuffs?.some(b => b.type === action)
                    const canAfford = warData.guildEntry!.warSupplies >= cost
                    const isLoading = spending === action
                    return (
                      <button
                        key={action}
                        disabled={isActive || !canAfford || !!spending}
                        onClick={() => handleSpendSupplies(action)}
                        className={cn(
                          'relative flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-all',
                          isActive
                            ? 'border-primary/40 bg-primary/10 opacity-60 cursor-not-allowed'
                            : canAfford && !spending
                            ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 cursor-pointer'
                            : 'border-border/40 bg-secondary/20 opacity-40 cursor-not-allowed'
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                            <Flame size={10} className={isActive ? 'text-primary' : 'text-amber-400'} />
                            {label}
                          </span>
                          {isActive ? (
                            <span className="text-[9px] text-primary font-medium">Active</span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                              {isLoading ? <Loader2 size={9} className="animate-spin" /> : <Package size={9} />}
                              {cost}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground">{description} · {duration}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Repair actions */}
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mt-2">Repairs</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Repair Stronghold */}
                  {(() => {
                    const cost = 50
                    const canAfford = warData.guildEntry!.warSupplies >= cost
                    const isLoading = spending === 'repairGarrison'
                    const isDestroyed = warData.guildStronghold?.isDestroyed
                    const isFullHp = warData.guildStronghold 
                      ? warData.guildStronghold.currentHp >= warData.guildStronghold.maxHp 
                      : true
                    const isDisabled = isDestroyed || isFullHp || !canAfford || !!spending
                    return (
                      <button
                        disabled={isDisabled}
                        onClick={() => handleSpendSupplies('repairGarrison')}
                        className={cn(
                          'relative flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-all',
                          !isDisabled
                            ? 'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/50 cursor-pointer'
                            : 'border-border/40 bg-secondary/20 opacity-40 cursor-not-allowed'
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                            <Wrench size={10} className="text-cyan-400" />
                            Repair SH
                          </span>
                          {isFullHp ? (
                            <span className="text-[9px] text-emerald-400 font-medium">Full HP</span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                              {isLoading ? <Loader2 size={9} className="animate-spin" /> : <Package size={9} />}
                              {cost}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground">+10% stronghold HP</span>
                      </button>
                    )
                  })()}

                  {/* Repair Outpost (for each owned outpost) */}
                  {myOutposts.slice(0, 1).map((outpost) => {
                    const cost = 100
                    const canAfford = warData.guildEntry!.warSupplies >= cost
                    const isLoading = spending === 'repairOutpost'
                    const isFullHp = outpost.garrison >= outpost.maxGarrison
                    const isDisabled = isFullHp || !canAfford || !!spending
                    return (
                      <button
                        key={outpost.outpostId}
                        disabled={isDisabled}
                        onClick={() => handleSpendSupplies('repairOutpost', outpost.outpostId)}
                        className={cn(
                          'relative flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-all',
                          !isDisabled
                            ? 'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/50 cursor-pointer'
                            : 'border-border/40 bg-secondary/20 opacity-40 cursor-not-allowed'
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                            <Wrench size={10} className="text-cyan-400" />
                            Repair {outpost.name.split(' ')[0]}
                          </span>
                          {isFullHp ? (
                            <span className="text-[9px] text-emerald-400 font-medium">Full HP</span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                              {isLoading ? <Loader2 size={9} className="animate-spin" /> : <Package size={9} />}
                              {cost}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground">+10% outpost HP</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Your Stronghold */}
      {warData.guildStronghold && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'rounded-xl border p-3',
            warData.guildStronghold.isDestroyed 
              ? 'border-red-500/30 bg-red-500/5' 
              : 'border-primary/20'
          )}
          style={!warData.guildStronghold.isDestroyed ? { background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' } : undefined}
        >
          <div className="flex items-center gap-2 mb-2">
            <Castle size={14} className={warData.guildStronghold.isDestroyed ? 'text-red-500' : 'text-primary'} />
            <span className="text-xs font-bold">Your Stronghold</span>
            {warData.guildStronghold.isDestroyed && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
                Destroyed
              </span>
            )}
            <button
              onClick={() => setShowContributions(true)}
              className="ml-auto flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 size={10} />
              Contributions
            </button>
          </div>
          {!warData.guildStronghold.isDestroyed ? (
            <>
              <Progress 
                value={(warData.guildStronghold.currentHp / warData.guildStronghold.maxHp) * 100} 
                className="h-3 mb-1" 
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart size={10} className="text-red-400" />
                  {formatNumber(warData.guildStronghold.currentHp)} HP
                </span>
                <span>{formatNumber(warData.guildStronghold.maxHp)} Max</span>
              </div>
            </>
          ) : (
            /* Revive button for destroyed stronghold - only visible to leader */
            actions.reviveStronghold && (
              <div className="mt-2 space-y-2">
                <p className="text-[10px] text-muted-foreground">
                  Your stronghold has been destroyed. Revive it to rejoin the fight!
                </p>
                <button
                  onClick={handleReviveStronghold}
                  disabled={reviving}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                    reviving
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20'
                  )}
                >
                  {reviving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Reviving...
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                                    Revive Stronghold (2,500 REALMC)
                    </>
                  )}
                </button>
                <p className="text-[9px] text-muted-foreground text-center">
                                Cost is paid from your personal Realm Coins balance
                </p>
              </div>
            )
          )}
        </motion.div>
      )}

      {/* Tab Selector */}
      <div className="flex gap-2">
        {(['outposts', 'strongholds', 'leaderboard'] as const).map((tab) => (
          <Button
            key={tab}
            variant={selectedTab === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTab(tab)}
            className="flex-1 text-xs"
          >
            {tab === 'outposts' && <Flag size={12} className="mr-1" />}
            {tab === 'strongholds' && <Castle size={12} className="mr-1" />}
            {tab === 'leaderboard' && <Trophy size={12} className="mr-1" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Outposts Tab - Training Card Style */}
      {selectedTab === 'outposts' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {warData.outposts.map((outpost, idx) => {
            const isOurs = outpost.controlledBy === myGuildId
            const isNeutral = !outpost.controlledBy
            const theme = getOutpostTheme(outpost.outpostId)
            const isAttacking = attacking === outpost.outpostId
            const requiredLevel = OUTPOST_REQUIRED_LEVELS[outpost.outpostId] ?? 0
            const isLocked = guildLevel < requiredLevel
            
            return (
              <motion.div
                key={outpost.outpostId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={cn(
                  'relative min-h-[130px] md:min-h-[150px] overflow-hidden rounded-xl border',
                  isOurs ? 'border-primary/50 ring-1 ring-primary/20' : theme.borderColor
                )}
              >
                {/* Background image */}
                <img
                  src={theme.bgImage}
                  alt={outpost.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Overlay */}
                <div className={cn('absolute inset-0', theme.overlay)} />
                
                {/* Owned indicator stripe */}
                {isOurs && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                )}

                {/* Content */}
                <div className="relative flex h-full flex-col p-3 md:p-4">
                  {/* Top: icon + title + status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                        isOurs ? 'bg-primary/20 border-primary/30' : theme.iconBg
                      )}>
                        <Flag className={cn('h-5 w-5', isOurs ? 'text-primary' : theme.iconColor)} />
                      </div>
                      <div>
                        <p className="font-display text-sm md:text-base font-bold text-foreground drop-shadow-lg">
                          {outpost.name}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          {isLocked 
                            ? `Requires Guild Level ${requiredLevel}` 
                            : isNeutral ? 'Neutral - Unclaimed' 
                            : isOurs ? 'Controlled by your guild' 
                            : `Held by ${outpost.controlledByName}`}
                        </p>
                      </div>
                    </div>
                    {isLocked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-semibold flex items-center gap-1">
                        <Lock size={10} />
                        Lv.{requiredLevel}
                      </span>
                    ) : isOurs && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                        Yours
                      </span>
                    )}
                  </div>

                  {/* Bottom: stats + button */}
                  <div className="mt-auto pt-3 flex flex-col gap-2">
                    {/* Stats row */}
                    <div className={cn(
                      'grid gap-1 rounded-lg bg-background/40 px-2 py-1.5 text-[10px] md:text-xs',
                      !isNeutral ? 'grid-cols-5' : 'grid-cols-4'
                    )}>
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Time</span>
                        <span className="flex items-center gap-0.5 font-semibold text-foreground">
                          {warMissionDuration}m <Clock size={10} className="text-primary" />
                        </span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Energy</span>
                        <span className="flex items-center gap-0.5 font-semibold text-foreground">
                          {WAR_MISSION_ENERGY_COST} <Zap size={10} className="text-primary" />
                        </span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Multiplier</span>
                        <span className="font-semibold text-emerald-400">
                          {OUTPOST_DAMAGE_MULTIPLIERS[outpost.outpostId] ?? 1}x
                        </span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">HP</span>
                        <span className={cn(
                          'font-semibold',
                          isNeutral ? 'text-muted-foreground' : isOurs ? 'text-primary' : 'text-red-400'
                        )}>
                          {isNeutral ? `${(outpost.maxGarrison / 1000).toFixed(0)}K` : `${(outpost.garrison / 1000).toFixed(0)}K`}
                        </span>
                      </span>
                      {/* Supply rate — only visible when outpost is controlled */}
                      {!isNeutral && (
                        <span className="flex flex-col items-center gap-0.5">
                          <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Supply</span>
                          <span className="flex items-center gap-0.5 font-semibold text-amber-400">
                            +{OUTPOST_SUPPLY_RATES[outpost.outpostId] ?? 0}
                            <Package size={9} />
                          </span>
                        </span>
                      )}
                    </div>

                    {/* HP bar (only for controlled outposts) */}
                    {!isNeutral && (
                      <div className="w-full">
                        <Progress 
                          value={(outpost.garrison / outpost.maxGarrison) * 100} 
                          className={cn('h-1.5', !isOurs && '[&>div]:bg-red-500')}
                        />
                      </div>
                    )}

                    {/* Action row */}
                    <div className="flex items-center justify-between">
                      {/* Active Buffs Tooltip (for enemy-controlled outposts) */}
                      {(() => {
                        if (isNeutral || isOurs || isLocked) return <div />
                        const enemyEntry = warData.leaderboard.find(e => e.guildId === outpost.controlledBy)
                        const now = new Date()
                        const activeEnemyBuffs = enemyEntry?.activeBuffs?.filter(b => new Date(b.expiresAt) > now) ?? []
                        if (activeEnemyBuffs.length === 0) return <div />
                        return (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/50 cursor-help">
                                  <ShieldCheck size={14} className="text-cyan-400" />
                                  <span className="text-[11px] font-semibold text-foreground">{activeEnemyBuffs.length} Active</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[200px] bg-background border border-border p-2">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Enemy Buffs</p>
                                <div className="flex flex-col gap-1">
                                  {activeEnemyBuffs.map((buff, i) => (
                                    <div
                                      key={i}
                                      className={`text-[11px] px-2 py-1 rounded font-semibold flex items-center gap-1.5 ${
                                        buff.type === 'shieldWall' 
                                          ? 'bg-cyan-500/20 text-cyan-300' 
                                          : buff.type === 'reinforce'
                                          ? 'bg-purple-500/20 text-purple-300'
                                          : 'bg-yellow-500/20 text-yellow-300'
                                      }`}
                                    >
                                      {buff.type === 'shieldWall' && <><Shield size={11} /> -25% Dmg Taken</>}
                                      {buff.type === 'reinforce' && <><Swords size={11} /> 15% Counter</>}
                                      {buff.type === 'warCry' && <><Flame size={11} /> +10% Damage</>}
                                      {buff.type === 'rally' && <><Flag size={11} /> Free Attacks</>}
                                      <span className="text-[9px] text-muted-foreground ml-auto">{formatBuffCountdown(buff.expiresAt)}</span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })()}
                      {isLocked ? (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/30">
                          <Lock size={12} />
                          Guild Lv.{requiredLevel} Required
                        </span>
                      ) : !isOurs ? (
                        <button
                          onClick={() => handleAttackOutpost(outpost.outpostId)}
                          disabled={isAttacking || hasActiveMission}
                          className="fantasy-btn px-5 md:px-6 py-1.5 md:py-2 text-xs md:text-sm disabled:opacity-40 flex items-center"
                        >
                          {isAttacking ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : hasActiveMission ? (
                            'Busy'
                          ) : (
                            <>
                              <Crosshair size={14} className="mr-1.5" />
                              Attack
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-primary/70 flex items-center gap-1">
                          <Shield size={12} />
                          Defended
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Strongholds Tab */}
      {selectedTab === 'strongholds' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {enemyStrongholds.length === 0 && rebuildingStrongholds.length === 0 ? (
            <div className="text-center py-8">
              <Shield size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No enemy strongholds to attack</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Other guilds need to join the war first</p>
            </div>
          ) : (
            <>
              {enemyStrongholds.map((stronghold, idx) => {
              const hpPercent = (stronghold.currentHp / stronghold.maxHp) * 100
              const isAttacking = attacking === stronghold.guildId
              
              return (
                <motion.div
                  key={stronghold.guildId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="relative min-h-[130px] md:min-h-[150px] overflow-hidden rounded-xl border border-red-500/30"
                >
                  {/* Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-950/50 to-slate-900" />
                  <div className="absolute inset-0 bg-red-950/60" />

                  {/* Content */}
                  <div className="relative flex h-full flex-col p-3 md:p-4">
                    {/* Top: icon + title */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-red-500/20 border-red-500/30">
                        <Castle className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <p className="font-display text-sm md:text-base font-bold text-foreground drop-shadow-lg">
                          {stronghold.guildName}&apos;s Stronghold
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          Enemy stronghold - Destroy for bonus points
                        </p>
                        <p className="text-[10px] md:text-xs text-amber-500/80">
                          {Math.round(SUPPLY_STEAL_BASE_CHANCE * 100)}% chance to steal supplies ({Math.round((SUPPLY_STEAL_BASE_CHANCE + SUPPLY_STEAL_DESTROY_BONUS) * 100)}% if destroyed)
                        </p>
                      </div>
                    </div>

                    {/* Bottom: stats + button */}
                    <div className="mt-auto pt-3 flex flex-col gap-2">
                      {/* Stats row */}
                      {(() => {
                        const guildEntry = warData.leaderboard.find(e => e.guildId === stronghold.guildId)
                        const supplies = guildEntry?.warSupplies ?? 0
                        return (
                          <div className="grid grid-cols-5 gap-1 rounded-lg bg-background/40 px-2 py-1.5 text-[10px] md:text-xs">
                            <span className="flex flex-col items-center gap-0.5">
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Time</span>
                              <span className="flex items-center gap-0.5 font-semibold text-foreground">
                                {warMissionDuration}m <Clock size={10} className="text-primary" />
                              </span>
                            </span>
                            <span className="flex flex-col items-center gap-0.5">
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Energy</span>
                              <span className="flex items-center gap-0.5 font-semibold text-foreground">
                                {WAR_MISSION_ENERGY_COST} <Zap size={10} className="text-primary" />
                              </span>
                            </span>
                            <span className="flex flex-col items-center gap-0.5">
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Bonus</span>
                              <span className="font-semibold text-amber-400">+500</span>
                            </span>
                            <span className="flex flex-col items-center gap-0.5">
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">Supplies</span>
                              <span className="font-semibold text-amber-500">{formatNumber(supplies)}</span>
                            </span>
                            <span className="flex flex-col items-center gap-0.5">
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60">HP</span>
                              <span className="font-semibold text-red-400">{hpPercent.toFixed(0)}%</span>
                            </span>
                          </div>
                        )
                      })()}

                      {/* HP bar */}
                      <div className="w-full">
                        <Progress 
                          value={hpPercent}
                          className="h-2 [&>div]:bg-red-500"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                          <span>{formatNumber(stronghold.currentHp)} HP</span>
                          <span>{formatNumber(stronghold.maxHp)} Max</span>
                        </div>
                      </div>

                      {/* Action row */}
                      <div className="flex items-center justify-between">
                        {/* Active Buffs Tooltip */}
                        {(() => {
                          const enemyEntry = warData.leaderboard.find(e => e.guildId === stronghold.guildId)
                          const now = new Date()
                          const activeEnemyBuffs = enemyEntry?.activeBuffs?.filter(b => new Date(b.expiresAt) > now) ?? []
                          if (activeEnemyBuffs.length === 0) return <div />
                          return (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/50 cursor-help">
                                    <ShieldCheck size={14} className="text-cyan-400" />
                                    <span className="text-[11px] font-semibold text-foreground">{activeEnemyBuffs.length} Active</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px] bg-background border border-border p-2">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Enemy Buffs</p>
                                  <div className="flex flex-col gap-1">
                                    {activeEnemyBuffs.map((buff, i) => (
                                      <div
                                        key={i}
                                        className={`text-[11px] px-2 py-1 rounded font-semibold flex items-center gap-1.5 ${
                                          buff.type === 'shieldWall' 
                                            ? 'bg-cyan-500/20 text-cyan-300' 
                                            : buff.type === 'reinforce'
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'bg-yellow-500/20 text-yellow-300'
                                        }`}
                                      >
                                        {buff.type === 'shieldWall' && <><Shield size={11} /> -25% Dmg Taken</>}
                                        {buff.type === 'reinforce' && <><Swords size={11} /> 15% Counter</>}
                                        {buff.type === 'warCry' && <><Flame size={11} /> +10% Damage</>}
                                        {buff.type === 'rally' && <><Flag size={11} /> Free Attacks</>}
                                        <span className="text-[9px] text-muted-foreground ml-auto">{formatBuffCountdown(buff.expiresAt)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })()}
                        <button
                          onClick={() => handleAttackStronghold(stronghold.guildId)}
                          disabled={isAttacking || hasActiveMission}
                          className="fantasy-btn px-5 md:px-6 py-1.5 md:py-2 text-xs md:text-sm disabled:opacity-40 bg-red-600 hover:bg-red-500 flex items-center"
                        >
                          {isAttacking ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : hasActiveMission ? (
                            'Busy'
                          ) : (
                            <>
                              <Target size={14} className="mr-1.5" />
                              Attack
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

              {rebuildingStrongholds.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                    <Hammer size={10} />
                    Rebuilding Strongholds
                  </p>
                  <div className="space-y-3">
                    {rebuildingStrongholds.map((stronghold, idx) => {
                      const revivalLabel = formatRevivalCountdown(stronghold.destroyedAt)
                      return (
                        <motion.div
                          key={stronghold.guildId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className="relative min-h-[110px] md:min-h-[120px] overflow-hidden rounded-xl border border-border/40 opacity-60 grayscale"
                          aria-label={`${stronghold.guildName}'s stronghold destroyed, rebuilding in ${revivalLabel}`}
                        >
                          {/* Muted background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
                          <div className="absolute inset-0 bg-background/60" />

                          <div className="relative flex h-full flex-col p-3 md:p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/20 border-border/40">
                                <Castle className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-display text-sm md:text-base font-bold text-muted-foreground truncate">
                                    {stronghold.guildName}&apos;s Stronghold
                                  </p>
                                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 border border-border/40 px-1.5 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <Shield size={9} />
                                    Destroyed
                                  </span>
                                </div>
                                <p className="text-[10px] md:text-xs text-muted-foreground/70 mt-0.5">
                                  Cannot be attacked while rebuilding
                                </p>
                              </div>
                            </div>

                            <div className="mt-auto pt-3 flex flex-col gap-2">
                              <div className="flex items-center justify-between rounded-lg bg-background/40 border border-border/40 px-3 py-2">
                                <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground/80">
                                  <Hammer size={12} />
                                  Rebuilds in
                                </span>
                                <span className="flex items-center gap-1 text-xs md:text-sm font-semibold text-foreground/80">
                                  <Clock size={12} className="text-muted-foreground/60" />
                                  {revivalLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Leaderboard Tab */}
      {selectedTab === 'leaderboard' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {warData.leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Trophy size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No guilds on leaderboard yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Be the first to capture an outpost!</p>
            </div>
          ) : (
            warData.leaderboard.slice(0, 10).map((entry, idx) => {
              const isOurs = entry.guildId === myGuildId
              
              return (
                <motion.div
                  key={entry.guildId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    'rounded-xl border p-3 flex items-center gap-3',
                    isOurs ? 'border-primary/30 bg-primary/5' : 'border-border'
                  )}
                  style={!isOurs ? { background: 'linear-gradient(145deg, hsl(230 12% 14%), hsl(230 12% 10%))' } : undefined}
                >
                  {/* Rank */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold',
                    entry.rank === 1 ? 'bg-amber-500/20 text-amber-500' :
                    entry.rank === 2 ? 'bg-slate-400/20 text-slate-400' :
                    entry.rank === 3 ? 'bg-orange-600/20 text-orange-600' :
                    'bg-secondary text-muted-foreground'
                  )}>
                    {entry.rank <= 3 ? <Crown size={14} /> : entry.rank}
                  </div>

                  {/* Guild Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">
                      {entry.guildName}
                      {isOurs && <span className="text-primary ml-1">(You)</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.outpostsCaptured} captured | {entry.strongholdsDestroyed} destroyed
                    </p>
                  </div>

                  {/* Valor */}
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-primary">{formatNumber(entry.valor)}</p>
                    <p className="text-[10px] text-muted-foreground">valor</p>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      )}

      {/* Member Contributions Modal — Drawer on mobile, Dialog on desktop */}
      {(() => {
        const contributionsBody =
          warData?.guildEntry?.memberContributions && warData.guildEntry.memberContributions.length > 0 ? (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 text-[9px] uppercase tracking-wider text-muted-foreground px-2 py-1 border-b border-border/50">
                <div className="col-span-4">Member</div>
                <div className="col-span-2 text-right">Valor</div>
                <div className="col-span-2 text-right">Damage</div>
                <div className="col-span-2 text-right">Captures</div>
                <div className="col-span-2 text-right">Destroys</div>
              </div>
              {/* Sort by valorEarned descending */}
              {[...warData.guildEntry.memberContributions]
                .sort((a, b) => b.valorEarned - a.valorEarned)
                .map((member, idx) => (
                  <div
                    key={member.playerId}
                    className={cn(
                      'grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-lg',
                      idx % 2 === 0 ? 'bg-secondary/30' : 'bg-transparent',
                    )}
                  >
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium truncate">{member.username}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-xs font-bold text-primary">{formatNumber(member.valorEarned)}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-[10px] text-foreground">{formatNumber(member.damageDealt)}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-[10px] text-emerald-500">{member.outpostsCaptured}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-[10px] text-red-500">{member.strongholdsDestroyed}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No contributions yet</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Attack outposts and strongholds to earn valor!
              </p>
            </div>
          )

        if (isMobile) {
          return (
            <Drawer open={showContributions} onOpenChange={setShowContributions}>
              <DrawerContent className="border-border p-0 flex flex-col">
                <DrawerHeader className="text-left px-4 pt-2 pb-3">
                  <DrawerTitle className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary" />
                    Member Contributions
                  </DrawerTitle>
                  <DrawerDescription className="sr-only">
                    Ranked list of each member&apos;s valor, damage dealt, outposts captured, and strongholds
                    destroyed.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto px-4 pb-6">{contributionsBody}</div>
              </DrawerContent>
            </Drawer>
          )
        }

        return (
          <Dialog open={showContributions} onOpenChange={setShowContributions}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-primary" />
                  Member Contributions
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto -mx-6 px-6">{contributionsBody}</div>
            </DialogContent>
          </Dialog>
        )
      })()}
    </div>
  )
}
