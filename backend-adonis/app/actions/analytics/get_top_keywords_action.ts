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
      
      .limit(5000)
    if (shopId) query.where('shopId', shopId)
    const comments = await query

    const freq: Record<string, number> = {}
    for (const row of comments) {
      if (!row.commentText) continue
      const words = row.commentText.toLowerCase()
        .replace(/[.,!?;:()[\]{}\"'`~@#$%^&*+=|\\/><]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))

      // Generate bigrams (2-word phrases)
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`
        freq[bigram] = (freq[bigram] || 0) + 1
      }
      // Also count trigrams for longer phrases
      for (let i = 0; i < words.length - 2; i++) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
        freq[trigram] = (freq[trigram] || 0) + 1
      }
    }

    // Filter out phrases that appear only once (noise)
    const keywords = Object.entries(freq)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }))

    return { keywords }
  }
}
