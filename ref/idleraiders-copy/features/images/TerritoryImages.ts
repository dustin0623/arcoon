// Material images are in public/assets/materials/
// Zone-specific materials (2 per dungeon zone, D1–D10)
export const MATERIAL_IMAGES = {
  // T1 — D1 Goblin Cave
  goblin_iron: '/assets/materials/goblin_iron.png',
  crude_leather: '/assets/materials/crude_leather.png',
  // T1 — D2 Spider Den
  silk_thread: '/assets/materials/silk_thread.png',
  chitin_plate: '/assets/materials/chitin_plate.png',
  // T2 — D3 Graveyard of Souls
  soul_ash: '/assets/materials/soul_ash.png',
  grave_cloth: '/assets/materials/grave_cloth.png',
  // T2 — D4 Crypt of the Undying
  necro_dust: '/assets/materials/necro_dust.png',
  bone_rune: '/assets/materials/bone_rune.png',
  // T2 — D5 Ice Cavern
  frostwood: '/assets/materials/frostwood.png',
  glacial_shard: '/assets/materials/glacial_shard.png',
  // T3 — D6 Dark Forest
  elder_bark: '/assets/materials/elder_bark.png',
  living_sap: '/assets/materials/living_sap.png',
  // T3 — D7 Molten Quarry
  cinder_stone: '/assets/materials/cinder_stone.png',
  magma_core: '/assets/materials/magma_core.png',
  // T3 — D8 Ashen Fortress
  ash_crystal: '/assets/materials/ash_crystal.png',
  charred_bone: '/assets/materials/charred_bone.png',
  // T4 — D9 Demon's Gate
  demon_ichor: '/assets/materials/demon_ichor.png',
  cursed_steel: '/assets/materials/cursed_steel.png',
  // T4 — D10 Dragon's Lair
  dragon_bone: '/assets/materials/dragon_bone.png',
  void_scale: '/assets/materials/void_scale.png',
}

export const getMaterialImage = (name) => {
  return MATERIAL_IMAGES[name] || null
}

export default MATERIAL_IMAGES
