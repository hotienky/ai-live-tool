import db from '@adonisjs/lucid/services/db'

interface Params {
  userShopIds: string[]
  shopId?: string
  date?: string
}

export default class GetHourlyAnalyticsAction {
  static async handle({ userShopIds, shopId, date }: Params) {
    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const query = db.from('chat_logs')
      .select(db.raw("EXTRACT(HOUR FROM created_at) as hour"), 'ai_label')
      .count('* as count')
      .whereBetween('created_at', [startOfDay.toISOString(), endOfDay.toISOString()])
      
      .groupByRaw('EXTRACT(HOUR FROM created_at), ai_label')

    if (shopId) query.where('shop_id', shopId)
    const rows = await query

    const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, HOT: 0, WARM: 0, COLD: 0, total: 0 }))
    for (const r of rows) {
      const h = Number(r.hour)
      hourly[h][r.ai_label as 'HOT' | 'WARM' | 'COLD'] = Number(r.count)
      hourly[h].total += Number(r.count)
    }

    return { hourly }
  }
}
