import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipment_history'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('shipment_id').unsigned().references('id').inTable('shipments').onDelete('CASCADE')
      table.string('status').notNullable()
      table.string('location').nullable()
      table.text('description').nullable()
      table.string('source').defaultTo('system') // system, carrier_webhook, manual
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
