import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_history'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.enum('action', ['add', 'deduct', 'adjust', 'order_confirmed', 'order_cancelled']).notNullable()
      table.integer('quantity_change').notNullable() // signed: +10 or -3
      table.integer('stock_before').notNullable()
      table.integer('stock_after').notNullable()
      table.string('reason').nullable() // e.g. 'Nhập hàng', 'Đơn #123 xác nhận'
      table.enum('reference_type', ['order', 'manual', 'import']).nullable()
      table.integer('reference_id').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
