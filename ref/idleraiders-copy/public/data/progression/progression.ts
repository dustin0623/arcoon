import getCardStats from '../cards/cardConfig'

/* =========================================================
   ACHIEVEMENTS
========================================================= */

export const ACHIEVEMENTS = [
  // ── Combat Achievements ─────────────────────────────────────
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Complete your first mission',
    icon: '⚔️',
    category: 'combat',
    check: (s) => s.totalMissions >= 1,
    rewards: { coins: 100 },
  },
  {
    id: 'veteran',
    title: 'Veteran Raider',
    description: 'Complete 50 missions',
    icon: '🗡️',
    category: 'combat',
    check: (s) => s.totalMissions >= 50,
    rewards: { coins: 500, shards: 5 },
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Complete 100 missions',
    icon: '🛡️',
    category: 'combat',
    check: (s) => s.totalMissions >= 100,
    rewards: { coins: 1000, shards: 10 },
  },
  {
    id: 'warlord',
    title: 'Warlord',
    description: 'Complete 500 missions',
    icon: '👑',
    category: 'combat',
    check: (s) => s.totalMissions >= 500,
    rewards: { coins: 5000, shards: 50 },
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    description: 'Deal 10,000 boss damage',
    icon: '🐉',
    category: 'combat',
    check: (s) => s.totalBossDamage >= 10000,
    rewards: { coins: 250, shards: 3 },
  },
  {
    id: 'dragon_killer',
    title: 'Dragon Killer',
    description: 'Deal 100,000 boss damage',
    icon: '💀',
    category: 'combat',
    check: (s) => s.totalBossDamage >= 100000,
    rewards: { coins: 1500, shards: 15 },
  },
  {
    id: 'godslayer',
    title: 'Godslayer',
    description: 'Deal 1,000,000 boss damage',
    icon: '⚡',
    category: 'combat',
    check: (s) => s.totalBossDamage >= 1000000,
    rewards: { coins: 10000, shards: 100 },
  },

  // ── Collection Achievements ─────────────────────────────────
  {
    id: 'collector_10',
    title: 'Collector',
    description: 'Own 10 unique cards',
    icon: '🃏',
    category: 'collection',
    check: (s) => s.uniqueCards >= 10,
    rewards: { coins: 200 },
  },
  {
    id: 'collector_25',
    title: 'Hoarder',
    description: 'Own 25 unique cards',
    icon: '📚',
    category: 'collection',
    check: (s) => s.uniqueCards >= 25,
    rewards: { coins: 750, shards: 8 },
  },
  {
    id: 'collector_50',
    title: 'Archivist',
    description: 'Own 50 unique cards',
    icon: '🏛️',
    category: 'collection',
    check: (s) => s.uniqueCards >= 50,
    rewards: { coins: 2000, shards: 25 },
  },

  // ── Progression Achievements ────────────────────────────────
  {
    id: 'lvl_5',
    title: 'Apprentice',
    description: 'Reach level 5',
    icon: '🌱',
    category: 'progression',
    check: (s) => s.playerLevel >= 5,
    rewards: { coins: 150 },
  },
  {
    id: 'lvl_10',
    title: 'Journeyman',
    description: 'Reach level 10',
    icon: '🌿',
    category: 'progression',
    check: (s) => s.playerLevel >= 10,
    rewards: { coins: 300, shards: 3 },
  },
  {
    id: 'lvl_25',
    title: 'Expert',
    description: 'Reach level 25',
    icon: '🌳',
    category: 'progression',
    check: (s) => s.playerLevel >= 25,
    rewards: { coins: 1000, shards: 12 },
  },
  {
    id: 'lvl_50',
    title: 'Master',
    description: 'Reach level 50',
    icon: '⭐',
    category: 'progression',
    check: (s) => s.playerLevel >= 50,
    rewards: { coins: 3000, shards: 35 },
  },
  {
    id: 'lvl_100',
    title: 'Legend',
    description: 'Reach level 100',
    icon: '🌟',
    category: 'progression',
    check: (s) => s.playerLevel >= 100,
    rewards: { coins: 10000, shards: 100 },
  },

  // ── Social Achievements ─────────────────────────────────────
  {
    id: 'guild_member',
    title: 'Guild Member',
    description: 'Join a guild',
    icon: '🏰',
    category: 'social',
    check: (s) => s.inGuild,
    rewards: { coins: 500, shards: 5 },
  },
]

/* =========================================================
   CRAFTING
========================================================= */

export const CRAFTING = [
  // ─────────────────────────────────────────────
  // EQUIPMENT — MELEE
  // ─────────────────────────────────────────────
  {
    id: 'craft_equipment_melee_common',
    name: 'Rusted Iron Sword',
    type: 'equipment',
    class: 'melee',
    rarity: 'common',
    stats: getCardStats({ type: 'equipment', rarity: 'common' }),
    requirements: {
      shardCost: 1,
      catalystId: 'catalyst_common',
      materials: [
        { materialId: 'material_goblin_iron', quantity: 8 },
        { materialId: 'material_crude_leather', quantity: 5 },
      ],
      components: [
        { materialId: 'comp_melee_weapon_hilt', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_melee_uncommon',
    name: 'Goblin Forged Blade',
    type: 'equipment',
    class: 'melee',
    rarity: 'uncommon',
    stats: getCardStats({ type: 'equipment', rarity: 'uncommon' }),
    requirements: {
      shardCost: 2,
      catalystId: 'catalyst_uncommon',
      materials: [
        { materialId: 'material_goblin_iron', quantity: 12 },
        { materialId: 'material_crude_leather', quantity: 6 },
        { materialId: 'material_silk_thread', quantity: 4 },
      ],
      components: [
        { materialId: 'comp_melee_blade_core', quantity: 1 },
        { materialId: 'comp_melee_weapon_hilt', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_melee_rare',
    name: 'Soulbound Greatsword',
    type: 'equipment',
    class: 'melee',
    rarity: 'rare',
    stats: getCardStats({ type: 'equipment', rarity: 'rare' }),
    requirements: {
      shardCost: 4,
      catalystId: 'catalyst_rare',
      materials: [
        { materialId: 'material_soul_ash', quantity: 8 },
        { materialId: 'material_bone_rune', quantity: 6 },
        { materialId: 'material_goblin_iron', quantity: 10 },
      ],
      components: [
        { materialId: 'comp_melee_blade_core', quantity: 1 },
        { materialId: 'comp_melee_edge_reinforcement', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_melee_epic',
    name: 'Infernal Warblade',
    type: 'equipment',
    class: 'melee',
    rarity: 'epic',
    stats: getCardStats({ type: 'equipment', rarity: 'epic' }),
    requirements: {
      shardCost: 8,
      catalystId: 'catalyst_epic',
      materials: [
        { materialId: 'material_cinder_stone', quantity: 10 },
        { materialId: 'material_magma_core', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 10 },
        { materialId: 'material_frostwood', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_melee_blade_core', quantity: 1 },
        { materialId: 'comp_melee_edge_reinforcement', quantity: 1 },
        { materialId: 'comp_melee_blood_channel', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_melee_legendary',
    name: 'Dragonbone Executioner',
    type: 'equipment',
    class: 'melee',
    rarity: 'legendary',
    stats: getCardStats({ type: 'equipment', rarity: 'legendary' }),
    requirements: {
      shardCost: 16,
      catalystId: 'catalyst_legendary',
      materials: [
        { materialId: 'material_dragon_bone', quantity: 10 },
        { materialId: 'material_void_scale', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 12 },
        { materialId: 'material_cursed_steel', quantity: 8 },
        { materialId: 'material_frostwood', quantity: 8 },
      ],
      components: [
        { materialId: 'comp_melee_blade_core', quantity: 1 },
        { materialId: 'comp_melee_weapon_hilt', quantity: 1 },
        { materialId: 'comp_melee_edge_reinforcement', quantity: 1 },
        { materialId: 'comp_melee_blood_channel', quantity: 1 },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // EQUIPMENT — RANGE
  // ─────────────────────────────────────────────
  {
    id: 'craft_equipment_range_common',
    name: "Hunter's Shortbow",
    type: 'equipment',
    class: 'range',
    rarity: 'common',
    stats: getCardStats({ type: 'equipment', rarity: 'common' }),
    requirements: {
      shardCost: 1,
      catalystId: 'catalyst_common',
      materials: [
        { materialId: 'material_crude_leather', quantity: 6 },
        { materialId: 'material_silk_thread', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_range_bow_frame', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_range_uncommon',
    name: 'Silkthread Bow',
    type: 'equipment',
    class: 'range',
    rarity: 'uncommon',
    stats: getCardStats({ type: 'equipment', rarity: 'uncommon' }),
    requirements: {
      shardCost: 2,
      catalystId: 'catalyst_uncommon',
      materials: [
        { materialId: 'material_silk_thread', quantity: 10 },
        { materialId: 'material_chitin_plate', quantity: 5 },
        { materialId: 'material_crude_leather', quantity: 4 },
      ],
      components: [
        { materialId: 'comp_range_bow_frame', quantity: 1 },
        { materialId: 'comp_range_tension_string', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_range_rare',
    name: 'Froststeel Bow',
    type: 'equipment',
    class: 'range',
    rarity: 'rare',
    stats: getCardStats({ type: 'equipment', rarity: 'rare' }),
    requirements: {
      shardCost: 4,
      catalystId: 'catalyst_rare',
      materials: [
        { materialId: 'material_frostwood', quantity: 10 },
        { materialId: 'material_glacial_shard', quantity: 6 },
        { materialId: 'material_silk_thread', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_range_bow_frame', quantity: 1 },
        { materialId: 'comp_range_tension_string', quantity: 1 },
        { materialId: 'comp_range_precision_sight', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_range_epic',
    name: 'Shadowstrike Longbow',
    type: 'equipment',
    class: 'range',
    rarity: 'epic',
    stats: getCardStats({ type: 'equipment', rarity: 'epic' }),
    requirements: {
      shardCost: 8,
      catalystId: 'catalyst_epic',
      materials: [
        { materialId: 'material_ash_crystal', quantity: 8 },
        { materialId: 'material_charred_bone', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 8 },
        { materialId: 'material_frostwood', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_range_bow_frame', quantity: 1 },
        { materialId: 'comp_range_arrow_mechanism', quantity: 1 },
        { materialId: 'comp_range_precision_sight', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_range_legendary',
    name: 'Voidpiercer Bow',
    type: 'equipment',
    class: 'range',
    rarity: 'legendary',
    stats: getCardStats({ type: 'equipment', rarity: 'legendary' }),
    requirements: {
      shardCost: 16,
      catalystId: 'catalyst_legendary',
      materials: [
        { materialId: 'material_void_scale', quantity: 8 },
        { materialId: 'material_dragon_bone', quantity: 8 },
        { materialId: 'material_frostwood', quantity: 10 },
        { materialId: 'material_silk_thread', quantity: 10 },
        { materialId: 'material_demon_ichor', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_range_bow_frame', quantity: 1 },
        { materialId: 'comp_range_tension_string', quantity: 1 },
        { materialId: 'comp_range_arrow_mechanism', quantity: 1 },
        { materialId: 'comp_range_precision_sight', quantity: 1 },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // EQUIPMENT — MAGIC
  // ─────────────────────────────────────────────
  {
    id: 'craft_equipment_magic_common',
    name: 'Apprentice Wand',
    type: 'equipment',
    class: 'magic',
    rarity: 'common',
    stats: getCardStats({ type: 'equipment', rarity: 'common' }),
    requirements: {
      shardCost: 1,
      catalystId: 'catalyst_common',
      materials: [
        { materialId: 'material_soul_ash', quantity: 5 },
        { materialId: 'material_grave_cloth', quantity: 5 },
      ],
      components: [
        { materialId: 'comp_magic_arcane_focus', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_magic_uncommon',
    name: 'Bone Rune Staff',
    type: 'equipment',
    class: 'magic',
    rarity: 'uncommon',
    stats: getCardStats({ type: 'equipment', rarity: 'uncommon' }),
    requirements: {
      shardCost: 2,
      catalystId: 'catalyst_uncommon',
      materials: [
        { materialId: 'material_necro_dust', quantity: 8 },
        { materialId: 'material_bone_rune', quantity: 6 },
        { materialId: 'material_soul_ash', quantity: 4 },
      ],
      components: [
        { materialId: 'comp_magic_arcane_focus', quantity: 1 },
        { materialId: 'comp_magic_rune_core', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_magic_rare',
    name: 'Necromancer Staff',
    type: 'equipment',
    class: 'magic',
    rarity: 'rare',
    stats: getCardStats({ type: 'equipment', rarity: 'rare' }),
    requirements: {
      shardCost: 4,
      catalystId: 'catalyst_rare',
      materials: [
        { materialId: 'material_necro_dust', quantity: 10 },
        { materialId: 'material_bone_rune', quantity: 8 },
        { materialId: 'material_frostwood', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_magic_arcane_focus', quantity: 1 },
        { materialId: 'comp_magic_rune_core', quantity: 1 },
        { materialId: 'comp_magic_mana_conduit', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_magic_epic',
    name: 'Ashen Arcane Staff',
    type: 'equipment',
    class: 'magic',
    rarity: 'epic',
    stats: getCardStats({ type: 'equipment', rarity: 'epic' }),
    requirements: {
      shardCost: 8,
      catalystId: 'catalyst_epic',
      materials: [
        { materialId: 'material_ash_crystal', quantity: 10 },
        { materialId: 'material_charred_bone', quantity: 8 },
        { materialId: 'material_necro_dust', quantity: 8 },
      ],
      components: [
        { materialId: 'comp_magic_arcane_focus', quantity: 1 },
        { materialId: 'comp_magic_mana_conduit', quantity: 1 },
        { materialId: 'comp_magic_spell_channeler', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_magic_legendary',
    name: 'Dragon Soul Catalyst Staff',
    type: 'equipment',
    class: 'magic',
    rarity: 'legendary',
    stats: getCardStats({ type: 'equipment', rarity: 'legendary' }),
    requirements: {
      shardCost: 16,
      catalystId: 'catalyst_legendary',
      materials: [
        { materialId: 'material_dragon_bone', quantity: 8 },
        { materialId: 'material_void_scale', quantity: 8 },
        { materialId: 'material_demon_ichor', quantity: 8 },
        { materialId: 'material_bone_rune', quantity: 10 },
      ],
      components: [
        { materialId: 'comp_magic_arcane_focus', quantity: 1 },
        { materialId: 'comp_magic_mana_conduit', quantity: 1 },
        { materialId: 'comp_magic_rune_core', quantity: 1 },
        { materialId: 'comp_magic_spell_channeler', quantity: 1 },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // EQUIPMENT — DEFENSE
  // ─────────────────────────────────────────────
  {
    id: 'craft_equipment_defense_common',
    name: 'Leather Guard Armor',
    type: 'equipment',
    class: 'defense',
    rarity: 'common',
    stats: getCardStats({ type: 'equipment', rarity: 'common' }),
    requirements: {
      shardCost: 1,
      catalystId: 'catalyst_common',
      materials: [
        { materialId: 'material_crude_leather', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 5 },
      ],
      components: [
        { materialId: 'comp_defense_armor_plating', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_defense_uncommon',
    name: 'Reinforced Bone Armor',
    type: 'equipment',
    class: 'defense',
    rarity: 'uncommon',
    stats: getCardStats({ type: 'equipment', rarity: 'uncommon' }),
    requirements: {
      shardCost: 2,
      catalystId: 'catalyst_uncommon',
      materials: [
        { materialId: 'material_grave_cloth', quantity: 8 },
        { materialId: 'material_bone_rune', quantity: 5 },
        { materialId: 'material_crude_leather', quantity: 5 },
      ],
      components: [
        { materialId: 'comp_defense_armor_plating', quantity: 1 },
        { materialId: 'comp_defense_reinforced_core', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_defense_rare',
    name: 'Froststeel Shield',
    type: 'equipment',
    class: 'defense',
    rarity: 'rare',
    stats: getCardStats({ type: 'equipment', rarity: 'rare' }),
    requirements: {
      shardCost: 4,
      catalystId: 'catalyst_rare',
      materials: [
        { materialId: 'material_frostwood', quantity: 8 },
        { materialId: 'material_glacial_shard', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 8 },
      ],
      components: [
        { materialId: 'comp_defense_shield_frame', quantity: 1 },
        { materialId: 'comp_defense_reinforced_core', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_defense_epic',
    name: 'Emberguard Plate',
    type: 'equipment',
    class: 'defense',
    rarity: 'epic',
    stats: getCardStats({ type: 'equipment', rarity: 'epic' }),
    requirements: {
      shardCost: 8,
      catalystId: 'catalyst_epic',
      materials: [
        { materialId: 'material_cinder_stone', quantity: 10 },
        { materialId: 'material_magma_core', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 8 },
        { materialId: 'material_crude_leather', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_defense_armor_plating', quantity: 1 },
        { materialId: 'comp_defense_reinforced_core', quantity: 1 },
        { materialId: 'comp_defense_impact_dampener', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_equipment_defense_legendary',
    name: 'Voidforged Aegis',
    type: 'equipment',
    class: 'defense',
    rarity: 'legendary',
    stats: getCardStats({ type: 'equipment', rarity: 'legendary' }),
    requirements: {
      shardCost: 16,
      catalystId: 'catalyst_legendary',
      materials: [
        { materialId: 'material_void_scale', quantity: 8 },
        { materialId: 'material_cursed_steel', quantity: 10 },
        { materialId: 'material_frostwood', quantity: 8 },
        { materialId: 'material_ash_crystal', quantity: 8 },
      ],
      components: [
        { materialId: 'comp_defense_armor_plating', quantity: 1 },
        { materialId: 'comp_defense_reinforced_core', quantity: 1 },
        { materialId: 'comp_defense_shield_frame', quantity: 1 },
        { materialId: 'comp_defense_impact_dampener', quantity: 1 },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // TRANSPORT — MERCHANT
  // ─────────────────────────────────────────────
  {
    id: 'craft_transport_merchant_common',
    name: 'Wooden Trade Cart',
    type: 'transport',
    class: 'merchant',
    rarity: 'common',
    stats: getCardStats({ type: 'transport', rarity: 'common' }),
    requirements: {
      shardCost: 1,
      catalystId: 'catalyst_common',
      materials: [
        { materialId: 'material_crude_leather', quantity: 6 },
        { materialId: 'material_goblin_iron', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_merchant_wagon_frame', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_merchant_uncommon',
    name: 'Reinforced Trade Wagon',
    type: 'transport',
    class: 'merchant',
    rarity: 'uncommon',
    stats: getCardStats({ type: 'transport', rarity: 'uncommon' }),
    requirements: {
      shardCost: 2,
      catalystId: 'catalyst_uncommon',
      materials: [
        { materialId: 'material_crude_leather', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 5 },
      ],
      components: [
        { materialId: 'comp_merchant_wagon_frame', quantity: 1 },
        { materialId: 'comp_merchant_storage_system', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_merchant_rare',
    name: 'Merchant Caravan',
    type: 'transport',
    class: 'merchant',
    rarity: 'rare',
    stats: getCardStats({ type: 'transport', rarity: 'rare' }),
    requirements: {
      shardCost: 4,
      catalystId: 'catalyst_rare',
      materials: [
        { materialId: 'material_frostwood', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 8 },
      ],
      components: [
        { materialId: 'comp_merchant_wagon_frame', quantity: 1 },
        { materialId: 'comp_merchant_storage_system', quantity: 1 },
        { materialId: 'comp_merchant_protection_seal', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_merchant_epic',
    name: 'Golden Trade Convoy',
    type: 'transport',
    class: 'merchant',
    rarity: 'epic',
    stats: getCardStats({ type: 'transport', rarity: 'epic' }),
    requirements: {
      shardCost: 8,
      catalystId: 'catalyst_epic',
      materials: [
        { materialId: 'material_cinder_stone', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 10 },
        { materialId: 'material_silk_thread', quantity: 10 },
        { materialId: 'material_frostwood', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_merchant_wagon_frame', quantity: 1 },
        { materialId: 'comp_merchant_storage_system', quantity: 1 },
        { materialId: 'comp_merchant_protection_seal', quantity: 1 },
        { materialId: 'comp_merchant_gold_chamber', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_merchant_legendary',
    name: 'Dragon Trade Caravan',
    type: 'transport',
    class: 'merchant',
    rarity: 'legendary',
    stats: getCardStats({ type: 'transport', rarity: 'legendary' }),
    requirements: {
      shardCost: 16,
      catalystId: 'catalyst_legendary',
      materials: [
        { materialId: 'material_dragon_bone', quantity: 8 },
        { materialId: 'material_void_scale', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 12 },
        { materialId: 'material_cinder_stone', quantity: 8 },
        { materialId: 'material_cursed_steel', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_merchant_wagon_frame', quantity: 1 },
        { materialId: 'comp_merchant_storage_system', quantity: 1 },
        { materialId: 'comp_merchant_protection_seal', quantity: 1 },
        { materialId: 'comp_merchant_gold_chamber', quantity: 1 },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // TRANSPORT — MILITARY
  // ─────────────────────────────────────────────
  {
    id: 'craft_transport_military_common',
    name: 'Supply War Cart',
    type: 'transport',
    class: 'military',
    rarity: 'common',
    stats: getCardStats({ type: 'transport', rarity: 'common' }),
    requirements: {
      shardCost: 1,
      catalystId: 'catalyst_common',
      materials: [
        { materialId: 'material_crude_leather', quantity: 6 },
        { materialId: 'material_goblin_iron', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_military_transport_frame', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_military_uncommon',
    name: 'Reinforced War Wagon',
    type: 'transport',
    class: 'military',
    rarity: 'uncommon',
    stats: getCardStats({ type: 'transport', rarity: 'uncommon' }),
    requirements: {
      shardCost: 2,
      catalystId: 'catalyst_uncommon',
      materials: [
        { materialId: 'material_goblin_iron', quantity: 10 },
        { materialId: 'material_crude_leather', quantity: 8 },
        { materialId: 'material_bone_rune', quantity: 5 },
      ],
      components: [
        { materialId: 'comp_military_transport_frame', quantity: 1 },
        { materialId: 'comp_military_armor_plating', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_military_rare',
    name: 'Siege Transport',
    type: 'transport',
    class: 'military',
    rarity: 'rare',
    stats: getCardStats({ type: 'transport', rarity: 'rare' }),
    requirements: {
      shardCost: 4,
      catalystId: 'catalyst_rare',
      materials: [
        { materialId: 'material_goblin_iron', quantity: 12 },
        { materialId: 'material_bone_rune', quantity: 8 },
        { materialId: 'material_frostwood', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_military_transport_frame', quantity: 1 },
        { materialId: 'comp_military_armor_plating', quantity: 1 },
        { materialId: 'comp_military_weapons_mount', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_military_epic',
    name: 'Ember War Chariot',
    type: 'transport',
    class: 'military',
    rarity: 'epic',
    stats: getCardStats({ type: 'transport', rarity: 'epic' }),
    requirements: {
      shardCost: 8,
      catalystId: 'catalyst_epic',
      materials: [
        { materialId: 'material_cinder_stone', quantity: 10 },
        { materialId: 'material_magma_core', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 10 },
        { materialId: 'material_charred_bone', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_military_transport_frame', quantity: 1 },
        { materialId: 'comp_military_armor_plating', quantity: 1 },
        { materialId: 'comp_military_weapons_mount', quantity: 1 },
        { materialId: 'comp_military_siege_platform', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_military_legendary',
    name: 'Demon Siege Engine',
    type: 'transport',
    class: 'military',
    rarity: 'legendary',
    stats: getCardStats({ type: 'transport', rarity: 'legendary' }),
    requirements: {
      shardCost: 16,
      catalystId: 'catalyst_legendary',
      materials: [
        { materialId: 'material_demon_ichor', quantity: 8 },
        { materialId: 'material_void_scale', quantity: 8 },
        { materialId: 'material_dragon_bone', quantity: 8 },
        { materialId: 'material_cursed_steel', quantity: 10 },
        { materialId: 'material_magma_core', quantity: 8 },
      ],
      components: [
        { materialId: 'comp_military_transport_frame', quantity: 1 },
        { materialId: 'comp_military_armor_plating', quantity: 1 },
        { materialId: 'comp_military_weapons_mount', quantity: 1 },
        { materialId: 'comp_military_siege_platform', quantity: 1 },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // TRANSPORT — LUXURY
  // ─────────────────────────────────────────────
  {
    id: 'craft_transport_luxury_common',
    name: 'Noble Carriage',
    type: 'transport',
    class: 'luxury',
    rarity: 'common',
    stats: getCardStats({ type: 'transport', rarity: 'common' }),
    requirements: {
      shardCost: 1,
      catalystId: 'catalyst_common',
      materials: [
        { materialId: 'material_crude_leather', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 5 },
      ],
      components: [
        { materialId: 'comp_luxury_carriage_frame', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_luxury_uncommon',
    name: 'Silk Caravan',
    type: 'transport',
    class: 'luxury',
    rarity: 'uncommon',
    stats: getCardStats({ type: 'transport', rarity: 'uncommon' }),
    requirements: {
      shardCost: 2,
      catalystId: 'catalyst_uncommon',
      materials: [
        { materialId: 'material_crude_leather', quantity: 10 },
        { materialId: 'material_silk_thread', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 4 },
      ],
      components: [
        { materialId: 'comp_luxury_carriage_frame', quantity: 1 },
        { materialId: 'comp_luxury_upholstery_system', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_luxury_rare',
    name: 'Royal Carriage',
    type: 'transport',
    class: 'luxury',
    rarity: 'rare',
    stats: getCardStats({ type: 'transport', rarity: 'rare' }),
    requirements: {
      shardCost: 4,
      catalystId: 'catalyst_rare',
      materials: [
        { materialId: 'material_frostwood', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 10 },
        { materialId: 'material_bone_rune', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_luxury_carriage_frame', quantity: 1 },
        { materialId: 'comp_luxury_upholstery_system', quantity: 1 },
        { materialId: 'comp_luxury_aesthetic_trim', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_luxury_epic',
    name: 'Phoenix Carriage',
    type: 'transport',
    class: 'luxury',
    rarity: 'epic',
    stats: getCardStats({ type: 'transport', rarity: 'epic' }),
    requirements: {
      shardCost: 8,
      catalystId: 'catalyst_epic',
      materials: [
        { materialId: 'material_cinder_stone', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 12 },
        { materialId: 'material_ash_crystal', quantity: 8 },
        { materialId: 'material_frostwood', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_luxury_carriage_frame', quantity: 1 },
        { materialId: 'comp_luxury_upholstery_system', quantity: 1 },
        { materialId: 'comp_luxury_aesthetic_trim', quantity: 1 },
        { materialId: 'comp_luxury_enchanted_suspension', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_luxury_legendary',
    name: 'Celestial Royal Convoy',
    type: 'transport',
    class: 'luxury',
    rarity: 'legendary',
    stats: getCardStats({ type: 'transport', rarity: 'legendary' }),
    requirements: {
      shardCost: 16,
      catalystId: 'catalyst_legendary',
      materials: [
        { materialId: 'material_dragon_bone', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 14 },
        { materialId: 'material_void_scale', quantity: 8 },
        { materialId: 'material_ash_crystal', quantity: 8 },
        { materialId: 'material_soul_ash', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_luxury_carriage_frame', quantity: 1 },
        { materialId: 'comp_luxury_upholstery_system', quantity: 1 },
        { materialId: 'comp_luxury_aesthetic_trim', quantity: 1 },
        { materialId: 'comp_luxury_enchanted_suspension', quantity: 1 },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // TRANSPORT — PRESTIGE
  // ─────────────────────────────────────────────
  {
    id: 'craft_transport_prestige_common',
    name: 'Courier Cart',
    type: 'transport',
    class: 'prestige',
    rarity: 'common',
    stats: getCardStats({ type: 'transport', rarity: 'common' }),
    requirements: {
      shardCost: 1,
      catalystId: 'catalyst_common',
      materials: [
        { materialId: 'material_crude_leather', quantity: 6 },
        { materialId: 'material_goblin_iron', quantity: 5 },
      ],
      components: [
        { materialId: 'comp_prestige_courier_frame', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_prestige_uncommon',
    name: 'Elite Delivery Wagon',
    type: 'transport',
    class: 'prestige',
    rarity: 'uncommon',
    stats: getCardStats({ type: 'transport', rarity: 'uncommon' }),
    requirements: {
      shardCost: 2,
      catalystId: 'catalyst_uncommon',
      materials: [
        { materialId: 'material_crude_leather', quantity: 8 },
        { materialId: 'material_goblin_iron', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_prestige_courier_frame', quantity: 1 },
        { materialId: 'comp_prestige_speed_system', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_prestige_rare',
    name: 'Shadow Courier',
    type: 'transport',
    class: 'prestige',
    rarity: 'rare',
    stats: getCardStats({ type: 'transport', rarity: 'rare' }),
    requirements: {
      shardCost: 4,
      catalystId: 'catalyst_rare',
      materials: [
        { materialId: 'material_frostwood', quantity: 8 },
        { materialId: 'material_bone_rune', quantity: 6 },
        { materialId: 'material_silk_thread', quantity: 8 },
      ],
      components: [
        { materialId: 'comp_prestige_courier_frame', quantity: 1 },
        { materialId: 'comp_prestige_speed_system', quantity: 1 },
        { materialId: 'comp_prestige_stealth_coating', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_prestige_epic',
    name: 'Phantom Transport',
    type: 'transport',
    class: 'prestige',
    rarity: 'epic',
    stats: getCardStats({ type: 'transport', rarity: 'epic' }),
    requirements: {
      shardCost: 8,
      catalystId: 'catalyst_epic',
      materials: [
        { materialId: 'material_ash_crystal', quantity: 8 },
        { materialId: 'material_charred_bone', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 10 },
        { materialId: 'material_frostwood', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_prestige_courier_frame', quantity: 1 },
        { materialId: 'comp_prestige_speed_system', quantity: 1 },
        { materialId: 'comp_prestige_stealth_coating', quantity: 1 },
        { materialId: 'comp_prestige_phantom_drive', quantity: 1 },
      ],
    },
  },
  {
    id: 'craft_transport_prestige_legendary',
    name: 'Void Merchant Cart',
    type: 'transport',
    class: 'prestige',
    rarity: 'legendary',
    stats: getCardStats({ type: 'transport', rarity: 'legendary' }),
    requirements: {
      shardCost: 16,
      catalystId: 'catalyst_legendary',
      materials: [
        { materialId: 'material_void_scale', quantity: 8 },
        { materialId: 'material_demon_ichor', quantity: 8 },
        { materialId: 'material_silk_thread', quantity: 12 },
        { materialId: 'material_ash_crystal', quantity: 8 },
        { materialId: 'material_cursed_steel', quantity: 6 },
      ],
      components: [
        { materialId: 'comp_prestige_courier_frame', quantity: 1 },
        { materialId: 'comp_prestige_speed_system', quantity: 1 },
        { materialId: 'comp_prestige_stealth_coating', quantity: 1 },
        { materialId: 'comp_prestige_phantom_drive', quantity: 1 },
      ],
    },
  },
]


/* =========================================================
   GUILDS
========================================================= */

// Guild XP system - XP is consumed on level up (progressive like player XP)
// Max level is 15, max cumulative XP is 1,000,000
// Buffs: xpBonus, materialBonus, energyRegen, bossDamage (all percentages as decimals)
// Target: 50% for XP, Material, Energy at level 15 (~3.5% per level)
export const GUILD_LEVELS = [
  // Level 1: Starting guild
  { level: 1, xpRequired: 0, unlock: 'Guild access', cumulative: 0, xpBonus: 0, materialBonus: 0, energyRegen: 0, bossDamage: 0 },
  
  // Level 2: First milestone - 5K XP
  { level: 2, xpRequired: 5_000, unlock: '+4% XP bonus', cumulative: 5_000, xpBonus: 0.04, materialBonus: 0, energyRegen: 0, bossDamage: 0 },
  
  // Level 3: 10K XP (15K cumulative)
  { level: 3, xpRequired: 10_000, unlock: '+4% material bonus', cumulative: 15_000, xpBonus: 0.04, materialBonus: 0.04, energyRegen: 0, bossDamage: 0 },
  
  // Level 4: 15K XP (30K cumulative)
  { level: 4, xpRequired: 15_000, unlock: '+8% XP bonus', cumulative: 30_000, xpBonus: 0.08, materialBonus: 0.04, energyRegen: 0, bossDamage: 0 },
  
  // Level 5: 20K XP (50K cumulative)
  { level: 5, xpRequired: 20_000, unlock: '+4% energy regen', cumulative: 50_000, xpBonus: 0.08, materialBonus: 0.04, energyRegen: 0.04, bossDamage: 0 },
  
  // Level 6: 30K XP (80K cumulative)
  { level: 6, xpRequired: 30_000, unlock: '+12% material bonus', cumulative: 80_000, xpBonus: 0.12, materialBonus: 0.12, energyRegen: 0.08, bossDamage: 0 },
  
  // Level 7: 40K XP (120K cumulative)
  { level: 7, xpRequired: 40_000, unlock: '+16% XP bonus', cumulative: 120_000, xpBonus: 0.16, materialBonus: 0.12, energyRegen: 0.08, bossDamage: 0 },
  
  // Level 8: 50K XP (170K cumulative)
  { level: 8, xpRequired: 50_000, unlock: '+5% boss damage', cumulative: 170_000, xpBonus: 0.20, materialBonus: 0.16, energyRegen: 0.12, bossDamage: 0.05 },
  
  // Level 9: 60K XP (230K cumulative)
  { level: 9, xpRequired: 60_000, unlock: '+20% energy regen', cumulative: 230_000, xpBonus: 0.24, materialBonus: 0.20, energyRegen: 0.20, bossDamage: 0.05 },
  
  // Level 10: 70K XP (300K cumulative) - Major milestone
  { level: 10, xpRequired: 70_000, unlock: '+28% XP bonus', cumulative: 300_000, xpBonus: 0.28, materialBonus: 0.24, energyRegen: 0.24, bossDamage: 0.05 },
  
  // Level 11: 80K XP (380K cumulative)
  { level: 11, xpRequired: 80_000, unlock: '+28% material bonus', cumulative: 380_000, xpBonus: 0.32, materialBonus: 0.28, energyRegen: 0.28, bossDamage: 0.05 },
  
  // Level 12: 100K XP (480K cumulative)
  { level: 12, xpRequired: 100_000, unlock: '+10% boss damage', cumulative: 480_000, xpBonus: 0.36, materialBonus: 0.32, energyRegen: 0.32, bossDamage: 0.10 },
  
  // Level 13: 120K XP (600K cumulative)
  { level: 13, xpRequired: 120_000, unlock: '+40% XP bonus', cumulative: 600_000, xpBonus: 0.40, materialBonus: 0.36, energyRegen: 0.36, bossDamage: 0.10 },
  
  // Level 14: 150K XP (750K cumulative)
  { level: 14, xpRequired: 150_000, unlock: '+44% energy regen', cumulative: 750_000, xpBonus: 0.44, materialBonus: 0.44, energyRegen: 0.44, bossDamage: 0.10 },
  
  // Level 15: 250K XP (1M cumulative) - MAX LEVEL
  { level: 15, xpRequired: 250_000, unlock: 'Max guild level', cumulative: 1_000_000, xpBonus: 0.50, materialBonus: 0.50, energyRegen: 0.50, bossDamage: 0.15 },
]

// All core materials from dungeons can be donated (2 per dungeon, 20 total)
// XP rates are the same for both materials from the same dungeon.
// Rate values below are the legacy "per 10 materials" coefficient.
// Donations are batched in groups of DONATION_AMOUNT (5).
// Per-batch XP = floor((rate * 5) / 10) = floor(rate / 2).
const DONATION_RATES: Record<string, number> = {
  // D1 — Goblin Cave        (rate 50  → 25 XP per 5 donated)
  material_goblin_iron: 50,
  material_crude_leather: 50,
  // D2 — Spider Den          (rate 50  → 25 XP per 5 donated)
  material_silk_thread: 50,
  material_chitin_plate: 50,
  // D3 — Graveyard of Souls  (rate 75  → 37 XP per 5 donated)
  material_soul_ash: 75,
  material_grave_cloth: 75,
  // D4 — Crypt of the Undying (rate 75  → 37 XP per 5 donated)
  material_necro_dust: 75,
  material_bone_rune: 75,
  // D5 — Ice Cavern          (rate 100 → 50 XP per 5 donated)
  material_frostwood: 100,
  material_glacial_shard: 100,
  // D6 — Dark Forest         (rate 125 → 62 XP per 5 donated)
  material_elder_bark: 125,
  material_living_sap: 125,
  // D7 — Molten Quarry       (rate 150 → 75 XP per 5 donated)
  material_cinder_stone: 150,
  material_magma_core: 150,
  // D8 — Ashen Fortress      (rate 175 → 87 XP per 5 donated)
  material_ash_crystal: 175,
  material_charred_bone: 175,
  // D9 — Demon's Gate        (rate 225 → 112 XP per 5 donated)
  material_demon_ichor: 225,
  material_cursed_steel: 225,
  // D10 — Dragon's Lair      (rate 300 → 150 XP per 5 donated)
  material_dragon_bone: 300,
  material_void_scale: 300,
}

/* =========================================================
   GUILD PERKS (War-Only Effects)
========================================================= */

export type GuildPerkEffectType =
  // Combat Branch
  | 'warMissionDamage'      // +% damage in war attacks
  | 'strongholdDamage'      // +% damage vs stronghold
  | 'outpostCaptureBonus'   // +% capture bonus valor
  | 'siegeDuration'         // +% time to hold mission
  | 'combatSeasonRewards'   // +% season-end war rewards
  // Economy Branch
  | 'warSupplyGeneration'   // +% supplies from outposts
  | 'buffDuration'          // +% buff duration
  | 'warSupplySpending'     // -% cost to spend supplies
  | 'garrisonRepairEff'     // +% repair effectiveness
  | 'economySeasonRewards'  // +% season-end economy rewards
  // Progression Branch
  | 'warValorPoints'        // +% all valor earned
  | 'strongholdMaxHp'       // +% stronghold HP
  | 'defenseValorBonus'     // +% defense valor earned
  | 'warMissionCooldown'    // -% mission cooldown
  | 'warMetricsCombo'       // +% all war metrics
  // War Branch
  | 'warMissionDuration'    // -% mission duration
  | 'outpostMaxHp'          // +% outpost HP
  | 'damageAbsorption'      // +% valor from damage received
  | 'strongholdDefense'     // +% defense valor from stronghold
  | 'outpostCapacity'       // Can hold +1 more outpost

export interface IGuildPerkTier {
  tier: number
  id: string
  name: string
  description: string
  pointsCost: number
  effect: {
    type: GuildPerkEffectType
    value: number
  }
}

export interface IGuildPerkBranch {
  id: string
  name: string
  description: string
  icon: string
  tiers: IGuildPerkTier[]
}

export const GUILD_PERK_BRANCHES: IGuildPerkBranch[] = [
  {
    id: 'combat',
    name: 'Combat',
    description: 'Boost war attack power and capture bonuses',
    icon: 'Swords',
    tiers: [
      {
        tier: 1,
        id: 'combat_t1',
        name: 'Battle Ready',
        description: '+5% War Mission Damage',
        pointsCost: 1000,
        effect: { type: 'warMissionDamage', value: 0.05 },
      },
      {
        tier: 2,
        id: 'combat_t2',
        name: 'Siege Breakers',
        description: '+10% Stronghold Attack Damage',
        pointsCost: 2500,
        effect: { type: 'strongholdDamage', value: 0.10 },
      },
      {
        tier: 3,
        id: 'combat_t3',
        name: 'Efficient Conquerors',
        description: '+15% Outpost Capture Bonus Valor',
        pointsCost: 5000,
        effect: { type: 'outpostCaptureBonus', value: 0.15 },
      },
      {
        tier: 4,
        id: 'combat_t4',
        name: 'War Veterans',
        description: '+10% Siege Duration',
        pointsCost: 10000,
        effect: { type: 'siegeDuration', value: 0.10 },
      },
      {
        tier: 5,
        id: 'combat_t5',
        name: 'Siege Masters',
        description: '+20% Season-End Combat Rewards',
        pointsCost: 20000,
        effect: { type: 'combatSeasonRewards', value: 0.20 },
      },
    ],
  },
  {
    id: 'economy',
    name: 'Economy',
    description: 'Generate and utilize war supplies effectively',
    icon: 'Coins',
    tiers: [
      {
        tier: 1,
        id: 'economy_t1',
        name: 'Treasure Hunters',
        description: '+10% War Supplies Generation',
        pointsCost: 1000,
        effect: { type: 'warSupplyGeneration', value: 0.10 },
      },
      {
        tier: 2,
        id: 'economy_t2',
        name: 'Material Masters',
        description: '+15% Buff Duration',
        pointsCost: 2500,
        effect: { type: 'buffDuration', value: 0.15 },
      },
      {
        tier: 3,
        id: 'economy_t3',
        name: 'Market Moguls',
        description: '-10% War Supply Spending Cost',
        pointsCost: 5000,
        effect: { type: 'warSupplySpending', value: -0.10 },
      },
      {
        tier: 4,
        id: 'economy_t4',
        name: 'Trade Empire',
        description: '+25% Garrison Repair Efficiency',
        pointsCost: 10000,
        effect: { type: 'garrisonRepairEff', value: 0.25 },
      },
      {
        tier: 5,
        id: 'economy_t5',
        name: 'Golden Coffers',
        description: '+15% Season-End Economy Rewards',
        pointsCost: 20000,
        effect: { type: 'economySeasonRewards', value: 0.15 },
      },
    ],
  },
  {
    id: 'progression',
    name: 'Progression',
    description: 'Accelerate war ranking and defense capabilities',
    icon: 'TrendingUp',
    tiers: [
      {
        tier: 1,
        id: 'progression_t1',
        name: 'Knowledge Seekers',
        description: '+5% War Season Valor Gain',
        pointsCost: 1000,
        effect: { type: 'warValorPoints', value: 0.05 },
      },
      {
        tier: 2,
        id: 'progression_t2',
        name: 'Endurance Training',
        description: '+10% Stronghold Max HP',
        pointsCost: 2500,
        effect: { type: 'strongholdMaxHp', value: 0.10 },
      },
      {
        tier: 3,
        id: 'progression_t3',
        name: 'Fortified Defenders',
        description: '+15% Defense Valor Earned',
        pointsCost: 5000,
        effect: { type: 'defenseValorBonus', value: 0.15 },
      },
      {
        tier: 4,
        id: 'progression_t4',
        name: 'Swift Learners',
        description: '-20% War Mission Cooldown',
        pointsCost: 10000,
        effect: { type: 'warMissionCooldown', value: -0.20 },
      },
      {
        tier: 5,
        id: 'progression_t5',
        name: 'Master Strategists',
        description: '+10% All War Metrics Combined',
        pointsCost: 20000,
        effect: { type: 'warMetricsCombo', value: 0.10 },
      },
    ],
  },
  {
    id: 'war',
    name: 'War',
    description: 'Dominate the battlefield with war-exclusive perks',
    icon: 'Shield',
    tiers: [
      {
        tier: 1,
        id: 'war_t1',
        name: 'Warmongers',
        description: '-10% War Mission Duration',
        pointsCost: 1000,
        effect: { type: 'warMissionDuration', value: -0.10 },
      },
      {
        tier: 2,
        id: 'war_t2',
        name: 'Garrison Builders',
        description: '+15% Outpost Max HP',
        pointsCost: 2500,
        effect: { type: 'outpostMaxHp', value: 0.15 },
      },
      {
        tier: 3,
        id: 'war_t3',
        name: 'Tactical Strike',
        description: '+20% Valor from Successful Defenses',
        pointsCost: 5000,
        effect: { type: 'damageAbsorption', value: 0.20 },
      },
      {
        tier: 4,
        id: 'war_t4',
        name: 'Fortress Keepers',
        description: '+25% Defense Valor from Stronghold',
        pointsCost: 10000,
        effect: { type: 'strongholdDefense', value: 0.25 },
      },
      {
        tier: 5,
        id: 'war_t5',
        name: 'Warlords',
        description: 'Can hold +1 additional outpost (base: 3)',
        pointsCost: 20000,
        effect: { type: 'outpostCapacity', value: 1 },
      },
    ],
  },
]

/* =========================================================
   GUILD WARS
========================================================= */

export const GUILD_WAR_CONFIG = {
  MATCHMAKING_POWER_VARIANCE: 0.2, // 20% power variance for matchmaking
  // War duration is bound to the weekly leaderboard cycle:
  // Monday 00:00 UTC+8 -> Sunday 23:59:59.999 UTC+8 (7 days / 168 hours).
  // The Sunday 16:00 UTC snapshot cron calls finalizeGuildWar(weekNumber).
  // See lib/modules/leaderboards/leaderboard.logic.ts:getCurrentWeek.
  ATTACK_ENERGY_COST: 10,
  ATTACK_COOLDOWN_MINUTES: 30,
  BASE_FORTRESS_HP: 100000,
  HP_PER_MEMBER: 5000,
  MIN_GUILD_LEVEL: 3, // Minimum guild level to participate in wars
  MIN_MEMBERS: 5, // Minimum members to participate
  // Final rewards are distributed by rank as Guild Points in
  // lib/modules/guildwars/guildwar.service.ts:distributeWarRewards.
}

/* =========================================================
   WAR ECONOMY SYSTEM
========================================================= */

export const WAR_ECONOMY_CONFIG = {
  // Supply Generation (per hour)
  SUPPLY_RATES: {
    outpost_1: 10,
    outpost_2: 25,
    outpost_3: 50,
    outpost_4: 100,
    outpost_5: 200,
  } as Record<string, number>,

  // Outpost Limits
  BASE_OUTPOST_LIMIT: 3,
  WARLORDS_BONUS_OUTPOSTS: 1,

  // Valor Multipliers
  VALOR_PER_DAMAGE: 1,                    // 1 valor per 1000 damage dealt
  VALOR_PER_DAMAGE_RECEIVED: 0.3,         // 0.3 valor per 1000 damage received
  VALOR_OUTPOST_CAPTURE_BONUS: 1500,      // Bonus valor for capturing outpost
  VALOR_STRONGHOLD_DESTROY_BONUS: 500,    // Bonus valor for destroying stronghold
  VALOR_OUTPOST_TIER_MULTIPLIER: {
    outpost_1: 1.0,
    outpost_2: 1.5,
    outpost_3: 2.0,
    outpost_4: 2.5,
    outpost_5: 3.0,
  } as Record<string, number>,

  // Supply Spending Costs
  SUPPLY_COSTS: {
    repairGarrison: 50,       // Repair 10% HP
    repairOutpost: 100,       // Repair 10% outpost HP
    warCry: 75,               // +10% damage for 1 hour
    reinforce: 100,           // +15% defense for 2 hours
    rally: 150,               // Free attacks (no energy cost) for 1 hour
    shieldWall: 200,          // -25% damage received for 2 hours
  } as Record<string, number>,

  // Buff Durations (milliseconds)
  BUFF_DURATIONS: {
    warCry: 60 * 60 * 1000,             // 1 hour
    reinforce: 2 * 60 * 60 * 1000,      // 2 hours
    rally: 60 * 60 * 1000,              // 1 hour (free attacks)
    shieldWall: 2 * 60 * 60 * 1000,     // 2 hours
  } as Record<string, number>,

  // Buff Effects
  BUFF_EFFECTS: {
    warCry: { type: 'damage', value: 0.10 },          // +10% damage
    reinforce: { type: 'defense', value: 0.15 },      // +15% defense (less damage taken)
    rally: { type: 'freeAttacks', value: 1.0 },       // Free attacks (no energy cost)
    shieldWall: { type: 'damageReduction', value: 0.25 }, // -25% damage received
  } as Record<string, { type: string; value: number }>,

  // Action Cooldowns (milliseconds)
  ACTION_COOLDOWNS: {
    repairGarrison: 30 * 60 * 1000,     // 30 minutes
    repairOutpost: 60 * 60 * 1000,      // 1 hour
    warCry: 2 * 60 * 60 * 1000,         // 2 hours
    reinforce: 3 * 60 * 60 * 1000,      // 3 hours
    rally: 4 * 60 * 60 * 1000,          // 4 hours
    shieldWall: 4 * 60 * 60 * 1000,     // 4 hours
  } as Record<string, number>,
}

export const GUILDS = {
  LEVELS: GUILD_LEVELS,
  MAX_LEVEL: 15,
  MAX_MEMBERS: 30,
  CREATION_FEE: 10000,
  DONATION_AMOUNT: 5,
  DONATION_RATES: DONATION_RATES,
  PERK_BRANCHES: GUILD_PERK_BRANCHES,
  WAR_CONFIG: GUILD_WAR_CONFIG,
  WAR_ECONOMY: WAR_ECONOMY_CONFIG,
}

/* =========================================================
   FINAL EXPORT
========================================================= */

export const PROGRESSION_DATA = {
  ACHIEVEMENTS,
  CRAFTING,
  GUILDS,
}

export default PROGRESSION_DATA
