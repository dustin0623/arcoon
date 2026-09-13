'use client'

import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react'

// Only log in development
const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

const log = (message?: unknown) => {
	if (isDev) console.log('[idleraiders-logs]', message || '')
}

const logError = (message?: unknown) => {
	if (isDev) console.error('[idleraiders-logs]', message || '')
}

// Helper to get cookie value
const getCookie = (name: string): string | null => {
	if (typeof document === 'undefined') return null
	const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
	return match ? match[2] : null
}

// Helper to set cookie
const setCookie = (name: string, value: string, days: number) => {
	const maxAge = days * 24 * 60 * 60
	document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}

// Helper to delete cookie
const deleteCookie = (name: string) => {
	document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

interface AuthContextValue {
	username: string | null
	isAuthenticated: boolean
	isRegistered: boolean
	isLoading: boolean
	error: string | null
	getAuthToken: () => string | null
	login: (name: string, referral?: string) => Promise<{ success: boolean; isRegistered?: boolean }>
	logout: () => void
	setRegistered: (value: boolean) => void
}

const AuthCtx = createContext<AuthContextValue | undefined>(undefined)

export const useAuth = (): AuthContextValue => {
	const ctx = useContext(AuthCtx)
	if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
	return ctx
}

interface AuthProviderProps {
	children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	// Initialize with null/false to match server render, then hydrate from cookies
	const [username, setUsername] = useState<string | null>(null)
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
	const [isRegistered, setIsRegistered] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Get auth token from cookie
	const getAuthToken = useCallback((): string | null => {
		return getCookie('auth_token')
	}, [])

	// Hydrate auth state after mount
	// Just read stored username for display, AuthGuard handles actual verification
	useEffect(() => {
		const storedUsername = localStorage.getItem('hive_username')
		const storedToken = getCookie('auth_token')

		if (storedUsername && storedToken) {
			setUsername(storedUsername)
			setIsAuthenticated(true)
		}
	}, [])

	const setRegistered = useCallback((value: boolean) => {
		setIsRegistered(value)
	}, [])

	const login = useCallback(async (name: string, referral = '') => {
		const hive_keychain = window.hive_keychain
		if (!hive_keychain) {
			log('Hive Keychain not found on window')
			setError('Hive Keychain extension not found. Please install it first.')
			return { success: false }
		}

		log('Starting keychain login')
		setIsLoading(true)
		setError(null)

		try {
			const signature = await new Promise<string>((resolve, reject) => {
				let hasResponded = false

				// Add a timeout to prevent infinite waiting
				const timeout = setTimeout(() => {
					if (!hasResponded) {
						hasResponded = true
						log('Keychain request timed out after 15 seconds')
						reject(
							new Error(
								'Keychain popup did not respond. Make sure the extension is enabled and try again.',
							),
						)
					}
				}, 15000) // 15 second timeout

				try {
					log('Calling requestSignBuffer')
					hive_keychain.requestSignBuffer(name, 'Idle Raiders Sign In', 'Posting', (response) => {
						if (hasResponded) {
							log('Ignoring late response from keychain')
							return
						}
						hasResponded = true
						clearTimeout(timeout)
						log('Keychain response received')

						if (response.success && response.result) {
							resolve(response.result)
						} else {
							reject(new Error(response.message || 'Sign failed'))
						}
					})
				} catch (err) {
					hasResponded = true
					clearTimeout(timeout)
					logError('Error calling requestSignBuffer')
					reject(
						new Error('Failed to call keychain: ' + (err instanceof Error ? err.message : 'Unknown error')),
					)
				}
			})

			log('Signature obtained, sending login request')
			const response = await fetch('/api/players/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: name, signature, referral }),
			})

			const data = await response.json()
			if (!data.token) {
				throw new Error(data.error || 'Login failed')
			}

			const playerIsRegistered = data.player?.isRegistered ?? false

			// Store auth_token in cookies, hive_username in localStorage
			localStorage.setItem('hive_username', name)
			setCookie('auth_token', data.token, 7)

			setUsername(name)
			setIsAuthenticated(true)
			setIsRegistered(playerIsRegistered)
			setIsLoading(false)
			setError(null)

			log('Login successful')
			return { success: true, isRegistered: playerIsRegistered }
		} catch (err) {
			setIsLoading(false)
			const errorMessage = err instanceof Error ? err.message : 'Login failed'
			setError(errorMessage)
			logError('Login error: ' + errorMessage)
			return { success: false }
		}
	}, [])

	const logout = useCallback(() => {
		localStorage.removeItem('hive_username')
		deleteCookie('auth_token')
		setUsername(null)
		setIsAuthenticated(false)
		setIsRegistered(false)
		setError(null)
	}, [])

	return (
		<AuthCtx.Provider
			value={{
				username,
				isAuthenticated,
				isRegistered,
				isLoading,
				error,
				getAuthToken,
				login,
				logout,
				setRegistered,
			}}
		>
			{children}
		</AuthCtx.Provider>
	)
}
