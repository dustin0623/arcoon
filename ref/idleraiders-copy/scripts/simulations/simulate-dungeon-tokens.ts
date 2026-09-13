/**
 * Monte-Carlo simulation of dungeon mission token rewards.
 *
 * Goal: Verify whether the current `calculateDungeonReward` formula plus
 * fatigue + repeat penalties correctly balances mission types so that
 * spamming Scouts is NOT strictly better per-energy than running War.
 *
 * Player profile: opened 1,000 standard packs.
 *   ~267k raidPower, mastery rolled from same card pool.
 *
 * Game constants used:
 *   ENERGY.MAX  = 100     (single-bar)
 *   FATIGUE.MAX = 100
 *
 * Scenarios:
 *   A) Single-bar burn (100 energy, fatigue starts 0)
 *      i.   spam-1d   — same dungeon, same mission     (repeat penalty active)
 *      ii.  rotate    — 10 dungeons, no repeat          (repeat penalty avoided)
 *   B) Daily grind (24h energy regen ≈ 480 energy)
 *      Same two strategies; fatigue accumulates until cap blocks further runs.
 *
 * Reward formula = verbatim copy of mission.logic.ts → calculateDungeonReward.
 */

import { CARDS_DATA } from '../../public/data/cards/index'
import { PACKS } from '../../public/data/items/items'
import { MISSION_TYPES, DUNGEONS_DATA, type MissionTypeId } from '../../public/data/world/dungeons'

type AnyCard = {
  id: string
  type: string
  rarity: string
  source?: { type?: string }
  stats?: { raidPower?: number; mastery?: number; luck?: number; gm?: number } | null
}

const cards = CARDS_DATA as unknown as AnyCard[]

// Build pack pool exactly like item.service.ts
const POOL_BY_RARITY: Record<string, AnyCard[]> = {}
for (const c of cards) {
  if (!c.rarity) continue
  if (c.type === 'booster') continue
  if (c.source?.type === 'crafting') continue
  if (c.source?.type === 'story') continue
  if (!POOL_BY_RARITY[c.rarity]) POOL_BY_RARITY[c.rarity] = []
  POOL_BY_RARITY[c.rarity].push(c)
}

const standardPack = PACKS.find((p) => p.id === 'standard_pack')
if (!standardPack?.data) throw new Error('standard_pack missing')
const dropRates = standardPack.data.dropRates as Record<string, number>
const cardCount = standardPack.data.cardCount ?? 3

function rollRarity(): string {
  const r = Math.random()
  let cum = 0
  for (const [k, v] of Object.entries(dropRates)) {
    cum += v
    if (r < cum) return k
  }
  return 'common'
}

function rollCard(rar: string): AnyCard {
  const pool = POOL_BY_RARITY[rar] ?? []
  if (pool.length === 0) return cards.find((x) => x.type !== 'booster') as AnyCard
  return pool[Math.floor(Math.random() * pool.length)]
}

function simulatePlayer(packs: number) {
  let raidPower = 0
  let mastery = 0
  for (let p = 0; p < packs; p++) {
    for (let i = 0; i < cardCount; i++) {
      const c = rollCard(rollRarity())
      raidPower += c.stats?.raidPower ?? 0
      mastery += c.stats?.mastery ?? 0
    }
  }
  return { raidPower, mastery }
}

// ─────────────────────────────────────────────
// Reward formula — verbatim from mission.logic.ts
// ─────────────────────────────────────────────
function calculateDungeonReward(
  baseReward: number,
  raidPower: number,
  repeatCount: number,
  fatigue: number,
  mastery: number,
  energyCost: number,
): number {
  const bonusReward = raidPower * 0.1 * (energyCost / 15)
  let repeatMultiplier = 1 - repeatCount * 0.15
  if (repeatMultiplier < 0.1) repeatMultiplier = 0.1
  let fatigueMultiplier = 1
  if (fatigue > 0) {
    fatigueMultiplier = mastery > 0 ? Math.min(1, mastery / Math.max(1, fatigue)) : 0
  }
  const adjustedBonus = bonusReward * repeatMultiplier * fatigueMultiplier
  const roll = Math.random() * adjustedBonus
  return Math.floor(baseReward + roll)
}

// ─────────────────────────────────────────────
// Strategy runners
// ─────────────────────────────────────────────
const FATIGUE_MAX = 100

interface Result {
  missions: number
  tokens: number
  energy: number
  minutes: number
}

/** Spam same mission in dungeon d1 (factor 1.2). repeatCount climbs. */
function runSingleDungeon(mid: MissionTypeId, rp: number, mast: number, energyBudget: number): Result {
  const m = MISSION_TYPES[mid]
  const dungeon = DUNGEONS_DATA[0]
  const baseReward = Math.floor(m.baseTokenReward * dungeon.dungeonFactor)
  let fatigue = 0,
    repeats = 0,
    energy = energyBudget,
    tokens = 0,
    missions = 0,
    minutes = 0
  while (energy >= m.energyCost && fatigue + m.fatiguePerMission <= FATIGUE_MAX) {
    tokens += calculateDungeonReward(baseReward, rp, repeats, fatigue, mast, m.energyCost)
    fatigue += m.fatiguePerMission
    energy -= m.energyCost
    minutes += m.duration / 60
    repeats++
    missions++
  }
  return { missions, tokens, energy: energyBudget - energy, minutes }
}

/** Rotate across all 10 dungeons. repeatCount = 0 every run, dungeonFactor varies. */
function runRotateDungeons(mid: MissionTypeId, rp: number, mast: number, energyBudget: number): Result {
  const m = MISSION_TYPES[mid]
  let fatigue = 0,
    energy = energyBudget,
    tokens = 0,
    missions = 0,
    minutes = 0,
    dIdx = 0
  while (energy >= m.energyCost && fatigue + m.fatiguePerMission <= FATIGUE_MAX) {
    const dungeon = DUNGEONS_DATA[dIdx % DUNGEONS_DATA.length]
    const baseReward = Math.floor(m.baseTokenReward * dungeon.dungeonFactor)
    tokens += calculateDungeonReward(baseReward, rp, 0, fatigue, mast, m.energyCost)
    fatigue += m.fatiguePerMission
    energy -= m.energyCost
    minutes += m.duration / 60
    missions++
    dIdx++
  }
  return { missions, tokens, energy: energyBudget - energy, minutes }
}

// ─────────────────────────────────────────────
// Build profile
// ─────────────────────────────────────────────
const PROFILE_TRIALS = 200
let avgRP = 0,
  avgMast = 0
for (let i = 0; i < PROFILE_TRIALS; i++) {
  const p = simulatePlayer(1000)
  avgRP += p.raidPower
  avgMast += p.mastery
}
avgRP /= PROFILE_TRIALS
avgMast /= PROFILE_TRIALS
const RP = Math.round(avgRP)
const MASTERY = Math.round(avgMast)

console.log('═══ 1,000-Pack Player Profile ═══')
console.log(`  Avg Raid Power : ${RP.toLocaleString()}`)
console.log(`  Avg Mastery    : ${MASTERY.toLocaleString()}`)
console.log(`  Mastery vs Fatigue cap (100): ${MASTERY >= 100 ? `${(MASTERY / 100).toFixed(1)}× — fully covered` : `${MASTERY}% — partial coverage`}`)
console.log()

// ─────────────────────────────────────────────
// Run scenarios
// ─────────────────────────────────────────────
const TRIALS = 5000
const MISSION_LIST: MissionTypeId[] = ['scout', 'patrol', 'expedition', 'siege', 'war']
const ENERGY_SCENARIOS: { name: string; energy: number }[] = [
  { name: 'Single bar (100 energy)', energy: 100 },
  { name: 'Daily play (480 energy ≈ 24h regen)', energy: 480 },
]

interface Row {
  mission: string
  strat: string
  missions: number
  tokens: number
  perMin: number
  perEnergy: number
  fatigueBlocked: boolean
}

for (const scenario of ENERGY_SCENARIOS) {
  console.log(`═══ Scenario: ${scenario.name} ═══`)
  const rows: Row[] = []

  for (const mid of MISSION_LIST) {
    for (const strat of ['spam d1', 'rotate d1-d10'] as const) {
      let tk = 0,
        ms = 0,
        mn = 0,
        en = 0
      for (let t = 0; t < TRIALS; t++) {
        const r =
          strat === 'spam d1'
            ? runSingleDungeon(mid, RP, MASTERY, scenario.energy)
            : runRotateDungeons(mid, RP, MASTERY, scenario.energy)
        tk += r.tokens
        ms += r.missions
        mn += r.minutes
        en += r.energy
      }
      const m = MISSION_TYPES[mid]
      const energyAffordable = Math.floor(scenario.energy / m.energyCost)
      const fatigueAffordable = Math.floor(FATIGUE_MAX / m.fatiguePerMission)
      const cap = Math.min(energyAffordable, fatigueAffordable)
      rows.push({
        mission: mid,
        strat,
        missions: ms / TRIALS,
        tokens: tk / TRIALS,
        perMin: tk / Math.max(1, mn),
        perEnergy: tk / Math.max(1, en),
        fatigueBlocked: fatigueAffordable < energyAffordable,
      })
      void cap
    }
  }

  console.log(
    'Mission     | Strategy        | Missions | Tokens     | Tokens/min | Tokens/energy | Limit',
  )
  console.log(
    '------------|-----------------|----------|------------|------------|---------------|---------',
  )
  for (const r of rows) {
    const limit = r.fatigueBlocked ? 'fatigue' : 'energy'
    console.log(
      `${r.mission.padEnd(12)}| ${r.strat.padEnd(16)}| ${r.missions.toFixed(1).padStart(8)} | ${Math.round(r.tokens).toLocaleString().padStart(10)} | ${Math.round(r.perMin).toLocaleString().padStart(10)} | ${Math.round(r.perEnergy).toLocaleString().padStart(13)} | ${limit}`,
    )
  }
  console.log()
}

// ─────────────────────────────────────────────
// Headline: best Scout vs best War (single-bar)
// ─────────────────────────────────────────────
const TRIALS_HEADLINE = 5000
let scoutBest = 0,
  warBest = 0
for (let t = 0; t < TRIALS_HEADLINE; t++) {
  const s = runSingleDungeon('scout', RP, MASTERY, 100).tokens
  const w = runSingleDungeon('war', RP, MASTERY, 100).tokens
  scoutBest += s
  warBest += w
}
scoutBest /= TRIALS_HEADLINE
warBest /= TRIALS_HEADLINE

console.log('═══ Headline (single-bar, spam d1) ═══')
console.log(`  Scout-spam total tokens : ${Math.round(scoutBest).toLocaleString()}`)
console.log(`  War       total tokens  : ${Math.round(warBest).toLocaleString()}`)
console.log(`  Scout/War ratio         : ${(scoutBest / warBest).toFixed(2)}× per energy bar`)
console.log()

// Same comparison but rotating dungeons
let scoutRot = 0,
  warRot = 0
for (let t = 0; t < TRIALS_HEADLINE; t++) {
  scoutRot += runRotateDungeons('scout', RP, MASTERY, 100).tokens
  warRot += runRotateDungeons('war', RP, MASTERY, 100).tokens
}
scoutRot /= TRIALS_HEADLINE
warRot /= TRIALS_HEADLINE

console.log('═══ Headline (single-bar, rotate dungeons — repeat penalty avoided) ═══')
console.log(`  Scout (rotate)  : ${Math.round(scoutRot).toLocaleString()}`)
console.log(`  War   (rotate)  : ${Math.round(warRot).toLocaleString()}`)
console.log(`  Scout/War ratio : ${(scoutRot / warRot).toFixed(2)}×`)
