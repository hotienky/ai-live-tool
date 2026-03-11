import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Password Resets (S-Cart: password_resets pattern) ──
    this.schema.createTable('password_resets', (table) => {
      table.increments('id')
      table.string('email').notNullable()
      table.integer('store_id').unsigned().nullable()
      table.string('token', 255).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.index(['email', 'store_id'])
    })

    // ── Languages (S-Cart: AdminLanguage pattern) ──
    this.schema.createTable('languages', (table) => {
      table.increments('id')
      table.string('code', 10).notNullable().unique()
      table.string('name', 100).notNullable()
      table.string('icon', 255).nullable()
      table.boolean('is_default').defaultTo(false)
      table.boolean('is_active').defaultTo(true)
      table.integer('sort').defaultTo(0)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // ── Language Translations ──
    this.schema.createTable('language_translations', (table) => {
      table.increments('id')
      table.integer('language_id').unsigned().notNullable().references('id').inTable('languages').onDelete('CASCADE')
      table.string('group', 100).notNullable()
      table.string('key', 255).notNullable()
      table.text('value').nullable()
      table.index(['language_id', 'group'])
      table.unique(['language_id', 'group', 'key'])
    })

    // ── API Keys (S-Cart: AdminApiConnection pattern) ──
    this.schema.createTable('api_keys', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('name', 100).notNullable()
      table.string('key', 255).notNullable().unique()
      table.string('secret', 255).nullable()
      table.jsonb('permissions').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('last_used_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // ── Custom Fields (S-Cart: AdminCustomField pattern) ──
    this.schema.createTable('custom_fields', (table) => {
      table.increments('id')
      table.integer('shop_id').unsigned().nullable().references('id').inTable('shops').onDelete('CASCADE')
      table.string('name', 100).notNullable()
      table.string('code', 100).notNullable()
      table.string('type', 50).notNullable().defaultTo('text') // text, number, select, checkbox, textarea, date, color
      table.jsonb('options').nullable() // For select: [{label, value}], for others: config
      table.boolean('required').defaultTo(false)
      table.string('group', 100).nullable()
      table.integer('sort').defaultTo(0)
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // ── Custom Field Values ──
    this.schema.createTable('custom_field_values', (table) => {
      table.increments('id')
      table.integer('custom_field_id').unsigned().notNullable().references('id').inTable('custom_fields').onDelete('CASCADE')
      table.string('entity_type', 50).notNullable() // 'product', 'category', 'page'
      table.integer('entity_id').unsigned().notNullable()
      table.text('value').nullable()
      table.index(['entity_type', 'entity_id'])
      table.unique(['custom_field_id', 'entity_type', 'entity_id'])
    })

    // ── System Config (key-value store for cache/mail/queue settings) ──
    this.schema.createTable('system_configs', (table) => {
      table.increments('id')
      table.string('group', 50).notNullable() // cache, mail, queue, general
      table.string('key', 100).notNullable()
      table.text('value').nullable()
      table.unique(['group', 'key'])
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTableIfExists('system_configs')
    this.schema.dropTableIfExists('custom_field_values')
    this.schema.dropTableIfExists('custom_fields')
    this.schema.dropTableIfExists('api_keys')
    this.schema.dropTableIfExists('language_translations')
    this.schema.dropTableIfExists('languages')
    this.schema.dropTableIfExists('password_resets')
  }
}
