// Material images are in public/assets/materials/
// Zone-specific materials (2 per dungeon zone, D1–D10)
// Keys match item IDs from items.ts (prefixed with material_)
export const MATERIAL_IMAGES: Record<string, string> = {
  // T1 — D1 Goblin Cave
  material_goblin_iron: '/assets/materials/material_goblin_iron.png',
  material_crude_leather: '/assets/materials/material_crude_leather.png',
  // T1 — D2 Spider Den
  material_silk_thread: '/assets/materials/material_silk_thread.png',
  material_chitin_plate: '/assets/materials/material_chitin_plate.png',
  // T2 — D3 Graveyard of Souls
  material_soul_ash: '/assets/materials/material_soul_ash.png',
  material_grave_cloth: '/assets/materials/material_grave_cloth.png',
  // T2 — D4 Crypt of the Undying
  material_necro_dust: '/assets/materials/material_necro_dust.png',
  material_bone_rune: '/assets/materials/material_bone_rune.png',
  // T2 — D5 Ice Cavern
  material_frostwood: '/assets/materials/material_frostwood.png',
  material_glacial_shard: '/assets/materials/material_glacial_shard.png',
  // T3 — D6 Dark Forest
  material_elder_bark: '/assets/materials/material_elder_bark.png',
  material_living_sap: '/assets/materials/material_living_sap.png',
  // T3 — D7 Molten Quarry
  material_cinder_stone: '/assets/materials/material_cinder_stone.png',
  material_magma_core: '/assets/materials/material_magma_core.png',
  // T3 — D8 Ashen Fortress
  material_ash_crystal: '/assets/materials/material_ash_crystal.png',
  material_charred_bone: '/assets/materials/material_charred_bone.png',
  // T4 — D9 Demon's Gate
  material_demon_ichor: '/assets/materials/material_demon_ichor.png',
  material_cursed_steel: '/assets/materials/material_cursed_steel.png',
  // T4 — D10 Dragon's Lair
  material_dragon_bone: '/assets/materials/material_dragon_bone.png',
  material_void_scale: '/assets/materials/material_void_scale.png',

  // Catalysts by rarity
  catalyst_common: '/assets/materials/catalyst_common.png',
  catalyst_uncommon: '/assets/materials/catalyst_uncommon.png',
  catalyst_rare: '/assets/materials/catalyst_rare.png',
  catalyst_epic: '/assets/materials/catalyst_epic.png',
  catalyst_legendary: '/assets/materials/catalyst_legendary.png',

  // Components — Melee
  component_melee_blade_core: '/assets/materials/component_melee_blade_core.png',
  component_melee_weapon_hilt: '/assets/materials/component_melee_weapon_hilt.png',
  component_melee_edge_reinforcement: '/assets/materials/component_melee_edge_reinforcement.png',
  component_melee_blood_channel: '/assets/materials/component_melee_blood_channel.png',

  // Components — Range
  component_range_bow_frame: '/assets/materials/component_range_bow_frame.png',
  component_range_tension_string: '/assets/materials/component_range_tension_string.png',
  component_range_arrow_mechanism: '/assets/materials/component_range_arrow_mechanism.png',
  component_range_precision_sight: '/assets/materials/component_range_precision_sigh.png',
  component_range_precision_sigh: '/assets/materials/component_range_precision_sigh.png',

  // Components — Magic
  component_magic_arcane_focus: '/assets/materials/component_magic_arcane_focus.png',
  component_magic_mana_conduit: '/assets/materials/component_magic_mana_conduit.png',
  component_magic_rune_core: '/assets/materials/component_magic_rune_core.png',
  component_magic_spell_channeler: '/assets/materials/component_magic_spell_channeler.png',

  // Components — Defense
  component_defense_armor_plating: '/assets/materials/component_defense_armor_plating.png',
  component_defense_reinforced_core: '/assets/materials/component_defense_reinforced_core.png',
  component_defense_shield_frame: '/assets/materials/component_defense_shield_frame.png',
  component_defense_impact_dampener: '/assets/materials/component_defense_impact_dampener.png',

  // Components — Transport Merchant
  component_merchant_reinforced_axle: '/assets/materials/component_merchant_reinforced_axle.png',
  component_merchant_wagon_frame: '/assets/materials/component_merchant_wagon_frame.png',
  component_merchant_cargo_hold: '/assets/materials/component_merchant_cargo_hold.png',
  component_merchant_trade_compartment: '/assets/materials/component_merchant_trade_compartment.png',
  component_merchant_load_stabilizer: '/assets/materials/component_merchant_load_stabilizer.png',
  component_merchant_secure_lock: '/assets/materials/component_merchant_secure_lock.png',

  // Components — Transport Trade
  component_trade_reinforced_axle: '/assets/materials/component_trade_reinforced_axle.png',
  component_trade_cargo_hold: '/assets/materials/component_cargo_hold.jpg',
  component_trade_compartment: '/assets/materials/component_trade_compartment.jpg',
  component_trade_manifest_seal: '/assets/materials/component_trade_manifest_seal.png',

  // Components — Transport Luxury
  component_luxury_silk_interior: '/assets/materials/component_luxury_silk_interior.png',
  component_luxury_ornament_fram: '/assets/materials/component_luxury_ornament_fram.png',
  component_luxury_ornament_frame: '/assets/materials/component_luxury_ornament_fram.png',
  component_luxury_comfort_suspension: '/assets/materials/component_luxury_comfort_suspension.png',
  component_luxury_gold_trim: '/assets/materials/component_luxury_gold_trim.png',

  // Components — Transport Prestige
  component_prestige_arcane_engine: '/assets/materials/component_prestige_arcane_engine.png',
  component_prestige_phantom_core: '/assets/materials/component_prestige_phantom_core.png',
  component_prestige_speed_matrix: '/assets/materials/component_prestige_speed_matrix.png',
  component_prestige_void_stabilizer: '/assets/materials/component_prestige_void_stabilizer.png',
  component_prestige_temporal_flux: '/assets/materials/component_prestige_temporal_flux.png',

  // Components — Transport Military
  component_military_reinforced_axle: '/assets/materials/component_military_reinforced_axle.png',
  component_military_siege_mount: '/assets/materials/component_military_siege_mount.png',
  component_military_weapon_rack: '/assets/materials/component_military_weapon_rack.png',
  component_military_armor_plating: '/assets/materials/component_military_armor_plating.png',

  // Packs and Special Items
  booster_pack: '/assets/materials/booster_pack.jpg',
  standard_pack: '/assets/materials/standard_pack.png',
}

export const getMaterialImage = (id: string, name?: string): string | null => {
  // Try direct match first (e.g., material_goblin_iron or catalyst_common)
  if (MATERIAL_IMAGES[id]) return MATERIAL_IMAGES[id]
  
  // Try with material_ prefix if not found
  const materialPrefixed = `material_${id.toLowerCase().replace(/\s+/g, '_')}`
  if (MATERIAL_IMAGES[materialPrefixed]) return MATERIAL_IMAGES[materialPrefixed]
  
  // Try by name conversion (e.g., "Common Catalyst" -> "catalyst_common")
  if (name) {
    const nameLower = name.toLowerCase()
    // Handle catalyst names
    if (nameLower.includes('catalyst')) {
      if (nameLower.includes('legendary')) return MATERIAL_IMAGES['catalyst_legendary']
      if (nameLower.includes('epic')) return MATERIAL_IMAGES['catalyst_epic']
      if (nameLower.includes('rare')) return MATERIAL_IMAGES['catalyst_rare']
      if (nameLower.includes('uncommon')) return MATERIAL_IMAGES['catalyst_uncommon']
      if (nameLower.includes('common')) return MATERIAL_IMAGES['catalyst_common']
    }
    
    // Try to find by component name
    const componentKey = Object.keys(MATERIAL_IMAGES).find(key => 
      key.includes(nameLower.replace(/\s+/g, '_'))
    )
    if (componentKey) return MATERIAL_IMAGES[componentKey]
  }
  
  return null
}

export default MATERIAL_IMAGES
