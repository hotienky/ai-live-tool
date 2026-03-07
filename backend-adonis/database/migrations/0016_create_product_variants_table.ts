import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE')
      table.string('name').notNullable() // e.g. 'Đỏ / Size M'
      table.string('sku').nullable()
      table.decimal('price', 12, 2).nullable() // null = use parent product price
      table.decimal('cost_price', 12, 2).nullable()
      table.integer('stock').defaultTo(0)
      table.jsonb('attributes').nullable() // { "color": "Đỏ", "size": "M" }
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
