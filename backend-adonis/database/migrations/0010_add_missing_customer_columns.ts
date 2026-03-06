import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Columns that exist in the Lucid model but not in the DB
      table.text('profile_picture_url').nullable()
      table.integer('total_comments').defaultTo(0)
      table.integer('hot_count').defaultTo(0)
      table.string('last_label').nullable()
      table.uuid('shop_id').nullable()
      table.jsonb('tags').nullable()
      table.text('notes').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns(
        'profile_picture_url',
        'total_comments',
        'hot_count',
        'last_label',
        'shop_id',
        'tags',
        'notes'
      )
    })
  }
}
