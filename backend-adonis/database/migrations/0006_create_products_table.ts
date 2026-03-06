import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('name').notNullable()
      table.decimal('price', 12, 2).defaultTo(0)
      table.string('image_url').nullable()
      table.json('keywords').nullable()
      table.boolean('is_active').defaultTo(true)
      table.string('sku').nullable()
      table.integer('stock').defaultTo(0)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
