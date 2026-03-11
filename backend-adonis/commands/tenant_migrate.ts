import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import TenantService from '../app/modules/master/services/tenant_service.js'
import db from '@adonisjs/lucid/services/db'

/**
 * Ace Command: tenant:migrate
 * Run migrations on one or all tenant databases.
 *
 * Usage:
 *   node ace tenant:migrate my-store        # Migrate specific tenant
 *   node ace tenant:migrate --all           # Migrate ALL active tenants
 */
export default class TenantMigrate extends BaseCommand {
  static commandName = 'tenant:migrate'
  static description = 'Run schema migrations on tenant database(s)'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Tenant slug to migrate', required: false })
  declare slug: string

  @flags.boolean({ description: 'Migrate ALL active tenants', default: false })
  declare all: boolean

  async run() {
    if (!this.slug && !this.all) {
      this.logger.error('Provide a tenant slug or use --all flag')
      return
    }

    if (this.all) {
      // Migrate all active tenants
      const tenants = await db.connection('master')
        .from('tenants')
        .where('status', 'active')
        .select('slug', 'db_name')

      this.logger.info(`Migrating ${tenants.length} tenant(s)...`)

      let success = 0
      let failed = 0

      for (const tenant of tenants) {
        try {
          await TenantService.migrateTenant(tenant.slug, tenant.db_name)
          this.logger.success(`  ✅ ${tenant.slug} (${tenant.db_name})`)
          success++
        } catch (error: any) {
          this.logger.error(`  ❌ ${tenant.slug}: ${error.message}`)
          failed++
        }
      }

      this.logger.info('')
      this.logger.info(`Done: ${success} succeeded, ${failed} failed`)
    } else {
      // Migrate single tenant
      this.logger.info(`Migrating tenant: ${this.slug}`)

      try {
        await TenantService.migrateTenant(this.slug)
        this.logger.success(`✅ Migrations completed for ${this.slug}`)
      } catch (error: any) {
        this.logger.error(`❌ Migration failed: ${error.message}`)
      }
    }
  }
}
