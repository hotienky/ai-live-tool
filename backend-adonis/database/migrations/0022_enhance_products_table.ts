import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Category & Brand references
      table.integer('category_id').unsigned().nullable().references('id').inTable('product_categories').onDelete('SET NULL')
      table.integer('brand_id').unsigned().nullable().references('id').inTable('product_brands').onDelete('SET NULL')

      // Enhanced product fields
      table.string('slug').nullable()
      table.text('description').nullable()
      table.jsonb('images').nullable()          // Array of image URLs
      table.jsonb('variants').nullable()         // [{name: "Size", options: ["S","M","L"]}]
      table.decimal('weight', 8, 2).nullable()   // For shipping calculation
      table.boolean('is_featured').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('category_id')
      table.dropColumn('brand_id')
      table.dropColumn('slug')
      table.dropColumn('description')
      table.dropColumn('images')
      table.dropColumn('variants')
      table.dropColumn('weight')
      table.dropColumn('is_featured')
    })
  }
}
