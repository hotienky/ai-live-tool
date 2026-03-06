import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('SET NULL').nullable()
      table.string('unique_id').notNullable().index()
      table.string('nickname').nullable()
      table.string('profile_picture_url').nullable()
      table.string('profile_link').nullable()
      table.string('platform').defaultTo('tiktok')
      table.integer('total_comments').defaultTo(0)
      table.integer('hot_count').defaultTo(0)
      table.string('last_label').nullable()
      table.json('tags').nullable()
      table.text('notes').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
