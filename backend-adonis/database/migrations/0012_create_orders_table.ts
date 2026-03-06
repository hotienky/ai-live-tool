import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('shop_id').nullable().references('id').inTable('shops').onDelete('SET NULL')
      table.uuid('customer_id').nullable().references('id').inTable('customers').onDelete('SET NULL')
      table.string('customer_name').nullable()
      table.string('customer_phone').nullable()
      table.decimal('total_amount', 12, 0).defaultTo(0)
      table.string('payment_status').defaultTo('unpaid') // unpaid, paid, refunded
      table.string('status').defaultTo('pending')        // pending, confirmed, shipping, delivered, cancelled
      table.jsonb('items').nullable()                     // [{name, qty, price}]
      table.text('notes').nullable()
      table.text('shipping_address').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
