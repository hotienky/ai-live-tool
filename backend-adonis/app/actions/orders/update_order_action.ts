import Order from '#models/order'

interface Params {
  userShopIds: string[]
  orderId: string
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
  static async handle({ userShopIds, orderId, data }: Params) {
    const order = await Order.query()
      .where('id', orderId)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!order) return null

    // Status transition timestamps
    const mergeData: any = { ...data }
    if (data.status === 'confirmed' && !order.confirmedAt) mergeData.confirmedAt = new Date()
    if (data.status === 'shipping' && !order.shippedAt) mergeData.shippedAt = new Date()
    if (data.status === 'delivered' && !order.deliveredAt) mergeData.deliveredAt = new Date()

    order.merge(mergeData)
    await order.save()
    return order
  }
}
