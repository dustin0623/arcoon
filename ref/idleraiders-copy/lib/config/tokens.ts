/**
 * Token Symbols — Single Source of Truth (Server-Side)
 * ─────────────────────────────────────────────────────
 * Used by backend services, transaction processors, and API routes.
 * The frontend currently keeps its own usages and is NOT migrated here.
 *
 * To rename a token in-game, change the value here and TypeScript will
 * surface every place that needs to be updated via the `TokenSymbol` type.
 */

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Main currency. Earned in-game; used for entry fees, guild creation, revival, etc. */
export const TOKEN_MAIN = 'REALMC' as const

/** Premium currency. Leaderboard rewards, marketplace, withdrawals. */
export const TOKEN_PREMIUM = 'SSHRD' as const

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Union type derived from constants — use in function signatures. */
export type TokenSymbol = typeof TOKEN_MAIN | typeof TOKEN_PREMIUM

/** All valid symbols, for runtime validation against API input. */
export const TOKEN_SYMBOLS: readonly TokenSymbol[] = [TOKEN_MAIN, TOKEN_PREMIUM] as const

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Type guard — narrows arbitrary input to a valid TokenSymbol. */
export function isTokenSymbol(value: unknown): value is TokenSymbol {
  return typeof value === 'string' && TOKEN_SYMBOLS.includes(value as TokenSymbol)
}

/**
 * Map a token symbol to the Player document field that holds its balance.
 * Centralizes the `symbol === 'REALMC' ? 'coins' : 'shards'` pattern.
 */
export function getBalanceField(symbol: TokenSymbol): 'coins' | 'shards' {
  return symbol === TOKEN_MAIN ? 'coins' : 'shards'
}

/**
 * Map a token symbol to the lifetime-total field name used in socket events
 * (e.g., transaction_success notifications).
 */
export function getTotalField(symbol: TokenSymbol): 'totalCoins' | 'totalShards' {
  return symbol === TOKEN_MAIN ? 'totalCoins' : 'totalShards'
}

// ─────────────────────────────────────────────
// Hive Engine precision (decimal places)
// ─────────────────────────────────────────────
//
// Hive Engine validates the quantity string against the token's configured
// precision via the regex `^[0-9]*(\.[0-9]{0,P})?$`. Sending more decimals
// than the token allows (e.g. "5.000" for a precision-0 token) causes the
// broadcast to be rejected, so all outgoing transfers and mints MUST format
// quantities using these values.
//
// These mirror the on-chain precision of each token. Update here if the
// chain-level precision is ever changed via the `tokens.updatePrecision`
// contract action.

/** Decimal precision for each token, as configured on Hive Engine. */
export const TOKEN_PRECISION: Record<TokenSymbol, number> = {
  [TOKEN_MAIN]: 0,    // REALMC — integer
  [TOKEN_PREMIUM]: 5, // SSHRD
}

/** Lookup the token's on-chain decimal precision. */
export function getTokenPrecision(symbol: TokenSymbol): number {
  return TOKEN_PRECISION[symbol]
}

/**
 * Smallest representable unit for the token (e.g. 1 for precision 0,
 * 0.00001 for precision 5). Used as a non-zero floor for mint sizing.
 */
export function getTokenMinUnit(symbol: TokenSymbol): number {
  return Math.pow(10, -getTokenPrecision(symbol))
}

/**
 * Format a numeric quantity into the string Hive Engine accepts for the given
 * token. Truncates excess decimals (never rounds up — we never want to
 * accidentally send more than intended).
 */
export function formatTokenQuantity(quantity: number, symbol: TokenSymbol): string {
  const precision = getTokenPrecision(symbol)
  const factor = Math.pow(10, precision)
  const truncated = Math.floor(quantity * factor) / factor
  return truncated.toFixed(precision)
}

/**
 * Round a quantity UP to the token's precision. Use this when sizing mints so
 * the post-mint balance always covers the deficit, even after string
 * truncation by `formatTokenQuantity`.
 */
export function ceilToTokenPrecision(quantity: number, symbol: TokenSymbol): number {
  const precision = getTokenPrecision(symbol)
  const factor = Math.pow(10, precision)
  return Math.ceil(quantity * factor) / factor
}
