'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, MessageCircle, ArrowLeft, Sparkles, Swords } from 'lucide-react'
import { useGame } from '@/context/GameContext'
import { useGuildActions } from '@/features/actions'
import { OverviewTab } from '@/components/game/guild/OverviewTab'
import { MembersTab } from '@/components/game/guild/MembersTab'
import { ChatTab } from '@/components/game/guild/ChatTab'
import { PerksTab } from '@/components/game/guild/PerksTab'
import { WarTab } from '@/components/game/guild/WarTab'
import { NoGuildView } from '@/components/game/guild/NoGuildView'


// ── Main Guild Page ──

const tabConfig = [
	{ id: 'overview', label: 'Overview', icon: Shield },
	{ id: 'perks', label: 'Perks', icon: Sparkles },
	{ id: 'war', label: 'War', icon: Swords },
	{ id: 'members', label: 'Members', icon: Users },
	{ id: 'chat', label: 'Chat', icon: MessageCircle },
]

const GuildPage = () => {
	const router = useRouter()
	const { playerState, gameData } = useGame()
	const actions = useGuildActions()
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [guildData, setGuildData] = useState<Record<string, any> | null>(null)
	const [activeTab, setActiveTab] = useState(tabConfig[0].id)
	const [browserOpen, setBrowserOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [hasUnreadChat, setHasUnreadChat] = useState(false)
	const lastSeenChatCount = useRef<number>(0)

	const guildTable = gameData?.PROGRESSION?.GUILDS?.LEVELS ?? gameData?.PROGRESSION?.GUILDS?.LEVEL_TABLE ?? []
	const guildConstants = gameData?.PROGRESSION?.GUILDS ?? {}

	const refreshGuild = useCallback(async (showLoader = false) => {
		if (showLoader) setIsLoading(true)
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const data = (await actions.getGuild()) as Record<string, any> | null
			if (data) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const myMember = (data.members as Record<string, any>[])?.find((m) => m.name === playerState?.username)
				setGuildData({ ...data, _playerRole: myMember?.role ?? 'member' })
			} else {
				setGuildData(null)
			}
		} finally {
			setIsLoading(false)
		}
	}, [actions, playerState?.username])

	useEffect(() => {
		if (playerState) refreshGuild(true)
	}, [playerState?.username])

	// Poll for new chat messages when not on chat tab
	useEffect(() => {
		if (!guildData || activeTab === 'chat') return
		
		const checkNewMessages = async () => {
			try {
				const messages = await actions.getChat()
				if (Array.isArray(messages)) {
					const currentCount = messages.length
					// If we have more messages than last seen, mark as unread
					if (lastSeenChatCount.current > 0 && currentCount > lastSeenChatCount.current) {
						setHasUnreadChat(true)
					}
					// Update the count (but don't mark as "seen" - that happens when user opens chat)
					if (lastSeenChatCount.current === 0) {
						lastSeenChatCount.current = currentCount
					}
				}
			} catch (e) {
				// Silently fail - chat polling is non-critical
			}
		}
		
		checkNewMessages()
		const interval = setInterval(checkNewMessages, 10000) // Check every 10 seconds
		return () => clearInterval(interval)
	}, [guildData, activeTab, actions])

	// Clear unread indicator when switching to chat tab
	useEffect(() => {
		if (activeTab === 'chat') {
			setHasUnreadChat(false)
			// Update last seen count
			actions.getChat().then((messages: unknown) => {
				if (Array.isArray(messages)) {
					lastSeenChatCount.current = messages.length
				}
			})
		}
	}, [activeTab, actions])

	const inGuild = !!guildData && !!playerState?.guildId

	const userRole = guildData?._playerRole ?? 'member'

	// Show loading state while fetching guild data
	if (isLoading) {
		return (
			<div className="space-y-5 py-4">
				{/* Header skeleton */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
							<Shield className="text-purple-400" size={18} />
						</div>
						<div>
							<h1 className="font-display text-xl font-bold text-foreground">Guild</h1>
							<p className="mt-0.5 text-[10px] text-muted-foreground">Loading...</p>
						</div>
					</div>
				</div>

				{/* Loading spinner */}
				<div className="flex flex-col items-center justify-center py-20 gap-4">
					<div className="relative">
						<div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
						<Shield className="absolute inset-0 m-auto text-primary/50" size={20} />
					</div>
					<p className="text-sm text-muted-foreground">Loading guild data...</p>
				</div>
			</div>
		)
	}

	const tabContent = {
		overview: (
			<OverviewTab
				guildData={guildData}
				guildTable={guildTable}
				guildConstants={guildConstants}
				refreshGuild={refreshGuild}
				actions={actions}
				playerState={playerState}
			/>
		),
		perks: (
			<PerksTab
				guildData={guildData}
				actions={actions}
				userRole={userRole}
			/>
		),
		war: (
			<WarTab
				guildData={guildData}
				actions={{
					getWarOverview: actions.getWarOverview,
					joinWar: actions.joinWar,
					attackOutpost: actions.attackOutpost,
					attackStronghold: actions.attackStronghold,
					// Only the guild leader can spend supplies and revive stronghold
					spendSupplies: userRole === 'leader' ? actions.spendSupplies : undefined,
					reviveStronghold: userRole === 'leader' ? actions.reviveStronghold : undefined,
				}}
				hasActiveMission={!!playerState?.activeMission}
				guildLevel={guildData?.level ?? 1}
			/>
		),
		members: (
			<MembersTab
				guildData={guildData}
				refreshGuild={refreshGuild}
				actions={actions}
				playerState={playerState}
				guildConstants={guildConstants}
			/>
		),
		chat: <ChatTab guildData={guildData} refreshGuild={refreshGuild} actions={actions} playerState={playerState} />,
	}

	if (!inGuild) {
		return <NoGuildView actions={actions} refreshGuild={refreshGuild} playerState={playerState} />
	}

	// Show guild browser inline when browse mode is active
	if (browserOpen) {
		return (
			<NoGuildView
				actions={actions}
				refreshGuild={refreshGuild}
				playerState={playerState}
				browseMode
				onBack={() => setBrowserOpen(false)}
			/>
		)
	}

	return (
		<div className="space-y-5 py-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2.5">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
						<Shield className="text-purple-400" size={18} />
					</div>
					<div>
						<h1 className="font-display text-xl font-bold text-foreground">Guild</h1>
						<p className="mt-0.5 text-[10px] text-muted-foreground">
							Unite with allies, share perks, and dominate guild wars
						</p>
					</div>
				</div>
				<button
					onClick={() => setBrowserOpen(true)}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
				>
					<Users size={13} />
					Browse Guilds
				</button>
			</div>

			{/* Tab bar */}
			<div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary p-1 scrollbar-none mt-4">
				{tabConfig.map((tab) => {
					const Icon = tab.icon
					const isActive = activeTab === tab.id
					const showUnread = tab.id === 'chat' && hasUnreadChat && !isActive
					return (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold transition-colors ${
								isActive
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							<div className="relative">
								<Icon size={14} className="md:w-4 md:h-4" />
								{showUnread && (
									<span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
								)}
							</div>
							{tab.label}
						</button>
					)
				})}
			</div>

			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.2 }}
				>
					{tabContent[activeTab as keyof typeof tabContent]}
				</motion.div>
			</AnimatePresence>
		</div>
	)
}

export default GuildPage
