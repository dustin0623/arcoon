export const HEROES_CARD_DATA = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LEGENDARY HEROES (1)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'legendary_hero_1',
    name: 'Aurelion the Dragonlord',
    description:
      'A legendary champion who once battled the Ancient Dragon beneath the Iron Citadel and lived to tell the tale.',
    type: 'hero',
    class: 'warrior',
    rarity: 'legendary',
    supply: { max: 100, minted: 0 },
    source: { type: 'standard_pack' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EPIC HEROES (2)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'epic_hero_1',
    name: 'Nyx Shadowblade',
    description: 'A master rogue of Ember City who strikes demon commanders from the shadows.',
    type: 'hero',
    class: 'rogue',
    rarity: 'epic',
    supply: { max: 1000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'epic_hero_2',
    name: 'Arcanis Crystal Sage',
    description: 'A Sunspire mage who commands crystallized arcane energy against the undead.',
    type: 'hero',
    class: 'mage',
    rarity: 'epic',
    supply: { max: 1000, minted: 0 },
    source: { type: 'standard_pack' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RARE HEROES (3)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'rare_hero_1',
    name: 'Evershade Ranger',
    description: 'Elite scouts of the Whispering Forest trained to hunt goblin raiders.',
    type: 'hero',
    class: 'archer',
    rarity: 'rare',
    supply: { max: 10000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'rare_hero_2',
    name: 'Sunspire Battlemage',
    description: 'Battle mages who wield radiant magic against undead armies.',
    type: 'hero',
    class: 'mage',
    rarity: 'rare',
    supply: { max: 10000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'rare_hero_3',
    name: 'Frosthold Sentinel',
    description: 'Guardians of the frozen bastion who hold the line against giants.',
    type: 'hero',
    class: 'paladin',
    rarity: 'rare',
    supply: { max: 10000, minted: 0 },
    source: { type: 'standard_pack' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UNCOMMON HEROES (6)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'uncommon_hero_1',
    name: 'Forest Archer',
    description: 'Elven archers who strike from the high branches of Evershade.',
    type: 'hero',
    class: 'archer',
    rarity: 'uncommon',
    supply: { max: 50000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'uncommon_hero_2',
    name: 'Citadel Guard',
    description: 'Human soldiers sworn to defend the golden walls of Sunspire.',
    type: 'hero',
    class: 'warrior',
    rarity: 'uncommon',
    supply: { max: 50000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'uncommon_hero_3',
    name: 'Crypt Scholar',
    description: "Scholars studying necromancy to understand the Lich King's magic.",
    type: 'hero',
    class: 'mage',
    rarity: 'uncommon',
    supply: { max: 50000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'uncommon_hero_4',
    name: 'Frost Ranger',
    description: 'Hunters who track beasts across the glaciers of Frosthold.',
    type: 'hero',
    class: 'archer',
    rarity: 'uncommon',
    supply: { max: 50000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'uncommon_hero_5',
    name: 'Ashland Rogue',
    description: 'Scouts who infiltrate demonic fortresses near Ember City.',
    type: 'hero',
    class: 'rogue',
    rarity: 'uncommon',
    supply: { max: 50000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'uncommon_hero_6',
    name: 'Iron Legion Recruit',
    description: 'New warriors trained within the walls of the Iron Citadel.',
    type: 'hero',
    class: 'warrior',
    rarity: 'uncommon',
    supply: { max: 50000, minted: 0 },
    source: { type: 'standard_pack' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMON HEROES (8)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'common_hero_1',
    name: 'Village Militia',
    description: 'Farmers and hunters who rise to defend their homes.',
    type: 'hero',
    class: 'warrior',
    rarity: 'common',
    supply: { max: 100000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'common_hero_2',
    name: 'Forest Scout',
    description: 'Messengers who run through the forests of Evershade carrying warnings.',
    type: 'hero',
    class: 'archer',
    rarity: 'common',
    supply: { max: 100000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'common_hero_3',
    name: 'Sunspire Apprentice',
    description: 'Young mages studying the arcane arts in Sunspire.',
    type: 'hero',
    class: 'mage',
    rarity: 'common',
    supply: { max: 100000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'common_hero_4',
    name: 'Graveyard Watcher',
    description: 'Guardians stationed near haunted burial grounds.',
    type: 'hero',
    class: 'warrior',
    rarity: 'common',
    supply: { max: 100000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'common_hero_5',
    name: 'Frosthold Hunter',
    description: 'Hunters who survive the frozen wilderness.',
    type: 'hero',
    class: 'archer',
    rarity: 'common',
    supply: { max: 100000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'common_hero_6',
    name: 'Lava Pit Miner',
    description: "Workers hardened by Ember City's volcanic mines.",
    type: 'hero',
    class: 'blacksmith',
    rarity: 'common',
    supply: { max: 100000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'common_hero_7',
    name: 'Citadel Messenger',
    description: 'Swift riders carrying orders between the Five Realms.',
    type: 'hero',
    class: 'warrior',
    rarity: 'common',
    supply: { max: 100000, minted: 0 },
    source: { type: 'standard_pack' },
  },
  {
    id: 'common_hero_8',
    name: 'Frontier Adventurer',
    description: 'Wanderers seeking glory across dangerous lands.',
    type: 'hero',
    class: 'rogue',
    rarity: 'common',
    supply: { max: 100000, minted: 0 },
    source: { type: 'standard_pack' },
  },
]

export default HEROES_CARD_DATA
