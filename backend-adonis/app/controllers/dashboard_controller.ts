import type { HttpContext } from '@adonisjs/core/http'
import ChatLog from '#models/chat_log'
import Lead from '#models/lead'
import LivestreamSession from '#models/livestream_session'
import db from '@adonisjs/lucid/services/db'

export default class DashboardController {
  async overview({ request, response }: HttpContext) {
    const { shopId } = request.qs()

    // Active sessions
    const sessionsQuery = LivestreamSession.query().where('status', 'live')
    if (shopId) sessionsQuery.where('shop_id', shopId)
    const activeSessions = await sessionsQuery

    // Today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const commentsQuery = ChatLog.query().where('created_at', '>=', today.toISOString())
    if (shopId) commentsQuery.where('shop_id', shopId)
    const todayComments = await commentsQuery.count('* as total')

    const leadsQuery = Lead.query().where('created_at', '>=', today.toISOString())
    const todayLeads = await leadsQuery.count('* as total')

    const hotLeadsQuery = Lead.query()
      .where('created_at', '>=', today.toISOString())
      .where('label', '[HOT]')
    const hotLeads = await hotLeadsQuery.count('* as total')

    return response.json({
      activeSessions: activeSessions.length,
      todayComments: Number(todayComments[0].$extras.total),
      todayLeads: Number(todayLeads[0].$extras.total),
      todayHotLeads: Number(hotLeads[0].$extras.total),
      sessions: activeSessions,
    })
  }
}
