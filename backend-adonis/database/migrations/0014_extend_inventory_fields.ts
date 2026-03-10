import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('cost_price', 12, 2).nullable()
      table.string('category').nullable()
      table.string('unit').defaultTo('cái')
      table.string('barcode').nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cost_price')
      table.dropColumn('category')
      table.dropColumn('unit')
      table.dropColumn('barcode')
    })
  }
}
