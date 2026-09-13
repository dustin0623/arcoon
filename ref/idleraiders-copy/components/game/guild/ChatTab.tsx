'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send } from 'lucide-react'

export const ChatTab = ({
	guildData,
	refreshGuild,
	actions,
	playerState,
}: {
	guildData: Record<string, any> | null
	refreshGuild: () => void
	actions: Record<string, any>
	playerState: Record<string, any> | null
}) => {
	const [chat, setChat] = useState<Record<string, any>[]>([])
	const [loading, setLoading] = useState(true)
	const playerName = playerState?.username ?? ''
	const [msg, setMsg] = useState('')
	const scrollRef = useRef<HTMLDivElement>(null)

	// Fetch chat messages on mount and periodically
	useEffect(() => {
		const fetchChat = async () => {
			const messages = await actions.getChat()
			if (Array.isArray(messages)) {
				setChat(messages.slice(-100)) // Keep only last 100
			} else {
				setChat([])
			}
			setLoading(false)
		}
		fetchChat()
		
		// Poll for new messages every 5 seconds
		const interval = setInterval(fetchChat, 5000)
		return () => clearInterval(interval)
	}, [actions])

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight
		}
	}, [chat])

	const handleSend = async () => {
		if (!msg.trim()) return
		await actions.sendChat(msg.trim())
		setMsg('')
		// Immediately fetch new messages after sending
		const messages = await actions.getChat()
		setChat(messages.slice(-100))
	}

	return (
		<div className="space-y-0">
			{/* Chat header */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="flex items-center justify-between pb-2"
			>
				<div className="flex items-center gap-1.5">
					<MessageCircle size={13} className="text-primary" />
					<span className="font-display text-xs font-bold text-foreground">Guild Chat</span>
				</div>
				<span className="text-[9px] text-muted-foreground">{chat.length} messages</span>
			</motion.div>

			{/* Chat area */}
			<div
				className="rounded-2xl border border-border overflow-hidden"
				style={{ background: 'linear-gradient(180deg, hsl(230 12% 11%), hsl(230 12% 9%))' }}
			>
				<div ref={scrollRef} className="h-[320px] px-3 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
					<div className="space-y-3">
						{loading && (
							<div className="text-center py-12 space-y-2">
								<p className="text-[10px] text-muted-foreground/50">Loading messages...</p>
							</div>
						)}
						{!loading && chat.length === 0 && (
							<div className="text-center py-12 space-y-2">
								<MessageCircle size={24} className="mx-auto text-muted-foreground/30" />
								<p className="text-[10px] text-muted-foreground/50">No messages yet. Say hello!</p>
							</div>
						)}
						{chat.map((m: Record<string, any>, i: number) => {
							const isMe = m.sender === playerName
							const msgKey = m._id || `${m.sender}-${m.timestamp}-${i}`
							const formattedTime = m.timestamp
								? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
								: ''
							return (
								<motion.div
									key={msgKey}
									initial={{ opacity: 0, y: 5 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: i * 0.02 }}
									className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
								>
									<div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
										<div
											className={`flex items-center gap-1.5 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}
										>
											{!isMe && (
												<div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
													<img
														src={`https://images.hive.blog/u/${m.sender}/avatar`}
														alt=""
														className="w-full h-full object-cover"
														onError={(e) => {
															e.currentTarget.style.display = 'none'
														}}
													/>
												</div>
											)}
											<span
												className={`text-[9px] font-bold ${isMe ? 'text-primary' : 'text-foreground/80'}`}
											>
												{m.sender}
											</span>
											<span className="text-[8px] text-muted-foreground/50">{formattedTime}</span>
										</div>
										<div
											className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
												isMe ? 'rounded-br-md' : 'rounded-bl-md'
											}`}
											style={{
												background: isMe
													? 'linear-gradient(135deg, hsl(43 80% 50% / 0.15), hsl(43 80% 50% / 0.08))'
													: 'hsl(230 12% 16%)',
												border: `1px solid ${isMe ? 'hsl(43 80% 50% / 0.2)' : 'hsl(230 12% 20%)'}`,
												color: 'hsl(var(--foreground))',
											}}
										>
											{m.text}
										</div>
									</div>
								</motion.div>
							)
						})}
					</div>
				</div>

				{/* Input */}
				<div
					className="flex gap-2 p-3 border-t"
					style={{ borderColor: 'hsl(230 12% 18%)', background: 'hsl(230 12% 10%)' }}
				>
					<input
						value={msg}
						onChange={(e) => setMsg(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && handleSend()}
						placeholder="Type a message..."
						className="flex-1 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
					/>
					<button
						onClick={handleSend}
						disabled={!msg.trim()}
						className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30"
						style={{
							background: msg.trim() ? 'hsl(43 80% 50% / 0.15)' : 'hsl(230 12% 15%)',
							border: `1px solid ${msg.trim() ? 'hsl(43 80% 50% / 0.3)' : 'hsl(230 12% 20%)'}`,
							color: msg.trim() ? 'hsl(43 80% 55%)' : 'hsl(230 10% 40%)',
						}}
					>
						<Send size={14} />
					</button>
				</div>
			</div>
		</div>
	)
}
