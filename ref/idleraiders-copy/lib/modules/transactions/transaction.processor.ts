/**
 * Transaction Processor
 * Processing logic for deposit, withdraw, purchase, and registration transactions
 */

import type { Server } from 'socket.io'
import Transaction from './transaction.model'
import Player from '../players/player.model'
import Item from '../items/item.model'
import * as blockchainService from './transaction.blockchain'
import * as logicService from './transaction.logic'
import * as historyService from '../histories/history.service'
import { releaseUserTxLock } from './transaction.service'
import { GAME_ACCOUNT_NAME } from '../../config/config'
import { getRedisConnection } from '../../config/redis'
import { REGISTRATION } from '@/public/data/system/system'
import { getBalanceField, getTokenMinUnit, ceilToTokenPrecision } from '@/lib/config/tokens'

/**
 * Release the per-user "one transaction at a time" lock once a transaction
 * reaches a terminal state. Called from a `finally` block so it fires whether
 * the processor returns normally or throws, but only when status is terminal —
 * mid-flight retries (where status is still pending/processing) keep the lock.
 */
async function releaseLockIfTerminal(tx: { sender: string; status: string }): Promise<void> {
  if (tx.status === 'completed' || tx.status === 'failed') {
    await releaseUserTxLock(tx.sender).catch((err) => {
      console.error('[idleraiders-logs] Failed to release user tx lock for', tx.sender, err)
    })
  }
}

// These will be injected from the server side
let userSocketsRef: Record<string, string> = {}
let ioRef: Server | null = null

/**
 * Initialize socket references for notifications
 */
export function initializeSocketRefs(io: Server, userSockets: Record<string, string>) {
  ioRef = io
  userSocketsRef = userSockets
}

/**
 * Get current user sockets reference
 */
export function getUserSockets(): Record<string, string> {
  return userSocketsRef
}

// Redis-based treasury minting lock for distributed workers
const TREASURY_MINT_LOCK_KEY = 'idleraiders:treasury_mint_lock'
const TREASURY_MINT_LOCK_TTL = 30 // 30 seconds max lock time

// Delay helper for waiting on blockchain processing
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Acquire a distributed lock for treasury minting using Redis
 * Returns true if lock acquired, false if another process holds the lock
 */
async function acquireTreasuryMintLock(symbol: string): Promise<boolean> {
  const redis = getRedisConnection()
  const lockKey = `${TREASURY_MINT_LOCK_KEY}:${symbol}`
  const result = await redis.set(lockKey, Date.now().toString(), 'EX', TREASURY_MINT_LOCK_TTL, 'NX')
  return result === 'OK'
}

/**
 * Release the distributed treasury mint lock
 */
async function releaseTreasuryMintLock(symbol: string): Promise<void> {
  const redis = getRedisConnection()
  const lockKey = `${TREASURY_MINT_LOCK_KEY}:${symbol}`
  await redis.del(lockKey)
}

/**
 * Wait for treasury mint lock to be released by another process
 */
async function waitForTreasuryMintLock(symbol: string, maxWaitMs = 15000): Promise<void> {
  const redis = getRedisConnection()
  const lockKey = `${TREASURY_MINT_LOCK_KEY}:${symbol}`
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitMs) {
    const lockExists = await redis.exists(lockKey)
    if (!lockExists) {
      return // Lock released
    }
    await delay(1000) // Check every second
  }
  
  console.log(`[idleraiders-logs] Treasury mint lock wait timeout for ${symbol}`)
}

/**
 * Process a pending deposit transaction
 */
export const processDeposit = async (tx: any, io: Server) => {
  if (tx.status === 'completed') return

  const { quantity, symbol } = tx.metadata

  try {
    // Track retry attempts in logs
    const attemptCount = (tx.logs?.attemptCount || 0) + 1
    tx.logs = { ...tx.logs, attemptCount, lastAttempt: new Date() }
    await tx.save()

    // 1. Validate blockchain transaction (may take 3-10s to appear on chain)
    const depositTx = await blockchainService.validateHiveEngineDeposit(tx.transactionId, symbol)

    if (!depositTx) {
      // If we haven't exceeded max attempts, throw to trigger BullMQ retry
      if (attemptCount < 5) {
        console.log(`[idleraiders-logs] Deposit tx not found on chain yet, attempt ${attemptCount}/5, will retry...`)
        throw new Error('Transaction not found on blockchain yet, will retry')
      }
      
      // Max attempts reached, mark as failed
      tx.status = 'failed'
      tx.logs = { ...tx.logs, failureCheckpoint: 'blockchainValidationFailed', maxAttemptsReached: true }
      await tx.save()
      notifyUser(io, tx.sender, 'transaction_failed', {
        type: 'deposit',
        message: 'Transaction not found on blockchain after multiple attempts',
        transactionId: tx._id,
      })
      return
    }

    // 2. Validate transaction details
    const validationErrors: string[] = []
    if (depositTx.sender !== tx.sender) validationErrors.push('Sender mismatch')
    if (depositTx.symbol !== symbol) validationErrors.push('Symbol mismatch')
    // Use tolerance check to handle floating-point precision differences
    if (Math.abs(depositTx.quantity - quantity) > 0.001) validationErrors.push('Quantity mismatch')

    if (validationErrors.length > 0) {
      tx.status = 'failed'
      tx.logs = { failureCheckpoint: 'validationFailed', validationErrors }
      await tx.save()
      notifyUser(io, tx.sender, 'transaction_failed', {
        type: 'deposit',
        message: 'Transaction validation failed',
        error: validationErrors.join(', '),
        transactionId: tx._id,
      })
      return
    }

    // 3. Check blockchain logs for errors
    let logsJson: any = {}
    try {
      logsJson = depositTx.logs ? JSON.parse(depositTx.logs) : {}
    } catch {
      tx.status = 'failed'
      tx.logs = { failureCheckpoint: 'logsParseFailed' }
      await tx.save()
      notifyUser(io, tx.sender, 'transaction_failed', {
        type: 'deposit',
        message: 'Failed to parse blockchain logs',
        transactionId: tx._id,
      })
      return
    }

    if (Array.isArray(logsJson.errors) && logsJson.errors.length > 0) {
      tx.status = 'failed'
      tx.logs = { failureCheckpoint: 'blockchainError', errors: logsJson.errors }
      await tx.save()
      notifyUser(io, tx.sender, 'transaction_failed', {
        type: 'deposit',
        message: 'Blockchain execution failed',
        error: logsJson.errors.join(', '),
        transactionId: tx._id,
      })
      return
    }

    // 4. Update player balance — atomic credit-once-per-tx guard.
    // The filter `creditedTxIds: { $ne: tx._id }` ensures the $inc only applies
    // when this transaction has NOT already been credited. The same write that
    // increments the balance also pushes tx._id into the dedup set, so any
    // replay (e.g. after a worker crash before tx.status='completed') will hit
    // the filter, return null, and skip re-crediting. Bounded to last 1000 IDs.
    const fieldToUpdate = getBalanceField(symbol)
    let player = await Player.findOneAndUpdate(
      { username: tx.sender, creditedTxIds: { $ne: tx._id } },
      {
        $inc: { [fieldToUpdate]: quantity },
        $push: { creditedTxIds: { $each: [tx._id], $slice: -1000 } },
      },
      { new: true, projection: { creditedTxIds: 0 } }
    )

    let alreadyCredited = false
    if (!player) {
      // Either the player doesn't exist or this tx was already credited.
      // Disambiguate so we can either fail or re-emit success appropriately.
      player = await Player.findOne({ username: tx.sender })
      if (!player) {
        tx.status = 'failed'
        tx.logs = { failureCheckpoint: 'playerNotFound' }
        await tx.save()
        notifyUser(io, tx.sender, 'transaction_failed', {
          type: 'deposit',
          message: 'Player not found',
          transactionId: tx._id,
        })
        return
      }
      alreadyCredited = true
      console.log(
        `[idleraiders-logs] processDeposit: tx ${tx._id} already credited for ${tx.sender}, finalizing without re-crediting`,
      )
    }

    // 5. Mark completed
    tx.status = 'completed'
    tx.logs = {
      successCheckpoint: 'depositCompleted',
      completedAt: new Date(),
      ...(alreadyCredited ? { idempotentReplay: true } : {}),
    }
    await tx.save()

    // Emit delta to update player state
    const socketId = userSocketsRef[tx.sender]
    const balanceField = getBalanceField(symbol)
    if (socketId) {
      io.to(socketId).emit('updated_user_state', {
        delta: { [balanceField]: player[balanceField] },
      })
    }

    notifyUser(io, tx.sender, 'transaction_success', {
      type: 'deposit',
      message: `Deposited ${quantity} ${symbol}`,
      quantity,
      symbol,
      newBalance: player[balanceField],
      transactionId: tx._id,
    })
  } catch (error: any) {
    console.error('[processDeposit] Unexpected error:', error)
    tx.status = 'failed'
    tx.logs = { failureCheckpoint: 'unexpectedError', error: error.message }
    await tx.save()
    notifyUser(io, tx.sender, 'transaction_failed', {
      type: 'deposit',
      message: 'Deposit failed',
      error: error.message,
      transactionId: tx._id,
    })
    throw error // Re-throw for BullMQ retry
  } finally {
    await releaseLockIfTerminal(tx)
  }
}

/**
 * Process a pending withdrawal transaction
 */
export const processWithdraw = async (tx: any, io: Server) => {
  // Skip if already completed or failed
  if (tx.status === 'completed' || tx.status === 'failed') return

  const { quantity, symbol, to } = tx.metadata
  const fieldToDeduct = getBalanceField(symbol)

  try {
    // Check if balance was already deducted (for retry safety)
    const balanceAlreadyDeducted = tx.logs?.checkpoint === 'balanceDeducted' || tx.chainTxId

    let player
    if (!balanceAlreadyDeducted) {
      // 1. Deduct from player (atomic) - only on first attempt
      player = await Player.findOneAndUpdate(
        { username: tx.sender, [fieldToDeduct]: { $gte: quantity } },
        { $inc: { [fieldToDeduct]: -quantity } },
        { new: true }
      )

      if (!player) {
        tx.status = 'failed'
        tx.logs = { failureCheckpoint: 'insufficientBalance' }
        await tx.save()
        notifyUser(io, tx.sender, 'transaction_failed', {
          type: 'withdraw',
          message: `Insufficient ${symbol} balance`,
          transactionId: tx._id,
        })
        return
      }
    } else {
      // Balance already deducted on previous attempt, just fetch player
      player = await Player.findOne({ username: tx.sender })
      console.log(`[idleraiders-logs] Withdrawal retry - balance already deducted, continuing from checkpoint`)
    }

    tx.status = 'processing'
    tx.logs = { checkpoint: 'balanceDeducted', deductedAt: new Date() }
    await tx.save()

    // 2. Check treasury balance (with Redis-based concurrency safety)
    const onChainBalance = await blockchainService.getHiveEngineBalance(GAME_ACCOUNT_NAME, symbol)
    const effectiveBalance = await logicService.getEffectiveBalance(onChainBalance, symbol)

    if (effectiveBalance < quantity) {
      const deficit = quantity - effectiveBalance
      // Mint with 10% buffer above the deficit, then round UP to the token's
      // precision so the on-chain string is always valid (e.g. "6" for a
      // precision-0 token, "0.00012" for precision-5) and the post-mint
      // balance always covers the deficit.
      const minUnit = getTokenMinUnit(symbol)
      const mintAmount = ceilToTokenPrecision(Math.max(deficit * 1.10, minUnit), symbol)

      console.log('[idleraiders-logs] TreasuryReplenish', {
        symbol,
        withdrawal: quantity,
        deficit,
        mintAmount,
        onChainBalance,
        effectiveBalance,
        bufferPercent: '10%',
      })

      // Try to acquire distributed lock for minting
      const lockAcquired = await acquireTreasuryMintLock(symbol)
      
      if (!lockAcquired) {
        // Another worker is minting, wait for it to complete
        console.log('[idleraiders-logs] Another process is minting, waiting for lock release...')
        await waitForTreasuryMintLock(symbol)
        
        // After lock released, recheck balance with retry (blockchain takes 3-10s to update)
        const { balance: newBalance, confirmed } = await blockchainService.getHiveEngineBalanceWithRetry(
          GAME_ACCOUNT_NAME,
          symbol,
          quantity,
          5,  // 5 retries
          2000 // 2s between retries
        )
        
        const newEffective = await logicService.getEffectiveBalance(newBalance, symbol)
        
        if (!confirmed || newEffective < quantity) {
          // Still insufficient - this job will retry via BullMQ
          throw new Error(`Treasury balance still insufficient after waiting for replenish: ${newEffective} < ${quantity}`)
        }
      } else {
        // We have the lock, perform the mint
        try {
          const mintTxId = await blockchainService.mintToTreasury(mintAmount, symbol)
          console.log(`[idleraiders-logs] Minted ${mintAmount} ${symbol} to treasury, txId: ${mintTxId}`)
          
          // Wait for balance to update with retry (SSC takes 3-10s to reflect)
          const { balance: newBalance, confirmed } = await blockchainService.getHiveEngineBalanceWithRetry(
            GAME_ACCOUNT_NAME,
            symbol,
            effectiveBalance + mintAmount * 0.9, // Expect at least 90% of minted amount to appear
            5,  // 5 retries
            2000 // 2s between retries (total up to 10s wait)
          )
          
          const newEffective = await logicService.getEffectiveBalance(newBalance, symbol)
          
          console.log('[idleraiders-logs] Post-mint balance check', {
            symbol,
            newOnChainBalance: newBalance,
            newEffectiveBalance: newEffective,
            requiredQuantity: quantity,
            confirmed,
          })
          
          if (newEffective < quantity) {
            // This can happen if SSC is slow, let BullMQ retry
            throw new Error(`Treasury balance not confirmed after mint: ${newEffective} < ${quantity}`)
          }
        } finally {
          // Always release the lock
          await releaseTreasuryMintLock(symbol)
        }
      }
    }

    // 3. Broadcast Hive Engine transfer with withdrawal memo
    // IDEMPOTENCY CHECK: If chainTxId already exists, the transfer was already sent
    // This prevents duplicate blockchain transfers on BullMQ retries
    let chainTxId = tx.chainTxId
    
    if (!chainTxId) {
      chainTxId = await blockchainService.broadcastHiveEngineTransfer({
        symbol,
        quantity,
        to,
        memo: `IdleRaiders withdrawal - ${quantity} ${symbol}`,
      })
      
      // Save chainTxId immediately to prevent duplicate transfers on retry
      tx.chainTxId = chainTxId
      tx.logs = { ...tx.logs, chainTxId, transferSentAt: new Date() }
      await tx.save()
    } else {
      console.log(`[idleraiders-logs] Withdrawal already sent on-chain (${chainTxId}), skipping duplicate transfer`)
    }

    // Mark as completed (chainTxId already saved above for idempotency)
    tx.status = 'completed'
    tx.logs = {
      ...tx.logs,
      successCheckpoint: 'withdrawalCompleted',
      treasury: { onChain: onChainBalance, effective: effectiveBalance },
      completedAt: new Date(),
    }
    await tx.save()

    // Emit delta to update player state
    const socketId = userSocketsRef[tx.sender]
    const balanceField = getBalanceField(symbol)
    if (socketId) {
      io.to(socketId).emit('updated_user_state', {
        delta: { [balanceField]: player[balanceField] },
      })
    }

    notifyUser(io, tx.sender, 'transaction_success', {
      type: 'withdraw',
      message: `Withdrew ${quantity} ${symbol}`,
      quantity,
      symbol,
      newBalance: player[balanceField],
      transactionId: tx._id,
    })
  } catch (error: any) {
    console.error('[processWithdraw] Unexpected error:', error)

    // CRITICAL: If the on-chain transfer was already broadcast, do NOT refund.
    // The tokens already left the treasury — refunding would create a double-spend.
    // Leave the tx in 'processing' state and let BullMQ retry to finalize completion.
    // The chainTxId idempotency guard at the broadcast step will skip the duplicate transfer.
    if (tx.chainTxId) {
      console.error(
        '[processWithdraw] Error AFTER on-chain broadcast — NOT refunding. chainTxId:',
        tx.chainTxId,
      )
      tx.logs = {
        ...tx.logs,
        postBroadcastError: error.message,
        postBroadcastErrorAt: new Date(),
      }
      try {
        await tx.save()
      } catch (saveErr: any) {
        console.error('[processWithdraw] Failed to save post-broadcast error logs:', saveErr.message)
      }
      throw error // Re-throw so BullMQ retries to finalize the transaction
    }

    // Pre-broadcast path: refund only if the player's balance was actually deducted.
    // The 'balanceDeducted' checkpoint is set immediately after a successful deduction,
    // so this prevents refunding when the deduction itself never happened
    // (e.g., DB error before deduction would otherwise grant free tokens).
    const balanceWasDeducted = tx.logs?.checkpoint === 'balanceDeducted'
    if (balanceWasDeducted) {
      const fieldToRefund = getBalanceField(tx.metadata.symbol)
      await Player.findOneAndUpdate(
        { username: tx.sender },
        { $inc: { [fieldToRefund]: tx.metadata.quantity } },
      )
    }

    tx.status = 'failed'
    tx.logs = {
      ...tx.logs,
      failureCheckpoint: 'unexpectedError',
      error: error.message,
      refunded: balanceWasDeducted,
      failedAt: new Date(),
    }
    await tx.save()
    notifyUser(io, tx.sender, 'transaction_failed', {
      type: 'withdraw',
      message: balanceWasDeducted
        ? 'Withdrawal failed. Refund processed.'
        : 'Withdrawal failed.',
      error: error.message,
      transactionId: tx._id,
    })
    throw error // Re-throw for BullMQ visibility
  } finally {
    await releaseLockIfTerminal(tx)
  }
}

/**
 * Process a pending dollar purchase transaction
 */
export const processDollarPurchase = async (tx: any, io: Server) => {
  if (tx.status === 'completed') return

  const { quantity, expectedHive } = tx.metadata

  try {
    // Track retry attempts in logs
    const attemptCount = (tx.logs?.attemptCount || 0) + 1
    tx.logs = { ...tx.logs, attemptCount, lastAttempt: new Date() }
    await tx.save()

    // 1. Validate blockchain transaction
    const chainTx = await blockchainService.validateHiveTransaction(tx.transactionId)

    if (!chainTx) {
      // If we haven't exceeded max attempts, throw to trigger BullMQ retry
      if (attemptCount < 5) {
        console.log(`[idleraiders-logs] Dollar purchase tx not found on chain yet, attempt ${attemptCount}/5, will retry...`)
        throw new Error('Transaction not found on blockchain yet, will retry')
      }

      tx.status = 'failed'
      tx.logs = { ...tx.logs, failureCheckpoint: 'blockchainValidationFailed', maxAttemptsReached: true }
      await tx.save()
      notifyUser(io, tx.sender, 'transaction_failed', {
        type: 'dollar_purchase',
        message: 'Transaction not found on blockchain after multiple attempts',
        transactionId: tx._id,
      })
      return
    }

    // 2. Validate transaction details
    const validationErrors: string[] = []
    if (chainTx.symbol !== 'HIVE') validationErrors.push('Symbol mismatch')
    if (chainTx.from !== tx.sender) validationErrors.push('Sender mismatch')
    if (chainTx.to !== GAME_ACCOUNT_NAME) validationErrors.push('Recipient mismatch')

    const min = expectedHive * 0.95
    const max = expectedHive * 1.05
    if (chainTx.amount < min || chainTx.amount > max) {
      validationErrors.push('Amount mismatch')
    }

    if (validationErrors.length > 0) {
      tx.status = 'failed'
      tx.logs = { failureCheckpoint: 'validationFailed', validationErrors }
      await tx.save()
      notifyUser(io, tx.sender, 'transaction_failed', {
        type: 'dollar_purchase',
        message: 'Transaction validation failed',
        error: validationErrors.join(', '),
        transactionId: tx._id,
      })
      return
    }

    // 3. Update player dollars — atomic credit-once-per-tx guard.
    // See processDeposit for the rationale; tx._id acts as the idempotency key.
    const dollarsToAdd = quantity
    let player = await Player.findOneAndUpdate(
      { username: tx.sender, creditedTxIds: { $ne: tx._id } },
      {
        $inc: { dollars: dollarsToAdd },
        $push: { creditedTxIds: { $each: [tx._id], $slice: -1000 } },
      },
      { new: true, projection: { creditedTxIds: 0 } }
    )

    let alreadyCredited = false
    if (!player) {
      player = await Player.findOne({ username: tx.sender })
      if (!player) {
        tx.status = 'failed'
        tx.logs = { failureCheckpoint: 'playerNotFound' }
        await tx.save()
        notifyUser(io, tx.sender, 'transaction_failed', {
          type: 'dollar_purchase',
          message: 'Player not found',
          transactionId: tx._id,
        })
        return
      }
      alreadyCredited = true
      console.log(
        `[idleraiders-logs] processDollarPurchase: tx ${tx._id} already credited for ${tx.sender}, finalizing without re-crediting`,
      )
    }

    // 4. Mark completed
    tx.status = 'completed'
    tx.logs = {
      successCheckpoint: 'purchaseCompleted',
      completedAt: new Date(),
      ...(alreadyCredited ? { idempotentReplay: true } : {}),
    }
    await tx.save()

    // Emit delta to update player state
    const socketId = userSocketsRef[tx.sender]
    if (socketId) {
      io.to(socketId).emit('updated_user_state', {
        delta: { dollars: player.dollars },
      })
    }

    notifyUser(io, tx.sender, 'transaction_success', {
      type: 'dollar_purchase',
      message: `Purchased ${dollarsToAdd} dollars`,
      dollarsAdded: dollarsToAdd,
      totalDollars: player.dollars,
      hiveSpent: chainTx.amount,
      transactionId: tx._id,
    })
  } catch (error: any) {
    console.error('[processDollarPurchase] Unexpected error:', error)
    tx.status = 'failed'
    tx.logs = { failureCheckpoint: 'unexpectedError', error: error.message }
    await tx.save()
    notifyUser(io, tx.sender, 'transaction_failed', {
      type: 'dollar_purchase',
      message: 'Purchase failed',
      error: error.message,
      transactionId: tx._id,
    })
    throw error // Re-throw for BullMQ retry
  } finally {
    await releaseLockIfTerminal(tx)
  }
}

/**
 * Process a pending registration transaction
 */
export const processRegistration = async (tx: any, io: Server) => {
  if (tx.status === 'completed') return

  const { referral } = tx.metadata

  try {
    // Track retry attempts in logs
    const attemptCount = (tx.logs?.attemptCount || 0) + 1
    tx.logs = { ...tx.logs, attemptCount, lastAttempt: new Date() }
    await tx.save()

    // 1. Validate blockchain transaction
    const chainTx = await blockchainService.validateHiveTransaction(tx.transactionId)

    if (!chainTx) {
      // If we haven't exceeded max attempts, throw to trigger BullMQ retry
      if (attemptCount < 5) {
        console.log(`[idleraiders-logs] Registration tx not found on chain yet, attempt ${attemptCount}/5, will retry...`)
        throw new Error('Transaction not found on blockchain yet, will retry')
      }

      tx.status = 'failed'
      tx.logs = { ...tx.logs, failureCheckpoint: 'chainTxNotFound', maxAttemptsReached: true, transactionId: tx.transactionId }
      await tx.save()
      notifyUser(io, tx.sender, 'transaction_failed', {
        type: 'registration',
        message: 'Blockchain transaction not found after multiple attempts',
        transactionId: tx._id,
      })
      return
    }

    // 2. Validate transaction details
    const validationErrors: string[] = []
    if (chainTx.from !== tx.sender) validationErrors.push(`Sender mismatch: ${chainTx.from} vs ${tx.sender}`)
    if (chainTx.to !== GAME_ACCOUNT_NAME) validationErrors.push(`Recipient mismatch`)
    if (chainTx.symbol !== 'HIVE') validationErrors.push('Must be HIVE transfer')
    
    // Validate registration fee amount (USD-based with current HIVE price).
    // If the price service hasn't reported a rate yet, throw so BullMQ retries
    // the job rather than failing the tx permanently with a bogus expected amount.
    if (!logicService.isHiveUsdPriceInitialized()) {
      console.log('[idleraiders-logs] HIVE/USD price not initialized yet, deferring registration validation for retry...')
      throw new logicService.HivePriceNotInitializedError()
    }
    const hiveUsdPrice = logicService.getCurrentHivePrice()
    const expectedHive = REGISTRATION.FEE_USD / hiveUsdPrice
    const receivedHive = chainTx.amount
    
    // Allow 5% tolerance for price fluctuations during payment (consistent with dollar purchase)
    const minAcceptable = expectedHive * 0.95
    const maxAcceptable = expectedHive * 1.05
    
    if (receivedHive < minAcceptable || receivedHive > maxAcceptable) {
      validationErrors.push(
        `Incorrect amount: ${receivedHive.toFixed(3)} HIVE (expected ${expectedHive.toFixed(3)} HIVE ≈ $${REGISTRATION.FEE_USD} USD)`
      )
    }

    if (validationErrors.length > 0) {
      tx.status = 'failed'
      tx.logs = { failureCheckpoint: 'validationFailed', errors: validationErrors }
      await tx.save()
      notifyUser(io, tx.sender, 'transaction_failed', {
        type: 'registration',
        message: 'Transaction validation failed',
        transactionId: tx._id,
      })
      return
    }

    // 3. Update player registration status and award starter dollars.
    // Atomic credit-once-per-tx guard via creditedTxIds (see processDeposit
    // for rationale). $set is naturally idempotent and would normally run
    // every replay, but gating the whole update on the dedup key keeps the
    // write surface tight and minimizes unnecessary writes.
    const starterDollars = REGISTRATION.STARTER_DOLLARS
    let player = await Player.findOneAndUpdate(
      { username: tx.sender, creditedTxIds: { $ne: tx._id } },
      {
        $set: { isRegistered: true, registeredAt: new Date() },
        $inc: { dollars: starterDollars },
        $push: { creditedTxIds: { $each: [tx._id], $slice: -1000 } },
      },
      { new: true, projection: { creditedTxIds: 0 } }
    )

    let alreadyCredited = false
    if (!player) {
      player = await Player.findOne({ username: tx.sender })
      if (!player) {
        tx.status = 'failed'
        tx.logs = { failureCheckpoint: 'playerNotFound' }
        await tx.save()
        notifyUser(io, tx.sender, 'transaction_failed', {
          type: 'registration',
          message: 'Player not found',
          transactionId: tx._id,
        })
        return
      }
      alreadyCredited = true
      console.log(
        `[idleraiders-logs] processRegistration: tx ${tx._id} already credited for ${tx.sender}, finalizing without re-crediting`,
      )
    }

    // 4. Reward referrer with dollars (if valid referrer exists and is
    // registered). Uses the same tx._id as the idempotency key on the
    // referrer's creditedTxIds set, so a retry won't double-pay the referrer.
    let referrerRewarded = false
    const referralDollars = REGISTRATION.REFERRAL_DOLLARS
    if (referral && referral !== 'idleraiders' && referral !== tx.sender) {
      const referrer = await Player.findOneAndUpdate(
        {
          username: referral,
          isRegistered: true,
          creditedTxIds: { $ne: tx._id },
        },
        {
          $inc: { dollars: referralDollars },
          $push: { creditedTxIds: { $each: [tx._id], $slice: -1000 } },
        },
        { new: true, projection: { creditedTxIds: 0 } }
      )

      if (referrer) {
        referrerRewarded = true
        console.log(`[idleraiders-logs] Referrer ${referral} rewarded with ${referralDollars} dollar(s) for referring ${tx.sender}`)

        // Log referral reward in history for the referrer
        await historyService.logEvent({
          username: referral,
          source: 'referral',
          eventType: 'reward',
          eventKey: 'referral.reward',
          data: {
            referredUser: tx.sender,
            dollarsEarned: referralDollars,
            totalDollars: referrer.dollars,
          },
        })

        // Notify referrer via socket if online
        notifyUser(io, referral, 'transaction_success', {
          type: 'referral_reward',
          message: `You received ${referralDollars} dollar(s) for referring @${tx.sender}!`,
          referredUser: tx.sender,
          dollarsEarned: referralDollars,
        })
      }
      // If `referrer` is null, either the referrer no longer qualifies
      // (unregistered/missing) or this referral was already paid out — both
      // are silently no-op'd, which is the correct behavior on retry.
    }

    // 5. Mark completed
    tx.status = 'completed'
    tx.logs = {
      successCheckpoint: 'registrationCompleted',
      registeredAt: new Date(),
      referral,
      referrerRewarded,
      starterDollarsAwarded: starterDollars,
      ...(alreadyCredited ? { idempotentReplay: true } : {}),
    }
    await tx.save()

    // Emit delta to update player registration state and dollars
    const currentSockets = getUserSockets()
    const socketId = currentSockets[tx.sender] || userSocketsRef[tx.sender]
    if (socketId) {
      io.to(socketId).emit('updated_user_state', {
        delta: { 
          isRegistered: true,
          dollars: player.dollars,
        },
      })
    }

    // Emit success notification
    notifyUser(io, tx.sender, 'transaction_success', {
      type: 'registration',
      message: `Registration successful! You received ${starterDollars} dollar(s).`,
      starterDollarsAwarded: starterDollars,
      totalDollars: player.dollars,
      transactionId: tx._id,
    })
  } catch (error: any) {
    console.error('[processRegistration] Unexpected error:', error)
    tx.status = 'failed'
    tx.logs = { failureCheckpoint: 'unexpectedError', error: error.message }
    await tx.save()
    notifyUser(io, tx.sender, 'transaction_failed', {
      type: 'registration',
      message: 'Registration failed',
      error: error.message,
      transactionId: tx._id,
    })
    throw error // Re-throw for BullMQ retry
  } finally {
    await releaseLockIfTerminal(tx)
  }
}

/**
 * Helper to notify user via Socket.IO
 * Always looks up the latest socket ID from the registry to handle reconnections
 */
function notifyUser(io: Server, username: string, event: string, data: any) {
  // Use getUserSockets() to get the latest socket mapping (handles reconnections)
  const currentSockets = getUserSockets()
  const socketId = currentSockets[username] || userSocketsRef[username]
  
  if (socketId) {
    io.to(socketId).emit(event, data)
    console.log(`[idleraiders-logs] Emitted ${event} to ${username} (socket: ${socketId})`)
  } else {
    console.log(`[idleraiders-logs] No socket found for ${username}, event ${event} not delivered`)
  }
}

export default {
  processDeposit,
  processWithdraw,
  processDollarPurchase,
  processRegistration,
}
