export const FRAME_IMAGES = {
  common: '/assets/frames/common_card_frame.png',
  uncommon: '/assets/frames/uncommon_card_frame.png',
  rare: '/assets/frames/rare_card_frame.png',
  epic: '/assets/frames/epic_card_frame.png',
  legendary: '/assets/frames/legendary_card_frame.png',
  special: '/assets/frames/special_card_frame.png',
}

export const getFrameImage = (rarity) => {
  return FRAME_IMAGES[rarity] || null
}

export default FRAME_IMAGES
