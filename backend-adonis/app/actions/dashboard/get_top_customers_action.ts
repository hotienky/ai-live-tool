import db from '@adonisjs/lucid/services/db'

interface Params {
  userShopIds: string[]
  limit: number
}

export default class GetTopCustomersAction {
  static async handle({ userShopIds, limit }: Params) {
    const customers = await db
      .from('chat_logs')
      .select('nickname')
      .count('* as total_comments')
      .select(db.raw("SUM(CASE WHEN ai_label = '[HOT]' THEN 1 ELSE 0 END) as hot_count"))
      .whereIn('shop_id', userShopIds)
      .groupBy('nickname')
      .orderBy('total_comments', 'desc')
      .limit(limit)

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
