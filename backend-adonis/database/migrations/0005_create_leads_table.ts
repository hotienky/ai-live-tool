import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('chat_log_id').unsigned().references('id').inTable('chat_logs').onDelete('SET NULL').nullable()
      table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('SET NULL').nullable()
      table.string('unique_id').nullable()
      table.string('nickname').nullable()
      table.text('comment').nullable()
      table.string('label').nullable()
      table.string('status').defaultTo('New')
      table.text('notes').nullable()
      table.string('product_intent').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
