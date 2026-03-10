import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import CustomerAddress from '#models/customer_address'

/**
 * ShopCustomer — S-Cart: ShopCustomer
 * E-commerce customer with auth (separate from live-commerce Customer)
 */
export default class ShopCustomer extends BaseModel {
  static table = 'shop_customers'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare addressId: string | null

  @column()
  declare storeId: string

  @column()
  declare status: number

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => CustomerAddress, { foreignKey: 'customerId' })
  declare addresses: HasMany<typeof CustomerAddress>

  /** Full name (S-Cart: getNameAttribute) */
  get name() {
    return `${this.firstName} ${this.lastName}`.trim()
  }
}
