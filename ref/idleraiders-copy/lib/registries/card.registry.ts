import GAME_DATA from '@/public/data'
import type { GameCard } from '@/lib/types'

/**
 * Central registry for card and material lookups
 * Initialized once and reused throughout the application
 * Eliminates duplicate map creation
 */

export const CARDS_BY_ID = Object.freeze(
  Object.fromEntries(
    ((GAME_DATA as { CARDS?: GameCard[] }).CARDS ?? []).map((card) => [card.id, card]),
  ) as Readonly<Record<string, GameCard>>,
)

/**
 * Get a card definition by ID
 * @param id Card ID
 * @returns Card definition or null if not found
 */
export function getCardById(id: string): GameCard | null {
  return CARDS_BY_ID[id] ?? null
}

/**
 * Check if a card exists in the registry
 * @param id Card ID
 * @returns True if card exists
 */
export function hasCard(id: string): boolean {
  return id in CARDS_BY_ID
}
