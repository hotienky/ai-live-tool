import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shops'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('shipping_config').nullable()
      table.string('default_carrier').defaultTo('manual')
      table.string('sender_name').nullable()
      table.string('sender_phone').nullable()
      table.string('sender_address').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('shipping_config')
      table.dropColumn('default_carrier')
      table.dropColumn('sender_name')
      table.dropColumn('sender_phone')
      table.dropColumn('sender_address')
    })
  }
}
