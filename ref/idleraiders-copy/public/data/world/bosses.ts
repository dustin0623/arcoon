import { MATERIALS } from "../items/items"

export interface BossDropRate {
  component: number
  catalyst: number
}

export interface BossCatalystDropRate {
  common: number
  uncommon: number
  rare: number
  epic: number
  legendary: number
}

export interface Boss {
  id: string
  name: string
  tier: number
  energyCost: number
  damageMultiplier: number
  componentPool?: string[]
  catalystPool?: string[]
  dropRate: BossDropRate
  catalystDropRate: BossCatalystDropRate
}

// Global shared pools - exported for use in mission.service when pools not specified
export const DEFAULT_COMPONENT_POOL = MATERIALS
  .filter((m) => m.type === "component")
  .map((m) => m.id)

export const DEFAULT_CATALYST_POOL = MATERIALS
  .filter((m) => m.type === "catalyst")
  .map((m) => m.id)

export const BOSSES_DATA: Boss[] = [
  {
    id: "b1",
    name: "Goblin King",
    tier: 1,
    energyCost: 20,
    damageMultiplier: 1.0,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.75,
      uncommon: 0.25,
      rare: 0,
      epic: 0,
      legendary: 0,
    },
  },
  {
    id: "b2",
    name: "Spider Queen",
    tier: 1,
    energyCost: 20,
    damageMultiplier: 1.0,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.65,
      uncommon: 0.30,
      rare: 0.05,
      epic: 0,
      legendary: 0,
    },
  },
  {
    id: "b3",
    name: "Soul Reaver",
    tier: 2,
    energyCost: 27,
    damageMultiplier: 1.25,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.45,
      uncommon: 0.40,
      rare: 0.15,
      epic: 0,
      legendary: 0,
    },
  },
  {
    id: "b4",
    name: "Lich King",
    tier: 2,
    energyCost: 27,
    damageMultiplier: 1.25,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.30,
      uncommon: 0.45,
      rare: 0.20,
      epic: 0.05,
      legendary: 0,
    },
  },
  {
    id: "b5",
    name: "Frost Giant",
    tier: 3,
    energyCost: 35,
    damageMultiplier: 1.5,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.15,
      uncommon: 0.45,
      rare: 0.30,
      epic: 0.10,
      legendary: 0,
    },
  },
  {
    id: "b6",
    name: "Ancient Treant",
    tier: 3,
    energyCost: 35,
    damageMultiplier: 1.5,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.10,
      uncommon: 0.35,
      rare: 0.40,
      epic: 0.14,
      legendary: 0.01,
    },
  },
  {
    id: "b7",
    name: "Ember Colossus",
    tier: 4,
    energyCost: 42,
    damageMultiplier: 1.75,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.05,
      uncommon: 0.25,
      rare: 0.45,
      epic: 0.22,
      legendary: 0.03,
    },
  },
  {
    id: "b8",
    name: "Ash Lord",
    tier: 4,
    energyCost: 42,
    damageMultiplier: 1.75,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.00,
      uncommon: 0.20,
      rare: 0.45,
      epic: 0.30,
      legendary: 0.05,
    },
  },
  {
    id: "b9",
    name: "Demon Lord",
    tier: 5,
    energyCost: 50,
    damageMultiplier: 2.0,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.00,
      uncommon: 0.10,
      rare: 0.40,
      epic: 0.40,
      legendary: 0.10,
    },
  },
  {
    id: "b10",
    name: "Ancient Dragon",
    tier: 5,
    energyCost: 50,
    damageMultiplier: 2.0,
    dropRate: { component: 75, catalyst: 25 },
    catalystDropRate: {
      common: 0.00,
      uncommon: 0.05,
      rare: 0.30,
      epic: 0.45,
      legendary: 0.20,
    },
  },
]

export default BOSSES_DATA
