import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_brands'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('slug').notNullable()
      table.string('logo_url').nullable()
      table.text('description').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
