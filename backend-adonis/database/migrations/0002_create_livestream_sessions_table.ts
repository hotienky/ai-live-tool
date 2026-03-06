import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'livestream_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('platform').defaultTo('tiktok')
      table.string('room_id').nullable()
      table.string('status').defaultTo('live')
      table.integer('viewer_count').defaultTo(0)
      table.integer('peak_viewers').defaultTo(0)
      table.integer('comment_count').defaultTo(0)
      table.integer('hot_lead_count').defaultTo(0)
      table.timestamp('started_at').nullable()
      table.timestamp('ended_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
