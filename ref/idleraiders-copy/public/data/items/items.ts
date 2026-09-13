// ─────────────────────────────────────────────
// Materials (Unified)
// ─────────────────────────────────────────────
// category: 'material'
// type: 'core' | 'component' | 'catalyst'
//
// CORE MATERIALS (from DUNGEONS)
//   20 zone-specific materials — 2 per dungeon zone
//   Drop rate: 1 per 5 min from dungeon/story missions
//   Conversion: 20× any material → 1× any target (+ 2,000 coins)
//
// COMPONENTS (from BOSS RAIDS - random ~35% chance)
//   Rare components dropped from boss raids
//   Component types: weapon, armor, transport, arcane
//
// CATALYST MATERIALS (from BOSS RAIDS - GUARANTEED)
//   Rare catalysts dropped GUARANTEED from boss raids
//   Rarity determined by boss difficulty (common → legendary)
//   Used in crafting recipes to determine output rarity
// ─────────────────────────────────────────────

export const MATERIALS = [
  // ── CORE MATERIALS ──
  // ── Tier 1: D1 — Goblin Cave
  {
    id: 'material_goblin_iron',
    name: 'Goblin Iron',
    description: 'Crude iron smelted by goblin smiths',
    category: 'material',
    type: 'core',
    zone: 'd1',
  },
  {
    id: 'material_crude_leather',
    name: 'Crude Leather',
    description: 'Rough hide stripped from goblin beasts',
    category: 'material',
    type: 'core',
    zone: 'd1',
  },
  // ── Tier 1: D2 — Spider Den
  {
    id: 'material_silk_thread',
    name: 'Silk Thread',
    description: 'Fine thread harvested from spider webs',
    category: 'material',
    type: 'core',
    zone: 'd2',
  },
  {
    id: 'material_chitin_plate',
    name: 'Chitin Plate',
    description: 'Hard shell fragment from giant spiders',
    category: 'material',
    type: 'core',
    zone: 'd2',
  },
  // ── Tier 2: D3 — Graveyard of Souls
  {
    id: 'material_soul_ash',
    name: 'Soul Ash',
    description: 'Residue left by restless spirits',
    category: 'material',
    type: 'core',
    zone: 'd3',
  },
  {
    id: 'material_grave_cloth',
    name: 'Grave Cloth',
    description: 'Decayed fabric from ancient burial wraps',
    category: 'material',
    type: 'core',
    zone: 'd3',
  },
  // ── Tier 2: D4 — Crypt of the Undying
  {
    id: 'material_necro_dust',
    name: 'Necro Dust',
    description: 'Powdered bone infused with death magic',
    category: 'material',
    type: 'core',
    zone: 'd4',
  },
  {
    id: 'material_bone_rune',
    name: 'Bone Rune',
    description: 'A carved bone etched with arcane symbols',
    category: 'material',
    type: 'core',
    zone: 'd4',
  },
  // ── Tier 2: D5 — Ice Cavern
  {
    id: 'material_frostwood',
    name: 'Frostwood',
    description: 'Petrified wood preserved by ancient ice',
    category: 'material',
    type: 'core',
    zone: 'd5',
  },
  {
    id: 'material_glacial_shard',
    name: 'Glacial Shard',
    description: 'A fragment of magical ice that never melts',
    category: 'material',
    type: 'core',
    zone: 'd5',
  },
  // ── Tier 3: D6 — Dark Forest
  {
    id: 'material_elder_bark',
    name: 'Elder Bark',
    description: 'Bark from an ancient sentient tree',
    category: 'material',
    type: 'core',
    zone: 'd6',
  },
  {
    id: 'material_living_sap',
    name: 'Living Sap',
    description: 'Sap imbued with life force from the dark forest',
    category: 'material',
    type: 'core',
    zone: 'd6',
  },
  // ── Tier 3: D7 — Molten Quarry
  {
    id: 'material_cinder_stone',
    name: 'Cinder Stone',
    description: 'Volcanic rock still warm to the touch',
    category: 'material',
    type: 'core',
    zone: 'd7',
  },
  {
    id: 'material_magma_core',
    name: 'Magma Core',
    description: 'A crystallized heart of molten rock',
    category: 'material',
    type: 'core',
    zone: 'd7',
  },
  // ── Tier 3: D8 — Ashen Fortress
  {
    id: 'material_ash_crystal',
    name: 'Ash Crystal',
    description: 'A rare crystal formed in volcanic ash fields',
    category: 'material',
    type: 'core',
    zone: 'd8',
  },
  {
    id: 'material_charred_bone',
    name: 'Charred Bone',
    description: 'Bone hardened and blackened by intense heat',
    category: 'material',
    type: 'core',
    zone: 'd8',
  },
  // ── Tier 4: D9 — Demon's Gate
  {
    id: 'material_demon_ichor',
    name: 'Demon Ichor',
    description: 'Foul fluid that flows through demonic veins',
    category: 'material',
    type: 'core',
    zone: 'd9',
  },
  {
    id: 'material_cursed_steel',
    name: 'Cursed Steel',
    description: 'Metal imbued with demonic corruption',
    category: 'material',
    type: 'core',
    zone: 'd9',
  },
  // ── Tier 4: D10 — Dragon's Lair
  {
    id: 'material_dragon_bone',
    name: 'Dragon Bone',
    description: 'A dense bone fragment from a dragon skeleton',
    category: 'material',
    type: 'core',
    zone: 'd10',
  },
  {
    id: 'material_void_scale',
    name: 'Void Scale',
    description: 'A scale from the Ancient Dragon, crackling with void energy',
    category: 'material',
    type: 'core',
    zone: 'd10',
  },

  // ── COMPONENT MATERIALS ──
  // =========================
  // EQUIPMENT — MELEE
  // =========================
  {
    id: 'component_melee_blade_core',
    name: 'Blade Core',
    description: 'Core forging piece for melee weapons',
    category: 'material',
    type: 'component',
    class: 'melee',
    zone: 'boss',
  },
  {
    id: 'component_melee_weapon_hilt',
    name: 'Weapon Hilt',
    description: 'Grip component for melee weapons',
    category: 'material',
    type: 'component',
    class: 'melee',
    zone: 'boss',
  },
  {
    id: 'component_melee_edge_reinforcement',
    name: 'Edge Reinforcement',
    description: 'Sharpened reinforcement for weapon edges',
    category: 'material',
    type: 'component',
    class: 'melee',
    zone: 'boss',
  },
  {
    id: 'component_melee_blood_channel',
    name: 'Blood Channel',
    description: 'Groove structure to enhance melee lethality',
    category: 'material',
    type: 'component',
    class: 'melee',
    zone: 'boss',
  },

  // =========================
  // EQUIPMENT — RANGE
  // =========================
  {
    id: 'component_range_bow_frame',
    name: 'Bow Frame',
    description: 'Structural frame for ranged weapons',
    category: 'material',
    type: 'component',
    class: 'range',
    zone: 'boss',
  },
  {
    id: 'component_range_tension_string',
    name: 'Tension String',
    description: 'High tension string for projectile weapons',
    category: 'material',
    type: 'component',
    class: 'range',
    zone: 'boss',
  },
  {
    id: 'component_range_arrow_mechanism',
    name: 'Arrow Mechanism',
    description: 'Launch mechanism for ranged attacks',
    category: 'material',
    type: 'component',
    class: 'range',
    zone: 'boss',
  },
  {
    id: 'component_range_precision_sight',
    name: 'Precision Sight',
    description: 'Enhances accuracy of ranged weapons',
    category: 'material',
    type: 'component',
    class: 'range',
    zone: 'boss',
  },

  // =========================
  // EQUIPMENT — MAGIC
  // =========================
  {
    id: 'component_magic_arcane_focus',
    name: 'Arcane Focus',
    description: 'Core amplifier for magical energy',
    category: 'material',
    type: 'component',
    class: 'magic',
    zone: 'boss',
  },
  {
    id: 'component_magic_mana_conduit',
    name: 'Mana Conduit',
    description: 'Channels mana flow through magical items',
    category: 'material',
    type: 'component',
    class: 'magic',
    zone: 'boss',
  },
  {
    id: 'component_magic_rune_core',
    name: 'Rune Core',
    description: 'Inscribed rune core for spellcasting',
    category: 'material',
    type: 'component',
    class: 'magic',
    zone: 'boss',
  },
  {
    id: 'component_magic_spell_channeler',
    name: 'Spell Channeler',
    description: 'Focuses and directs magical spells',
    category: 'material',
    type: 'component',
    class: 'magic',
    zone: 'boss',
  },

  // =========================
  // EQUIPMENT — DEFENSE
  // =========================
  {
    id: 'component_defense_armor_plating',
    name: 'Armor Plating',
    description: 'Heavy plating for defensive gear',
    category: 'material',
    type: 'component',
    class: 'defense',
    zone: 'boss',
  },
  {
    id: 'component_defense_reinforced_core',
    name: 'Reinforced Core',
    description: 'Strengthened internal core for armor',
    category: 'material',
    type: 'component',
    class: 'defense',
    zone: 'boss',
  },
  {
    id: 'component_defense_shield_frame',
    name: 'Shield Frame',
    description: 'Structural base for shields',
    category: 'material',
    type: 'component',
    class: 'defense',
    zone: 'boss',
  },
  {
    id: 'component_defense_impact_dampener',
    name: 'Impact Dampener',
    description: 'Reduces incoming damage impact',
    category: 'material',
    type: 'component',
    class: 'defense',
    zone: 'boss',
  },

  // =========================
  // TRANSPORT — MERCHANT
  // =========================
  {
    id: 'component_merchant_wagon_frame',
    name: 'Wagon Frame',
    description: 'Base structure for merchant transport',
    category: 'material',
    type: 'component',
    class: 'merchant',
    zone: 'boss',
  },
  {
    id: 'component_merchant_cargo_hold',
    name: 'Cargo Hold',
    description: 'Storage system for trade goods',
    category: 'material',
    type: 'component',
    class: 'merchant',
    zone: 'boss',
  },
  {
    id: 'component_merchant_trade_compartment',
    name: 'Trade Compartment',
    description: 'Organized compartments for trading',
    category: 'material',
    type: 'component',
    class: 'merchant',
    zone: 'boss',
  },
  {
    id: 'component_merchant_load_stabilizer',
    name: 'Load Stabilizer',
    description: 'Maintains balance of cargo during travel',
    category: 'material',
    type: 'component',
    class: 'merchant',
    zone: 'boss',
  },

  // =========================
  // TRANSPORT — MILITARY
  // =========================
  {
    id: 'component_military_reinforced_axle',
    name: 'Reinforced Axle',
    description: 'Heavy-duty axle for military transport',
    category: 'material',
    type: 'component',
    class: 'military',
    zone: 'boss',
  },
  {
    id: 'component_military_siege_mount',
    name: 'Siege Mount',
    description: 'Mounting system for siege weapons',
    category: 'material',
    type: 'component',
    class: 'military',
    zone: 'boss',
  },
  {
    id: 'component_military_weapon_rack',
    name: 'Weapon Rack',
    description: 'Storage for weapons in transport units',
    category: 'material',
    type: 'component',
    class: 'military',
    zone: 'boss',
  },
  {
    id: 'component_military_armor_plating',
    name: 'Military Armor Plating',
    description: 'Protective plating for war vehicles',
    category: 'material',
    type: 'component',
    class: 'military',
    zone: 'boss',
  },

  // =========================
  // TRANSPORT — LUXURY
  // =========================
  {
    id: 'component_luxury_silk_interior',
    name: 'Silk Interior',
    description: 'Luxury interior finishing for comfort',
    category: 'material',
    type: 'component',
    class: 'luxury',
    zone: 'boss',
  },
  {
    id: 'component_luxury_ornament_frame',
    name: 'Ornament Frame',
    description: 'Decorative structural frame',
    category: 'material',
    type: 'component',
    class: 'luxury',
    zone: 'boss',
  },
  {
    id: 'component_luxury_comfort_suspension',
    name: 'Comfort Suspension',
    description: 'Smooth ride suspension system',
    category: 'material',
    type: 'component',
    class: 'luxury',
    zone: 'boss',
  },
  {
    id: 'component_luxury_gold_trim',
    name: 'Gold Trim Assembly',
    description: 'Luxury finishing trim made of gold',
    category: 'material',
    type: 'component',
    class: 'luxury',
    zone: 'boss',
  },

  // =========================
  // TRANSPORT — PRESTIGE
  // =========================
  {
    id: 'component_prestige_arcane_engine',
    name: 'Arcane Engine',
    description: 'Magical engine powering advanced transport',
    category: 'material',
    type: 'component',
    class: 'prestige',
    zone: 'boss',
  },
  {
    id: 'component_prestige_phantom_core',
    name: 'Phantom Core',
    description: 'Core infused with spectral energy',
    category: 'material',
    type: 'component',
    class: 'prestige',
    zone: 'boss',
  },
  {
    id: 'component_prestige_speed_matrix',
    name: 'Speed Matrix',
    description: 'Enhances movement speed of transport',
    category: 'material',
    type: 'component',
    class: 'prestige',
    zone: 'boss',
  },
  {
    id: 'component_prestige_void_stabilizer',
    name: 'Void Stabilizer',
    description: 'Stabilizes transport across void energies',
    category: 'material',
    type: 'component',
    class: 'prestige',
    zone: 'boss',
  },

  // ── CATALYST MATERIALS ──
  {
    id: 'catalyst_common',
    name: 'Common Catalyst',
    description: 'Basic catalyst for common rarity crafting',
    category: 'material',
    type: 'catalyst',
    rarity: 'common',
    boss: 'b1',
  },
  {
    id: 'catalyst_uncommon',
    name: 'Uncommon Catalyst',
    description: 'Catalyst for uncommon rarity crafting',
    category: 'material',
    type: 'catalyst',
    rarity: 'uncommon',
    boss: 'b2',
  },
  {
    id: 'catalyst_rare',
    name: 'Rare Catalyst',
    description: 'Catalyst for rare rarity crafting',
    category: 'material',
    type: 'catalyst',
    rarity: 'rare',
    boss: 'b3',
  },
  {
    id: 'catalyst_epic',
    name: 'Epic Catalyst',
    description: 'Catalyst for epic rarity crafting',
    category: 'material',
    type: 'catalyst',
    rarity: 'epic',
    boss: 'b9',
  },
  {
    id: 'catalyst_legendary',
    name: 'Legendary Catalyst',
    description: 'Catalyst for legendary rarity crafting',
    category: 'material',
    type: 'catalyst',
    rarity: 'legendary',
    boss: 'b10',
  },
]

// ─────────────────────────────────────────────
// Potions
// ─────────────────────────────────────────────

export const POTIONS = [
  {
    id: 'energy_potion',
    name: 'Energy Potion',
    description: 'Fully refills energy to 100',
    catergory: 'potion',

    data: {
      type: 'energy_restore',
      amount: 100,
      baseChance: 0.04,
      chanceMultiplier: {
        scout: 1.0,
        patrol: 1.2,
        expedition: 1.4,
        siege: 1.7,
        war: 2.0,
      },
    },
  },

  {
    id: 'exp_potion',
    name: 'EXP Potion',
    description: '2× XP on next mission',
    catergory: 'potion',

    data: {
      type: 'exp_boost',
      multiplier: 2,
      baseChance: 0.04,
      chanceMultiplier: {
        scout: 1.0,
        patrol: 1.2,
        expedition: 1.4,
        siege: 1.7,
        war: 2.0,
      },
    },
  },
]

// ─────────────────────────────────────────────
// Card Packs
// ─────────────────────────────────────────────

export const PACKS = [
  {
    id: 'standard_pack',
    name: 'Standard Pack',
    description: 'Contains 3 cards rolled from the standard rarity table',
    catergory: 'pack',

    buy: {
      coins: 10000,
      dollars: 1, // Sale price for first month; returns to $2 after sale ends
    },

    data: {
      cardCount: 3,
      dropRates: {
        common: 0.65,
        uncommon: 0.23,
        rare: 0.10,
        epic: 0.019,
        legendary: 0.001,
      },
    },
  },

  {
    id: 'booster_pack',
    name: 'Booster Pack',
    description: 'Contains 1 booster card',
    catergory: 'pack',

    buy: {
      shards: 100,
      dollars: 3, // Sale price for first month; returns to $5 after sale ends
    },

    data: {
      cardCount: 1,
      dropRates: {
        common: 0.65,
        uncommon: 0.23,
        rare: 0.10,
        epic: 0.019,
        legendary: 0.001,
      },
    },
  },
]

// ─────────────────────────────────────────────
// Items Data Export
// ─────────────────────────────────────────────

// Flat items array (used by registry builder)
export const ITEMS_DATA_ARRAY = [...MATERIALS, ...POTIONS, ...PACKS]

// Full items object (GAME_DATA.ITEMS)
export const ITEMS_DATA = ITEMS_DATA_ARRAY

export default ITEMS_DATA
