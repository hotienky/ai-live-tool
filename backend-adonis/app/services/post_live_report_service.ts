/**
 * Post-Live Report Service — Auto generate analytics report when session ends
 */
import ChatLog from '#models/chat_log'
import Customer from '#models/customer'
import Lead from '#models/lead'

interface ReportData {
  sessionId: number
  shopId: number
  shopName: string
  duration: string
  totalComments: number
  uniqueViewers: number
  peakViewers: number
  hotLeads: number
  warmLeads: number
  coldComments: number
  conversionRate: number
  topKeywords: { word: string; count: number }[]
  topCommenters: { nickname: string; count: number; label: string }[]
  commentsByHour: { hour: number; count: number }[]
  platform: string
  startTime: string
  endTime: string
}

export async function generatePostLiveReport(
  sessionId: number,
  shopId: number,
  shopName: string,
  platform: string,
  startTime: string,
  stats: { hot: number; warm: number; cold: number; total: number },
  peakViewers: number
): Promise<ReportData> {
  const endTime = new Date().toISOString()
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  const durationMs = endDate.getTime() - startDate.getTime()
  const hours = Math.floor(durationMs / 3600000)
  const minutes = Math.floor((durationMs % 3600000) / 60000)
  const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  // Fetch session comments
  const comments = await ChatLog.query()
    .where('sessionId', sessionId)
    .orderBy('createdAt', 'asc')

  // Top keywords (bigrams)
  const STOP_WORDS = new Set([
    'của', 'và', 'là', 'có', 'cho', 'với', 'được', 'các', 'từ', 'trong',
    'này', 'đó', 'những', 'một', 'không', 'cũng', 'như', 'thì', 'mà',
    'khi', 'ở', 'đã', 'sẽ', 'đang', 'bị', 'vì', 'nên', 'hay', 'hoặc',
    'nhưng', 'nếu', 'vậy', 'rồi', 'lại', 'còn', 'em', 'anh', 'chị',
    'ơi', 'nhé', 'nha', 'ạ', 'quá', 'rất', 'lắm', 'gì', 'nào',
    'ok', 'ko', 'dc', 'đc',
  ])

  const freq: Record<string, number> = {}
  const commenterFreq: Record<string, { count: number; label: string }> = {}
  const hourlyCount: Record<number, number> = {}

  for (const c of comments) {
    // Commenters
    const nick = c.nickname || 'Anonymous'
    if (!commenterFreq[nick]) commenterFreq[nick] = { count: 0, label: c.label || '[COLD]' }
    commenterFreq[nick].count++
    if (c.label === '[HOT]') commenterFreq[nick].label = '[HOT]'
    else if (c.label === '[WARM]' && commenterFreq[nick].label !== '[HOT]') commenterFreq[nick].label = '[WARM]'

    // Hourly
    const hour = new Date(c.createdAt as any).getHours()
    hourlyCount[hour] = (hourlyCount[hour] || 0) + 1

    // Keywords
    if (!c.commentText) continue
    const words = c.commentText.toLowerCase()
      .replace(/[.,!?;:()\[\]{}"'`~@#$%^&*+=|\\\/><]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`
      freq[bigram] = (freq[bigram] || 0) + 1
    }
  }

  const topKeywords = Object.entries(freq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  const topCommenters = Object.entries(commenterFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([nickname, data]) => ({ nickname, count: data.count, label: data.label }))

  const uniqueViewersSet = new Set(comments.map(c => c.nickname).filter(Boolean))
  const conversionRate = stats.total > 0 ? Math.round((stats.hot / stats.total) * 100) : 0

  const commentsByHour = Object.entries(hourlyCount)
    .map(([hour, count]) => ({ hour: Number(hour), count }))
    .sort((a, b) => a.hour - b.hour)

  return {
    sessionId,
    shopId,
    shopName,
    platform,
    startTime,
    endTime,
    duration,
    totalComments: comments.length,
    uniqueViewers: uniqueViewersSet.size,
    peakViewers,
    hotLeads: stats.hot,
    warmLeads: stats.warm,
    coldComments: stats.cold,
    conversionRate,
    topKeywords,
    topCommenters,
    commentsByHour,
  }
}
