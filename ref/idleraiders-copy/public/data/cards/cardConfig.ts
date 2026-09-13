// ═══════════════════════════════════════════════════════════════════════════
// CARD CONFIGURATION & STAT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
// Complete unified system for card stat generation, class modifiers, and booster calculations

export interface CardStats {
  raidPower: number
  mastery: number
  luck: number
  gm: number
}

export interface Card {
  id: string
  name: string
  description: string
  type: 'hero' | 'booster' | 'equipment' | 'mount' | 'transport' | 'artifact'
  class: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'special'
  supply?: number
  source?: 'standard_pack' | 'booster_pack' | 'craft' | 'event'
}

// ═══════════════════════════════════════════════════════════════════════════
// BASE STATS PER CARD TYPE
// ═══════════════════════════════════════════════════════════════════════════

export const CARD_BASE_STATS: Record<string, CardStats> = {
  hero: { raidPower: 60, mastery: 30, luck: 0, gm: 1 },
  booster: { raidPower: 0, mastery: 0, luck: 0, gm: 0 },
  equipment: { raidPower: 35, mastery: 0, luck: 5, gm: 1 },
  mount: { raidPower: 25, mastery: 0, luck: 15, gm: 1 },
  transport: { raidPower: 0, mastery: 0, luck: 30, gm: 1 },
  artifact: { raidPower: 25, mastery: 25, luck: 0, gm: 1 },
}

// ═══════════════════════════════════════════════════════════════════════════
// RARITY MULTIPLIERS (Apply to base stats)
// ═══════════════════════════════════════════════════════════════════════════

export const RARITY_MULTIPLIERS: Record<string, number> = {
  common: 1,
  uncommon: 3,
  rare: 8,
  epic: 25,
  legendary: 100,
  special: 12,
}

// ═══════════════════════════════════════════════════════════════════════════
// GM SCALING BY RARITY
// ═══════════════════════════════════════════════════════════════════════════
// Only rare and above cards contribute to GM (Guild Mastery)
// Common and Uncommon cards do not provide any GM bonus

export const GM_MULTIPLIER: Record<string, number> = {
  common: 0,
  uncommon: 0,
  rare: 1,
  epic: 3,
  legendary: 6,
  special: 2,
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOSTER MULTIPLIERS (RARITY → MULTIPLIER)
// ═══════════════════════════════════════════════════════════════════════════
// All booster classes (xpBoost, energyBoost, materialBoost) use same multiplier values

export const BOOSTER_MULTIPLIERS: Record<string, number> = {
  common: 2,
  uncommon: 5,
  rare: 10,
  epic: 15,
  legendary: 25,
}

// ═══════════════════════════════════════════════════════════════════════════
// MOUNT CLASS VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export const VALID_MOUNT_CLASSES = ['swift', 'heavy', 'flying']

export function validateMountClass(mountClass: string): boolean {
  return VALID_MOUNT_CLASSES.includes(mountClass)
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASS-BASED STAT MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

export const HERO_CLASS_MODIFIERS: Record<string, Record<string, number>> = {
  warrior: { raidPower: 1.2, mastery: 0.8, luck: 0.9 },
  archer: { raidPower: 1.0, mastery: 0.9, luck: 1.3 },
  mage: { raidPower: 0.8, mastery: 1.4, luck: 0.9 },
  rogue: { raidPower: 0.95, mastery: 0.8, luck: 1.4 },
  paladin: { raidPower: 1.1, mastery: 1.1, luck: 0.8 },
  blacksmith: { raidPower: 0.7, mastery: 1.5, luck: 0.8 },
}

export const EQUIPMENT_CLASS_MODIFIERS: Record<string, Record<string, number>> = {
  melee: { raidPower: 1.15, mastery: 0.9, luck: 0.8 },
  range: { raidPower: 1.0, mastery: 0.85, luck: 1.2 },
  magic: { raidPower: 0.8, mastery: 1.3, luck: 0.9 },
  defense: { raidPower: 1.1, mastery: 0.95, luck: 0.7 },
}

export const TRANSPORT_CLASS_MODIFIERS: Record<string, Record<string, number>> = {
  merchant: { raidPower: 0, mastery: 0, luck: 1.4 },
  military: { raidPower: 1.3, mastery: 0, luck: 0.8 },
  luxury: { raidPower: 0.5, mastery: 0.5, luck: 1.5 },
  prestige: { raidPower: 0.8, mastery: 0.8, luck: 1.4 },
}

export const ARTIFACT_CLASS_MODIFIERS: Record<string, Record<string, number>> = {
  ceremonial: { raidPower: 1.0, mastery: 1.0, luck: 1.0 },
  magical: { raidPower: 0.8, mastery: 1.3, luck: 0.9 },
  historical: { raidPower: 1.2, mastery: 0.9, luck: 0.9 },
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generates stats for any card type (except boosters which don't have stats)
 * @param type - Card type (hero, equipment, mount, transport, artifact, etc.)
 * @param rarity - Card rarity (common, uncommon, rare, epic, legendary, special)
 * @param cardClass - Optional class for stat modifiers (depends on card type)
 * @returns CardStats object with raidPower, mastery, luck, and gm values
 */
export function generateCardStats(type: string, rarity: string, cardClass?: string): CardStats {
  const base = CARD_BASE_STATS[type]
  const rarityMult = RARITY_MULTIPLIERS[rarity] || 1
  const gmScale = GM_MULTIPLIER[rarity] || 1

  if (!base) {
    return { raidPower: 0, mastery: 0, luck: 0, gm: 0 }
  }

  let raidPower = Math.round(base.raidPower * rarityMult)
  let mastery = Math.round(base.mastery * rarityMult)
  let luck = Math.round(base.luck * rarityMult)

  // Apply class modifiers
  if (type === 'hero' && cardClass && HERO_CLASS_MODIFIERS[cardClass]) {
    const mods = HERO_CLASS_MODIFIERS[cardClass]
    raidPower = Math.round(raidPower * mods.raidPower)
    mastery = Math.round(mastery * mods.mastery)
    luck = Math.round(luck * mods.luck)
  }

  if (type === 'equipment' && cardClass && EQUIPMENT_CLASS_MODIFIERS[cardClass]) {
    const mods = EQUIPMENT_CLASS_MODIFIERS[cardClass]
    raidPower = Math.round(raidPower * mods.raidPower)
    mastery = Math.round(mastery * mods.mastery)
    luck = Math.round(luck * mods.luck)
  }

  if (type === 'transport' && cardClass && TRANSPORT_CLASS_MODIFIERS[cardClass]) {
    const mods = TRANSPORT_CLASS_MODIFIERS[cardClass]
    raidPower = Math.round(raidPower * mods.raidPower)
    mastery = Math.round(mastery * mods.mastery)
    luck = Math.round(luck * mods.luck)
  }

  if (type === 'artifact' && cardClass && ARTIFACT_CLASS_MODIFIERS[cardClass]) {
    const mods = ARTIFACT_CLASS_MODIFIERS[cardClass]
    raidPower = Math.round(raidPower * mods.raidPower)
    mastery = Math.round(mastery * mods.mastery)
    luck = Math.round(luck * mods.luck)
  }

  return {
    raidPower,
    mastery,
    luck,
    gm: Math.round(base.gm * gmScale),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOSTER MULTIPLIER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gets booster multiplier based on rarity
 * All booster classes (xpBoost, energyBoost, materialBoost) use same multiplier values
 * @param rarity - Card rarity
 * @returns Multiplier value for booster effects
 */
export function getBoosterMultiplier(rarity: string): number {
  return BOOSTER_MULTIPLIERS[rarity] || 1
}

// ═══════════════════════════════════════════════════════════════════════════
// GET CARD STATS FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get stats for any card
 * @param card - Card object with type, rarity, and optional class
 * @returns CardStats object or null for boosters (which don't have stats)
 */
export function getCardStats(card: Card): CardStats | null {
  if (card.type === 'booster') {
    return null // Boosters don't have stats, only multipliers
  }
  return generateCardStats(card.type, card.rarity, card.class)
}

export default getCardStats
