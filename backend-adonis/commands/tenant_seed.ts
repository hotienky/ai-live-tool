import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import TenantService from '../app/modules/master/services/tenant_service.js'
import db from '@adonisjs/lucid/services/db'

/**
 * Ace Command: tenant:seed
 * Seed sample data for one or all tenant databases.
 *
 * Usage:
 *   node ace tenant:seed my-store           # Seed specific tenant
 *   node ace tenant:seed --all              # Seed ALL active tenants
 */
export default class TenantSeed extends BaseCommand {
  static commandName = 'tenant:seed'
  static description = 'Seed sample data for tenant database(s)'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Tenant slug to seed', required: false })
  declare slug: string

  @flags.boolean({ description: 'Seed ALL active tenants', default: false })
  declare all: boolean

  async run() {
    if (!this.slug && !this.all) {
      this.logger.error('Provide a tenant slug or use --all flag')
      return
    }

    if (this.all) {
      const tenants = await db.connection('master')
        .from('tenants')
        .where('status', 'active')
        .select('slug')

      this.logger.info(`Seeding ${tenants.length} tenant(s)...`)

      let success = 0
      let failed = 0

      for (const tenant of tenants) {
        try {
          await TenantService.seedTenant(tenant.slug)
          this.logger.success(`  ✅ ${tenant.slug}`)
          success++
        } catch (error: any) {
          this.logger.error(`  ❌ ${tenant.slug}: ${error.message}`)
          failed++
        }
      }

      this.logger.info('')
      this.logger.info(`Done: ${success} succeeded, ${failed} failed`)
    } else {
      this.logger.info(`Seeding tenant: ${this.slug}`)

      try {
        await TenantService.seedTenant(this.slug)
        this.logger.success(`✅ Sample data seeded for ${this.slug}`)
      } catch (error: any) {
        this.logger.error(`❌ Seed failed: ${error.message}`)
      }
    }
  }
}
