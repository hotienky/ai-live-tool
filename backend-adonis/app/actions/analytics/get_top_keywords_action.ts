import ChatLog from '#models/chat_log'

interface Params {
  userShopIds: string[]
  shopId?: string
  days: number
  limit: number
}

const STOP_WORDS = new Set([
  'của', 'và', 'là', 'có', 'cho', 'với', 'được', 'các', 'từ', 'trong',
  'này', 'đó', 'những', 'một', 'không', 'cũng', 'như', 'thì', 'mà',
  'khi', 'ở', 'đã', 'sẽ', 'đang', 'bị', 'vì', 'nên', 'hay', 'hoặc',
  'nhưng', 'nếu', 'vậy', 'rồi', 'lại', 'còn', 'em', 'anh', 'chị',
  'mình', 'ơi', 'nhé', 'nha', 'ạ', 'quá', 'rất', 'lắm', 'gì', 'nào',
  'ok', 'ko', 'dc', 'đc', 'the', 'and', 'a', 'an', 'of', 'to', 'in',
])

export default class GetTopKeywordsAction {
  static async handle({ userShopIds, shopId, days, limit }: Params) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const query = ChatLog.query()
      .select('commentText')
      .where('created_at', '>=', startDate.toISOString())
      .whereIn('shop_id', userShopIds)
      .limit(5000)
    if (shopId) query.where('shopId', shopId)
    const comments = await query

    const freq: Record<string, number> = {}
    for (const row of comments) {
      if (!row.commentText) continue
      const words = row.commentText.toLowerCase()
        .replace(/[.,!?;:()[\]{}\"'`~@#$%^&*+=|\\/><]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
      for (const w of words) freq[w] = (freq[w] || 0) + 1
    }

    const keywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }))

    return { keywords }
  }
}
