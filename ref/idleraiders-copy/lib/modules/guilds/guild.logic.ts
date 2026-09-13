interface GuildLevelEntry {
  level: number;
  xpRequired: number;
  cumulative: number;
  unlock: string;
  xpBonus: number;
  materialBonus: number;
  energyRegen: number;
  bossDamage: number;
}

interface GuildBuffs {
  xpBonus: number;
  materialBonus: number;
  energyRegen: number;
  bossDamage: number;
}

export function getGuildBuffsAtLevel(level: number, guildLevelTable: GuildLevelEntry[]): GuildBuffs {
  // Find the entry for the given level and return its buffs directly
  const entry = guildLevelTable.find(e => e.level === level);
  if (!entry) {
    return { xpBonus: 0, materialBonus: 0, energyRegen: 0, bossDamage: 0 };
  }
  
  return {
    xpBonus: entry.xpBonus ?? 0,
    materialBonus: entry.materialBonus ?? 0,
    energyRegen: entry.energyRegen ?? 0,
    bossDamage: entry.bossDamage ?? 0,
  };
}

export function getActivityBonus(activeMembers: number): number {
  if (activeMembers >= 30) return 0.03;
  if (activeMembers >= 20) return 0.02;
  if (activeMembers >= 10) return 0.01;
  return 0;
}

export function getGuildLevelData(
  level: number,
  guildLevelTable: GuildLevelEntry[]
): GuildLevelEntry | undefined {
  return guildLevelTable.find((entry) => entry.level === level);
}

// Guild XP Progression - 15 levels, max 1,000,000 cumulative XP
// XP is consumed on level up (progressive like player XP)
const XP_THRESHOLDS = [
  0,        // Level 1: 0 XP
  5_000,    // Level 2: 5K XP
  15_000,   // Level 3: 15K cumulative
  30_000,   // Level 4: 30K cumulative
  50_000,   // Level 5: 50K cumulative
  80_000,   // Level 6: 80K cumulative
  120_000,  // Level 7: 120K cumulative
  170_000,  // Level 8: 170K cumulative
  230_000,  // Level 9: 230K cumulative
  300_000,  // Level 10: 300K cumulative
  380_000,  // Level 11: 380K cumulative
  480_000,  // Level 12: 480K cumulative
  600_000,  // Level 13: 600K cumulative
  750_000,  // Level 14: 750K cumulative
  1_000_000, // Level 15: 1M cumulative (MAX)
];

const MAX_GUILD_LEVEL = 15;

// Member capacity based on guild level
// Low level guilds have limited capacity, encouraging growth
const MEMBER_CAP_BY_LEVEL: Record<number, number> = {
  1: 5,
  2: 8,
  3: 10,
  4: 12,
  5: 15,
  6: 17,
  7: 20,
  8: 22,
  9: 25,
  10: 27,
  11: 30,
  12: 35,
  13: 40,
  14: 45,
  15: 50,
};

/**
 * Get maximum member capacity for a guild level
 */
export function getMaxMembersForLevel(level: number): number {
  if (level <= 0) return 5;
  if (level >= MAX_GUILD_LEVEL) return MEMBER_CAP_BY_LEVEL[MAX_GUILD_LEVEL];
  return MEMBER_CAP_BY_LEVEL[level] ?? 5;
}

export function getGuildLevelFromXP(totalXP: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= XP_THRESHOLDS[i]) {
      return Math.min(i + 1, MAX_GUILD_LEVEL);
    }
  }
  return 1;
}

export function getXPNeededForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_GUILD_LEVEL) return 0;
  return XP_THRESHOLDS[currentLevel] - (XP_THRESHOLDS[currentLevel - 1] ?? 0);
}

export function getXPProgressInLevel(totalXP: number, currentLevel: number): { current: number; needed: number } {
  if (currentLevel >= MAX_GUILD_LEVEL) {
    return { current: 0, needed: 0 };
  }
  const levelStartXP = XP_THRESHOLDS[currentLevel - 1] ?? 0;
  const levelEndXP = XP_THRESHOLDS[currentLevel] ?? 0;
  return {
    current: totalXP - levelStartXP,
    needed: levelEndXP - levelStartXP,
  };
}



// ═══════════════════════════════════════════════════════════════════════════════
// Guild Perks System
// ═══════════════════════════════════════════════════════════════════════════════

import { GUILD_PERK_BRANCHES, type IGuildPerkBranch, type IGuildPerkTier } from '@/public/data/progression/progression'

export interface UnlockedPerk {
  perkId: string
  branch: string
  tier: number
}

export interface CanUnlockResult {
  canUnlock: boolean
  reason?: string
}

export interface GuildPerkEffects {
  raidPower: number
  bossDamage: number
  bossEnergyCost: number
  tokenReward: number
  materialDrop: number
  marketplaceFee: number
  xpGain: number
  fatigue: number
  potionSlot: number
  warMissionDuration: number
}

/**
 * Get all perk branches configuration
 */
export function getPerkBranches(): IGuildPerkBranch[] {
  return GUILD_PERK_BRANCHES
}

/**
 * Find a specific perk tier by branch and tier number
 */
export function getPerkTier(branchId: string, tier: number): IGuildPerkTier | undefined {
  const branch = GUILD_PERK_BRANCHES.find(b => b.id === branchId)
  return branch?.tiers.find(t => t.tier === tier)
}

/**
 * Find a perk by its unique ID
 */
export function getPerkById(perkId: string): { branch: IGuildPerkBranch; tier: IGuildPerkTier } | undefined {
  for (const branch of GUILD_PERK_BRANCHES) {
    const tier = branch.tiers.find(t => t.id === perkId)
    if (tier) {
      return { branch, tier }
    }
  }
  return undefined
}

/**
 * Check if a guild can unlock a specific perk
 */
export function canUnlockPerk(
  guild: { points: number; perks: UnlockedPerk[] },
  branchId: string,
  tier: number
): CanUnlockResult {
  const tierData = getPerkTier(branchId, tier)
  if (!tierData) {
    return { canUnlock: false, reason: 'Perk not found' }
  }

  // Check if already unlocked
  const alreadyUnlocked = guild.perks.some(p => p.perkId === tierData.id)
  if (alreadyUnlocked) {
    return { canUnlock: false, reason: 'Perk already unlocked' }
  }

  // Check prerequisite tier (must have previous tier in same branch)
  if (tier > 1) {
    const previousTier = getPerkTier(branchId, tier - 1)
    if (previousTier) {
      const hasPreviousTier = guild.perks.some(p => p.perkId === previousTier.id)
      if (!hasPreviousTier) {
        return { canUnlock: false, reason: `Must unlock ${previousTier.name} first` }
      }
    }
  }

  // Check points
  if (guild.points < tierData.pointsCost) {
    return { canUnlock: false, reason: `Need ${tierData.pointsCost.toLocaleString()} guild points` }
  }

  return { canUnlock: true }
}

/**
 * Calculate combined perk effects from all unlocked perks
 */
export function calculatePerkEffects(unlockedPerks: UnlockedPerk[]): GuildPerkEffects {
  const effects: GuildPerkEffects = {
    raidPower: 0,
    bossDamage: 0,
    bossEnergyCost: 0,
    tokenReward: 0,
    materialDrop: 0,
    marketplaceFee: 0,
    xpGain: 0,
    fatigue: 0,
    potionSlot: 0,
    warMissionDuration: 0,
  }

  for (const unlockedPerk of unlockedPerks) {
    const perkData = getPerkById(unlockedPerk.perkId)
    if (perkData) {
      const { type, value } = perkData.tier.effect
      effects[type] += value
    }
  }

  return effects
}

/**
 * Get the highest unlocked tier for each branch
 */
export function getHighestUnlockedTiers(unlockedPerks: UnlockedPerk[]): Record<string, number> {
  const highest: Record<string, number> = {}
  
  for (const perk of unlockedPerks) {
    if (!highest[perk.branch] || perk.tier > highest[perk.branch]) {
      highest[perk.branch] = perk.tier
    }
  }
  
  return highest
}

/**
 * Get next available perks that can be unlocked
 */
export function getNextAvailablePerks(unlockedPerks: UnlockedPerk[]): IGuildPerkTier[] {
  const highestTiers = getHighestUnlockedTiers(unlockedPerks)
  const available: IGuildPerkTier[] = []

  for (const branch of GUILD_PERK_BRANCHES) {
    const currentTier = highestTiers[branch.id] ?? 0
    const nextTier = branch.tiers.find(t => t.tier === currentTier + 1)
    if (nextTier) {
      available.push(nextTier)
    }
  }

  return available
}

/**
 * Calculate total points spent on perks
 */
export function calculateTotalPointsSpent(unlockedPerks: UnlockedPerk[]): number {
  let total = 0
  for (const perk of unlockedPerks) {
    const perkData = getPerkById(perk.perkId)
    if (perkData) {
      total += perkData.tier.pointsCost
    }
  }
  return total
}
