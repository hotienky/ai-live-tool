import type { HttpContext } from '@adonisjs/core/http'
import LivestreamSession from '#models/livestream_session'

export default class SessionsController {
  async index({ request, response }: HttpContext) {
    const { shopId, page = 1, limit = 20 } = request.qs()
    const query = LivestreamSession.query().orderBy('created_at', 'desc')
    if (shopId) query.where('shop_id', shopId)
    const sessions = await query.paginate(Number(page), Number(limit))
    return response.json(sessions)
  }

  async show({ params, response }: HttpContext) {
    const session = await LivestreamSession.query()
      .where('id', params.id)
      .preload('chatLogs')
      .first()
    if (!session) return response.notFound({ error: 'Session not found' })
    return response.json(session)
  }
}
