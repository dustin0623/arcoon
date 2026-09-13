import GAME_DATA from '@/public/data';

interface RecipeMaterials {
  [materialId: string]: number;
}

interface Recipe {
  cost: number;
  materials?: RecipeMaterials;
}

const SYSTEM = GAME_DATA.SYSTEM ?? {};
const LAND = (SYSTEM as Record<string, unknown>).LAND ?? { MAX_LEVEL: 5 };

// Potion balance constants
// Base drop rate: 10%, max with luck: 25%
const BASE_POTION_CHANCE = 0.10;
const MAX_POTION_CHANCE = 0.25;

export function getEffectiveBoost(rawBonusPercent: number): number {
  return rawBonusPercent / (1 + rawBonusPercent / 200);
}

export function getBoostMultiplier(rawBonusPercent: number): number {
  return 1 + getEffectiveBoost(rawBonusPercent) / 100;
}

export function rollPotionDrop(luck: number): string | null {
  // Luck increases drop rate from 10% base towards 25% max
  // Formula: luckBonus scales from 0 to 1.5 (adds up to 15% to base 10%)
  const luckBonus = Math.min(1.5, luck / 4000); // At 6000 luck = 1.5 bonus
  const dropChance = Math.min(MAX_POTION_CHANCE, BASE_POTION_CHANCE * (1 + luckBonus));

  if (Math.random() >= dropChance) return null;

  const r = Math.random();
  // Return the full potion IDs that match GAME_DATA.ITEMS
  if (r < 0.6) return 'exp_potion';
  return 'energy_potion';
}

export function getFatigueMultiplier(fatigue: number, mastery: number): number {
  if (fatigue === 0) return 1;
  return Math.min(1, mastery / Math.max(1, fatigue));
}

export function clampLandLevel(level: number): number {
  const maxLevel = (LAND as { MAX_LEVEL: number }).MAX_LEVEL ?? 5;
  return Math.max(1, Math.min(maxLevel, level));
}

export function canAffordRecipe(
  recipe: Recipe,
  coins: number,
  materials: Record<string, number>
): boolean {
  if (coins < recipe.cost) return false;

  for (const [mat, needed] of Object.entries(recipe.materials || {})) {
    if ((materials[mat] || 0) < needed) return false;
  }

  return true;
}
