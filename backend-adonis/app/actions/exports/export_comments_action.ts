import ChatLog from '#models/chat_log'

interface Params {
  userShopIds: string[]
  shopId?: string
  sessionId?: string
}

export default class ExportCommentsAction {
  static async handle({ userShopIds, shopId, sessionId }: Params) {
    const query = ChatLog.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('created_at', 'desc')
      .limit(10000)
    if (shopId) query.where('shopId', shopId as string)
    if (sessionId) query.where('sessionId', sessionId as string)
    const comments = await query

    const headers = ['id', 'uniqueId', 'nickname', 'commentText', 'aiLabel', 'aiSummary', 'productIntent', 'platform', 'createdAt']
    let csv = headers.join(',') + '\n'
    for (const c of comments) {
      const s = c.serialize()
      csv += headers.map((h) => `"${String(s[h] || '').replace(/"/g, '""')}"`).join(',') + '\n'
    }

    return { comments, csv }
  }
}
