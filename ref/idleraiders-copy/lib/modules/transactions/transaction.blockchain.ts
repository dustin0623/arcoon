import hive from '@hiveio/hive-js'
import SSC from 'sscjs'
import { GAME_ACCOUNT_NAME, HIVE_ACTIVE_KEY } from '../../config/config'
import { TOKEN_MAIN, type TokenSymbol, formatTokenQuantity } from '@/lib/config/tokens'

hive.api.setOptions({ url: 'https://api.deathwing.me' })

const ssc = new SSC('https://api.hive-engine.com/rpc')

const TREASURY = GAME_ACCOUNT_NAME

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/*
|--------------------------------------------------------------------------
| Utility
|--------------------------------------------------------------------------
*/

export function formatHive(amountMilli) {
  return `${(amountMilli / 1000).toFixed(3)} HIVE`
}

/**
 * Format a token quantity for Hive Engine broadcasts. Symbol is required so we
 * can match the token's configured precision — sending too many decimals
 * causes the broadcast to be rejected by the contract validation regex.
 */
export function formatToken(quantity: number, symbol: TokenSymbol): string {
  return formatTokenQuantity(quantity, symbol)
}

/*
|--------------------------------------------------------------------------
| Hive Engine Token Transfer (Withdrawals)
|--------------------------------------------------------------------------
*/

export const broadcastHiveEngineTransfer = async ({ symbol, quantity, to, memo = '' }) => {
  if (!symbol || !to) {
    throw new Error('Invalid transfer payload')
  }

  const qty = Number(quantity)

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('Invalid token quantity')
  }

  const formattedQty = formatToken(qty, symbol)

  // Guard against the case where truncating to the token's precision yields 0
  // (e.g. requesting 0.4 of a precision-0 token). Better to fail loudly here
  // than to broadcast a no-op transfer.
  if (Number(formattedQty) <= 0) {
    throw new Error(`Quantity ${qty} is below the minimum unit for ${symbol}`)
  }

  const json = JSON.stringify({
    contractName: 'tokens',
    contractAction: 'transfer',
    contractPayload: {
      symbol,
      to,
      quantity: formattedQty,
      memo,
    },
  })

  try {
    const result = await hive.broadcast.customJsonAsync(
      HIVE_ACTIVE_KEY,
      [GAME_ACCOUNT_NAME],
      [],
      'ssc-mainnet-hive',
      json,
    )

    const txId = result?.id || result?.tx_id

    if (!txId) {
      throw new Error('Hive Engine transfer broadcast failed')
    }

    return txId
  } catch (error) {
    throw new Error(`Hive Engine broadcast error: ${error.message}`)
  }
}

/*
|--------------------------------------------------------------------------
| Native HIVE Transfer
|--------------------------------------------------------------------------
*/

export const broadcastHiveTransfer = async ({ to, amountMilli, memo = '' }) => {
  if (!to) {
    throw new Error('Missing recipient')
  }

  if (!Number.isFinite(amountMilli) || amountMilli <= 0) {
    throw new Error('Invalid HIVE amount')
  }

  const formattedAmount = formatHive(amountMilli)

  try {
    const result = await new Promise((resolve, reject) => {
      hive.broadcast.transfer(HIVE_ACTIVE_KEY, GAME_ACCOUNT_NAME, to, formattedAmount, memo, (err, res) => {
        if (err) return reject(err)
        resolve(res)
      })
    })

    const txId = result?.id || result?.tx_id

    if (!txId) {
      throw new Error('HIVE transfer broadcast failed')
    }

    return txId
  } catch (error) {
    throw new Error(`Hive broadcast error: ${error.message}`)
  }
}

/*
|--------------------------------------------------------------------------
| Blockchain Validation
|--------------------------------------------------------------------------
*/

export const getHiveEngineTransactionInfo = async (transactionId: string) => {
  try {
    // sscjs returns a promise when no callback is passed
    const result = await ssc.getTransactionInfo(transactionId)
    return result || null
  } catch (error) {
    console.error('[idleraiders-logs] getHiveEngineTransactionInfo error:', error)
    return null
  }
}

export const validateHiveEngineDeposit = async (transactionId, expectedSymbol) => {
  const maxRetries = 5

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const tx = await getHiveEngineTransactionInfo(transactionId)

    if (!tx) {
      await delay(2000)
      continue
    }

    if (tx.contract !== 'tokens' || tx.action !== 'transfer') {
      return null
    }

    let payload

    try {
      payload = JSON.parse(tx.payload)
    } catch {
      return null
    }

    if (payload.to !== TREASURY) return null
    if (payload.symbol !== expectedSymbol) return null

    return {
      transactionId: tx.transactionId,
      sender: tx.sender,
      symbol: payload.symbol,
      quantity: Number(payload.quantity),
      logs: tx.logs,
    }
  }

  return null
}

export const validateHiveTransaction = async (txId) => {
  const result = await hive.api.getTransactionAsync(txId)

  if (!result || !result.operations?.length) {
    return null
  }

  const [operation, payload] = result.operations[0]

  if (operation !== 'transfer') {
    return null
  }

  const [amountStr, symbol] = payload.amount.split(' ')

  return {
    from: payload.from,
    to: payload.to,
    amount: Number(amountStr),
    symbol,
    memo: payload.memo,
  }
}

/*
|--------------------------------------------------------------------------
| Hive Engine Balance
|--------------------------------------------------------------------------
*/

export const getHiveEngineBalance = async (account, symbol) => {
  try {
    const balance = await ssc.findOne('tokens', 'balances', {
      account,
      symbol,
    })

    return balance ? parseFloat(balance.balance) : 0
  } catch (error) {
    console.error(`[getHiveEngineBalance] ${error.message}`)
    return 0
  }
}

/*
|--------------------------------------------------------------------------
| Treasury Minting (Auto-fund on withdrawal shortfall)
|--------------------------------------------------------------------------
*/

export const mintToTreasury = async (quantity: number, symbol: TokenSymbol = TOKEN_MAIN) => {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Invalid mint quantity')
  }

  // Use the token's own precision instead of a hard-coded 3-decimal format —
  // Hive Engine rejects strings whose decimal count exceeds the token's
  // configured precision (e.g. "5.000" for a precision-0 token).
  const qty = formatTokenQuantity(quantity, symbol)

  if (Number(qty) <= 0) {
    throw new Error(`Mint quantity ${quantity} is below the minimum unit for ${symbol}`)
  }

  const json = JSON.stringify({
    contractName: 'tokens',
    contractAction: 'issue',
    contractPayload: {
      symbol,
      quantity: qty,
      to: TREASURY,
    },
  })

  try {
    const result = await hive.broadcast.customJsonAsync(
      HIVE_ACTIVE_KEY,
      [GAME_ACCOUNT_NAME],
      [],
      'ssc-mainnet-hive',
      json,
    )

    const txId = result?.id || result?.tx_id

    if (!txId) {
      throw new Error('Hive Engine mint broadcast failed')
    }

    return txId
  } catch (error) {
    throw new Error(`Hive Engine mint error: ${error.message}`)
  }
}

/*
|--------------------------------------------------------------------------
| Balance Check with Retry (waits for blockchain confirmation)
|--------------------------------------------------------------------------
*/

export const getHiveEngineBalanceWithRetry = async (
  account: string,
  symbol: string,
  minExpected: number,
  maxRetries = 5,
  delayMs = 2000
): Promise<{ balance: number; confirmed: boolean }> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const balance = await getHiveEngineBalance(account, symbol)
    
    if (balance >= minExpected) {
      return { balance, confirmed: true }
    }
    
    console.log(`[idleraiders-logs] Balance check attempt ${attempt}/${maxRetries}: ${balance} < ${minExpected}, waiting ${delayMs}ms...`)
    
    if (attempt < maxRetries) {
      await delay(delayMs)
    }
  }
  
  // Return final balance even if not confirmed
  const finalBalance = await getHiveEngineBalance(account, symbol)
  return { balance: finalBalance, confirmed: finalBalance >= minExpected }
}
