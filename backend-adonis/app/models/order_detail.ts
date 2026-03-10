import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'

/**
 * OrderDetail — S-Cart: ShopOrderDetail
 * Stores individual product line items in an order
 */
export default class OrderDetail extends BaseModel {
  static table = 'order_details'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare productId: string | null

  @column()
  declare name: string

  @column()
  declare sku: string | null

  @column()
  declare qty: number

  @column()
  declare price: number

  @column()
  declare tax: number

  @column()
  declare totalPrice: number

  @column()
  declare attribute: Record<string, any> | null

  @column()
  declare storeId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>
}
