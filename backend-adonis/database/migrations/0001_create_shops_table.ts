import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shops'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('shop_name').notNullable()
      table.string('platform').defaultTo('tiktok')
      table.string('tiktok_username').nullable()
      table.string('shopee_id').nullable()
      table.string('facebook_page_id').nullable()
      table.string('youtube_channel_id').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
