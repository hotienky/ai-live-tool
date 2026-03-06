import type { HttpContext } from '@adonisjs/core/http'
import ChatLog from '#models/chat_log'
import Lead from '#models/lead'
import db from '@adonisjs/lucid/services/db'

export default class AnalyticsController {
  async daily({ request, response }: HttpContext) {
    const { shopId, days = 7 } = request.qs()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    const query = db.from('chat_logs')
      .select(db.raw("DATE(created_at) as date"), 'ai_label')
      .count('* as count')
      .where('created_at', '>=', startDate.toISOString())
      .groupByRaw('DATE(created_at), ai_label')
      .orderByRaw('DATE(created_at) ASC')

    if (shopId) query.where('shop_id', shopId)
    const rows = await query

    const dateMap: Record<string, any> = {}
    for (const r of rows) {
      const d = String(r.date)
      if (!dateMap[d]) dateMap[d] = { date: d, HOT: 0, WARM: 0, COLD: 0, total: 0 }
      dateMap[d][r.ai_label] = Number(r.count)
      dateMap[d].total += Number(r.count)
    }

    return response.json({ daily: Object.values(dateMap) })
  }

  async hourly({ request, response }: HttpContext) {
    const { shopId, date } = request.qs()
    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const query = db.from('chat_logs')
      .select(db.raw("EXTRACT(HOUR FROM created_at) as hour"), 'ai_label')
      .count('* as count')
      .whereBetween('created_at', [startOfDay.toISOString(), endOfDay.toISOString()])
      .groupByRaw('EXTRACT(HOUR FROM created_at), ai_label')

    if (shopId) query.where('shop_id', shopId)
    const rows = await query

    const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, HOT: 0, WARM: 0, COLD: 0, total: 0 }))
    for (const r of rows) {
      const h = Number(r.hour)
      hourly[h][r.ai_label as 'HOT' | 'WARM' | 'COLD'] = Number(r.count)
      hourly[h].total += Number(r.count)
    }

    return response.json({ hourly })
  }

  async conversion({ request, response }: HttpContext) {
    const { days = 30 } = request.qs()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    const statuses = ['New', 'Contacting', 'Closed', 'Ignored']
    const funnel: Array<{ status: string; count: number }> = []

    for (const status of statuses) {
      const result = await Lead.query()
        .where('status', status)
        .where('created_at', '>=', startDate.toISOString())
        .count('* as total')
      funnel.push({ status, count: Number(result[0].$extras.total) })
    }

    const totalLeads = funnel.reduce((sum, f) => sum + f.count, 0)
    const closedCount = funnel.find((f) => f.status === 'Closed')?.count || 0
    const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0

    return response.json({ funnel, totalLeads, closedCount, conversionRate })
  }

  async topKeywords({ request, response }: HttpContext) {
    const { shopId, days = 7, limit = 20 } = request.qs()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    const query = ChatLog.query()
      .select('commentText')
      .where('created_at', '>=', startDate.toISOString())
      .limit(5000)
    if (shopId) query.where('shopId', shopId)
    const comments = await query

    const STOP = new Set([
      'của', 'và', 'là', 'có', 'cho', 'với', 'được', 'các', 'từ', 'trong',
      'này', 'đó', 'những', 'một', 'không', 'cũng', 'như', 'thì', 'mà',
      'khi', 'ở', 'đã', 'sẽ', 'đang', 'bị', 'vì', 'nên', 'hay', 'hoặc',
      'nhưng', 'nếu', 'vậy', 'rồi', 'lại', 'còn', 'em', 'anh', 'chị',
      'mình', 'ơi', 'nhé', 'nha', 'ạ', 'quá', 'rất', 'lắm', 'gì', 'nào',
      'ok', 'ko', 'dc', 'đc', 'the', 'and', 'a', 'an', 'of', 'to', 'in',
    ])

    const freq: Record<string, number> = {}
    for (const row of comments) {
      if (!row.commentText) continue
      const words = row.commentText.toLowerCase()
        .replace(/[.,!?;:()[\]{}"'`~@#$%^&*+=|\\/><]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w))
      for (const w of words) freq[w] = (freq[w] || 0) + 1
    }

    const keywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, Number(limit))
      .map(([word, count]) => ({ word, count }))

    return response.json({ keywords })
  }

  async summary({ request, response }: HttpContext) {
    const { shopId, days = 7 } = request.qs()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    const query = db.from('chat_logs')
      .select('ai_label')
      .count('* as count')
      .where('created_at', '>=', startDate.toISOString())
      .groupBy('ai_label')
    if (shopId) query.where('shop_id', shopId)
    const stats = await query

    const counts: Record<string, number> = { HOT: 0, WARM: 0, COLD: 0 }
    for (const s of stats) counts[s.ai_label] = Number(s.count)

    const totalComments = counts.HOT + counts.WARM + counts.COLD
    const hotRate = totalComments > 0 ? Math.round((counts.HOT / totalComments) * 100) : 0
    const avgCommentsPerDay = Math.round(totalComments / Number(days))

    return response.json({
      totalComments,
      totalHot: counts.HOT,
      totalWarm: counts.WARM,
      totalCold: counts.COLD,
      hotRate,
      avgCommentsPerDay,
    })
  }
}
