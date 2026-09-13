'use client'

import { useGame } from '@/context/GameContext'
import { useMemo } from 'react'

/**
 * Helper to extract plain values from a potential Mongoose subdocument.
 * Mongoose stores subdoc fields inside `_doc`, so direct property access fails.
 */
function getSubdocValue<T>(subdoc: unknown, key: string, fallback: T): T {
  if (!subdoc || typeof subdoc !== 'object') return fallback
  const doc = subdoc as Record<string, unknown>
  // Try _doc first (Mongoose subdocument), then direct access
  if (doc._doc && typeof doc._doc === 'object') {
    const inner = doc._doc as Record<string, unknown>
    return (inner[key] as T) ?? fallback
  }
  return (doc[key] as T) ?? fallback
}

/**
 * Custom hook to access the player state from the game context
 * @returns {Object} player data including identity, wallet, and milestones
 */
export function usePlayer() {
  const { playerState } = useGame()

  const identity = useMemo(() => {
    return {
      username: playerState?.username ?? 'Guest',
      playerId: playerState?._id ?? null,
    }
  }, [playerState])

  const wallet = useMemo(() => {
    const coins = playerState?.coins ?? 0
    const shards = playerState?.shards ?? 0
    const dollars = playerState?.dollars ?? 0
    return { coins, shards, dollars }
  }, [playerState])

  const milestones = useMemo(() => {
    const milestonesDoc = playerState?.milestones
    const storyProgress = getSubdocValue<number>(milestonesDoc, 'storyProgress', 0)
    const totalMissionsCompleted = getSubdocValue<number>(milestonesDoc, 'totalMissionsCompleted', 0)
    const totalBossDamage = getSubdocValue<number>(milestonesDoc, 'totalBossDamage', 0)
    const totalMinutesPlayed = getSubdocValue<number>(milestonesDoc, 'totalMinutesPlayed', 0)

    return { storyProgress, totalMissionsCompleted, totalBossDamage, totalMinutesPlayed }
  }, [playerState])

  return { identity, wallet, milestones }
}

export default usePlayer
