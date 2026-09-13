import type { Worker } from 'bullmq'
import { createPurchaseWorker } from './purchase.worker'
import { createCancelWorker } from './cancel.worker'

let purchaseWorker: Worker | null = null
let cancelWorker: Worker | null = null

export async function initializeWorkers() {
  try {
    console.log('[Workers] Initializing marketplace workers...')

    purchaseWorker = await createPurchaseWorker()
    console.log('[Workers] Purchase worker initialized')

    cancelWorker = await createCancelWorker()
    console.log('[Workers] Cancel worker initialized')

    console.log('[Workers] All workers ready')
  } catch (error) {
    console.error('[Workers] Failed to initialize workers:', error)
    throw error
  }
}

export async function closeWorkers() {
  try {
    console.log('[Workers] Closing marketplace workers...')

    if (purchaseWorker) {
      await purchaseWorker.close()
      console.log('[Workers] Purchase worker closed')
    }

    if (cancelWorker) {
      await cancelWorker.close()
      console.log('[Workers] Cancel worker closed')
    }
  } catch (error) {
    console.error('[Workers] Failed to close workers:', error)
  }
}

export function getPurchaseWorker() {
  return purchaseWorker
}

export function getCancelWorker() {
  return cancelWorker
}
