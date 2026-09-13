// ─────────────────────────────────────────────
// Mission Templates
// ─────────────────────────────────────────────

export type MissionTypeId = 'scout' | 'patrol' | 'expedition' | 'siege' | 'war'

/**
 * Per-dungeon completion gate. To unlock this mission tier in a given dungeon,
 * the player must have completed `count` runs of `missionId` in that same dungeon.
 * `null` = no gate (Scout is always free).
 */
export interface MissionCompletionRequirement {
  missionId: MissionTypeId
  count: number
}

export interface MissionTemplate {
  id: MissionTypeId
  name: string
  duration: number
  label: string
  energyCost: number
  baseTokenReward: number
  fatiguePerMission: number
  materialRolls: number
  requiredCompletions?: MissionCompletionRequirement
}

export interface Mission extends MissionTemplate {
  requiredLevel: number
}

export interface DungeonBase {
  id: string
  name: string
  requiredLevel: number
  /** Number of War Campaigns from previous dungeon required to unlock (null for first dungeon) */
  requiredWarCampaigns?: { dungeonId: string; count: number } | null
  dungeonFactor: number
  materialPool: string[]
}

export interface Dungeon extends DungeonBase {
  missions: Mission[]
}

export const MISSION_TYPES: Record<MissionTypeId, MissionTemplate> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    duration: 300,
    label: '5 min',
    energyCost: 15,
    baseTokenReward: 50,
    fatiguePerMission: 10,
    materialRolls: 1,
  },

  patrol: {
    id: 'patrol',
    name: 'Patrol',
    duration: 900,
    label: '15 min',
    energyCost: 25,
    baseTokenReward: 100,
    fatiguePerMission: 20,
    materialRolls: 3,
    requiredCompletions: { missionId: 'scout', count: 36 },      // 36 × 5min = 3 hrs
  },

  expedition: {
    id: 'expedition',
    name: 'Expedition',
    duration: 1800,
    label: '30 min',
    energyCost: 45,
    baseTokenReward: 250,
    fatiguePerMission: 35,
    materialRolls: 6,
    requiredCompletions: { missionId: 'patrol', count: 24 },     // 24 × 15min = 6 hrs
  },

  siege: {
    id: 'siege',
    name: 'Siege',
    duration: 3600,
    label: '1 hr',
    energyCost: 60,
    baseTokenReward: 500,
    fatiguePerMission: 60,
    materialRolls: 12,
    requiredCompletions: { missionId: 'expedition', count: 18 }, // 18 × 30min = 9 hrs
  },

  war: {
    id: 'war',
    name: 'War Campaign',
    duration: 10800,
    label: '3 hr',
    energyCost: 80,
    baseTokenReward: 750,
    fatiguePerMission: 90,
    materialRolls: 36,
    requiredCompletions: { missionId: 'siege', count: 12 },      // 12 × 1hr = 12 hrs
  },
} as const

// ─────────────────────────────────────────────
// Mission Level Offsets
// ─────────────────────────────────────────────

export const MISSION_LEVEL_OFFSETS: Record<MissionTypeId, number> = {
  scout: 0,
  patrol: 3,
  expedition: 6,
  siege: 9,
  war: 12,
}

// ─────────────────────────────────────────────
// Dungeon Definitions
// ─────────────────────────────────────────────

const RAW_DUNGEONS: readonly DungeonBase[] = [
  {
    id: 'd1',
    name: 'Goblin Cave',
    requiredLevel: 1,
    requiredWarCampaigns: null, // First dungeon — no prerequisite
    dungeonFactor: 1.2,
    materialPool: ['material_goblin_iron', 'material_crude_leather'],
  },
  {
    id: 'd2',
    name: 'Spider Den',
    requiredLevel: 16,
    requiredWarCampaigns: { dungeonId: 'd1', count: 8 },  // 8 × 3hr = 24 hrs
    dungeonFactor: 1.4,
    materialPool: ['material_silk_thread', 'material_chitin_plate'],
  },
  {
    id: 'd3',
    name: 'Graveyard of Souls',
    requiredLevel: 31,
    requiredWarCampaigns: { dungeonId: 'd2', count: 8 },  // 8 × 3hr = 24 hrs
    dungeonFactor: 1.6,
    materialPool: ['material_soul_ash', 'material_grave_cloth'],
  },
  {
    id: 'd4',
    name: 'Crypt of the Undying',
    requiredLevel: 46,
    requiredWarCampaigns: { dungeonId: 'd3', count: 8 },  // 8 × 3hr = 24 hrs
    dungeonFactor: 1.8,
    materialPool: ['material_necro_dust', 'material_bone_rune'],
  },
  {
    id: 'd5',
    name: 'Ice Cavern',
    requiredLevel: 61,
    requiredWarCampaigns: { dungeonId: 'd4', count: 8 },  // 8 × 3hr = 24 hrs
    dungeonFactor: 2.0,
    materialPool: ['material_frostwood', 'material_glacial_shard'],
  },
  {
    id: 'd6',
    name: 'Dark Forest',
    requiredLevel: 76,
    requiredWarCampaigns: { dungeonId: 'd5', count: 8 },  // 8 × 3hr = 24 hrs
    dungeonFactor: 2.2,
    materialPool: ['material_elder_bark', 'material_living_sap'],
  },
  {
    id: 'd7',
    name: 'Molten Quarry',
    requiredLevel: 91,
    requiredWarCampaigns: { dungeonId: 'd6', count: 8 },  // 8 × 3hr = 24 hrs
    dungeonFactor: 2.4,
    materialPool: ['material_cinder_stone', 'material_magma_core'],
  },
  {
    id: 'd8',
    name: 'Ashen Fortress',
    requiredLevel: 106,
    requiredWarCampaigns: { dungeonId: 'd7', count: 8 },  // 8 × 3hr = 24 hrs
    dungeonFactor: 2.6,
    materialPool: ['material_ash_crystal', 'material_charred_bone'],
  },
  {
    id: 'd9',
    name: "Demon's Gate",
    requiredLevel: 121,
    requiredWarCampaigns: { dungeonId: 'd8', count: 8 },  // 8 × 3hr = 24 hrs
    dungeonFactor: 2.8,
    materialPool: ['material_demon_ichor', 'material_cursed_steel'],
  },
  {
    id: 'd10',
    name: "Dragon's Lair",
    requiredLevel: 136,
    requiredWarCampaigns: { dungeonId: 'd9', count: 8 },  // 8 × 3hr = 24 hrs
    dungeonFactor: 3.0,
    materialPool: ['material_dragon_bone', 'material_void_scale'],
  },
] as const

// ─────────────────────────────────────────────
// Build Dungeons
// ─────────────────────────────────────────────

export const DUNGEONS_DATA: readonly Dungeon[] = Object.freeze(
  RAW_DUNGEONS.map((dungeon): Dungeon => {
    const missions: Mission[] = (Object.values(MISSION_TYPES) as MissionTemplate[]).map(
      (mission): Mission => {
        const offset = MISSION_LEVEL_OFFSETS[mission.id]

        return {
          ...mission,
          baseTokenReward: Math.floor(mission.baseTokenReward * dungeon.dungeonFactor),
          requiredLevel: dungeon.requiredLevel + offset,
        }
      },
    )

    return {
      ...dungeon,
      missions,
    }
  }),
)

export default DUNGEONS_DATA
