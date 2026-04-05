/**
 * Section Schema Registry
 *
 * Mỗi section type có 1 schema định nghĩa toàn bộ những gì có thể config.
 * BlockConfigPanel đọc schema này để render form tự động.
 *
 * Cách dùng trong admin:
 *   import { getSectionSchema } from '@/views/sections/schemas'
 *   const schema = getSectionSchema('featured_products')
 *
 * Hoặc từ global bridge:
 *   window.__SECTION_SCHEMAS__['featured_products']
 */

import featuredProducts from './featured_products.schema.js'
import newArrivals from './new_arrivals.schema.js'
import banner from './banner.schema.js'
import categories from './categories.schema.js'
import pharmacyHero from './pharmacy_hero.schema.js'

export const SECTION_SCHEMAS = {
  featured_products: featuredProducts,
  new_arrivals: newArrivals,
  banner: banner,
  categories: categories,
  pharmacy_hero: pharmacyHero,
}

export function getSectionSchema(type) {
  return SECTION_SCHEMAS[type] || null
}

// Expose trên window để admin plugin có thể truy cập mà không cần import trực tiếp
if (typeof window !== 'undefined') {
  window.__SECTION_SCHEMAS__ = SECTION_SCHEMAS
}
