// Dungeon images are in public/assets/dungeons/
export const DUNGEON_IMAGES = {
  d1: '/assets/dungeons/goblin_cave.png',
  d2: '/assets/dungeons/spider_den.png',
  d3: '/assets/dungeons/graveyard_of_souls.png',
  d4: '/assets/dungeons/crypt_of_the_undying.png',
  d5: '/assets/dungeons/ice_cavern.png',
  d6: '/assets/dungeons/dark_forest.png',
  d7: '/assets/dungeons/molten_quarry.png',
  d8: '/assets/dungeons/ashen_fortress.png',
  d9: '/assets/dungeons/demons_gate.png',
  d10: '/assets/dungeons/dragons_lair.png',
}

export const getDungeonImage = (dungeonId) => {
  return DUNGEON_IMAGES[dungeonId] || null
}

export default DUNGEON_IMAGES
