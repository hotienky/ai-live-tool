import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'

/**
 * ProductPromotion — S-Cart: ShopProductPromotion
 * Product-level price override with date range
 */
export default class ProductPromotion extends BaseModel {
  static table = 'product_promotions'
  static primaryKey = 'productId'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare productId: string

  @column()
  declare pricePromotion: number

  @column.dateTime()
  declare dateStart: DateTime | null

  @column.dateTime()
  declare dateEnd: DateTime | null

  @column()
  declare status: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Product, { foreignKey: 'productId' })
  declare product: BelongsTo<typeof Product>

  /** Check if promotion is currently active */
  get isActive() {
    if (this.status !== 1) return false
    const now = DateTime.now()
    if (this.dateStart && now < this.dateStart) return false
    if (this.dateEnd && now > this.dateEnd) return false
    return true
  }
}
