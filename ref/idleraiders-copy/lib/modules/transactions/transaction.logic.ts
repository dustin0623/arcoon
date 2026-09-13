import Transaction from './transaction.model'
import { getRedisConnection } from '@/lib/config/redis'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface PurchaseQuote {
  expectedHiveMilli: number
  expectedHive: number
  hiveUsdAtQuote: number
  quantity: number
  dollarsToReceive: number
  usdEquivalent: number
}

interface ExpectedHiveResult {
  expectedHive: number
  hiveUsdAtQuote: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// Errors
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Thrown when a price-dependent operation is requested before the price worker
 * has reported a HIVE/USD rate at least once. Callers should treat this as
 * "service temporarily unavailable" (retry) rather than a permanent failure.
 */
export class HivePriceNotInitializedError extends Error {
  constructor() {
    super('HIVE/USD price is not initialized yet. Please try again shortly.')
    this.name = 'HivePriceNotInitializedError'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const USD_PER_UNIT = 1.0

// Redis key used to share the HIVE/USD price across all processes.
// TTL is 15 minutes (3× the 5-minute update interval) so a stale value
// is always available even if the price worker temporarily goes quiet.
const HIVE_PRICE_REDIS_KEY = 'idleraiders:hive_usd_price'
const HIVE_PRICE_REDIS_TTL = 900 // 15 minutes in seconds

// In-process cache — avoids a Redis round-trip on every price read within
// the same process. The price worker still writes to Redis on every update.
let cachedHiveUsdPrice: number | null = null

export function setHiveUsdPrice(price: number): void {
  if (!Number.isFinite(price) || price <= 0) {
    console.warn('[idleraiders-logs] Ignoring invalid HIVE/USD price:', price)
    return
  }
  cachedHiveUsdPrice = price

  // Write to Redis so other processes (Next.js API routes) can read it.
  getRedisConnection()
    .set(HIVE_PRICE_REDIS_KEY, price.toString(), 'EX', HIVE_PRICE_REDIS_TTL)
    .catch((err) => console.error('[idleraiders-logs] Failed to persist HIVE price to Redis:', err.message))
}

export async function isHiveUsdPriceInitialized(): Promise<boolean> {
  if (cachedHiveUsdPrice !== null && cachedHiveUsdPrice > 0) return true
  try {
    const raw = await getRedisConnection().get(HIVE_PRICE_REDIS_KEY)
    if (raw) {
      const price = parseFloat(raw)
      if (Number.isFinite(price) && price > 0) {
        cachedHiveUsdPrice = price
        return true
      }
    }
  } catch {
    // Redis unavailable — fall through to false
  }
  return false
}

export async function getHiveUsdPrice(): Promise<number> {
  if (cachedHiveUsdPrice !== null && cachedHiveUsdPrice > 0) {
    return cachedHiveUsdPrice
  }

  // In-memory cache is empty (different process) — try Redis.
  try {
    const raw = await getRedisConnection().get(HIVE_PRICE_REDIS_KEY)
    if (raw) {
      const price = parseFloat(raw)
      if (Number.isFinite(price) && price > 0) {
        cachedHiveUsdPrice = price
        return price
      }
    }
  } catch (err: any) {
    console.error('[idleraiders-logs] Redis read failed in getHiveUsdPrice:', err.message)
  }

  throw new HivePriceNotInitializedError()
}

export async function getCurrentHivePrice(): Promise<number> {
  return getHiveUsdPrice()
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

export async function getReservedWithdrawalTotal(symbol: string): Promise<number> {
  const reserved = await Transaction.aggregate([
    {
      $match: {
        type: 'withdraw',
        status: { $in: ['pending', 'processing'] },
        'metadata.symbol': symbol,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$metadata.quantity' },
      },
    },
  ])

  return reserved[0]?.total || 0
}

export async function getEffectiveBalance(onChainBalance: number, symbol: string): Promise<number> {
  const reserved = await getReservedWithdrawalTotal(symbol)
  return onChainBalance - reserved
}

export async function createPurchaseQuote(quantity: number): Promise<PurchaseQuote> {
  const hiveUsd = await getHiveUsdPrice()
  const totalUsd = quantity * USD_PER_UNIT
  const hiveMilli = Math.round((totalUsd / hiveUsd) * 1000)

  return {
    expectedHiveMilli: hiveMilli,
    expectedHive: hiveMilli / 1000,
    hiveUsdAtQuote: hiveUsd,
    quantity,
    dollarsToReceive: quantity,
    usdEquivalent: totalUsd,
  }
}

export async function calculateExpectedHive(quantity: number): Promise<ExpectedHiveResult> {
  const hiveUsd = await getHiveUsdPrice()
  const totalUsd = quantity * USD_PER_UNIT
  const expectedHive = totalUsd / hiveUsd
  return { expectedHive, hiveUsdAtQuote: hiveUsd }
}
