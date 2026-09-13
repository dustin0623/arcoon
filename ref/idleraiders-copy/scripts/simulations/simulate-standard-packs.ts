/**
 * Simulation: open N standard packs for a single player and report total raid power.
 *
 * Mirrors the production roll logic in `lib/modules/items/item.service.ts`:
 *   - Standard pack = 3 cards, each rolled independently against `dropRates`.
 *   - Pool excludes boosters, crafting, and story-source cards.
 *   - Within a rarity, the card is picked uniformly at random.
 *
 * Supply caps are ignored — over 3,000 rolls the expected number of legendaries is ~3,
 * which is well below the 100-legendary supply cap, so caps don't materially change results.
 */

import { CARDS_DATA } from '../../public/data/cards/index'
import { PACKS } from '../../public/data/items/items'

type AnyCard = {
  id: string
  type: string
  rarity: string
  class?: string
  source?: { type?: string }
  stats?: { raidPower?: number; mastery?: number; luck?: number; gm?: number } | null
}

const cards = CARDS_DATA as unknown as AnyCard[]

// Eligible pool per rarity (same filter as item.service.ts)
const POOL_BY_RARITY: Record<string, AnyCard[]> = {}
for (const card of cards) {
  if (!card.rarity) continue
  if (card.type === 'booster') continue
  if (card.source?.type === 'crafting') continue
  if (card.source?.type === 'story') continue
  if (!POOL_BY_RARITY[card.rarity]) POOL_BY_RARITY[card.rarity] = []
  POOL_BY_RARITY[card.rarity].push(card)
}

const standardPack = PACKS.find((p) => p.id === 'standard_pack')
if (!standardPack || !standardPack.data) throw new Error('standard_pack definition missing')

const dropRates = standardPack.data.dropRates as Record<string, number>
const cardCount = standardPack.data.cardCount ?? 3

function rollRarity(): string {
  const r = Math.random()
  let cum = 0
  for (const [rarity, rate] of Object.entries(dropRates)) {
    cum += rate
    if (r < cum) return rarity
  }
  return 'common'
}

function rollCard(rarity: string): AnyCard {
  const pool = POOL_BY_RARITY[rarity] ?? []
  if (pool.length === 0) {
    // Fall back to any non-booster card (matches PACK_FALLBACK_CARD behavior)
    return cards.find((c) => c.type !== 'booster') as AnyCard
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Pool diagnostics ────────────────────────────────────────────────────────
console.log('=== Pool composition (eligible for standard pack) ===')
for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
  const pool = POOL_BY_RARITY[rarity] ?? []
  const avgRP =
    pool.length > 0
      ? pool.reduce((s, c) => s + (c.stats?.raidPower ?? 0), 0) / pool.length
      : 0
  const minRP = pool.length > 0 ? Math.min(...pool.map((c) => c.stats?.raidPower ?? 0)) : 0
  const maxRP = pool.length > 0 ? Math.max(...pool.map((c) => c.stats?.raidPower ?? 0)) : 0
  console.log(
    `  ${rarity.padEnd(10)} cards=${String(pool.length).padStart(3)}  avgRP=${avgRP
      .toFixed(1)
      .padStart(7)}  range=[${minRP}-${maxRP}]  dropRate=${(dropRates[rarity] * 100).toFixed(2)}%`,
  )
}

// ─── Theoretical expected raid power per pack ────────────────────────────────
let expectedPerCard = 0
for (const [rarity, rate] of Object.entries(dropRates)) {
  const pool = POOL_BY_RARITY[rarity] ?? []
  const avgRP =
    pool.length > 0 ? pool.reduce((s, c) => s + (c.stats?.raidPower ?? 0), 0) / pool.length : 0
  expectedPerCard += rate * avgRP
}
const expectedPerPack = expectedPerCard * cardCount
console.log(`\nTheoretical expected raid power per pack: ${expectedPerPack.toFixed(2)}`)
console.log(`Theoretical expected raid power per 1,000 packs: ${(expectedPerPack * 1000).toFixed(0)}`)

// ─── Monte Carlo simulation ──────────────────────────────────────────────────
const TRIALS = 20
const PACKS_PER_TRIAL = 1000
const totals: number[] = []
const rarityCountsAcrossTrials: Record<string, number[]> = {
  common: [],
  uncommon: [],
  rare: [],
  epic: [],
  legendary: [],
}

for (let t = 0; t < TRIALS; t++) {
  let total = 0
  const rarityCounts: Record<string, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  }
  for (let p = 0; p < PACKS_PER_TRIAL; p++) {
    for (let i = 0; i < cardCount; i++) {
      const rarity = rollRarity()
      const card = rollCard(rarity)
      total += card.stats?.raidPower ?? 0
      rarityCounts[rarity] = (rarityCounts[rarity] ?? 0) + 1
    }
  }
  totals.push(total)
  for (const r of Object.keys(rarityCountsAcrossTrials)) {
    rarityCountsAcrossTrials[r].push(rarityCounts[r] ?? 0)
  }
}

const mean = totals.reduce((a, b) => a + b, 0) / totals.length
const variance = totals.reduce((a, b) => a + (b - mean) ** 2, 0) / totals.length
const std = Math.sqrt(variance)
const min = Math.min(...totals)
const max = Math.max(...totals)
const sorted = [...totals].sort((a, b) => a - b)
const median = sorted[Math.floor(sorted.length / 2)]

console.log(`\n=== Monte Carlo: ${TRIALS} trials × ${PACKS_PER_TRIAL} packs each ===`)
console.log(`Total cards drawn per trial: ${PACKS_PER_TRIAL * cardCount}`)
console.log(`\nRaid power for opening ${PACKS_PER_TRIAL} standard packs:`)
console.log(`  mean   : ${mean.toFixed(0)}`)
console.log(`  median : ${median.toFixed(0)}`)
console.log(`  stdev  : ${std.toFixed(0)}  (~${((std / mean) * 100).toFixed(1)}% of mean)`)
console.log(`  min    : ${min}`)
console.log(`  max    : ${max}`)

console.log(`\nAverage rarity counts per 1,000 packs (${PACKS_PER_TRIAL * cardCount} cards):`)
for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
  const counts = rarityCountsAcrossTrials[rarity]
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length
  const expected = dropRates[rarity] * PACKS_PER_TRIAL * cardCount
  console.log(
    `  ${rarity.padEnd(10)} avg=${avg.toFixed(1).padStart(7)}  (expected ${expected.toFixed(1)})`,
  )
}
