// ──────────────────────────────────────────────────────────
// CONSOLIDATED IMAGE EXPORTS
// ──────────────────────────────────────────────────────────

import BOOSTER_IMAGES, { getBoosterImage } from './BoosterImages'
import BOSS_IMAGES, { getBossImage } from './BossImages'
import CARD_IMAGES, { getCardImage } from './CardImages'
import DUNGEON_IMAGES, { getDungeonImage } from './DungeonImages'
import MATERIAL_IMAGES, { getMaterialImage } from './MaterialImages'
import GAME_UI_IMAGES, { getGameUIImage } from './GameImages'
import FRAME_IMAGES, { getFrameImage } from './FrameImages'

// ══════════════════════════════════════════════════════════
// COMBINED IMAGE OBJECT
// ══════════════════════════════════════════════════════════

export const IDLERAIDERS_IMAGES = {
  ...BOOSTER_IMAGES,
  ...BOSS_IMAGES,
  ...CARD_IMAGES,
  ...DUNGEON_IMAGES,
  ...MATERIAL_IMAGES,
  ...GAME_UI_IMAGES,
}

// ══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════

export const getImage = (imageId, type = null, subType = null) => {
  // Try to get from combined images first
  if (IDLERAIDERS_IMAGES[imageId]) return IDLERAIDERS_IMAGES[imageId]

  // Use specialized getters if type is specified
  if (type === 'booster') return getBoosterImage(imageId)
  if (type === 'boss') return getBossImage(imageId)
  if (type === 'card') return getCardImage(imageId, subType)
  if (type === 'dungeon') return getDungeonImage(imageId)
  if (type === 'material') return getMaterialImage(imageId)
  if (type === 'ui') return getGameUIImage(imageId)

  return null
}

// ══════════════════════════════════════════════════════════
// ORGANIZED EXPORTS BY CATEGORY
// ══════════════════════════════════════════════════════════

// Game UI Images
export { GAME_UI_IMAGES, getGameUIImage }

// Booster Images
export { BOOSTER_IMAGES, getBoosterImage }

// Boss Images
export { BOSS_IMAGES, getBossImage }

// Card Images
export { CARD_IMAGES, getCardImage }

// Dungeon Images
export { DUNGEON_IMAGES, getDungeonImage }

// Material Images
export { MATERIAL_IMAGES, getMaterialImage }

// Frame Images
export { FRAME_IMAGES, getFrameImage }

export default IDLERAIDERS_IMAGES
