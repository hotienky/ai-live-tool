/**
 * Get order statistics for dashboard — S-CART aligned
 * Includes status breakdown, pending orders, revenue stats
 */
import Order from '#models/order'

interface Params {
  userShopIds: string[] | null
  shopId?: string
  days?: number
}

export default class GetOrderStatsAction {
  static async handle({ userShopIds, shopId, days = 30 }: Params) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const baseQuery = () => {
      const q = Order.query()
        .where('created_at', '>=', startDate.toISOString())
      if (userShopIds) q.whereIn('shop_id', userShopIds)
      if (shopId) q.where('shop_id', shopId)
      return q
    }

    // Status breakdown
    const statusCounts = await baseQuery()
      .select('status')
      .count('* as count')
      .groupBy('status')

    const statuses: Record<string, number> = {}
    let totalOrders = 0
    for (const row of statusCounts) {
      const count = Number((row as any).$extras?.count || 0)
      statuses[row.status] = count
      totalOrders += count
    }

    // Revenue by payment status
    const revenueStats = await baseQuery()
      .select('payment_status')
      .sum('total_amount as total')
      .count('* as count')
      .groupBy('payment_status')

    const revenue: Record<string, { total: number; count: number }> = {}
    let totalRevenue = 0
    for (const row of revenueStats) {
      const total = Number((row as any).$extras?.total || 0)
      const count = Number((row as any).$extras?.count || 0)
      revenue[(row as any).paymentStatus || 'unknown'] = { total, count }
      if ((row as any).paymentStatus === 'paid') totalRevenue = total
    }

    // Recent orders (last 5)
    const recentOrders = await baseQuery()
      .orderBy('created_at', 'desc')
      .limit(5)
      .select('id', 'customerName', 'totalAmount', 'status', 'paymentStatus', 'createdAt')

    return {
      totalOrders,
      totalRevenue,
      statusBreakdown: statuses,
      revenueByPayment: revenue,
      pendingCount: statuses['pending'] || 0,
      processingCount: statuses['processing'] || 0,
      shippedCount: statuses['shipped'] || 0,
      completedCount: statuses['completed'] || 0,
      cancelledCount: statuses['cancelled'] || 0,
      recentOrders,
    }
  }
}
