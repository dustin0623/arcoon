'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'
import GAME_DATA from '@/public/data/index'

// Only log in development
const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

const log = (message?: unknown) => {
	if (isDev) console.log('[idleraiders-logs]', message || '')
}

const logWarn = (message?: unknown) => {
	if (isDev) console.warn('[idleraiders-logs]', message || '')
}

const logError = (message?: unknown) => {
	if (isDev) console.error('[idleraiders-logs]', message || '')
}

const WORKER_SOCKET_URL =
	process.env.NEXT_PUBLIC_WORKER_SOCKET_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'

interface PlayerState {
	_id?: string
	username?: string
	isRegistered?: boolean
	level?: number
	xp?: number
	energy?: number
	maxEnergy?: number
	lastEnergyRegen?: number
	coins?: number
	shards?: number
	dollars?: number
	storageSlots?: number
	raidTokens?: number
	guildTokens?: number
	health?: Record<string, unknown>
	wallet?: Record<string, unknown>
	stats?: Record<string, unknown>
	fatigue?: Record<string, unknown>
	missionStats?: Record<string, unknown>
	milestones?: Record<string, unknown>
	boosts?: Record<string, number>
	inventory?: unknown[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	materials?: Record<string, any>[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	cards?: Record<string, any>[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	potions?: Record<string, any>[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	packs?: Record<string, any>[]
	activeMission?: Record<string, unknown> | null
	guild?: Record<string, unknown> | null
	guildId?: string | null
	lands?: unknown[]
	[key: string]: unknown
}

interface GameData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	CARDS?: Record<string, any>[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ITEMS?: Record<string, any>[]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	WORLD?: Record<string, any>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	PROGRESSION?: Record<string, any>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ECONOMY?: Record<string, any>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	SYSTEM?: Record<string, any>
	[key: string]: unknown
}

interface GameContextValue {
	isLoading: boolean
	socketConnected: boolean
	hiveUsdPrice: number | null
	playerState: PlayerState | null
	gameData: GameData
	requestHivePrice: () => void
	patchPlayerState: (partialState: Partial<PlayerState>) => void
	setPlayerState: (state: PlayerState | null) => void
	fetchPlayerState: () => Promise<void>
	apiRequest: <T = unknown>(
		endpoint: string,
		options?: RequestInit,
	) => Promise<{ success: boolean; data?: T; delta?: Partial<PlayerState>; error?: string }>
}

const GameContext = createContext<GameContextValue | undefined>(undefined)

export const useGame = (): GameContextValue => {
	const ctx = useContext(GameContext)
	if (!ctx) throw new Error('useGame must be used within a GameProvider')
	return ctx
}

// Legacy hook for backwards compatibility
export const useSocket = useGame

interface GameProviderProps {
	children: ReactNode
}

export const GameProvider = ({ children }: GameProviderProps) => {
	const [isLoading, setIsLoading] = useState(false)
	const [socketConnected, setSocketConnected] = useState(false)
	const [hiveUsdPrice, setHiveUsdPrice] = useState<number | null>(null)
	const [playerState, setPlayerStateInternal] = useState<PlayerState | null>(null)
	const socketRef = useRef<Socket | null>(null)
	const gameData = useMemo(() => GAME_DATA as GameData, [])

	const { isAuthenticated, username, setRegistered, getAuthToken } = useAuth()

	const patchPlayerState = useCallback((partialState: Partial<PlayerState>) => {
		if (!partialState) return
		setPlayerStateInternal((prev) => {
			const base = prev || {}
			const merged = { ...base, ...partialState }
			// Deep merge known nested objects, arrays remain atomic replacements.
			for (const key of ['health', 'wallet', 'stats', 'fatigue', 'missionStats', 'milestones']) {
				const partialVal = partialState[key]
				const baseVal = base[key]
				if (partialVal && baseVal && typeof partialVal === 'object' && !Array.isArray(partialVal)) {
					merged[key] = { ...(baseVal as object), ...(partialVal as object) }
				}
			}
			return merged
		})
	}, [])

	const setPlayerState = useCallback((state: PlayerState | null) => {
		setPlayerStateInternal(state)
	}, [])

	const apiRequest = useCallback(
		async <T = unknown,>(
			endpoint: string,
			options: RequestInit = {},
		): Promise<{ success: boolean; data?: T; delta?: Partial<PlayerState>; error?: string }> => {
			const token = getAuthToken()

			const headers: HeadersInit = {
				'Content-Type': 'application/json',
				...(options.headers || {}),
			}

			if (token) {
				;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
			}

			try {
				const response = await fetch(endpoint, {
					...options,
					headers,
				})

				const result = await response.json()

				// Handle 401 Unauthorized - token expired or invalid
				if (response.status === 401) {
					logWarn('401 Unauthorized - redirecting to login')
					// Redirect to login - AuthContext will handle clearing cookies
					window.location.href = '/login?session_expired=true'
					return { success: false, error: 'Session expired. Please login again.' }
				}

				if (!response.ok) {
					return { success: false, error: result.error || 'Request failed' }
				}

				// Auto-apply delta updates to player state
				if (result.delta) {
					patchPlayerState(result.delta)
				}

				// Auto-apply full player state updates
				if (result.playerState) {
					setPlayerState(result.playerState)
				}

				return { success: true, data: result as T, delta: result.delta }
			} catch (error) {
				const err = error as Error
				logError('API request failed: ' + err.message)
				return { success: false, error: err.message }
			}
		},
		[getAuthToken, patchPlayerState, setPlayerState],
	)

	const fetchPlayerState = useCallback(async () => {
		const token = getAuthToken()
		if (!token) return

		setIsLoading(true)
		try {
			const result = await apiRequest<{ playerState: PlayerState }>('/api/players/state')

			if (result.success && result.data?.playerState) {
				setPlayerState(result.data.playerState)

				if (result.data.playerState.isRegistered) {
					setRegistered(true)
				}
			}
		} catch (error) {
			logError(
				'Failed to fetch player state: ' + (error instanceof Error ? error.message : String(error)),
			)
			toast.error('Failed to load player data')
		} finally {
			setIsLoading(false)
		}
	}, [getAuthToken, apiRequest, setPlayerState, setRegistered])

	const requestHivePrice = useCallback(async () => {
		try {
			const response = await fetch(`${SERVER_URL}/api/price`)
			const data = await response.json()
			if (data.success && typeof data.hiveUsd === 'number') {
				setHiveUsdPrice(data.hiveUsd)
			}
		} catch (error) {
			logError('Failed to fetch HIVE price')
		}
	}, [])

	useEffect(() => {
		if (!isAuthenticated) {
			socketRef.current?.disconnect()
			socketRef.current = null
			setSocketConnected(false)
			return
		}

		const initialUsername = username || undefined
		const token = getAuthToken()
		const socket = io(WORKER_SOCKET_URL, {
			autoConnect: true,
			withCredentials: false,
			reconnection: true,
			transports: ['websocket', 'polling'],
			auth: token ? { token, username: initialUsername } : undefined,
		})

		socketRef.current = socket

		const handleConnected = () => {
			log('Socket connected to server')
		}

		const handleTransactionSuccess = (payload: { message?: string; result?: { delta?: Partial<PlayerState> } }) => {
			if (payload?.result?.delta && typeof payload.result.delta === 'object') {
				patchPlayerState(payload.result.delta)
			}

			toast.success(payload?.message || 'Transaction completed successfully')
		}

		// Handle real-time balance/state updates from server (deposit/withdraw/registration completion)
		const handleUpdatedUserState = (payload: { delta?: Partial<PlayerState> }) => {
			log('Received updated_user_state: ' + JSON.stringify(payload))
			if (payload?.delta && typeof payload.delta === 'object') {
				patchPlayerState(payload.delta)
				
				// Sync isRegistered with AuthContext for navigation/redirect logic
				if (payload.delta.isRegistered === true) {
					setRegistered(true)
				}
			}
		}

		// Handle transaction status updates (completed/failed notifications)
		const handleTransactionUpdate = (payload: {
			transactionId: string
			status: 'completed' | 'failed'
			type: string
			message?: string
			balanceUpdate?: { gold?: number; dollars?: number }
		}) => {
			log('Received transaction:update: ' + JSON.stringify(payload))
			
			if (payload.status === 'completed') {
				toast.success(payload.message || `${payload.type} completed successfully`)
			} else if (payload.status === 'failed') {
				toast.error(payload.message || `${payload.type} failed`)
			}
		}

		socket.on('connect', () => {
			setSocketConnected(true)
			log('Socket connected')

			if (initialUsername) {
				socket.emit('register_username', { username: initialUsername })
			}
		})

		socket.on('disconnect', () => {
			setSocketConnected(false)
			log('Socket disconnected')
		})

		socket.on('connect_error', (error: Error) => {
			logWarn(`Worker socket error: ${error.message}`)
		})

		socket.on('connected', handleConnected)
		socket.on('transaction_success', handleTransactionSuccess)
		socket.on('updated_user_state', handleUpdatedUserState)
		socket.on('transaction:update', handleTransactionUpdate)

		return () => {
			socket.off('connected', handleConnected)
			socket.off('transaction_success', handleTransactionSuccess)
			socket.off('updated_user_state', handleUpdatedUserState)
			socket.off('transaction:update', handleTransactionUpdate)
			socket.disconnect()
			socketRef.current = null
			setSocketConnected(false)
		}
	}, [isAuthenticated, username, patchPlayerState, getAuthToken, setRegistered])

	useEffect(() => {
		const activeUsername = username || playerState?.username
		if (!activeUsername || !socketRef.current?.connected) {
			return
		}

		socketRef.current.emit('register_username', { username: activeUsername })
	}, [username, playerState?.username])

	// Fetch player state on authentication
	useEffect(() => {
		if (isAuthenticated) {
			fetchPlayerState()
		} else {
			setPlayerState(null)
		}
	}, [isAuthenticated, fetchPlayerState, setPlayerState])

	// Fetch HIVE price on mount and refresh every 5 minutes
	useEffect(() => {
		requestHivePrice()
		const interval = setInterval(requestHivePrice, 5 * 60 * 1000)
		return () => clearInterval(interval)
	}, [requestHivePrice])

	const value = useMemo(
		() => ({
			isLoading,
			socketConnected,
			hiveUsdPrice,
			playerState,
			gameData,
			requestHivePrice,
			patchPlayerState,
			setPlayerState,
			fetchPlayerState,
			apiRequest,
		}),
		[
			isLoading,
			socketConnected,
			hiveUsdPrice,
			playerState,
			gameData,
			requestHivePrice,
			patchPlayerState,
			setPlayerState,
			fetchPlayerState,
			apiRequest,
		],
	)

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// Legacy export for backwards compatibility
export const SocketProvider = GameProvider
