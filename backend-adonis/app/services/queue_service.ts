import { Queue, Worker, Job } from 'bullmq'

/**
 * QueueService — Centralized BullMQ queue manager.
 *
 * Uses Redis (already in Docker) for persistent, reliable job processing.
 * Singleton pattern: one Queue instance, one Worker instance.
 */

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || '6379'),
}

const QUEUE_NAME = 'tenant-lifecycle'

// ── Queue (producer) ──
let queue: Queue | null = null

export function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection: REDIS_CONNECTION })
  }
  return queue
}

/**
 * Dispatch a job to the tenant lifecycle queue.
 */
export async function dispatch(jobName: string, data: Record<string, any>, opts?: { delay?: number }) {
  const q = getQueue()
  const job = await q.add(jobName, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { age: 86400 },   // keep 24h
    removeOnFail: { age: 604800 },       // keep 7d
    ...opts,
  })
  console.log(`[Queue] Dispatched "${jobName}" → Job #${job.id}`)
  return job
}

// ── Job registry ──
type JobHandler = (job: Job) => Promise<void>
const handlers: Record<string, JobHandler> = {}

export function registerJob(name: string, handler: JobHandler) {
  handlers[name] = handler
}

/**
 * Start the BullMQ worker (called from bin/queue_worker.ts).
 */
export function startWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const handler = handlers[job.name]
      if (!handler) {
        throw new Error(`No handler registered for job "${job.name}"`)
      }
      console.log(`[Worker] Processing "${job.name}" #${job.id} ...`)
      await handler(job)
      console.log(`[Worker] ✅ Completed "${job.name}" #${job.id}`)
    },
    {
      connection: REDIS_CONNECTION,
      concurrency: 2,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[Worker] ❌ Failed "${job?.name}" #${job?.id}: ${err.message}`)
  })

  worker.on('error', (err) => {
    console.error('[Worker] Error:', err.message)
  })

  console.log(`[Worker] 🚀 Listening on queue "${QUEUE_NAME}" (Redis: ${REDIS_CONNECTION.host}:${REDIS_CONNECTION.port})`)
  return worker
}

export default { getQueue, dispatch, registerJob, startWorker }
