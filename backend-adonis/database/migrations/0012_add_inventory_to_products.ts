import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('stock').defaultTo(0)
      table.string('sku').nullable()
      table.integer('low_stock_threshold').defaultTo(5)
      table.json('variants').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stock')
      table.dropColumn('sku')
      table.dropColumn('low_stock_threshold')
      table.dropColumn('variants')
    })
  }
}
