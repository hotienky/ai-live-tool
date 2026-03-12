import Order from '#models/order'

interface Params {
  userShopIds: string[]
  shopId?: string
  days: number
}

export default class GetOrderStatsAction {
  static async handle({ userShopIds, shopId, days }: Params) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const query = Order.query()
      .where('created_at', '>=', startDate.toISOString())
      
    if (shopId) query.where('shopId', shopId)
    const orders = await query

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid')
    const paidRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length

    const statusBreakdown: Record<string, number> = {}
    for (const o of orders) {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1
    }

    return {
      totalOrders, totalRevenue, paidRevenue,
      pendingOrders, deliveredOrders,
      conversionRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
      statusBreakdown,
    }
  }
}
