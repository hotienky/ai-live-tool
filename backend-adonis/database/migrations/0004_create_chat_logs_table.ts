import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chat_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE').nullable()
      table.integer('session_id').unsigned().references('id').inTable('livestream_sessions').onDelete('SET NULL').nullable()
      table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('SET NULL').nullable()
      table.string('unique_id').nullable()
      table.string('nickname').nullable()
      table.text('comment_text').nullable()
      table.string('ai_label').nullable()
      table.text('ai_summary').nullable()
      table.string('product_intent').nullable()
      table.string('platform').defaultTo('tiktok')
      table.string('profile_link').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
