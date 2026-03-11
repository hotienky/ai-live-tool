/**
 * Revenue trends analytics — S-CART aligned
 * Daily revenue + order count for charting
 */
import db from '@adonisjs/lucid/services/db'

interface Params {
  userShopIds: string[]
  shopId?: string
  days: number
}

export default class GetRevenueTrendsAction {
  static async handle({ userShopIds, shopId, days }: Params) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const query = db.from('orders')
      .select(db.raw("DATE(created_at) as date"))
      .sum('total_amount as revenue')
      .count('* as orders')
      .where('created_at', '>=', startDate.toISOString())
      .whereIn('shop_id', userShopIds)
      .groupByRaw('DATE(created_at)')
      .orderBy('date', 'asc')

    if (shopId) query.where('shop_id', shopId)

    const rows = await query

    // Fill gaps (days with no orders)
    const trends: Array<{ date: string; revenue: number; orders: number }> = []
    const dateMap = new Map<string, { revenue: number; orders: number }>()

    for (const row of rows) {
      const dateStr = typeof row.date === 'string' ? row.date.substring(0, 10) : new Date(row.date).toISOString().substring(0, 10)
      dateMap.set(dateStr, {
        revenue: Number(row.revenue || 0),
        orders: Number(row.orders || 0),
      })
    }

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().substring(0, 10)
      trends.push({
        date: dateStr,
        revenue: dateMap.get(dateStr)?.revenue || 0,
        orders: dateMap.get(dateStr)?.orders || 0,
      })
    }

    // Summary
    const totalRevenue = trends.reduce((s, t) => s + t.revenue, 0)
    const totalOrders = trends.reduce((s, t) => s + t.orders, 0)
    const avgDailyRevenue = days > 0 ? Math.round(totalRevenue / days) : 0
    const avgDailyOrders = days > 0 ? Math.round(totalOrders / days) : 0

    return {
      trends,
      totalRevenue,
      totalOrders,
      avgDailyRevenue,
      avgDailyOrders,
    }
  }
}
