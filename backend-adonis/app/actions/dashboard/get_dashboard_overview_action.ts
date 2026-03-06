import ChatLog from '#models/chat_log'
import Lead from '#models/lead'
import LivestreamSession from '#models/livestream_session'
import Order from '#models/order'
import ScheduledLivestream from '#models/scheduled_livestream'

interface Params {
  userShopIds: string[]
  shopId?: string
}

export default class GetDashboardOverviewAction {
  static async handle({ userShopIds, shopId }: Params) {
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

    // Active sessions from DB
    const sessionsQuery = LivestreamSession.query()
      .where('status', 'live')
      .whereIn('shop_id', userShopIds)
    if (shopId) sessionsQuery.where('shop_id', shopId)
    const activeSessions = await sessionsQuery

    // Today's stats
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

    // Revenue today
    let todayRevenue = 0
    try {
      const revenueResult = await Order.query()
        .where('created_at', '>=', today.toISOString())
        .where('payment_status', 'paid')
        .whereIn('shop_id', userShopIds)
        .sum('total_amount as total')
      todayRevenue = Number(revenueResult[0].$extras.total) || 0
    } catch (_e) {}

    // Upcoming schedules
    let upcomingSchedules: any[] = []
    try {
      upcomingSchedules = await ScheduledLivestream.query()
        .where('status', 'scheduled')
        .where('scheduled_at', '>=', new Date().toISOString())
        .whereIn('shop_id', userShopIds)
        .orderBy('scheduled_at', 'asc')
        .limit(5)
    } catch (_e) {}

    return {
      activeConnections,
      activeSessions: activeSessions.length,
      todayComments: Number(todayComments[0].$extras.total),
      todayLeads: Number(todayLeads[0].$extras.total),
      todayHotLeads: Number(hotLeads[0].$extras.total),
      todayRevenue,
      upcomingSchedules,
      aiStats,
      sessions: activeSessions,
    }
  }
}
