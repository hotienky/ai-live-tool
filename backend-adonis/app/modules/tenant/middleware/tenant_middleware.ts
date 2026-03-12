import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import db from '@adonisjs/lucid/services/db'
import ConnectionPoolManager from '../services/connection_pool_manager.js'

/**
 * Middleware: Identifies tenant from subdomain/query, patches DB connection.
 *
 * Flow:
 * 1. Extract subdomain from hostname (or ?tenant= query param in dev)
 * 2. Lookup tenant in master DB
 * 3. Check connection pool limits
 * 4. Dynamically patch DB connection for this tenant
 * 5. Store tenant info on ctx for downstream controllers
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const hostname = ctx.request.hostname() || ''
    const parts = hostname.split('.')
    const subdomain = parts[0]

    // Skip for master subdomain or direct API without subdomain
    if (subdomain === 'master') {
      return next()
    }

    // Dev mode: allow ?tenant=slug or X-Tenant-Slug header as fallback
    let tenantSlug: string | undefined
    if (subdomain !== 'localhost' && subdomain !== '127' && subdomain !== '0') {
      tenantSlug = subdomain
    } else {
      tenantSlug = ctx.request.qs().tenant || ctx.request.header('x-tenant-slug')
    }

    if (!tenantSlug) {
      return ctx.response.badRequest({
        error: 'Tenant not identified.',
        hint: 'Use subdomain, ?tenant=slug query param, or X-Tenant-Slug header',
      })
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

      // Check pool limits
      if (ConnectionPoolManager.isAtLimit()) {
        // Try cleanup first
        await ConnectionPoolManager.cleanupIdle()
        if (ConnectionPoolManager.isAtLimit()) {
          return ctx.response.serviceUnavailable({ error: 'Too many active tenants' })
        }
      }

      // Patch dynamic connection (for explicit TenantDb usage)
      const connectionName = `tenant_${tenant.slug}`
      const tenantDbConfig = {
        client: 'pg' as const,
        connection: {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT || '5432'),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: tenant.db_name,
        },
      }
      db.manager.patch(connectionName, tenantDbConfig)

      // CRITICAL: Also patch the DEFAULT 'pg' connection so ALL Lucid ORM models
      // (Product, Banner, Category, etc.) automatically query the tenant DB.
      // Without this, models query ai_live_tool (the default database).
      db.manager.patch('pg', tenantDbConfig)

      // Track in pool
      ConnectionPoolManager.markActive(connectionName, tenant.slug)

      // Store on context for downstream use
      ;(ctx as any).tenant = tenant
      ;(ctx as any).tenantConnection = connectionName

      return next()
    } catch (error: any) {
      console.error('[TenantMiddleware] Error:', error.message)
      return ctx.response.internalServerError({ error: 'Tenant resolution failed' })
    }
  }
}
