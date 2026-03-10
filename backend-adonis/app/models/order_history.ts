import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'

/**
 * OrderHistory — S-Cart: ShopOrderHistory
 * Logs status changes with content and actor info
 */
export default class OrderHistory extends BaseModel {
  static table = 'order_history'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orderId: string

  @column()
  declare orderStatusId: number

  @column()
  declare content: string | null

  @column()
  declare customerId: string | null

  @column()
  declare adminId: string | null

  @column.dateTime({ autoCreate: true, columnName: 'add_date' })
  declare addDate: DateTime

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>
}
