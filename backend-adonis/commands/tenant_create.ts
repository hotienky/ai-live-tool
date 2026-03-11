import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import TenantService from '../app/modules/master/services/tenant_service.js'

/**
 * Ace Command: tenant:create
 * Creates a new tenant with its own PostgreSQL database and runs migrations.
 *
 * Usage:
 *   node ace tenant:create my-store --name="My Store" --email=owner@store.com
 *   node ace tenant:create my-store --name="My Store" --email=owner@store.com --plan=pro --seed
 */
export default class TenantCreate extends BaseCommand {
  static commandName = 'tenant:create'
  static description = 'Create a new tenant with database, schema, and optional seed data'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Unique slug for the tenant (used as subdomain)' })
  declare slug: string

  @flags.string({ description: 'Display name of the tenant' })
  declare name: string

  @flags.string({ description: 'Owner email address' })
  declare email: string

  @flags.string({ description: "Owner's name", default: '' })
  declare ownerName: string

  @flags.string({ description: 'Plan: free, pro, enterprise', default: 'free' })
  declare plan: string

  @flags.boolean({ description: 'Seed sample data after creation', default: false })
  declare seed: boolean

  async run() {
    // Validate required flags
    if (!this.name) {
      this.logger.error('--name flag is required')
      return
    }
    if (!this.email) {
      this.logger.error('--email flag is required')
      return
    }

    // Validate slug format
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(this.slug) || this.slug.length < 3) {
      this.logger.error('Slug must be 3+ lowercase alphanumeric chars with optional hyphens')
      return
    }

    this.logger.info(`Creating tenant: ${this.slug}`)

    try {
      // 1. Create tenant
      const tenant = await TenantService.createTenant({
        name: this.name,
        slug: this.slug,
        ownerEmail: this.email,
        ownerName: this.ownerName || this.name,
        plan: this.plan,
      })

      this.logger.success(`✅ Tenant created: ${this.slug}`)
      this.logger.info(`   Database: tenant_${this.slug}`)
      this.logger.info(`   Owner: ${this.email}`)
      this.logger.info(`   Plan: ${this.plan}`)

      // 2. Optionally seed
      if (this.seed) {
        this.logger.info('Seeding sample data...')
        await TenantService.seedTenant(this.slug)
        this.logger.success('✅ Sample data seeded')
      }

      this.logger.info('')
      this.logger.info(`🌐 Access at: http://${this.slug}.localhost:3333`)
      this.logger.info(`   Or use: ?tenant=${this.slug} query param in dev`)
    } catch (error: any) {
      this.logger.error(`❌ Failed to create tenant: ${error.message}`)
    }
  }
}
