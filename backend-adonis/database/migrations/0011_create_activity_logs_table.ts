import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'activity_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      table.string('action').notNullable()  // e.g. 'lead.status_changed', 'order.created', 'session.started'
      table.string('entity_type').nullable()  // e.g. 'Lead', 'Order', 'Session'
      table.integer('entity_id').nullable()
      table.json('details').nullable()  // extra data
      table.string('ip').nullable()
      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
