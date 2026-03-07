import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'webhooks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('url').notNullable()
      table.json('events').defaultTo('["hot_lead"]')
      table.boolean('is_active').defaultTo(true)
      table.string('secret').nullable()
      table.integer('last_status').nullable()
      table.timestamp('last_triggered_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
