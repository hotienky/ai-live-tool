import Order from '#models/order'
import { bulkDeductForOrder, bulkRestoreForOrder } from '#services/inventory_service'

interface Params {
  userShopIds: string[]
  orderId: string
  userId?: number
  data: {
    status?: string
    notes?: string
    trackingNumber?: string
    paymentMethod?: string
    paymentStatus?: string
    customerName?: string
    customerPhone?: string
    customerAddress?: string
  }
}

export default class UpdateOrderAction {
  static async handle({ userShopIds, orderId, data, userId }: Params) {
    const order = await Order.query()
      .where('id', orderId)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!order) return null

    const oldStatus = order.status

    // Status transition timestamps
    const mergeData: any = { ...data }
    if (data.status === 'confirmed' && !order.confirmedAt) mergeData.confirmedAt = new Date()
    if (data.status === 'shipping' && !order.shippedAt) mergeData.shippedAt = new Date()
    if (data.status === 'delivered' && !order.deliveredAt) mergeData.deliveredAt = new Date()

    // ── Inventory integration ──
    const items: Array<{ productId?: number; qty: number; name?: string }> =
      typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])

    // Deduct stock when confirming order
    if (data.status === 'confirmed' && oldStatus !== 'confirmed') {
      const results = await bulkDeductForOrder(items, order.id, userId)
      const failed = results.filter((r: any) => !r.success)
      if (failed.length > 0) {
        const msgs = failed.map((f: any) => f.error).join('; ')
        throw new Error(`Không thể xác nhận đơn: ${msgs}`)
      }
    }

    // Restore stock when cancelling a confirmed order
    if (data.status === 'cancelled' && oldStatus === 'confirmed') {
      await bulkRestoreForOrder(items, order.id, userId)
    }

    order.merge(mergeData)
    await order.save()
    return order
  }
}

