// Booster/Pack images are in public/assets/
export const BOOSTER_IMAGES = {
  // Pack card images
  booster_pack: '/assets/idle_raiders_booster_pack.png',
  heroes_pack: '/assets/idle_raiders_heroes_pack.png',
  // Card back for display
  card_back: '/assets/card_back.png',
}

export const getBoosterImage = (boosterId) => {
  return BOOSTER_IMAGES[boosterId] || null
}

export default BOOSTER_IMAGES
