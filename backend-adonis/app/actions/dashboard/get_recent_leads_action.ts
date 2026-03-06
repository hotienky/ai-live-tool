import Lead from '#models/lead'
import ChatLog from '#models/chat_log'

interface Params {
  userShopIds: string[]
  shopId?: string
  limit: number
}

export default class GetRecentLeadsAction {
  static async handle({ userShopIds, shopId, limit }: Params) {
    const query = Lead.query()
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
      .orderBy('created_at', 'desc')
      .limit(limit)
    if (shopId) query.whereHas('chatLog', (q) => q.where('shop_id', shopId))
    return await query
  }
}
