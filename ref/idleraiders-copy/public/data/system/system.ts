// ─────────────────────────────────────────────
// Player Configuration
// ─────────────────────────────────────────────

export const PLAYER = {
  MAX_LEVEL: 150,

  STARTING_LEVEL: 1,

  STARTING_XP: 0,
}

// ─────────────────────────────────────────────
// Energy System
// ─────────────────────────────────────────────

export const ENERGY = {
  MAX: 100,

  REGEN_INTERVAL: 180, // seconds (3 minutes)

  PER_TICK: 1,
}

// ─────────────────────────────────────────────
// Registration Configuration
// ─────────────────────────────────────────────

export const REGISTRATION = {
  FEE_USD: 10, // One-time registration fee in USD (set to $10 when live)

  STARTER_DOLLARS: 10, // Number of dollars awarded to new players on registration

  REFERRAL_DOLLARS: 1, // Number of dollars awarded to referrer when someone they referred registers
}

// ─────────────────────────────────────────────
// System Data Export
// ─────────────────────────────────────────────

export const SYSTEM_DATA = {

  PLAYER,

  ENERGY,

  REGISTRATION,
}

export default SYSTEM_DATA
