import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Drop old wrong-design tables
    this.schema.dropTableIfExists('cart_items')
    this.schema.dropTableIfExists('carts')
    this.schema.dropTableIfExists('order_history')
    this.schema.dropTableIfExists('order_items')

    // ── Order Statuses (S-Cart: ShopOrderStatus) ──
    this.schema.createTable('order_statuses', (table) => {
      table.increments('id')
      table.string('name', 100).notNullable()
    })

    // ── Payment Statuses (S-Cart: ShopPaymentStatus) ──
    this.schema.createTable('payment_statuses', (table) => {
      table.increments('id')
      table.string('name', 100).notNullable()
    })

    // ── Order Details (S-Cart: ShopOrderDetail) ──
    this.schema.createTable('order_details', (table) => {
      table.increments('id')
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.integer('product_id').unsigned().nullable().references('id').inTable('products').onDelete('SET NULL')
      table.string('name', 255).notNullable()
      table.string('sku', 100).nullable()
      table.integer('qty').notNullable().defaultTo(1)
      table.decimal('price', 15, 2).notNullable().defaultTo(0)
      table.decimal('tax', 15, 2).notNullable().defaultTo(0)
      table.decimal('total_price', 15, 2).notNullable().defaultTo(0)
      table.jsonb('attribute').nullable()
      table.integer('store_id').unsigned().nullable().references('id').inTable('shops').onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })

    // ── Order History (S-Cart: ShopOrderHistory) ──
    this.schema.createTable('order_history', (table) => {
      table.increments('id')
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.integer('order_status_id').notNullable().references('id').inTable('order_statuses')
      table.text('content').nullable()
      table.integer('customer_id').unsigned().nullable()
      table.integer('admin_id').unsigned().nullable()
      table.timestamp('add_date', { useTz: true }).defaultTo(this.now())
    })

    // ── Order Totals (S-Cart: ShopOrderTotal) ──
    this.schema.createTable('order_totals', (table) => {
      table.increments('id')
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.string('code', 50).notNullable() // subtotal, shipping, discount, tax, total
      table.string('title', 255).notNullable()
      table.decimal('value', 15, 2).notNullable().defaultTo(0)
      table.integer('sort').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })

    // ── Shopping Cart (S-Cart: ShopCart) ──
    this.schema.createTable('shopping_carts', (table) => {
      table.increments('id')
      table.string('identifier', 255).notNullable() // userId or sessionId
      table.string('instance', 50).notNullable().defaultTo('cart') // cart, wishlist, compare
      table.text('content').nullable() // JSON serialized cart content
      table.integer('store_id').unsigned().nullable().references('id').inTable('shops').onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.index(['identifier', 'instance'])
    })

    // ── Enhance orders table ──
    this.schema.alterTable('orders', (table) => {
      table.string('currency', 10).defaultTo('VND')
      table.decimal('exchange_rate', 15, 4).defaultTo(1)
      table.string('domain', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable('orders', (table) => {
      table.dropColumn('currency')
      table.dropColumn('exchange_rate')
      table.dropColumn('domain')
    })
    this.schema.dropTableIfExists('shopping_carts')
    this.schema.dropTableIfExists('order_totals')
    this.schema.dropTableIfExists('order_history')
    this.schema.dropTableIfExists('order_details')
    this.schema.dropTableIfExists('payment_statuses')
    this.schema.dropTableIfExists('order_statuses')
  }
}
