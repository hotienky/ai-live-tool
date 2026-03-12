import type { Job } from 'bullmq'
import db from '@adonisjs/lucid/services/db'
import { registerJob } from '#services/queue_service'

/**
 * Job: delete-tenant-db
 *
 * Flow:
 *   1. Close AdonisJS connection pool
 *   2. Terminate all PostgreSQL connections
 *   3. DROP DATABASE
 *   4. Delete from master registry
 */
export function registerDeleteTenantJob() {
  registerJob('delete-tenant-db', async (job: Job) => {
    const { slug, dbName } = job.data

    console.log(`[Job:delete-tenant-db] Dropping DB "${dbName}" for tenant "${slug}"`)

    try {
      // 1. Close AdonisJS pool
      const connectionName = `tenant_${slug}`
      try { await db.manager.close(connectionName) } catch { /* may not exist */ }

      // 2. Terminate active PostgreSQL connections
      await db.rawQuery(
        `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE datname = ? AND pid <> pg_backend_pid()`,
        [dbName]
      )

      // 3. Drop database
      await db.rawQuery(`DROP DATABASE IF EXISTS "${dbName}"`)

      // 4. Delete from master registry
      await db.connection('master')
        .from('tenants')
        .where('slug', slug)
        .delete()

      console.log(`[Job:delete-tenant-db] ✅ Tenant "${slug}" deleted & DB dropped`)
    } catch (error: any) {
      console.error(`[Job:delete-tenant-db] ❌ Failed for "${slug}":`, error.message)
      throw error // BullMQ will retry
    }
  })
}
