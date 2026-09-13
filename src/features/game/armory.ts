/**
 * Armory — buying bows, upgrading their stars and equipping them.
 * Every function takes the saved profile and returns the updated one
 * (already persisted), or the unchanged profile when the action is illegal.
 */
import { BOWS, MAX_STARS, starUpgradeCost, type BowRarity } from "@/features/game/bow";
import { saveProgress, type Progress } from "@/features/game/campaign";

export function ownsBow(progress: Progress, rarity: BowRarity): boolean {
  return (progress.bows[rarity] ?? 0) > 0;
}

export function starsOf(progress: Progress, rarity: BowRarity): number {
  return progress.bows[rarity] ?? 0;
}

/** Buys an unowned bow at 1★ and equips it. */
export function buyBow(progress: Progress, rarity: BowRarity): Progress {
  const cost = BOWS[rarity].unlockCost;
  if (ownsBow(progress, rarity) || progress.gold < cost) return progress;
  const next: Progress = {
    ...progress,
    gold: progress.gold - cost,
    bows: { ...progress.bows, [rarity]: 1 },
    equipped: rarity,
  };
  saveProgress(next);
  return next;
}

/** Spends gold to add one star to an owned bow. */
export function upgradeStar(progress: Progress, rarity: BowRarity): Progress {
  const stars = starsOf(progress, rarity);
  const cost = stars > 0 ? starUpgradeCost(rarity, stars) : null;
  if (cost === null || stars >= MAX_STARS || progress.gold < cost) return progress;
  const next: Progress = {
    ...progress,
    gold: progress.gold - cost,
    bows: { ...progress.bows, [rarity]: stars + 1 },
  };
  saveProgress(next);
  return next;
}

export function equipBow(progress: Progress, rarity: BowRarity): Progress {
  if (!ownsBow(progress, rarity) || progress.equipped === rarity) return progress;
  const next: Progress = { ...progress, equipped: rarity };
  saveProgress(next);
  return next;
}
