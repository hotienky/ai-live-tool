import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shops'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('moderation_blacklist').nullable()
      table.boolean('moderation_hide_spam').defaultTo(true)
      table.boolean('moderation_rate_limit').defaultTo(false)
      table.integer('moderation_max_per_minute').defaultTo(5)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns(
        'moderation_blacklist',
        'moderation_hide_spam',
        'moderation_rate_limit',
        'moderation_max_per_minute'
      )
    })
  }
}
