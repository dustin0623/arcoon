/**
 * Achievements Configuration
 * Cosmetic achievements for bragging rights and milestones
 * No stat rewards - purely display/bragging purposes
 */

export const ACHIEVEMENTS = [
  // ── Combat Achievements ─────────────────────────────────────
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Complete your first mission',
    icon: '⚔️',
    category: 'combat',
    check: (s: Record<string, any>) => s.totalMissions >= 1,
  },
  {
    id: 'veteran',
    title: 'Veteran Raider',
    description: 'Complete 50 missions',
    icon: '🗡️',
    category: 'combat',
    check: (s: Record<string, any>) => s.totalMissions >= 50,
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Complete 100 missions',
    icon: '🛡️',
    category: 'combat',
    check: (s: Record<string, any>) => s.totalMissions >= 100,
  },
  {
    id: 'warlord',
    title: 'Warlord',
    description: 'Complete 500 missions',
    icon: '👑',
    category: 'combat',
    check: (s: Record<string, any>) => s.totalMissions >= 500,
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    description: 'Deal 10,000 boss damage',
    icon: '🐉',
    category: 'combat',
    check: (s: Record<string, any>) => s.totalBossDamage >= 10000,
  },
  {
    id: 'dragon_killer',
    title: 'Dragon Killer',
    description: 'Deal 100,000 boss damage',
    icon: '💀',
    category: 'combat',
    check: (s: Record<string, any>) => s.totalBossDamage >= 100000,
  },
  {
    id: 'godslayer',
    title: 'Godslayer',
    description: 'Deal 1,000,000 boss damage',
    icon: '⚡',
    category: 'combat',
    check: (s: Record<string, any>) => s.totalBossDamage >= 1000000,
  },

  // ── Collection Achievements ─────────────────────────────────
  {
    id: 'collector_10',
    title: 'Collector',
    description: 'Own 10 unique cards',
    icon: '🃏',
    category: 'collection',
    check: (s: Record<string, any>) => s.uniqueCards >= 10,
  },
  {
    id: 'collector_25',
    title: 'Hoarder',
    description: 'Own 25 unique cards',
    icon: '📚',
    category: 'collection',
    check: (s: Record<string, any>) => s.uniqueCards >= 25,
  },
  {
    id: 'collector_50',
    title: 'Archivist',
    description: 'Own 50 unique cards',
    icon: '🏛️',
    category: 'collection',
    check: (s: Record<string, any>) => s.uniqueCards >= 50,
  },

  // ── Progression Achievements ────────────────────────────────
  {
    id: 'lvl_5',
    title: 'Apprentice',
    description: 'Reach level 5',
    icon: '🌱',
    category: 'progression',
    check: (s: Record<string, any>) => s.playerLevel >= 5,
  },
  {
    id: 'lvl_10',
    title: 'Journeyman',
    description: 'Reach level 10',
    icon: '🌿',
    category: 'progression',
    check: (s: Record<string, any>) => s.playerLevel >= 10,
  },
  {
    id: 'lvl_25',
    title: 'Expert',
    description: 'Reach level 25',
    icon: '🌳',
    category: 'progression',
    check: (s: Record<string, any>) => s.playerLevel >= 25,
  },
  {
    id: 'lvl_50',
    title: 'Master',
    description: 'Reach level 50',
    icon: '⭐',
    category: 'progression',
    check: (s: Record<string, any>) => s.playerLevel >= 50,
  },
  {
    id: 'lvl_100',
    title: 'Legend',
    description: 'Reach level 100',
    icon: '🌟',
    category: 'progression',
    check: (s: Record<string, any>) => s.playerLevel >= 100,
  },

  // ── Social Achievements ─────────────────────────────────────
  {
    id: 'guild_member',
    title: 'Guild Member',
    description: 'Join a guild',
    icon: '🏰',
    category: 'social',
    check: (s: Record<string, any>) => s.inGuild,
  },
] as const
