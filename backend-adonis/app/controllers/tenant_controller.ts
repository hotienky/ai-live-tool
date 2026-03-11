import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import TenantService from '#services/tenant_service'

/**
 * TenantController — CRUD operations for managing tenants (master panel).
 */
export default class TenantController {
  /**
   * GET /api/master/tenants — List all tenants
   */
  async index({ request, response }: HttpContext) {
    const page = Number(request.qs().page || 1)
    const limit = Number(request.qs().limit || 20)
    const search = request.qs().search

    const query = db.connection('master')
      .from('tenants')
      .select('*')
      .orderBy('created_at', 'desc')

    if (search) {
      query.where((q: any) => {
        q.whereILike('name', `%${search}%`)
          .orWhereILike('slug', `%${search}%`)
          .orWhereILike('owner_email', `%${search}%`)
      })
    }

    const result = await query.paginate(page, limit)
    return response.json(result)
  }

  /**
   * GET /api/master/tenants/:id — Get tenant details
   */
  async show({ params, response }: HttpContext) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('id', params.id)
      .first()

    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    // Get tenant stats (users count, products count, etc.)
    try {
      const connectionName = `stats_${tenant.slug}`
      db.manager.patch(connectionName, {
        client: 'pg',
        connection: {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT || '5432'),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: tenant.db_name,
        },
      })

      const conn = db.connection(connectionName)
      const [usersCount] = await conn.rawQuery('SELECT COUNT(*) as count FROM users')
      const [productsCount] = await conn.rawQuery('SELECT COUNT(*) as count FROM products')
      const [ordersCount] = await conn.rawQuery('SELECT COUNT(*) as count FROM orders')

      tenant.stats = {
        users: Number(usersCount.rows?.[0]?.count || 0),
        products: Number(productsCount.rows?.[0]?.count || 0),
        orders: Number(ordersCount.rows?.[0]?.count || 0),
      }

      await db.manager.close(connectionName)
    } catch {
      tenant.stats = null
    }

    return response.json(tenant)
  }

  /**
   * POST /api/master/tenants — Create a new tenant
   */
  async store({ request, response }: HttpContext) {
    const { name, slug, ownerEmail, ownerName, plan } = request.only([
      'name', 'slug', 'ownerEmail', 'ownerName', 'plan',
    ])

    if (!name || !slug || !ownerEmail) {
      return response.badRequest({ error: 'name, slug, and ownerEmail are required' })
    }

    // Validate slug format
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || slug.length < 3) {
      return response.badRequest({ error: 'Slug must be 3+ chars, lowercase alphanumeric with hyphens' })
    }

    // Check uniqueness
    const existing = await db.connection('master')
      .from('tenants')
      .where('slug', slug)
      .first()
    if (existing) {
      return response.conflict({ error: 'Slug already taken' })
    }

    try {
      const tenant = await TenantService.createTenant({ name, slug, ownerEmail, ownerName, plan })
      return response.created(tenant)
    } catch (error: any) {
      console.error('[TenantController.store] Error:', error.message)
      return response.internalServerError({ error: 'Failed to create tenant', details: error.message })
    }
  }

  /**
   * PUT /api/master/tenants/:id — Update tenant
   */
  async update({ params, request, response }: HttpContext) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('id', params.id)
      .first()

    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    const updates = request.only(['name', 'status', 'plan', 'custom_domain', 'logo', 'settings'])

    await db.connection('master')
      .from('tenants')
      .where('id', params.id)
      .update({ ...updates, updated_at: new Date() })

    const updated = await db.connection('master')
      .from('tenants')
      .where('id', params.id)
      .first()

    return response.json(updated)
  }

  /**
   * POST /api/master/tenants/:id/suspend — Suspend tenant
   */
  async suspend({ params, response }: HttpContext) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('id', params.id)
      .first()

    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    await TenantService.suspendTenant(tenant.slug)
    return response.json({ message: `Tenant ${tenant.slug} suspended` })
  }

  /**
   * POST /api/master/tenants/:id/activate — Activate tenant
   */
  async activate({ params, response }: HttpContext) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('id', params.id)
      .first()

    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    await TenantService.activateTenant(tenant.slug)
    return response.json({ message: `Tenant ${tenant.slug} activated` })
  }

  /**
   * DELETE /api/master/tenants/:id — Delete tenant  
   */
  async destroy({ params, response }: HttpContext) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('id', params.id)
      .first()

    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    try {
      await TenantService.deleteTenant(tenant.slug)
      return response.json({ message: `Tenant ${tenant.slug} deleted` })
    } catch (error: any) {
      return response.internalServerError({ error: 'Delete failed', details: error.message })
    }
  }

  /**
   * POST /api/master/tenants/:id/migrate — Run migrations for tenant
   */
  async migrate({ params, response }: HttpContext) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('id', params.id)
      .first()

    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    try {
      await TenantService.migrateTenant(tenant.slug, tenant.db_name)
      return response.json({ message: `Migrations run for ${tenant.slug}` })
    } catch (error: any) {
      return response.internalServerError({ error: 'Migration failed', details: error.message })
    }
  }

  /**
   * POST /api/master/tenants/:id/seed — Seed sample data
   */
  async seed({ params, response }: HttpContext) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('id', params.id)
      .first()

    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    try {
      await TenantService.seedTenant(tenant.slug)
      return response.json({ message: `Sample data seeded for ${tenant.slug}` })
    } catch (error: any) {
      return response.internalServerError({ error: 'Seed failed', details: error.message })
    }
  }
}
