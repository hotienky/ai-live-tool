import db from '@adonisjs/lucid/services/db'

interface Params {
  userShopIds: string[]
  shopId?: string
  days: number
}

export default class GetDailyAnalyticsAction {
  static async handle({ userShopIds, shopId, days }: Params) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const query = db.from('chat_logs')
      .select(db.raw("DATE(created_at) as date"), 'ai_label')
      .count('* as count')
      .where('created_at', '>=', startDate.toISOString())
      
      .groupByRaw('DATE(created_at), ai_label')
      .orderByRaw('DATE(created_at) ASC')

    if (shopId) query.where('shop_id', shopId)
    const rows = await query

    const dateMap: Record<string, any> = {}
    for (const r of rows) {
      const d = String(r.date)
      if (!dateMap[d]) dateMap[d] = { date: d, HOT: 0, WARM: 0, COLD: 0, total: 0 }
      dateMap[d][r.ai_label] = Number(r.count)
      dateMap[d].total += Number(r.count)
    }

    return { daily: Object.values(dateMap) }
  }
}
