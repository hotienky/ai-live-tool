import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Shop Keywords
    this.schema.createTable('shop_keywords', (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('keyword').notNullable()
      table.string('color').defaultTo('#ff3b5c')
      table.string('alert_type').defaultTo('highlight')
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    // Auto Reply Templates
    this.schema.createTable('auto_reply_templates', (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('name').notNullable()
      table.text('template').notNullable()
      table.string('trigger_label').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    // Orders — NEW
    this.schema.createTable('orders', (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.integer('session_id').unsigned().references('id').inTable('livestream_sessions').onDelete('SET NULL').nullable()
      table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('SET NULL').nullable()
      table.integer('lead_id').unsigned().references('id').inTable('leads').onDelete('SET NULL').nullable()
      table.string('customer_name').nullable()
      table.string('customer_phone').nullable()
      table.string('customer_address').nullable()
      table.string('status').defaultTo('pending') // pending, confirmed, shipping, delivered, cancelled
      table.decimal('total_amount', 12, 2).defaultTo(0)
      table.json('items').nullable() // [{productId, name, price, qty}]
      table.text('notes').nullable()
      table.string('tracking_number').nullable()
      table.string('payment_method').nullable()
      table.string('payment_status').defaultTo('unpaid') // unpaid, paid, refunded
      table.timestamp('confirmed_at').nullable()
      table.timestamp('shipped_at').nullable()
      table.timestamp('delivered_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    // Scheduled Livestreams — NEW
    this.schema.createTable('scheduled_livestreams', (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('platform').defaultTo('tiktok')
      table.json('product_ids').nullable()
      table.text('script').nullable()
      table.string('status').defaultTo('scheduled') // scheduled, live, completed, cancelled
      table.timestamp('scheduled_at').notNullable()
      table.integer('duration_minutes').defaultTo(60)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('scheduled_livestreams')
    this.schema.dropTable('orders')
    this.schema.dropTable('auto_reply_templates')
    this.schema.dropTable('shop_keywords')
  }
}
