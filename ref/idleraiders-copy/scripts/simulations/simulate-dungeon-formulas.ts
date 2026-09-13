/**
 * Compares CURRENT vs PROPOSED dungeon token formulas.
 *
 * CURRENT:    bonus = RP * 0.1
 * PROPOSED A: bonus = RP * 0.1 * (energyCost / 15)     // scale by energy cost
 * PROPOSED B: bonus = RP * 0.1 * (durationMin / 5)     // scale by mission time
 * PROPOSED C: bonus = RP * 0.1 * sqrt(energyCost / 15) // softer energy scaling
 *
 * Player profile: ~1000 standard packs already opened (matches first sim).
 * Same baseReward, repeatMultiplier, fatigueMultiplier as production
 * `calculateDungeonReward` in lib/modules/missions/mission.logic.ts.
 */
import { CARDS_DATA } from "../../public/data/cards/index"
import { PACKS } from "../../public/data/items/items"

type AnyCard = {
  id: string
  type: string
  rarity: string
  class?: string
  source?: { type?: string }
  stats?: { raidPower?: number; mastery?: number; luck?: number; gm?: number } | null
}

const cards = CARDS_DATA as unknown as AnyCard[]
const standardPack = PACKS.find((p: any) => p.id === "standard_pack") as any
const dropRates = standardPack.data.dropRates as Record<string, number>

const POOL_BY_RARITY: Record<string, AnyCard[]> = {}
for (const card of cards) {
  if (!card.rarity) continue
  if (card.source?.type && ["booster", "crafting", "story"].includes(card.source.type)) continue
    ; (POOL_BY_RARITY[card.rarity] ||= []).push(card)
}

function pickRarity(): string {
  const r = Math.random()
  let acc = 0
  for (const [rarity, rate] of Object.entries(dropRates)) {
    acc += rate
    if (r < acc) return rarity
  }
  return "common"
}

function pickCard(rarity: string): AnyCard {
  const pool = POOL_BY_RARITY[rarity] || []
  return pool[Math.floor(Math.random() * pool.length)]
}

// Build a 1000-pack player
function buildPlayer() {
  let raidPower = 0
  let mastery = 0
  for (let p = 0; p < 1000; p++) {
    for (let c = 0; c < 3; c++) {
      const card = pickCard(pickRarity())
      raidPower += card?.stats?.raidPower ?? 0
      mastery += card?.stats?.mastery ?? 0
    }
  }
  return { raidPower, mastery }
}

// ---- Mission formulas (mirroring mission.logic.ts) ----
type Formula = "current" | "energy" | "time" | "sqrtEnergy"

function calcReward(
  formula: Formula,
  baseReward: number,
  raidPower: number,
  energyCost: number,
  durationMin: number,
  repeatCount: number,
  fatigue: number,
  mastery: number,
): number {
  let bonus = raidPower * 0.1
  switch (formula) {
    case "energy":
      bonus *= energyCost / 15 // scout=1x, war=80/15=5.33x
      break
    case "time":
      bonus *= durationMin / 5 // scout=1x, war=180/5=36x
      break
    case "sqrtEnergy":
      bonus *= Math.sqrt(energyCost / 15) // scout=1x, war=2.31x
      break
  }
  const repeatMult = Math.max(0.1, 1 - repeatCount * 0.15)
  const fatigueMult = mastery > 0 ? Math.min(1, mastery / Math.max(fatigue, 1)) : 0
  const adjustedBonus = bonus * repeatMult * fatigueMult
  return Math.floor(baseReward + Math.random() * adjustedBonus)
}

// ---- Mission catalog (matches dungeons.ts) ----
const MISSIONS = [
  { id: "scout", base: 50, energy: 15, durationMin: 5, fatigue: 10, dungeonFactor: 3.0 },
  { id: "patrol", base: 100, energy: 25, durationMin: 15, fatigue: 20, dungeonFactor: 3.0 },
  { id: "expedition", base: 250, energy: 45, durationMin: 30, fatigue: 35, dungeonFactor: 3.0 },
  { id: "siege", base: 500, energy: 60, durationMin: 60, fatigue: 60, dungeonFactor: 3.0 },
  { id: "war", base: 750, energy: 80, durationMin: 180, fatigue: 90, dungeonFactor: 3.0 },
]

const ENERGY_BAR = 100
const FATIGUE_CAP = 100

// Spam single dungeon (full repeat penalty kicks in, fatigue kicks in)
function simulateSpam(
  formula: Formula,
  mission: typeof MISSIONS[number],
  player: { raidPower: number; mastery: number },
  energyBudget: number,
) {
  let energy = energyBudget
  let fatigue = 0
  let totalTokens = 0
  let totalTimeMin = 0
  let runs = 0
  let repeatCount = 0

  while (energy >= mission.energy && fatigue + mission.fatigue <= FATIGUE_CAP) {
    const baseReward = mission.base * mission.dungeonFactor
    const tokens = calcReward(
      formula,
      baseReward,
      player.raidPower,
      mission.energy,
      mission.durationMin,
      repeatCount,
      fatigue,
      player.mastery,
    )
    totalTokens += tokens
    totalTimeMin += mission.durationMin
    energy -= mission.energy
    fatigue += mission.fatigue
    repeatCount += 1
    runs += 1
  }

  return { runs, totalTokens, totalTimeMin }
}

// Rotate across 10 dungeons (no repeat penalty), still hits global fatigue cap
function simulateRotate(
  formula: Formula,
  mission: typeof MISSIONS[number],
  player: { raidPower: number; mastery: number },
  energyBudget: number,
) {
  let energy = energyBudget
  let fatigue = 0
  let totalTokens = 0
  let totalTimeMin = 0
  let runs = 0
  const dungeonRepeats: Record<number, number> = {}
  let dungeonIdx = 0

  while (energy >= mission.energy && fatigue + mission.fatigue <= FATIGUE_CAP) {
    const idx = dungeonIdx % 10
    const repeatCount = dungeonRepeats[idx] ?? 0
    const baseReward = mission.base * mission.dungeonFactor
    const tokens = calcReward(
      formula,
      baseReward,
      player.raidPower,
      mission.energy,
      mission.durationMin,
      repeatCount,
      fatigue,
      player.mastery,
    )
    totalTokens += tokens
    totalTimeMin += mission.durationMin
    energy -= mission.energy
    fatigue += mission.fatigue
    dungeonRepeats[idx] = repeatCount + 1
    dungeonIdx += 1
    runs += 1
  }

  return { runs, totalTokens, totalTimeMin }
}

// ---- Run ----
const TRIALS = 2000

function avgRun(runner: () => number): number {
  let total = 0
  for (let i = 0; i < TRIALS; i++) total += runner()
  return total / TRIALS
}

const samplePlayer = buildPlayer()
console.log(`Player profile: RP=${samplePlayer.raidPower.toLocaleString()}  Mastery=${samplePlayer.mastery.toLocaleString()}`)
console.log(`Trials: ${TRIALS}\n`)

const formulas: Formula[] = ["current", "energy", "time", "sqrtEnergy"]

for (const mode of ["spam", "rotate"] as const) {
  console.log(`\n===== ${mode.toUpperCase()} (single 100-energy bar) =====`)
  console.log(
    "Formula".padEnd(12),
    "Mission".padEnd(11),
    "Runs".padStart(5),
    "Tokens".padStart(9),
    "Tokens/min".padStart(11),
    "Tokens/energy".padStart(14),
  )
  for (const formula of formulas) {
    for (const mission of MISSIONS) {
      const tokens = avgRun(() => {
        const result = mode === "spam"
          ? simulateSpam(formula, mission, samplePlayer, ENERGY_BAR)
          : simulateRotate(formula, mission, samplePlayer, ENERGY_BAR)
        return result.totalTokens
      })
      const runs = mode === "spam"
        ? simulateSpam(formula, mission, samplePlayer, ENERGY_BAR).runs
        : simulateRotate(formula, mission, samplePlayer, ENERGY_BAR).runs
      const timeMin = runs * mission.durationMin
      const tokensPerMin = timeMin > 0 ? tokens / timeMin : 0
      const tokensPerEnergy = runs > 0 ? tokens / (runs * mission.energy) : 0
      console.log(
        formula.padEnd(12),
        mission.id.padEnd(11),
        runs.toString().padStart(5),
        Math.round(tokens).toLocaleString().padStart(9),
        tokensPerMin.toFixed(0).padStart(11),
        tokensPerEnergy.toFixed(0).padStart(14),
      )
    }
    console.log("")
  }
}
