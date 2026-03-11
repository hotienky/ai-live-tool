import db from '@adonisjs/lucid/services/db'
import TenantService from '../services/tenant_service.js'

/**
 * Action: Create a new tenant (DB + schema + registry).
 */
export default class CreateTenantAction {
  async execute(data: {
    name: string
    slug: string
    ownerEmail: string
    ownerName?: string
    plan?: string
  }) {
    // Check slug uniqueness
    const existing = await db.connection('master')
      .from('tenants')
      .where('slug', data.slug)
      .first()

    if (existing) {
      return { success: false, error: 'Slug already taken', status: 409 }
    }

    const tenant = await TenantService.createTenant(data)
    return { success: true, data: tenant }
  }
}
