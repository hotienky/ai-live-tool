import type { HttpContext } from '@adonisjs/core/http'
import LivestreamSession from '#models/livestream_session'
import { getUserShopIds } from '#services/scope_helper'

export default class SessionsController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId, page = 1, limit = 20 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = LivestreamSession.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('created_at', 'desc')
    if (shopId) query.where('shop_id', shopId)
    const sessions = await query.paginate(Number(page), Number(limit))
    return response.json(sessions)
  }

  async show({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const session = await LivestreamSession.query()
      .where('id', params.id)
      .whereIn('shop_id', userShopIds)
      .preload('chatLogs')
      .first()
    if (!session) return response.notFound({ error: 'Session not found' })
    return response.json(session)
  }
}
