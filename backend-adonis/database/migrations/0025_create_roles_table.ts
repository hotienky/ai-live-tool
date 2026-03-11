import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Roles table
    this.schema.createTable('roles', (table) => {
      table.increments('id')
      table.string('name', 50).notNullable().unique()
      table.string('display_name', 100).nullable()
      table.text('description').nullable()
      table.json('permissions').nullable() // JSON array of permission slugs
      table.boolean('is_system').defaultTo(false) // Cannot delete system roles
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    // Add role_id to users table (FK to roles)
    this.schema.alterTable('users', (table) => {
      table.integer('role_id').unsigned().nullable().references('id').inTable('roles').onDelete('SET NULL')
    })

    // Seed default roles
    this.defer(async (db) => {
      await db.table('roles').multiInsert([
        {
          name: 'admin',
          display_name: 'Quản trị viên',
          description: 'Toàn quyền quản lý hệ thống',
          permissions: JSON.stringify([
            'dashboard.view', 'products.manage', 'orders.manage', 'customers.manage',
            'leads.manage', 'sessions.manage', 'settings.manage', 'users.manage',
            'roles.manage', 'analytics.view', 'cms.manage', 'banners.manage',
            'promotions.manage', 'shipping.manage', 'webhooks.manage', 'activity_logs.view',
          ]),
          is_system: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'manager',
          display_name: 'Quản lý',
          description: 'Quản lý sản phẩm, đơn hàng, khách hàng',
          permissions: JSON.stringify([
            'dashboard.view', 'products.manage', 'orders.manage', 'customers.manage',
            'leads.manage', 'sessions.manage', 'analytics.view', 'promotions.manage',
          ]),
          is_system: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'staff',
          display_name: 'Nhân viên',
          description: 'Xem dashboard, quản lý leads, trả lời comments',
          permissions: JSON.stringify([
            'dashboard.view', 'leads.manage', 'sessions.manage', 'customers.manage',
          ]),
          is_system: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      // Update existing admin users to admin role
      const adminRole = await db.from('roles').where('name', 'admin').first()
      if (adminRole) {
        await db.from('users').where('role', 'admin').update({ role_id: adminRole.id })
      }
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('role_id')
    })
    this.schema.dropTable('roles')
  }
}
