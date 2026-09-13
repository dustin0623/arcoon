import { useState, useEffect, useCallback } from 'react'

const HIVE_API = 'https://api.deathwing.me'
const HE_API = 'https://api.hive-engine.com/rpc/contracts'

interface HiveAccount {
  balance?: string
}

interface HiveApiResponse {
  result?: HiveAccount[]
}

interface HETokenBalance {
  balance: string
}

interface HEApiResponse {
  result?: HETokenBalance[]
}

async function fetchHiveBalance(username: string): Promise<number> {
  const res = await fetch(HIVE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'condenser_api.get_accounts',
      params: [[username]],
      id: 1,
    }),
  })
  const data: HiveApiResponse = await res.json()
  const accounts = data?.result
  if (!accounts?.length) return 0
  const raw = accounts[0].balance || '0.000 HIVE'
  return parseFloat(raw.split(' ')[0])
}

async function fetchHETokenBalance(username: string, symbol: string): Promise<number> {
  const res = await fetch(HE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'find',
      params: {
        contract: 'tokens',
        table: 'balances',
        query: { account: username, symbol },
        limit: 1,
      },
      id: 1,
    }),
  })
  const data: HEApiResponse = await res.json()
  const rows = data?.result
  if (!rows?.length) return 0
  return parseFloat(rows[0].balance)
}

interface UseHiveBlockchainReturn {
  hiveBalance: number | null
  realmcBalance: number | null
  sshrdBalance: number | null
  refetch: () => Promise<void>
}

export function useHiveBlockchain(username: string | null, enabled: boolean = true): UseHiveBlockchainReturn {
  const [hiveBalance, setHiveBalance] = useState<number | null>(null)
  const [realmcBalance, setRealmcBalance] = useState<number | null>(null)
  const [sshrdBalance, setSshrdBalance] = useState<number | null>(null)

  const fetchBalances = useCallback(async (): Promise<void> => {
    if (!username || !enabled) return
    try {
      const [hive, realmc, sshrd] = await Promise.all([
        fetchHiveBalance(username),
        fetchHETokenBalance(username, 'REALMC'),
        fetchHETokenBalance(username, 'SSHRD'),
      ])
      setHiveBalance(hive)
      setRealmcBalance(realmc)
      setSshrdBalance(sshrd)
    } catch (error) {
      console.error('[useHiveBlockchain] Error fetching balances:', error)
      setHiveBalance(0)
      setRealmcBalance(0)
      setSshrdBalance(0)
    }
  }, [username, enabled])

  useEffect(() => {
    if (!username || !enabled) return
    fetchBalances()
    const interval = setInterval(fetchBalances, 15000)
    return () => clearInterval(interval)
  }, [username, enabled, fetchBalances])

  return { hiveBalance, realmcBalance, sshrdBalance, refetch: fetchBalances }
}
