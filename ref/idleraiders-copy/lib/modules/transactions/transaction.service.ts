/**
 * Transaction Service
 * Queue operations for deposit, withdraw, purchase, and registration
 * Processing is handled by the backend service worker
 */

import crypto from 'crypto'
import type { ITransactionDocument } from './transaction.model'
import * as transactionRepo from './transaction.repository'
import * as playerRepo from '../players/player.repository'
import * as logicService from './transaction.logic'
import { addTransactionJob } from '@/lib/queues/transaction.queue'
import { type TokenSymbol, isTokenSymbol, getBalanceField } from '@/lib/config/tokens'
import { getRedisConnection } from '@/lib/config/redis'

// ═══════════════════════════════════════════════════════════════════════════════
// Per-user transaction lock
// Enforces "one transaction at a time" per user across deposit/withdraw/purchase/
// registration. Combines a fast DB pre-check with an atomic Redis NX lock to
// close the race window between two near-simultaneous queue calls.
// ═══════════════════════════════════════════════════════════════════════════════

const USER_TX_LOCK_KEY = 'idleraiders:user_tx_lock'
const USER_TX_LOCK_TTL = 1800 // 30 minutes — bounded fallback if lock isn't released
const PENDING_TX_MESSAGE =
  'You already have a transaction in progress. Please wait for it to finish before submitting another.'

async function acquireUserTxLock(username: string): Promise<boolean> {
  const redis = getRedisConnection()
  const result = await redis.set(
    `${USER_TX_LOCK_KEY}:${username}`,
    Date.now().toString(),
    'EX',
    USER_TX_LOCK_TTL,
    'NX',
  )
  return result === 'OK'
}

/**
 * Release the per-user transaction lock. Called by the processor when a
 * transaction reaches a terminal status (completed or failed).
 */
export async function releaseUserTxLock(username: string): Promise<void> {
  const redis = getRedisConnection()
  await redis.del(`${USER_TX_LOCK_KEY}:${username}`)
}

/**
 * Refresh (or set, with no NX guard) the lock TTL. Used by recovery on startup
 * so that pending transactions re-queued from disk continue to block new
 * submissions even if the previous TTL expired during downtime.
 */
async function refreshUserTxLock(username: string): Promise<void> {
  const redis = getRedisConnection()
  await redis.set(
    `${USER_TX_LOCK_KEY}:${username}`,
    Date.now().toString(),
    'EX',
    USER_TX_LOCK_TTL,
  )
}

/**
 * Reserve a transaction slot for the user, or return a rejection message.
 * Performs both a DB pending-tx check (covers crashed-worker scenarios) and a
 * Redis NX acquire (closes the race window between concurrent requests).
 */
async function reserveUserTxSlot(
  username: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  // Fast DB pre-check — also catches the case where Redis lost the lock during
  // a restart but a tx record is still pending/processing in Mongo.
  const pending = await transactionRepo.findPendingBySender(username, 1)
  if (pending.length > 0) {
    return { ok: false, message: PENDING_TX_MESSAGE }
  }

  // Atomic NX acquire to prevent the small race window between two requests
  // that both pass the DB check before either writes its tx record.
  const lockAcquired = await acquireUserTxLock(username)
  if (!lockAcquired) {
    return { ok: false, message: PENDING_TX_MESSAGE }
  }

  return { ok: true }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface QueueResult {
  success: boolean
  message: string
  transactionId?: string
  error?: string
  /**
   * Stable machine-readable failure code. Currently used so clients/support
   * can distinguish duplicate chain-tx replays from generic queue failures.
   */
  code?: 'duplicate_transaction'
}

/**
 * Detect MongoDB duplicate-key (E11000) errors raised when the same chain
 * transactionId is replayed against the unique index on Transaction.transactionId.
 */
function isDuplicateTransactionIdError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: number; keyPattern?: Record<string, unknown> }
  if (e.code !== 11000) return false
  // If keyPattern is present, only treat it as duplicate-tx when the violated
  // index is on transactionId. Older driver shapes may omit keyPattern, in
  // which case we still treat any 11000 from this collection as a duplicate.
  return !e.keyPattern || Object.prototype.hasOwnProperty.call(e.keyPattern, 'transactionId')
}

interface DepositMetadata {
  quantity: number
  symbol: TokenSymbol
}

interface WithdrawMetadata {
  quantity: number
  symbol: TokenSymbol
  to: string
}

interface DollarPurchaseMetadata {
  quantity: number
  expectedHive?: number
  hiveUsdAtQuote?: number
}

interface RegistrationMetadata {
  referral?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

function generateTxId(): string {
  return crypto.randomUUID()
}

// ═══════════════════════════════════════════════════════════════════════════════
// Queue Operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Queue a deposit transaction for processing
 */
export async function queueDeposit(
  chainTxId: string,
  username: string,
  metadata: DepositMetadata
): Promise<QueueResult> {
  const { quantity, symbol } = metadata

  if (!quantity || quantity <= 0) {
    return { success: false, message: 'Invalid quantity' }
  }
  if (!isTokenSymbol(symbol)) {
    return { success: false, message: 'Invalid symbol' }
  }

  const slot = await reserveUserTxSlot(username)
  if (!slot.ok) {
    return { success: false, message: slot.message }
  }

  try {
    const tx = await transactionRepo.create({
      transactionId: chainTxId,
      sender: username,
      contract: 'tokens',
      action: 'transfer',
      status: 'pending',
      type: 'deposit',
      metadata,
      logs: {},
    })

    // Add to BullMQ queue for processing
    await addTransactionJob(tx._id.toString(), 'deposit', username)

    return {
      success: true,
      message: 'Deposit queued for processing',
      transactionId: tx._id.toString(),
    }
  } catch (error) {
    // Release the slot since the tx never made it into the system.
    await releaseUserTxLock(username).catch(() => {})

    if (isDuplicateTransactionIdError(error)) {
      console.warn(
        `[idleraiders-logs] queueDeposit duplicate chainTxId=${chainTxId} from ${username}`,
      )
      return {
        success: false,
        code: 'duplicate_transaction',
        message:
          'This deposit has already been recorded. If your balance is incorrect, please contact support with the transaction ID.',
      }
    }

    console.error('[idleraiders-logs] queueDeposit Error:', error)
    return {
      success: false,
      message: 'Failed to queue deposit',
      error: (error as Error).message,
    }
  }
}

/**
 * Queue a withdrawal transaction for processing
 */
export async function queueWithdraw(username: string, metadata: WithdrawMetadata): Promise<QueueResult> {
  const { quantity, symbol, to } = metadata

  if (!quantity || quantity <= 0) {
    return { success: false, message: 'Invalid quantity' }
  }
  if (!isTokenSymbol(symbol)) {
    return { success: false, message: 'Invalid symbol' }
  }
  if (!to) {
    return { success: false, message: 'Missing recipient' }
  }

  // Local balance check (read-only). The atomic deduction in the processor is
  // the authoritative guard against over-spending; this just gives a fast
  // user-visible error before queueing.
  const player = await playerRepo.findByUsername(username)
  if (!player) {
    return { success: false, message: 'Player not found' }
  }
  const balance = player[getBalanceField(symbol)]
  if (balance < quantity) {
    return { success: false, message: `Insufficient ${symbol} balance` }
  }

  const slot = await reserveUserTxSlot(username)
  if (!slot.ok) {
    return { success: false, message: slot.message }
  }

  try {
    const tx = await transactionRepo.create({
      transactionId: generateTxId(),
      sender: username,
      contract: 'tokens',
      action: 'transfer',
      status: 'pending',
      type: 'withdraw',
      metadata,
      logs: {},
    })

    // Add to BullMQ queue for processing
    await addTransactionJob(tx._id.toString(), 'withdraw', username)

    return {
      success: true,
      message: 'Withdrawal queued for processing',
      transactionId: tx._id.toString(),
    }
  } catch (error) {
    await releaseUserTxLock(username).catch(() => {})
    console.error('[idleraiders-logs] queueWithdraw Error:', error)
    return {
      success: false,
      message: 'Failed to queue withdrawal',
      error: (error as Error).message,
    }
  }
}

/**
 * Queue a dollar purchase transaction for processing
 */
export async function queueDollarPurchase(
  chainTxId: string,
  username: string,
  metadata: DollarPurchaseMetadata
): Promise<QueueResult> {
  const { quantity } = metadata

  if (!quantity || quantity < 1) {
    return { success: false, message: 'Invalid quantity' }
  }

  if (!(await logicService.isHiveUsdPriceInitialized())) {
    return { success: false, message: 'Price service unavailable, please try again shortly' }
  }

  const slot = await reserveUserTxSlot(username)
  if (!slot.ok) {
    return { success: false, message: slot.message }
  }

  try {
    // Calculate expectedHive server-side — never trust the client
    const { expectedHive, hiveUsdAtQuote } = await logicService.calculateExpectedHive(quantity)

    const tx = await transactionRepo.create({
      transactionId: chainTxId,
      sender: username,
      contract: 'hive',
      action: 'transfer',
      status: 'pending',
      type: 'dollar_purchase',
      metadata: { quantity, expectedHive, hiveUsdAtQuote },
      logs: {},
    })

    // Add to BullMQ queue for processing
    await addTransactionJob(tx._id.toString(), 'dollar_purchase', username)

    return {
      success: true,
      message: 'Purchase queued for processing',
      transactionId: tx._id.toString(),
    }
  } catch (error) {
    await releaseUserTxLock(username).catch(() => {})

    if (isDuplicateTransactionIdError(error)) {
      console.warn(
        `[idleraiders-logs] queueDollarPurchase duplicate chainTxId=${chainTxId} from ${username}`,
      )
      return {
        success: false,
        code: 'duplicate_transaction',
        message:
          'This purchase has already been recorded. If your balance is incorrect, please contact support with the transaction ID.',
      }
    }

    console.error('[idleraiders-logs] queueDollarPurchase Error:', error)
    return {
      success: false,
      message: 'Failed to queue purchase',
      error: (error as Error).message,
    }
  }
}

/**
 * Queue a registration transaction for processing
 */
export async function queueRegistration(
  chainTxId: string,
  username: string,
  metadata: RegistrationMetadata
): Promise<QueueResult> {
  const { referral } = metadata

  if (!(await logicService.isHiveUsdPriceInitialized())) {
    return { success: false, message: 'Price service unavailable, please try again shortly' }
  }

  const slot = await reserveUserTxSlot(username)
  if (!slot.ok) {
    return { success: false, message: slot.message }
  }

  try {
    const tx = await transactionRepo.create({
      transactionId: chainTxId,
      sender: username,
      contract: 'hive',
      action: 'transfer',
      status: 'pending',
      type: 'registration',
      metadata: { referral },
      logs: {},
    })

    // Add to BullMQ queue for processing
    await addTransactionJob(tx._id.toString(), 'registration', username)

    return {
      success: true,
      message: 'Registration queued for processing',
      transactionId: tx._id.toString(),
    }
  } catch (error) {
    await releaseUserTxLock(username).catch(() => {})

    if (isDuplicateTransactionIdError(error)) {
      console.warn(
        `[idleraiders-logs] queueRegistration duplicate chainTxId=${chainTxId} from ${username}`,
      )
      return {
        success: false,
        code: 'duplicate_transaction',
        message:
          'This registration has already been recorded. If you cannot access your account, please contact support with the transaction ID.',
      }
    }

    console.error('[idleraiders-logs] queueRegistration Error:', error)
    return {
      success: false,
      message: 'Failed to queue registration',
      error: (error as Error).message,
    }
  }
}

// ═══��════════════��══════════════════════════════════════════════════════════════
// Recovery - Re-queue pending transactions on startup
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Recover pending transactions from the database and re-add them to the queue.
 * This should be called on server startup to handle any transactions that were
 * pending when the server was last shut down.
 */
export async function recoverPendingTransactions(): Promise<{ recovered: number; failed: number }> {
  console.log('[idleraiders-logs] Starting transaction recovery...')
  
  let recovered = 0
  let failed = 0

  try {
    // Find all pending or processing transactions
    const pendingTransactions = await transactionRepo.findByStatus(['pending', 'processing'], 500)
    
    if (pendingTransactions.length === 0) {
      console.log('[idleraiders-logs] No pending transactions to recover')
      return { recovered: 0, failed: 0 }
    }

    console.log(`[idleraiders-logs] Found ${pendingTransactions.length} pending transactions to recover`)

    for (const tx of pendingTransactions) {
      try {
        // Re-acquire the per-user transaction lock so new submissions stay
        // blocked until this resurrected tx finishes (in case the previous
        // lock TTL expired during downtime).
        await refreshUserTxLock(tx.sender).catch(() => {})

        // Re-add to the BullMQ queue
        await addTransactionJob(tx._id.toString(), tx.type, tx.sender)
        recovered++
        console.log(`[idleraiders-logs] Recovered transaction: ${tx._id} (${tx.type}) for ${tx.sender}`)
      } catch (error) {
        failed++
        console.error(`[idleraiders-logs] Failed to recover transaction ${tx._id}:`, (error as Error).message)
      }
    }

    console.log(`[idleraiders-logs] Transaction recovery complete: ${recovered} recovered, ${failed} failed`)
    return { recovered, failed }
  } catch (error) {
    console.error('[idleraiders-logs] Transaction recovery error:', error)
    return { recovered, failed }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Transaction Status
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get transaction status by ID
 */
export async function getTransactionStatus(transactionId: string): Promise<{
  status: string
  type: string
  logs?: Record<string, unknown>
} | null> {
  const tx = await transactionRepo.findById(transactionId)
  if (!tx) return null
  
  return {
    status: tx.status,
    type: tx.type,
    logs: tx.logs,
  }
}

/**
 * Get pending transactions for a user
 */
export async function getPendingTransactions(username: string): Promise<{
  id: string
  type: string
  status: string
  createdAt: Date
}[]> {
  const transactions = await transactionRepo.findPendingBySender(username, 10)

  return transactions.map(tx => ({
    id: tx._id.toString(),
    type: tx.type,
    status: tx.status,
    createdAt: tx.createdAt,
  }))
}
