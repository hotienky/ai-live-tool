import ChatLog from '#models/chat_log'
import Lead from '#models/lead'
import db from '@adonisjs/lucid/services/db'

interface Params {
  userShopIds: string[] | null
  shopId?: string
  days: number
}

export default class GetDashboardAnalyticsAction {
  static async handle({ userShopIds, shopId, days }: Params) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Daily comment counts
    const dailyQuery = db
      .from('chat_logs')
      .select(db.raw("DATE(created_at) as date"), 'ai_label')
      .count('* as count')
      .where('created_at', '>=', startDate.toISOString())
      .groupByRaw('DATE(created_at), ai_label')
      .orderByRaw('DATE(created_at) ASC')
    if (userShopIds) dailyQuery.whereIn('shop_id', userShopIds)
    if (shopId) dailyQuery.where('shop_id', shopId)
    const dailyRows = await dailyQuery

    const dateMap: Record<string, any> = {}
    for (const r of dailyRows) {
      const d = String(r.date)
      if (!dateMap[d]) dateMap[d] = { date: d, HOT: 0, WARM: 0, COLD: 0, total: 0 }
      dateMap[d][r.ai_label] = Number(r.count)
      dateMap[d].total += Number(r.count)
    }

    // Conversion stats
    const statuses = ['New', 'Contacting', 'Closed', 'Ignored']
    const funnel: Array<{ status: string; count: number }> = []
    for (const status of statuses) {
      const query = Lead.query()
        .where('status', status)
        .where('created_at', '>=', startDate.toISOString())
      if (userShopIds) {
        query.whereIn('chat_log_id',
          ChatLog.query().select('id').whereIn('shop_id', userShopIds)
        )
      }
      const result = await query.count('* as total')
      funnel.push({ status, count: Number(result[0].$extras.total) })
    }
    const totalLeads = funnel.reduce((sum, f) => sum + f.count, 0)
    const closedCount = funnel.find((f) => f.status === 'Closed')?.count || 0
    const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0

    return {
      daily: Object.values(dateMap),
      conversion: { funnel, totalLeads, closedCount, rate: conversionRate },
    }
  }
}
