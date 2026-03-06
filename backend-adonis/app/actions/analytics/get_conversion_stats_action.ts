import Lead from '#models/lead'
import ChatLog from '#models/chat_log'

interface Params {
  userShopIds: string[]
  days: number
}

export default class GetConversionStatsAction {
  static async handle({ userShopIds, days }: Params) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const statuses = ['New', 'Contacting', 'Closed', 'Ignored']
    const funnel: Array<{ status: string; count: number }> = []

    for (const status of statuses) {
      const result = await Lead.query()
        .where('status', status)
        .where('created_at', '>=', startDate.toISOString())
        .whereIn('chat_log_id',
          ChatLog.query().select('id').whereIn('shop_id', userShopIds)
        )
        .count('* as total')
      funnel.push({ status, count: Number(result[0].$extras.total) })
    }

    const totalLeads = funnel.reduce((sum, f) => sum + f.count, 0)
    const closedCount = funnel.find((f) => f.status === 'Closed')?.count || 0
    const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0

    return { funnel, totalLeads, closedCount, conversionRate }
  }
}
