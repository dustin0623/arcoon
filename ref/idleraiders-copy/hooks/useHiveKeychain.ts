import { useCallback } from 'react'

// Hive Keychain types
interface KeychainResponse {
  success: boolean
  message?: string
  result?: unknown
}

interface HiveKeychain {
  requestTransfer: (
    username: string,
    to: string,
    amount: string,
    memo: string,
    currency: string,
    callback: (response: KeychainResponse) => void
  ) => void
  requestCustomJson: (
    username: string,
    id: string,
    keyType: string,
    json: string,
    memo: string,
    callback: (response: KeychainResponse) => void
  ) => void
  requestSignBuffer: (
    username: string,
    message: string,
    keyType: string,
    callback: (response: KeychainResponse) => void
  ) => void
}

declare global {
  interface Window {
    hive_keychain?: HiveKeychain
  }
}

function getKeychain(): HiveKeychain {
  if (typeof window === 'undefined') {
    throw new Error('Hive Keychain is not available on server side')
  }
  if (!window.hive_keychain) {
    throw new Error(
      'Hive Keychain extension is not installed or not yet loaded. Please install the Hive Keychain browser extension.',
    )
  }
  return window.hive_keychain
}

const GAME_ACCOUNT = 'idleraiders'

interface CustomJsonPayload {
  contractName: string
  contractAction: string
  contractPayload: {
    to: string
    symbol: string
    quantity: string
    memo: string
  }
}

interface UseHiveKeychainReturn {
  registrationPayment: (username: string, referrer: string, amount: number) => Promise<KeychainResponse>
  creditPurchasePayment: (username: string, amount: number) => Promise<KeychainResponse>
  depositToken: (username: string, quantity: number, symbol?: string) => Promise<KeychainResponse>
  transferHandler: (username: string, to: string, amount: number, memo: string, currency?: string) => Promise<KeychainResponse>
}

export function useHiveKeychain(): UseHiveKeychainReturn {
  const transferHandler = useCallback(async (
    username: string,
    to: string,
    amount: number,
    memo: string,
    currency: string = 'HIVE'
  ): Promise<KeychainResponse> => {
    return new Promise((resolve, reject) => {
      try {
        const keychain = getKeychain()
        const formattedAmount = parseFloat(String(amount)).toFixed(3)
        keychain.requestTransfer(username, to, formattedAmount, memo, currency, (res: KeychainResponse) => {
          if (res && res.success) {
            resolve(res)
          } else {
            reject(res || new Error('Transfer failed'))
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }, [])

  const registrationPayment = useCallback(
    async (username: string, _referrer: string, amount: number): Promise<KeychainResponse> => {
      const memo = 'idleraiders:registration'
      return await transferHandler(username, GAME_ACCOUNT, amount, memo, 'HIVE')
    },
    [transferHandler],
  )

  const creditPurchasePayment = useCallback(
    async (username: string, amount: number): Promise<KeychainResponse> => {
      const memo = 'idleraiders:in-game dollar purchase'
      return await transferHandler(username, GAME_ACCOUNT, amount, memo, 'HIVE')
    },
    [transferHandler],
  )

  const fetchHandler = useCallback(async (
    username: string,
    json: CustomJsonPayload,
    memo: string
  ): Promise<KeychainResponse> => {
    const keychain = getKeychain()
    const res = await new Promise<KeychainResponse>((resolve) => {
      keychain.requestCustomJson(username, 'ssc-mainnet-hive', 'Active', JSON.stringify(json), memo, (res: KeychainResponse) => {
        resolve(res)
      })
    })
    if (!res.success) {
      throw new Error(res.message || 'Token transfer failed')
    }
    return res
  }, [])

  const depositToken = useCallback(
    async (username: string, quantity: number, symbol: string = 'REALMC'): Promise<KeychainResponse> => {
      const memo = `idleraiders:deposit request ${symbol} qty:${quantity}`
      const json: CustomJsonPayload = {
        contractName: 'tokens',
        contractAction: 'transfer',
        contractPayload: {
          to: GAME_ACCOUNT,
          symbol,
          quantity: `${quantity}`,
          memo,
        },
      }
      return await fetchHandler(username, json, memo)
    },
    [fetchHandler],
  )

  return {
    registrationPayment,
    creditPurchasePayment,
    depositToken,
    transferHandler,
  }
}
