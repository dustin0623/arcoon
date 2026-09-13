'use client'

import { useState, useEffect } from 'react'
import { Copy, Loader2, UserCheck, UserX, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { useGame } from '@/context/GameContext'
import { usePlayerActions } from '@/features/actions/playerActions'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

const ReferralsModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
	const { playerState } = useGame()
	const { getReferrals } = usePlayerActions()
	const isMobile = useIsMobile()
	const [referrals, setReferrals] = useState<Record<string, any>[]>([])
	const [loading, setLoading] = useState(false)

	const username = playerState?.username
	const referralLink = `https://www.idleraiders.site/login?ref=${username}`

	useEffect(() => {
		if (!open) return
		setLoading(true)
		getReferrals().then((data: any) => {
			setReferrals(data?.referrals ?? [])
			setLoading(false)
		})
	}, [open])

	const copyReferral = () => {
		navigator.clipboard.writeText(referralLink)
		toast.success('Referral link copied!')
	}

	const registered = referrals.filter((r) => r.isRegistered)
	const pending = referrals.filter((r) => !r.isRegistered)

	// Shared body: referral link card + stats row + list
	const body = (
		<div className="space-y-3">
			{/* Referral link copy */}
			<div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-2">
				<div className="flex items-center justify-between gap-2">
					<p className="text-xs text-muted-foreground truncate">{referralLink}</p>
					<Button size="sm" variant="ghost" onClick={copyReferral} className="shrink-0 h-7 px-2">
						<Copy size={13} className="mr-1" />
						Copy
					</Button>
				</div>
				<p className="text-[10px] text-primary/80">
					You earn 1 Standard Pack for each player who registers using your link!
				</p>
			</div>

			{/* Stats summary */}
			<div className="flex gap-2">
				<div className="flex-1 rounded-lg border border-border bg-secondary/30 p-2 text-center">
					<p className="text-lg font-bold text-green-400">{registered.length}</p>
					<p className="text-[10px] text-muted-foreground uppercase tracking-wide">Registered</p>
				</div>
				<div className="flex-1 rounded-lg border border-border bg-secondary/30 p-2 text-center">
					<p className="text-lg font-bold text-red-400">{pending.length}</p>
					<p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending</p>
				</div>
				<div className="flex-1 rounded-lg border border-border bg-secondary/30 p-2 text-center">
					<p className="text-lg font-bold text-foreground">{referrals.length}</p>
					<p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
				</div>
			</div>

			{/* List */}
			<div className="space-y-1.5 pr-1">
				{loading ? (
					<div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
						<Loader2 size={16} className="animate-spin" />
						<span className="text-sm">Loading...</span>
					</div>
				) : referrals.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
						<Users size={28} className="opacity-30" />
						<p className="text-sm">No referrals yet</p>
						<p className="text-xs opacity-60">Share your referral link to invite players!</p>
					</div>
				) : (
					<>
						{registered.map((r) => (
							<div
								key={r.username}
								className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2"
							>
								<div className="flex items-center gap-2">
									<img
										src={`https://images.hive.blog/u/${r.username}/avatar`}
										alt={r.username}
										className="h-6 w-6 rounded-full border border-green-500/30"
										onError={(e) => {
											e.currentTarget.style.display = 'none'
										}}
									/>
									<span className="text-sm font-medium text-foreground">@{r.username}</span>
								</div>
								<div className="flex items-center gap-1 text-green-400">
									<UserCheck size={13} />
									<span className="text-[11px] font-medium">Registered</span>
								</div>
							</div>
						))}
						{pending.map((r) => (
							<div
								key={r.username}
								className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2"
							>
								<div className="flex items-center gap-2">
									<img
										src={`https://images.hive.blog/u/${r.username}/avatar`}
										alt={r.username}
										className="h-6 w-6 rounded-full border border-red-500/30"
										onError={(e) => {
											e.currentTarget.style.display = 'none'
										}}
									/>
									<span className="text-sm font-medium text-muted-foreground">@{r.username}</span>
								</div>
								<div className="flex items-center gap-1 text-red-400">
									<UserX size={13} />
									<span className="text-[11px] font-medium">Pending</span>
								</div>
							</div>
						))}
					</>
				)}
			</div>
		</div>
	)

	// ── Mobile: bottom drawer (default max-h-[80vh]) ─────────────────────────
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange}>
				<DrawerContent className="border-border p-0 flex flex-col">
					<DrawerHeader className="px-5 pb-2 text-left">
						<DrawerTitle className="flex items-center gap-2 text-base">
							<Users size={18} className="text-primary" />
							Referrals
						</DrawerTitle>
						<DrawerDescription className="text-xs">
							Players who joined using your referral link.
						</DrawerDescription>
					</DrawerHeader>
					<div className="flex-1 overflow-y-auto px-5 pb-5">{body}</div>
				</DrawerContent>
			</Drawer>
		)
	}

	// ── Desktop: centered dialog ─────────────────────────────────────────────
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-full max-w-sm mx-4">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Users size={18} className="text-primary" />
						Referrals
					</DialogTitle>
					<DialogDescription>Players who joined using your referral link.</DialogDescription>
				</DialogHeader>
				<div className="max-h-[60vh] overflow-y-auto">{body}</div>
			</DialogContent>
		</Dialog>
	)
}

export default ReferralsModal
