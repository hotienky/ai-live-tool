import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Shop from '#models/shop'
import Customer from '#models/customer'

export default class Order extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare shopId: number
  @column() declare sessionId: number | null
  @column() declare customerId: number | null
  @column() declare leadId: number | null
  @column() declare customerName: string | null
  @column() declare customerPhone: string | null
  @column() declare customerAddress: string | null
  @column() declare status: string
  @column() declare totalAmount: number
  @column() declare items: any
  @column() declare notes: string | null
  @column() declare trackingNumber: string | null
  @column() declare paymentMethod: string | null
  @column() declare paymentStatus: string
  @column.dateTime() declare confirmedAt: DateTime | null
  @column.dateTime() declare shippedAt: DateTime | null
  @column.dateTime() declare deliveredAt: DateTime | null
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @belongsTo(() => Shop) declare shop: BelongsTo<typeof Shop>
  @belongsTo(() => Customer) declare customer: BelongsTo<typeof Customer>
}
