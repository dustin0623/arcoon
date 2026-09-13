/**
 * Bows — five rarity sets, each upgradeable from 1★ to 5★.
 * Pure data + math; ownership lives in the saved profile (armory.ts).
 */

export type BowRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export interface BowDef {
  rarity: BowRarity;
  name: string;
  /** Base stats at 1★. */
  damage: number;
  rangeTiles: number;
  fireRateMs: number;
  /** Gold to unlock the bow in the Blacksmith. */
  unlockCost: number;
  /** Gold for the first star upgrade; each further star costs this × stars. */
  starCost: number;
}

export interface BowStats {
  damage: number;
  rangeTiles: number;
  fireRateMs: number;
}

export const BOW_RARITIES: BowRarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

export const BOWS: Record<BowRarity, BowDef> = {
  Common: {
    rarity: "Common",
    name: "Sapling Shortbow",
    damage: 5,
    rangeTiles: 6,
    fireRateMs: 640,
    unlockCost: 0,
    starCost: 150,
  },
  Uncommon: {
    rarity: "Uncommon",
    name: "Hunter's Recurve",
    damage: 9,
    rangeTiles: 7,
    fireRateMs: 590,
    unlockCost: 400,
    starCost: 350,
  },
  Rare: {
    rarity: "Rare",
    name: "Silverwood Longbow",
    damage: 15,
    rangeTiles: 8,
    fireRateMs: 540,
    unlockCost: 1200,
    starCost: 900,
  },
  Epic: {
    rarity: "Epic",
    name: "Emberglass Bow",
    damage: 24,
    rangeTiles: 9,
    fireRateMs: 480,
    unlockCost: 3200,
    starCost: 2200,
  },
  Legendary: {
    rarity: "Legendary",
    name: "Ignisite Warbow",
    damage: 38,
    rangeTiles: 11,
    fireRateMs: 420,
    unlockCost: 8000,
    starCost: 5000,
  },
};

export const MAX_STARS = 5;

/**
 * Stats for a bow at a given star level (1–5).
 * Each star adds +12% damage and 4% faster draw; 3★ and 5★ add a tile of range.
 */
export function bowStats(rarity: BowRarity, stars: number): BowStats {
  const def = BOWS[rarity];
  const s = Math.min(Math.max(stars, 1), MAX_STARS);
  const steps = s - 1;
  return {
    damage: Math.round(def.damage * (1 + 0.12 * steps)),
    rangeTiles: def.rangeTiles + (s >= 5 ? 2 : s >= 3 ? 1 : 0),
    fireRateMs: Math.round(def.fireRateMs * Math.pow(0.96, steps)),
  };
}

/** Gold cost of the next star, or null at max stars. */
export function starUpgradeCost(rarity: BowRarity, stars: number): number | null {
  if (stars >= MAX_STARS) return null;
  return BOWS[rarity].starCost * stars;
}
