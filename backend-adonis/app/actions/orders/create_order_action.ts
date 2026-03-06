import Order from '#models/order'

interface Params {
  userShopIds: string[]
  data: {
    shopId?: string
    sessionId?: string
    customerId?: string
    leadId?: string
    customerName?: string
    customerPhone?: string
    customerAddress?: string
    status?: string
    totalAmount?: number
    items?: any
    notes?: string
    paymentMethod?: string
    paymentStatus?: string
  }
}

export default class CreateOrderAction {
  static async handle({ userShopIds, data }: Params) {
    if (data.shopId && !userShopIds.includes(String(data.shopId))) {
      return { error: 'Shop not found', order: null }
    }
    const order = await Order.create(data as any)
    return { error: null, order }
  }
}
