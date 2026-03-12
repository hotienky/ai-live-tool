/**
 * Queue Worker — Standalone process for processing BullMQ jobs.
 *
 * Run: npx tsx bin/queue_worker.ts
 *
 * This boots the AdonisJS IoC container (for DB access)
 * then starts the BullMQ worker to process tenant lifecycle jobs.
 */

import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║   🏗️  Queue Worker — Tenant Lifecycle Jobs      ║')
  console.log('╚══════════════════════════════════════════════════╝')

  // Boot AdonisJS app (for DB, config, etc.)
  const ignitor = new Ignitor(APP_ROOT)
  const app = ignitor.createApp('console')
  await app.init()
  await app.boot()

  // Register all job handlers
  const { registerCreateTenantJob } = await import('#jobs/create_tenant_job')
  const { registerDeleteTenantJob } = await import('#jobs/delete_tenant_job')
  registerCreateTenantJob()
  registerDeleteTenantJob()

  // Start the BullMQ worker
  const { startWorker } = await import('#services/queue_service')
  const worker = startWorker()

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[Worker] Shutting down...')
    await worker.close()
    console.log('[Worker] Closed.')
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err)
  process.exit(1)
})
