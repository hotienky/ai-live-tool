import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      if (!this.schema.hasColumn(this.tableName, 'cost_price')) {
        table.decimal('cost_price', 12, 2).nullable()
      }
      if (!this.schema.hasColumn(this.tableName, 'category')) {
        table.string('category').nullable()
      }
      if (!this.schema.hasColumn(this.tableName, 'unit')) {
        table.string('unit').defaultTo('cái')
      }
      if (!this.schema.hasColumn(this.tableName, 'barcode')) {
        table.string('barcode').nullable().unique()
      }
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
