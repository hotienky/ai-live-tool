import Lead from '#models/lead'
import ChatLog from '#models/chat_log'

interface Params {
  userShopIds: string[] | null
  shopId?: string
}

export default class GetPipelineStatsAction {
  static async handle({ userShopIds, shopId }: Params) {
    const statuses = ['New', 'Contacting', 'Closed', 'Ignored']
    const pipeline: Record<string, number> = {}

    for (const status of statuses) {
      const query = Lead.query().where('status', status)
      if (userShopIds) {
        query.whereIn('chat_log_id',
          ChatLog.query().select('id').whereIn('shop_id', userShopIds)
        )
      }
      if (shopId) query.whereHas('chatLog', (q) => q.where('shop_id', shopId))
      const count = await query.count('* as total')
      pipeline[status] = Number(count[0].$extras.total)
    }

    return { pipeline }
  }
}
