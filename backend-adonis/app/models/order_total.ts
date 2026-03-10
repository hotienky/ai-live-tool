import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'

/**
 * OrderTotal — S-Cart: ShopOrderTotal
 * Breakdown of order totals: subtotal, tax, shipping, discount, total
 */
export default class OrderTotal extends BaseModel {
  static table = 'order_totals'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare code: string

  @column()
  declare title: string

  @column()
  declare value: number

  @column()
  declare sort: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>
}
