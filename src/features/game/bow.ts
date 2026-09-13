export type BowTier =
  | "Wood"
  | "Iron"
  | "Silver"
  | "Emerald"
  | "Diamond"
  | "Ignisite";

export interface BowStats {
  damage: number;
  rangeTiles: number;
  fireRateMs: number;
  goldCost: number;
}

export const BOW_TIER: Record<BowTier, BowStats> = {
  Wood: { damage: 4, rangeTiles: 6, fireRateMs: 650, goldCost: 0 },
  Iron: { damage: 8, rangeTiles: 7, fireRateMs: 600, goldCost: 250 },
  Silver: { damage: 14, rangeTiles: 8, fireRateMs: 550, goldCost: 800 },
  Emerald: { damage: 22, rangeTiles: 9, fireRateMs: 500, goldCost: 2000 },
  Diamond: { damage: 34, rangeTiles: 10, fireRateMs: 450, goldCost: 5000 },
  Ignisite: { damage: 55, rangeTiles: 12, fireRateMs: 380, goldCost: 12000 },
};

export function getBowStats(tier: BowTier | undefined): BowStats {
  return BOW_TIER[tier ?? "Wood"] ?? BOW_TIER.Wood;
}

export const BOW_TIER_ORDER: BowTier[] = [
  "Wood",
  "Iron",
  "Silver",
  "Emerald",
  "Diamond",
  "Ignisite",
];

export function getNextBowTier(tier: BowTier | undefined): BowTier | null {
  const idx = BOW_TIER_ORDER.indexOf(tier ?? "Wood");
  return BOW_TIER_ORDER[idx + 1] ?? null;
}