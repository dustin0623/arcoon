'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, XCircle, User, Clock, Swords, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatNumber } from '@/lib/formatters'

interface JoinRequest {
  playerId: string
  playerName: string
  level?: number
  raidPower?: number
  message?: string
  appliedAt: Date | string
}

export const JoinRequestsModal = ({
  open,
  onClose,
  actions,
  refreshGuild,
  guildData,
}: {
  open: boolean
  onClose: () => void
  actions: Record<string, any>
  refreshGuild: () => void
  guildData?: Record<string, any> | null
}) => {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // Initialize requests from guildData when modal opens
  useEffect(() => {
    if (open && guildData?.joinRequests) {
      const mappedRequests = guildData.joinRequests.map((r: any) => ({
        playerId: r.playerId?.toString() || r.playerId,
        playerName: r.playerName,
        level: r.level ?? 1,
        raidPower: r.raidPower ?? 0,
        message: r.message,
        appliedAt: r.appliedAt,
      }))
      setRequests(mappedRequests)
    } else if (open) {
      // Fallback to API if guildData not available
      loadRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, guildData])

  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const data = await actions.getJoinRequests()
      setRequests(data || [])
    } catch (error) {
      console.error('Error loading requests:', error)
      toast.error('Failed to load join requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (playerId: string, _playerName: string) => {
    setProcessingId(playerId)
    try {
      await actions.approveJoinRequest(playerId)
      setRequests((prev) => prev.filter((r) => r.playerId !== playerId))
      refreshGuild()
    } catch (error) {
      toast.error((error as Error).message || 'Failed to approve request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (playerId: string) => {
    setProcessingId(playerId)
    try {
      await actions.rejectJoinRequest(playerId)
      setRequests((prev) => prev.filter((r) => r.playerId !== playerId))
    } catch (error) {
      toast.error((error as Error).message || 'Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  }

  if (!open) return null

  // Shared list body — rendered identically inside the drawer and the desktop modal.
  const listBody = isLoading ? (
    <div className="text-center py-8">
      <p className="text-xs text-muted-foreground">Loading requests...</p>
    </div>
  ) : requests.length === 0 ? (
    <div className="text-center py-8 space-y-2">
      <Inbox size={32} className="mx-auto text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">No pending requests</p>
    </div>
  ) : (
    requests.map((request) => (
      <motion.div
        key={request.playerId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl border border-border p-4"
        style={{ background: 'hsl(230 12% 12%)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User size={18} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/game/profile/${request.playerId}`}
                className="font-display font-bold text-sm text-foreground hover:text-primary transition-colors"
                onClick={onClose}
              >
                {request.playerName}
              </Link>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                  Lv.{request.level ?? 1}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Swords size={10} className="text-red-400" />
                  {formatNumber(request.raidPower ?? 0)} RP
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1.5">
                <Clock size={10} /> {formatTimeAgo(request.appliedAt)}
              </p>
              {request.message && (
                <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                  &quot;{request.message}&quot;
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleApprove(request.playerId, request.playerName)}
              disabled={processingId === request.playerId}
              className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
              title="Approve"
              aria-label={`Approve ${request.playerName}`}
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => handleReject(request.playerId)}
              disabled={processingId === request.playerId}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              title="Reject"
              aria-label={`Reject ${request.playerName}`}
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    ))
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="border-border">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display">Join Requests</DrawerTitle>
            <DrawerDescription className="sr-only">
              Pending player applications to your guild. Approve or reject each request.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto space-y-3">{listBody}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl border border-border overflow-hidden"
          style={{ background: 'linear-gradient(160deg, hsl(230 15% 15%), hsl(230 12% 8%))' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-display text-lg font-bold text-foreground">Join Requests</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">{listBody}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
