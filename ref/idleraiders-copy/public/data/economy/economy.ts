// ─────────────────────────────────────────────
// Mission Reward Configuration
// ─────────────────────────────────────────────

export const MISSION_REWARDS = {
  BASE_TOKEN_REWARD: 10,
}

// ─────────────────────────────────────────────
// Marketplace Configuration
// ─────────────────────────────────────────────

export const MARKETPLACE = {
  MARKET_FEE_PERCENT: 5,

  LISTING_DURATION_HOURS: 168,
  LISTING_CREATION_FEE: 100,

  MIN_PRICE: 1,

  MAX_PRICE: 100000,
}

// ─────────────────────────────────────────────
// Leaderboard Configuration
// ─────────────────────────────────────────────

export const LEADERBOARD = {
  // Minimum expected damage threshold (floor for tiny playerbases)
  MIN_EXPECTED_DAMAGE: 1_000_000,

  // Legacy hardcoded value - kept for backwards compatibility.
  // New dynamic system uses: max(MIN_EXPECTED_DAMAGE, totalRaidPower × EXPECTED_ATTACKS_PER_WEEK)
  EXPECTED_DAMAGE: 1_000_000,

  // Expected number of boss attacks per player per week (average activity assumption).
  // Each attack deals ~1.0× raidPower damage on average (range 0.8x–1.2x),
  // so total expected weekly damage = totalRaidPower × EXPECTED_ATTACKS_PER_WEEK.
  // Tune this based on observed player activity (energy regen, attack cooldowns).
  EXPECTED_ATTACKS_PER_WEEK: 10,

  PREMIUM_POOL: 1000,
}

// ─────────────────────────────────────────────
// Material Conversion Configuration
// ─────────────────────────────────────────────
// Note: live conversion logic lives in lib/modules/items/item.service.ts:convertMaterials.
// These values are kept in sync for documentation / read-only consumers.
//   - Trades are restricted to the next zone up (D1→D2 … D9→D10)
//   - Coin cost scales with target zone index: cost = ZONE_INDEX × coinCostPerZone
//     (D2=25, D3=50, D4=75, D5=100, D6=125, D7=150, D8=175, D9=200, D10=225)

export const MATERIAL_CONVERSION = {
  ratio: 5, // 5× source → 1× target
  coinCostPerZone: 25, // multiplied by destination zone index (1..9)
  // Legacy field retained for backwards compatibility — represents the average
  // cost across zones rather than a flat fee. Prefer coinCostPerZone for new code.
  coinCost: 25,
}

// ─────────────────────────────────────────────
// Economy Data Export
// ─────────────────────────────────────────────

export const ECONOMY_DATA = {
  MISSION_REWARDS,

  MARKETPLACE,

  LEADERBOARD,

  MATERIAL_CONVERSION,
}

export default ECONOMY_DATA
