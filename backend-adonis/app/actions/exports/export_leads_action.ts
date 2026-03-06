import Lead from '#models/lead'
import ChatLog from '#models/chat_log'

interface Params {
  userShopIds: string[]
  shopId?: string
}

export default class ExportLeadsAction {
  static async handle({ userShopIds, shopId }: Params) {
    const query = Lead.query()
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
      .orderBy('created_at', 'desc')
    if (shopId) query.whereHas('chatLog', (q) => q.where('shop_id', shopId))
    const leads = await query

    const headers = ['id', 'unique_id', 'nickname', 'comment', 'label', 'status', 'notes', 'product_intent', 'created_at']
    let csv = headers.join(',') + '\n'
    for (const l of leads) {
      const s = l.serialize()
      csv += headers.map((h) => `"${String(s[h] || '').replace(/"/g, '""')}"`).join(',') + '\n'
    }

    return { leads, csv }
  }
}
