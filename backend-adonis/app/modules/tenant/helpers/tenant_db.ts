import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import TenantContext from '../helpers/tenant_context.js'

/**
 * TenantDb — Query builder scoped to the current tenant's database.
 *
 * Usage in controllers/actions:
 *   const tenantDb = TenantDb.from(ctx)
 *   const products = await tenantDb.query('products').select('*').paginate(1, 20)
 *   const [result] = await tenantDb.raw('SELECT COUNT(*) FROM orders')
 *
 * Single Responsibility: Provide tenant-scoped database access.
 */
export default class TenantDb {
  private connectionName: string

  private constructor(connectionName: string) {
    this.connectionName = connectionName
  }

  /**
   * Create TenantDb from HttpContext (requires TenantMiddleware).
   */
  static from(ctx: HttpContext): TenantDb {
    const tenantCtx = TenantContext.from(ctx)
    return new TenantDb(tenantCtx.connectionName)
  }

  /**
   * Create TenantDb from an explicit connection name.
   */
  static fromConnection(connectionName: string): TenantDb {
    return new TenantDb(connectionName)
  }

  /**
   * Get a query builder for a table on the tenant DB.
   */
  query(tableName: string) {
    return db.connection(this.connectionName).from(tableName)
  }

  /**
   * Insert into a table on the tenant DB.
   */
  table(tableName: string) {
    return db.connection(this.connectionName).table(tableName)
  }

  /**
   * Execute a raw SQL query on the tenant DB.
   */
  raw(sql: string, bindings?: any[]) {
    return db.connection(this.connectionName).rawQuery(sql, bindings)
  }

  /**
   * Get the underlying Knex connection for advanced queries.
   */
  connection() {
    return db.connection(this.connectionName)
  }
}
