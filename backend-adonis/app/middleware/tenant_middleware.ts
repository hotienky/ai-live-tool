import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import db from '@adonisjs/lucid/services/db'

/**
 * TenantMiddleware — Identifies tenant from subdomain and patches DB connection.
 *
 * Flow:
 * 1. Extract subdomain from request hostname
 * 2. Lookup tenant in master DB
 * 3. Dynamically patch a DB connection for this tenant
 * 4. Store tenant info in ctx for downstream use
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const hostname = ctx.request.hostname() || ''
    const parts = hostname.split('.')
    const slug = parts[0] // e.g. "fashionstore" from "fashionstore.domain.com"

    // Skip middleware for master subdomain or direct IP/localhost without subdomain
    if (slug === 'master' || slug === 'localhost' || slug === '127') {
      return next()
    }

    // Development: allow ?tenant=slug query param as alternative to subdomain
    const tenantSlug = slug || ctx.request.qs().tenant

    if (!tenantSlug) {
      return ctx.response.badRequest({ error: 'Tenant not identified' })
    }

    try {
      // Lookup tenant in master DB
      const tenant = await db.connection('master')
        .from('tenants')
        .where('slug', tenantSlug)
        .first()

      if (!tenant) {
        return ctx.response.notFound({ error: 'Tenant not found', slug: tenantSlug })
      }

      if (tenant.status !== 'active') {
        return ctx.response.forbidden({ error: 'Tenant is suspended', slug: tenantSlug })
      }

      // Dynamically register/patch the tenant DB connection
      const connectionName = `tenant_${tenant.slug}`
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

      // Store tenant info on the context for controllers to use
      ;(ctx as any).tenant = tenant
      ;(ctx as any).tenantConnection = connectionName

      return next()
    } catch (error) {
      console.error('[TenantMiddleware] Error:', error.message)
      return ctx.response.internalServerError({ error: 'Tenant resolution failed' })
    }
  }
}
