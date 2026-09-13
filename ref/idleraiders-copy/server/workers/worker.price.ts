import cron, { type ScheduledTask } from 'node-cron'
import { setHiveUsdPrice } from '../../lib/modules/transactions/transaction.logic'

let priceTask: ScheduledTask | null = null

const fetchHiveUsdPrice = async (): Promise<number> => {
  const res = await fetch('https://api.coinpaprika.com/v1/tickers/hive-hive', { cache: 'no-store' })

  if (!res.ok) {
    throw new Error('Failed to fetch Hive price')
  }

  const data = await res.json()
  return data.quotes.USD.price
}

export const initializePriceWorker = (): void => {
  const updatePrice = async () => {
    try {
      const price = await fetchHiveUsdPrice()

      // Update the logic service with the new price
      setHiveUsdPrice(price)

      console.log('[idleraiders-logs] HIVE price updated:', price.toFixed(4), 'USD')
    } catch (error: any) {
      console.error('[idleraiders-logs] Error fetching price:', error.message)
    }
  }

  // Run immediately on startup
  updatePrice()

  // Every 5 minutes
  priceTask = cron.schedule('*/5 * * * *', updatePrice)
  console.log('[idleraiders-logs] Price worker started (updates every 5 minutes)')
}

export const stopPriceWorker = (): void => {
  if (priceTask) {
    priceTask.stop()
    priceTask = null
    console.log('[idleraiders-logs] Stopped price worker')
  }
}
