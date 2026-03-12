import db from '@adonisjs/lucid/services/db'

interface Params {
  userShopIds: string[] | null
  limit: number
}

export default class GetTopCustomersAction {
  static async handle({ userShopIds, limit }: Params) {
    const query = db
      .from('chat_logs')
      .select('nickname')
      .count('* as total_comments')
      .select(db.raw("SUM(CASE WHEN ai_label = '[HOT]' THEN 1 ELSE 0 END) as hot_count"))
      .groupBy('nickname')
      .orderBy('total_comments', 'desc')
      .limit(limit)
    if (userShopIds) query.whereIn('shop_id', userShopIds)

    const customers = await query
    return customers.map((c: any) => ({
      nickname: c.nickname,
      totalComments: Number(c.total_comments),
      hotCount: Number(c.hot_count || 0),
      hotRate: Number(c.total_comments) > 0
        ? Math.round((Number(c.hot_count || 0) / Number(c.total_comments)) * 100)
        : 0,
    }))
  }
}
