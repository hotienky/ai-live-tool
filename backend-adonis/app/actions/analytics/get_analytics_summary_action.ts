import db from '@adonisjs/lucid/services/db'

interface Params {
  userShopIds: string[]
  shopId?: string
  days: number
}

export default class GetAnalyticsSummaryAction {
  static async handle({ userShopIds, shopId, days }: Params) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const query = db.from('chat_logs')
      .select('ai_label')
      .count('* as count')
      .where('created_at', '>=', startDate.toISOString())
      .whereIn('shop_id', userShopIds)
      .groupBy('ai_label')
    if (shopId) query.where('shop_id', shopId)
    const stats = await query

    const counts: Record<string, number> = { HOT: 0, WARM: 0, COLD: 0 }
    for (const s of stats) counts[s.ai_label] = Number(s.count)

    const totalComments = counts.HOT + counts.WARM + counts.COLD
    const hotRate = totalComments > 0 ? Math.round((counts.HOT / totalComments) * 100) : 0
    const avgCommentsPerDay = Math.round(totalComments / days)

    return {
      totalComments,
      totalHot: counts.HOT,
      totalWarm: counts.WARM,
      totalCold: counts.COLD,
      hotRate,
      avgCommentsPerDay,
    }
  }
}
