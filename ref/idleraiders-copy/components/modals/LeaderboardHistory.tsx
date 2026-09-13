'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Calendar, Loader2, Radio, ChevronRight } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useLeaderboardActions } from '@/features/actions/leaderboardActions'

interface WeekListItem {
  weekNumber: number
  weekStart: string
  weekEnd: string
  isActive?: boolean
  status?: 'active' | 'finalized'
}

interface LeaderboardHistoryModalProps {
  open: boolean
  onClose: () => void
  /**
   * Clicking a week invokes this with the selected week number. The modal
   * is responsible for closing itself after selection.
   */
  onSelectWeek?: (weekNumber: number) => void
  /**
   * Highlight the currently-viewed week (e.g. from the parent page's state)
   * so the player sees which week is already loaded. Pass null for the
   * live/current week when no historical week is being viewed.
   */
  currentWeekNumber?: number | null
}

const LeaderboardHistoryModal = ({
  open,
  onClose,
  onSelectWeek,
  currentWeekNumber,
}: LeaderboardHistoryModalProps) => {
  const { getLeaderboardHistory } = useLeaderboardActions()
  const [weeks, setWeeks] = useState<WeekListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadedAll, setLoadedAll] = useState(false)
  const initialLimit = 12
  const expandedLimit = 52

  const fetchWeeks = useCallback(
    async (limit: number) => {
      setIsLoading(true)
      try {
        const payload = await getLeaderboardHistory({ limit, includeActive: true })
        if (payload?.success && Array.isArray(payload.snapshots)) {
          setWeeks(payload.snapshots as WeekListItem[])
          setLoadedAll(limit >= expandedLimit || payload.snapshots.length < limit)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard history:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [getLeaderboardHistory]
  )

  useEffect(() => {
    if (open) {
      fetchWeeks(initialLimit)
    }
  }, [open, fetchWeeks])

  const handleSelect = (weekNumber: number) => {
    onSelectWeek?.(weekNumber)
    onClose()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (typeof document === 'undefined') return null

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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fantasy-card glow-gold mx-4 w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy size={16} className="text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">Leaderboard History</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {isLoading && weeks.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="text-muted-foreground/50 animate-spin" />
                </div>
              ) : weeks.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No history available yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Check back after the first weekly reset
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {weeks.map((week, idx) => {
                    const isLive = !!week.isActive || week.status === 'active'
                    const isCurrent =
                      (currentWeekNumber == null && isLive) ||
                      currentWeekNumber === week.weekNumber

                    return (
                      <motion.li
                        key={week.weekNumber}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <button
                          onClick={() => handleSelect(week.weekNumber)}
                          className={`group w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                            isCurrent
                              ? 'border-primary/50 bg-primary/10 hover:bg-primary/15'
                              : 'border-border bg-secondary/40 hover:bg-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold ${
                                isLive
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-secondary text-foreground'
                              }`}
                            >
                              {week.weekNumber}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-foreground">
                                  Week {week.weekNumber}
                                </span>
                                {isLive && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary">
                                    <Radio size={8} className="animate-pulse" />
                                    Live
                                  </span>
                                )}
                                {isCurrent && !isLive && (
                                  <span className="rounded-full bg-primary/15 border border-primary/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary">
                                    Viewing
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Calendar size={10} />
                                <span className="truncate">
                                  {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
                          />
                        </button>
                      </motion.li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground">
                {weeks.length > 0
                  ? `${weeks.length} week${weeks.length !== 1 ? 's' : ''}`
                  : ''}
              </p>
              {!loadedAll && weeks.length >= initialLimit && (
                <button
                  onClick={() => fetchWeeks(expandedLimit)}
                  disabled={isLoading}
                  className="rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5"
                >
                  {isLoading ? 'Loading…' : 'Load More'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default LeaderboardHistoryModal
