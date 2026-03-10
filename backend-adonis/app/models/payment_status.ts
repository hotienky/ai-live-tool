import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * PaymentStatus — S-Cart: ShopPaymentStatus
 * Configurable payment status lookup table
 */
export default class PaymentStatus extends BaseModel {
  static table = 'payment_statuses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  static async getAll() {
    const rows = await this.all()
    return rows.reduce((map, r) => ({ ...map, [r.id]: r.name }), {} as Record<number, string>)
  }
}
