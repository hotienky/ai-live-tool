import type { HttpContext } from '@adonisjs/core/http'

/**
 * TenantContext — A typed helper to access tenant info from HttpContext.
 *
 * Usage in controllers:
 *   const ctx = TenantContext.from(httpCtx)
 *   const tenantId = ctx.tenant.id
 *   const connection = ctx.connectionName
 *
 * Single Responsibility: Type-safe access to tenant data on request context.
 */
export interface TenantRecord {
  id: number
  name: string
  slug: string
  db_name: string
  owner_email: string
  owner_name: string | null
  status: string
  plan: string
  custom_domain: string | null
  logo: string | null
  settings: Record<string, any>
  created_at: string
  updated_at: string
  expires_at: string | null
}

export default class TenantContext {
  readonly tenant: TenantRecord
  readonly connectionName: string

  private constructor(tenant: TenantRecord, connectionName: string) {
    this.tenant = tenant
    this.connectionName = connectionName
  }

  /**
   * Extract TenantContext from HttpContext.
   * Throws if middleware hasn't run yet.
   */
  static from(ctx: HttpContext): TenantContext {
    const tenant = (ctx as any).tenant
    const connectionName = (ctx as any).tenantConnection

    if (!tenant || !connectionName) {
      throw new Error(
        'TenantContext not available. Ensure TenantMiddleware has run before this controller.'
      )
    }

    return new TenantContext(tenant, connectionName)
  }

  /**
   * Try to extract TenantContext. Returns null if not available.
   */
  static tryFrom(ctx: HttpContext): TenantContext | null {
    const tenant = (ctx as any).tenant
    const connectionName = (ctx as any).tenantConnection
    if (!tenant || !connectionName) return null
    return new TenantContext(tenant, connectionName)
  }

  /** Tenant slug (used as subdomain) */
  get slug(): string {
    return this.tenant.slug
  }

  /** Tenant database name */
  get dbName(): string {
    return this.tenant.db_name
  }

  /** Whether this tenant is on a paid plan */
  get isPaid(): boolean {
    return this.tenant.plan !== 'free'
  }
}
