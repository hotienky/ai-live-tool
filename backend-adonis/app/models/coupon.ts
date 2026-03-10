import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Coupon — Mã giảm giá
 * Custom implementation (S-Cart uses plugins for discounts)
 */
export default class Coupon extends BaseModel {
  static table = 'coupons'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column()
  declare type: 'percent' | 'fixed'

  @column()
  declare value: number

  @column()
  declare minOrder: number

  @column()
  declare maxUses: number | null

  @column()
  declare usedCount: number

  @column()
  declare storeId: string

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

  /** Check if coupon is valid */
  get isValid() {
    if (this.status !== 1) return false
    const now = DateTime.now()
    if (this.dateStart && now < this.dateStart) return false
    if (this.dateEnd && now > this.dateEnd) return false
    if (this.maxUses && this.usedCount >= this.maxUses) return false
    return true
  }

  /** Calculate discount for a given order subtotal */
  calculateDiscount(subtotal: number): number {
    if (!this.isValid) return 0
    if (subtotal < this.minOrder) return 0
    if (this.type === 'percent') {
      return Math.round(subtotal * this.value / 100)
    }
    return Math.min(this.value, subtotal)
  }
}
