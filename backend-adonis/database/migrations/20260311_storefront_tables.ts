import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // ── Banners ──
    this.schema.createTable('banners', (table) => {
      table.increments('id')
      table.integer('store_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.string('image', 500).nullable()
      table.string('url', 500).nullable()
      table.string('type', 50).defaultTo('main') // main, sidebar, popup
      table.integer('sort').defaultTo(0)
      table.integer('status').defaultTo(1) // 1 = active, 0 = inactive
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    // ── CMS Pages ──
    this.schema.createTable('cms_pages', (table) => {
      table.increments('id')
      table.integer('store_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.string('alias', 255).nullable() // slug
      table.string('image', 500).nullable()
      table.text('content').nullable()
      table.integer('sort').defaultTo(0)
      table.integer('status').defaultTo(1) // 1 = published
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    // Add promotion columns to products if not exist
    this.schema.alterTable('products', (table) => {
      table.decimal('promotion_price', 12, 2).nullable()
      table.timestamp('promotion_start').nullable()
      table.timestamp('promotion_end').nullable()
    })

    // Add logo to shops if not exist
    this.schema.alterTable('shops', (table) => {
      table.string('logo', 500).nullable()
    })
  }

  async down() {
    this.schema.dropTableIfExists('banners')
    this.schema.dropTableIfExists('cms_pages')
    this.schema.alterTable('products', (table) => {
      table.dropColumns('promotion_price', 'promotion_start', 'promotion_end')
    })
    this.schema.alterTable('shops', (table) => {
      table.dropColumn('logo')
    })
  }
}
