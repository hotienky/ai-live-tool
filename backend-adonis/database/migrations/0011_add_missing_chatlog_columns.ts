import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chat_logs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('ai_summary').nullable()
      table.string('product_intent').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('ai_summary', 'product_intent')
    })
  }
}
