import type { Job } from 'bullmq'
import db from '@adonisjs/lucid/services/db'
import { registerJob } from '#services/queue_service'

/**
 * Job: create-tenant-db
 *
 * Flow:
 *   1. CREATE DATABASE tenant_{slug}
 *   2. Run TENANT_SCHEMA migrations
 *   3. Seed owner user with hashed password
 *   4. Update tenant status → 'active'
 */

// Import the schema from tenant_service (re-export it)
import TenantService from '#modules/master/services/tenant_service'

export function registerCreateTenantJob() {
  registerJob('create-tenant-db', async (job: Job) => {
    const { slug, dbName, ownerEmail, ownerName, ownerPassword } = job.data

    console.log(`[Job:create-tenant-db] Creating DB "${dbName}" for tenant "${slug}"`)

    try {
      // 1. Create PostgreSQL database
      await db.rawQuery(`CREATE DATABASE "${dbName}" OWNER postgres`)

      // 2. Run migrations
      await TenantService.migrateTenant(slug, dbName)

      // 3. Seed owner
      if (ownerEmail) {
        await TenantService.seedOwner(slug, dbName, {
          email: ownerEmail,
          name: ownerName || slug,
          password: ownerPassword || 'Admin@123',
        })
      }

      // 4. Seed sample data
      await TenantService.seedTenant(slug)

      // 5. Update status → active
      await db.connection('master')
        .from('tenants')
        .where('slug', slug)
        .update({ status: 'active', updated_at: new Date() })

      console.log(`[Job:create-tenant-db] ✅ Tenant "${slug}" provisioned successfully`)
    } catch (error: any) {
      // Mark as failed
      await db.connection('master')
        .from('tenants')
        .where('slug', slug)
        .update({ status: 'failed', updated_at: new Date() })

      console.error(`[Job:create-tenant-db] ❌ Failed for "${slug}":`, error.message)
      throw error // BullMQ will retry
    }
  })
}
