import type { HttpContext } from '@adonisjs/core/http'
import ChatLog from '#models/chat_log'
import Lead from '#models/lead'
import LivestreamSession from '#models/livestream_session'
import Order from '#models/order'
import ScheduledLivestream from '#models/scheduled_livestream'
import db from '@adonisjs/lucid/services/db'
import { getUserShopIds } from '#services/scope_helper'

export default class DashboardController {
  async overview({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    // Active connections from ConnectionManager (runtime, not DB)
    let activeConnections: any[] = []
    try {
      const connectionManager = (await import('#services/connection_manager')).default
      activeConnections = Array.from(connectionManager.connections.entries())
        .filter(([id]: [any, any]) => userShopIds.includes(String(id)))
        .map(([id, conn]: [any, any]) => ({
          shopId: id,
          shopName: conn.shopName || `Shop ${id}`,
          platform: conn.platform || 'tiktok',
          status: conn.status || 'connected',
          totalComments: conn.stats?.total || 0,
          peakViewers: conn.stats?.peakViewers || 0,
        }))
    } catch (_e) {}

    // AI Queue stats
    let aiStats = { processed: 0, queueLength: 0, retried: 0, failed: 0 }
    try {
      const aiQueue = (await import('#services/ai_queue')).default
      aiStats = aiQueue.getStats()
    } catch (_e) {}

    // Active sessions from DB — scoped to user
    const sessionsQuery = LivestreamSession.query()
      .where('status', 'live')
      .whereIn('shop_id', userShopIds)
    if (shopId) sessionsQuery.where('shop_id', shopId)
    const activeSessions = await sessionsQuery

    // Today's stats — scoped to user
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const commentsQuery = ChatLog.query()
      .where('created_at', '>=', today.toISOString())
      .whereIn('shop_id', userShopIds)
    if (shopId) commentsQuery.where('shop_id', shopId)
    const todayComments = await commentsQuery.count('* as total')

    const leadsQuery = Lead.query()
      .where('created_at', '>=', today.toISOString())
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
    const todayLeads = await leadsQuery.count('* as total')

    const hotLeadsQuery = Lead.query()
      .where('created_at', '>=', today.toISOString())
      .where('label', 'HOT')
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
    const hotLeads = await hotLeadsQuery.count('* as total')

    // Revenue today — scoped
    let todayRevenue = 0
    try {
      const revenueResult = await Order.query()
        .where('created_at', '>=', today.toISOString())
        .where('payment_status', 'paid')
        .whereIn('shop_id', userShopIds)
        .sum('total_amount as total')
      todayRevenue = Number(revenueResult[0].$extras.total) || 0
    } catch (_e) {}

    // Upcoming schedules — scoped
    let upcomingSchedules: any[] = []
    try {
      upcomingSchedules = await ScheduledLivestream.query()
        .where('status', 'scheduled')
        .where('scheduled_at', '>=', new Date().toISOString())
        .whereIn('shop_id', userShopIds)
        .orderBy('scheduled_at', 'asc')
        .limit(5)
    } catch (_e) {}

    return response.json({
      activeConnections,
      activeSessions: activeSessions.length,
      todayComments: Number(todayComments[0].$extras.total),
      todayLeads: Number(todayLeads[0].$extras.total),
      todayHotLeads: Number(hotLeads[0].$extras.total),
      todayRevenue,
      upcomingSchedules,
      aiStats,
      sessions: activeSessions,
    })
  }

  /**
   * Recent leads — scoped to user's shops
   */
  async recentLeads({ auth, request, response }: HttpContext) {
    const { limit = 20, shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = Lead.query()
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
    if (shopId) query.whereHas('chatLog', (q) => q.where('shop_id', shopId))
    const leads = await query
    return response.json(leads)
  }

  /**
   * Analytics overview — scoped to user's shops
   */
  async analytics({ auth, request, response }: HttpContext) {
    const { shopId, days = 7 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    // Daily comment counts — scoped
    const dailyQuery = db
      .from('chat_logs')
      .select(db.raw("DATE(created_at) as date"), 'ai_label')
      .count('* as count')
      .where('created_at', '>=', startDate.toISOString())
      .whereIn('shop_id', userShopIds)
      .groupByRaw('DATE(created_at), ai_label')
      .orderByRaw('DATE(created_at) ASC')
    if (shopId) dailyQuery.where('shop_id', shopId)
    const dailyRows = await dailyQuery

    const dateMap: Record<string, any> = {}
    for (const r of dailyRows) {
      const d = String(r.date)
      if (!dateMap[d]) dateMap[d] = { date: d, HOT: 0, WARM: 0, COLD: 0, total: 0 }
      dateMap[d][r.ai_label] = Number(r.count)
      dateMap[d].total += Number(r.count)
    }

    // Conversion stats — scoped
    const statuses = ['New', 'Contacting', 'Closed', 'Ignored']
    const funnel: Array<{ status: string; count: number }> = []
    for (const status of statuses) {
      const result = await Lead.query()
        .where('status', status)
        .where('created_at', '>=', startDate.toISOString())
        .whereIn('chat_log_id',
          ChatLog.query().select('id').whereIn('shop_id', userShopIds)
        )
        .count('* as total')
      funnel.push({ status, count: Number(result[0].$extras.total) })
    }
    const totalLeads = funnel.reduce((sum, f) => sum + f.count, 0)
    const closedCount = funnel.find((f) => f.status === 'Closed')?.count || 0
    const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0

    return response.json({
      daily: Object.values(dateMap),
      conversion: { funnel, totalLeads, closedCount, rate: conversionRate },
    })
  }

  /**
   * Top customers — scoped to user's shops
   */
  async topCustomers({ auth, request, response }: HttpContext) {
    const { limit = 10 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const customers = await db
      .from('chat_logs')
      .select('nickname')
      .count('* as total_comments')
      .sum(db.raw("CASE WHEN ai_label = '[HOT]' THEN 1 ELSE 0 END") as any)
      .whereIn('shop_id', userShopIds)
      .groupBy('nickname')
      .orderBy('total_comments', 'desc')
      .limit(Number(limit))

    const result = customers.map((c: any) => ({
      nickname: c.nickname,
      totalComments: Number(c.total_comments),
      hotCount: Number(c.sum || 0),
      hotRate: Number(c.total_comments) > 0
        ? Math.round((Number(c.sum || 0) / Number(c.total_comments)) * 100)
        : 0,
    }))

    return response.json(result)
  }
}
