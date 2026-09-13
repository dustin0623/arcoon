'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type AuthStatus = 'loading' | 'unauthenticated' | 'unregistered' | 'registered' | 'banned'

interface AuthCheckResult {
  status: AuthStatus
  user: { username: string; referredBy?: string; banReason?: string; bannedAt?: string } | null
  isLoading: boolean
}

// Helper to get cookie value
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

/**
 * Hook to verify authentication status by calling the API.
 * This is the SINGLE SOURCE OF TRUTH for auth status.
 * 
 * Re-checks auth on every route change to ensure fresh data.
 * 
 * Returns:
 * - status: 'loading' | 'unauthenticated' | 'unregistered' | 'registered'
 * - user: { username } | null
 * - isLoading: boolean
 */
export function useAuthCheck(): AuthCheckResult {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<{
    username: string
    referredBy?: string
    banReason?: string
    bannedAt?: string
  } | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Reset to loading state on each check
    setStatus('loading')
    
    const verifyAuth = async () => {
      // Check if token exists in cookies
      const token = getCookie('auth_token')

      if (!token) {
        setStatus('unauthenticated')
        setUser(null)
        return
      }

      // Verify token with API - this is the source of truth
      try {
        const res = await fetch('/api/players/me', {
          headers: { Authorization: `Bearer ${token}` },
          // Prevent caching to always get fresh data
          cache: 'no-store',
        })

        if (!res.ok) {
          // Token invalid or expired
          setStatus('unauthenticated')
          setUser(null)
          return
        }

        const data = await res.json()
        const isRegistered = data.player?.isRegistered ?? false
        const isBanned = data.player?.isBanned ?? false
        const username = data.player?.username ?? null
        const referredBy = data.player?.referredBy ?? undefined
        const banReason = data.player?.banReason ?? undefined
        const bannedAt = data.player?.bannedAt ?? undefined

        setUser(username ? { username, referredBy, banReason, bannedAt } : null)

        // Ban takes priority over registration: a banned account is always blocked.
        if (isBanned) {
          setStatus('banned')
        } else {
          setStatus(isRegistered ? 'registered' : 'unregistered')
        }
      } catch (error) {
        // Network error or other issue
        setStatus('unauthenticated')
        setUser(null)
      }
    }

    verifyAuth()
  }, [pathname]) // Re-run when pathname changes

  return {
    status,
    user,
    isLoading: status === 'loading',
  }
}
