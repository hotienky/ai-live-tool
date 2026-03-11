import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import TenantService from '../app/modules/master/services/tenant_service.js'
import db from '@adonisjs/lucid/services/db'

/**
 * Ace Command: tenant:manage
 * Manage tenant status: list, suspend, activate, delete.
 *
 * Usage:
 *   node ace tenant:manage list                      # List all tenants
 *   node ace tenant:manage suspend my-store           # Suspend a tenant
 *   node ace tenant:manage activate my-store          # Activate a tenant
 *   node ace tenant:manage delete my-store            # Delete tenant + drop DB
 *   node ace tenant:manage delete my-store --force    # Skip confirmation
 */
export default class TenantManage extends BaseCommand {
  static commandName = 'tenant:manage'
  static description = 'List, suspend, activate, or delete tenants'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Action: list, suspend, activate, delete',
  })
  declare action: string

  @args.string({
    description: 'Tenant slug (required for suspend/activate/delete)',
    required: false,
  })
  declare slug: string

  @flags.boolean({ description: 'Skip confirmation for delete', default: false })
  declare force: boolean

  async run() {
    switch (this.action) {
      case 'list':
        await this.listTenants()
        break
      case 'suspend':
        await this.suspendTenant()
        break
      case 'activate':
        await this.activateTenant()
        break
      case 'delete':
        await this.deleteTenant()
        break
      default:
        this.logger.error(`Unknown action: ${this.action}`)
        this.logger.info('Available actions: list, suspend, activate, delete')
    }
  }

  private async listTenants() {
    const tenants = await db.connection('master')
      .from('tenants')
      .select('id', 'name', 'slug', 'db_name', 'status', 'plan', 'owner_email', 'created_at')
      .orderBy('created_at', 'desc')

    if (tenants.length === 0) {
      this.logger.info('No tenants found.')
      return
    }

    this.logger.info(`Found ${tenants.length} tenant(s):`)
    this.logger.info('')

    const table = this.ui.table()
    table.head(['ID', 'Name', 'Slug', 'DB', 'Status', 'Plan', 'Owner'])

    for (const t of tenants) {
      const statusIcon = t.status === 'active' ? '🟢' : t.status === 'suspended' ? '🔴' : '🟡'
      table.row([
        String(t.id),
        t.name,
        t.slug,
        t.db_name,
        `${statusIcon} ${t.status}`,
        t.plan,
        t.owner_email,
      ])
    }

    table.render()
  }

  private async suspendTenant() {
    if (!this.slug) {
      this.logger.error('Tenant slug is required for suspend action')
      return
    }

    try {
      await TenantService.suspendTenant(this.slug)
      this.logger.success(`🔴 Tenant ${this.slug} suspended`)
    } catch (error: any) {
      this.logger.error(`❌ Failed: ${error.message}`)
    }
  }

  private async activateTenant() {
    if (!this.slug) {
      this.logger.error('Tenant slug is required for activate action')
      return
    }

    try {
      await TenantService.activateTenant(this.slug)
      this.logger.success(`🟢 Tenant ${this.slug} activated`)
    } catch (error: any) {
      this.logger.error(`❌ Failed: ${error.message}`)
    }
  }

  private async deleteTenant() {
    if (!this.slug) {
      this.logger.error('Tenant slug is required for delete action')
      return
    }

    if (!this.force) {
      const confirmed = await this.prompt.confirm(
        `⚠️  This will permanently delete tenant "${this.slug}" and DROP its database. Continue?`
      )
      if (!confirmed) {
        this.logger.info('Aborted.')
        return
      }
    }

    try {
      await TenantService.deleteTenant(this.slug)
      this.logger.success(`🗑️  Tenant ${this.slug} deleted (database dropped)`)
    } catch (error: any) {
      this.logger.error(`❌ Failed: ${error.message}`)
    }
  }
}
