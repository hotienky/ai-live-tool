import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * OrderStatus — S-Cart: ShopOrderStatus
 * Configurable order status lookup table
 */
export default class OrderStatus extends BaseModel {
  static table = 'order_statuses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  /**
   * Get all statuses as { id: name } map
   */
  static async getAll() {
    const rows = await this.all()
    return rows.reduce((map, r) => ({ ...map, [r.id]: r.name }), {} as Record<number, string>)
  }
}
