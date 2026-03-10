import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ShopCustomer from '#models/shop_customer'

/**
 * CustomerAddress — S-Cart: ShopCustomerAddress
 * Shipping address book for e-commerce customers
 */
export default class CustomerAddress extends BaseModel {
  static table = 'customer_addresses'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare customerId: string

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare phone: string | null

  @column()
  declare address1: string | null

  @column()
  declare address2: string | null

  @column()
  declare country: string

  @column()
  declare province: string | null

  @column()
  declare city: string | null

  @column()
  declare district: string | null

  @column()
  declare postcode: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ShopCustomer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof ShopCustomer>

  /** Full address string */
  get fullAddress() {
    return [this.address1, this.address2, this.district, this.city, this.province, this.country]
      .filter(Boolean).join(', ')
  }
}
