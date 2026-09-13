import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { purchaseQueue } from '@/lib/queue/purchase.queue'
import { cancelQueue } from '@/lib/queue/cancel.queue'

// This route hits Redis (BullMQ). Force dynamic + Node runtime so Next.js
// doesn't attempt to pre-render it during `next build`'s page-data collection.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  return withAuth(request, async () => {
    const jobId = params.jobId

    if (!jobId) {
      throw new Error('Missing jobId')
    }

    try {
      // Try purchase queue first
      let job = await purchaseQueue.getJob(jobId)
      let queueType = 'purchase'

      // If not found, try cancel queue
      if (!job) {
        job = await cancelQueue.getJob(jobId)
        queueType = 'cancel'
      }

      if (!job) {
        return {
          success: false,
          status: 'not_found',
          message: 'Job not found',
        }
      }

      const state = await job.getState()
      const progress = job.progress() || 0
      const isCompleted = state === 'completed'
      const isFailed = state === 'failed'

      const response = {
        success: true,
        jobId: job.id,
        queueType,
        status: state,
        progress,
        isCompleted,
        isFailed,
        data: job.data,
        timestamp: job.processedOn || job.createdOn,
      }

      // Add result if completed
      if (isCompleted) {
        response.result = job.returnvalue
      }

      // Add error if failed
      if (isFailed) {
        response.error = job.failedReason
        response.attemptsMade = job.attemptsMade
        response.maxAttempts = job.opts?.attempts ?? 1
      }

      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to get job status: ${message}`)
    }
  })
}
