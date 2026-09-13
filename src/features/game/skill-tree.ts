/**
 * Skill tree — three branches the player invests level-up points into.
 * Ranks are pure data; `getSkillModifiers` turns them into the multipliers
 * the arena scene applies to combat, survival and loot.
 */

export type SkillId =
  | "sharpshooter"
  | "rapid_draw"
  | "long_shot"
  | "vitality"
  | "swiftness"
  | "second_wind"
  | "greed"
  | "magnetism"
  | "scholar";

export type SkillBranch = "Marksman" | "Survival" | "Fortune";

export interface SkillDef {
  id: SkillId;
  branch: SkillBranch;
  name: string;
  icon: string;
  maxRank: number;
  /** Short description of one rank's effect. */
  effect: string;
  /** Skill that must have at least 1 rank before this one unlocks. */
  requires?: SkillId;
}

export const SKILL_TREE: SkillDef[] = [
  // Marksman
  { id: "sharpshooter", branch: "Marksman", name: "Sharpshooter", icon: "/assets/icons/target.png", maxRank: 5, effect: "+15% arrow damage" },
  { id: "rapid_draw", branch: "Marksman", name: "Rapid Draw", icon: "/assets/icons/lightning.png", maxRank: 5, effect: "-7% draw time", requires: "sharpshooter" },
  { id: "long_shot", branch: "Marksman", name: "Long Shot", icon: "/assets/icons/bow.png", maxRank: 3, effect: "+1 tile bow range", requires: "rapid_draw" },

  // Survival
  { id: "vitality", branch: "Survival", name: "Vitality", icon: "/assets/icons/heart.png", maxRank: 5, effect: "+20 max HP" },
  { id: "swiftness", branch: "Survival", name: "Swiftness", icon: "/assets/icons/arrow_right.png", maxRank: 5, effect: "+7% move speed" },
  { id: "second_wind", branch: "Survival", name: "Second Wind", icon: "/assets/icons/timer.png", maxRank: 3, effect: "+20% invulnerability", requires: "vitality" },

  // Fortune
  { id: "greed", branch: "Fortune", name: "Greed", icon: "/assets/icons/token.png", maxRank: 5, effect: "+20% gold drops" },
  { id: "magnetism", branch: "Fortune", name: "Magnetism", icon: "/assets/icons/indicator.png", maxRank: 3, effect: "+35% coin pickup range" },
  { id: "scholar", branch: "Fortune", name: "Scholar", icon: "/assets/icons/book.png", maxRank: 5, effect: "+12% experience", requires: "greed" },
];

export const SKILL_BRANCHES: SkillBranch[] = ["Marksman", "Survival", "Fortune"];

export type SkillRanks = Record<SkillId, number>;

export const EMPTY_RANKS: SkillRanks = {
  sharpshooter: 0,
  rapid_draw: 0,
  long_shot: 0,
  vitality: 0,
  swiftness: 0,
  second_wind: 0,
  greed: 0,
  magnetism: 0,
  scholar: 0,
};

export function getSkill(id: SkillId): SkillDef {
  return SKILL_TREE.find((s) => s.id === id)!;
}

/** A skill can be learned when it has points left, ranks free and its parent is unlocked. */
export function canLearn(skill: SkillDef, ranks: SkillRanks, points: number): boolean {
  if (points < 1) return false;
  if ((ranks[skill.id] ?? 0) >= skill.maxRank) return false;
  if (skill.requires && (ranks[skill.requires] ?? 0) < 1) return false;
  return true;
}

export interface SkillModifiers {
  damageMult: number;
  fireRateMult: number;
  rangeBonusTiles: number;
  bonusHp: number;
  speedMult: number;
  iframeMult: number;
  goldMult: number;
  magnetMult: number;
  xpMult: number;
}

export function getSkillModifiers(ranks: SkillRanks): SkillModifiers {
  return {
    damageMult: 1 + 0.15 * (ranks.sharpshooter ?? 0),
    fireRateMult: Math.pow(0.93, ranks.rapid_draw ?? 0),
    rangeBonusTiles: ranks.long_shot ?? 0,
    bonusHp: (ranks.vitality ?? 0) * 20,
    speedMult: 1 + 0.07 * (ranks.swiftness ?? 0),
    iframeMult: 1 + 0.2 * (ranks.second_wind ?? 0),
    goldMult: 1 + 0.2 * (ranks.greed ?? 0),
    magnetMult: 1 + 0.35 * (ranks.magnetism ?? 0),
    xpMult: 1 + 0.12 * (ranks.scholar ?? 0),
  };
}
