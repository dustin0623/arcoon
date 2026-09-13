// Boss images are in public/assets/bosses/
export const BOSS_IMAGES = {
  b1: '/assets/bosses/goblin_king.png',
  b2: '/assets/bosses/spider_queen.png',
  b3: '/assets/bosses/soul_reaver.png',
  b4: '/assets/bosses/lich_king.png',
  b5: '/assets/bosses/frost_giant.png',
  b6: '/assets/bosses/ancient_treant.png',
  b7: '/assets/bosses/ember_colossus.png',
  b8: '/assets/bosses/ash_lord.png',
  b9: '/assets/bosses/demon_lord.png',
  b10: '/assets/bosses/ancient_dragon.png',
}

export const getBossImage = (bossId) => {
  return BOSS_IMAGES[bossId] || null
}

export default BOSS_IMAGES
