import db from '@adonisjs/lucid/services/db'

/**
 * Action: Update tenant fields in master registry.
 */
export default class UpdateTenantAction {
  async execute(id: number, updates: Record<string, any>) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('id', id)
      .first()

    if (!tenant) return null

    // Filter allowed fields
    const allowedFields = ['name', 'status', 'plan', 'custom_domain', 'logo', 'settings']
    const filteredUpdates: Record<string, any> = { updated_at: new Date() }
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key]
      }
    }

    await db.connection('master')
      .from('tenants')
      .where('id', id)
      .update(filteredUpdates)

    return db.connection('master')
      .from('tenants')
      .where('id', id)
      .first()
  }
}
