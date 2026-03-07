import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shops'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      if (!this.schema.hasColumn(this.tableName, 'shipping_config')) {
        table.jsonb('shipping_config').nullable()
        // Format: { ghn: { token, shopId }, ghtk: { token }, viettelPost: { token } }
      }
      if (!this.schema.hasColumn(this.tableName, 'default_carrier')) {
        table.string('default_carrier').defaultTo('manual')
      }
      if (!this.schema.hasColumn(this.tableName, 'sender_name')) {
        table.string('sender_name').nullable()
      }
      if (!this.schema.hasColumn(this.tableName, 'sender_phone')) {
        table.string('sender_phone').nullable()
      }
      if (!this.schema.hasColumn(this.tableName, 'sender_address')) {
        table.string('sender_address').nullable()
      }
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
