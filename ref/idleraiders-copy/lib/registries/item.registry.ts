import GAME_DATA from '@/public/data'
import type { GameItem } from '@/lib/types'

/**
 * Pre-built O(1) lookup maps for items and materials
 * Frozen to prevent accidental mutations
 */

export const MATERIALS_BY_ID = Object.freeze(
  Object.fromEntries(
    ((GAME_DATA as { ITEMS?: GameItem[] }).ITEMS ?? [])
      .filter((item) => item?.category === 'material')
      .map((item) => [item.id, item]),
  ),
) as Readonly<Record<string, GameItem>>

export const CATALYSTS_BY_ID = Object.freeze(
  Object.fromEntries(
    ((GAME_DATA as { ITEMS?: GameItem[] }).ITEMS ?? [])
      .filter((item) => item?.type === 'catalyst')
      .map((item) => [item.id, item]),
  ),
) as Readonly<Record<string, GameItem>>

export const COMPONENTS_BY_ID = Object.freeze(
  Object.fromEntries(
    ((GAME_DATA as { ITEMS?: GameItem[] }).ITEMS ?? [])
      .filter((item) => item?.type === 'component')
      .map((item) => [item.id, item]),
  ),
) as Readonly<Record<string, GameItem>>

export const ITEMS_BY_ID = Object.freeze(
  Object.fromEntries(
    ((GAME_DATA as { ITEMS?: GameItem[] }).ITEMS ?? []).map((item) => [item.id, item]),
  ),
) as Readonly<Record<string, GameItem>>

/**
 * Get material by ID with O(1) lookup
 */
export function getMaterialById(materialId: string): GameItem | undefined {
  return MATERIALS_BY_ID[materialId]
}

/**
 * Get catalyst by ID with O(1) lookup
 */
export function getCatalystById(catalystId: string): GameItem | undefined {
  return CATALYSTS_BY_ID[catalystId]
}

/**
 * Get item by ID with O(1) lookup
 */
export function getItemById(itemId: string): GameItem | undefined {
  return ITEMS_BY_ID[itemId]
}
