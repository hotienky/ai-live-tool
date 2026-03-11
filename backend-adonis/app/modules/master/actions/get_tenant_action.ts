import db from '@adonisjs/lucid/services/db'

/**
 * Action: Get tenant details by ID, optionally with stats from tenant DB.
 */
export default class GetTenantAction {
  async execute(id: number) {
    const tenant = await db.connection('master')
      .from('tenants')
      .where('id', id)
      .first()

    if (!tenant) return null

    // Try to fetch stats from tenant DB
    try {
      const connectionName = `stats_${tenant.slug}_${Date.now()}`
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

    return tenant
  }
}
