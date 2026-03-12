import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class NotificationsController {
  async index({ auth, request, response }: HttpContext) {
    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', 20))
    const offset = (page - 1) * limit

    const [data, countResult] = await Promise.all([
      db.from('notifications')
        .where('user_id', auth.user!.id)
        .orderBy('created_at', 'desc')
        .offset(offset)
        .limit(limit),
      db.from('notifications')
        .where('user_id', auth.user!.id)
        .count('* as total')
        .first(),
    ])
    const total = Number(countResult?.total || 0)

    return response.json({
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    })
  }

  async unreadCount({ auth, response }: HttpContext) {
    const result = await db.from('notifications')
      .where('user_id', auth.user!.id)
      .where('is_read', false)
      .count('* as total')
      .first()
    return response.json({ count: Number(result?.total || 0) })
  }

  async markRead({ auth, params, response }: HttpContext) {
    const updated = await db.from('notifications')
      .where('id', params.id)
      .where('user_id', auth.user!.id)
      .update({ is_read: true, updated_at: new Date() })
    if (!updated) return response.notFound({ error: 'Not found' })
    return response.json({ success: true })
  }

  async markAllRead({ auth, response }: HttpContext) {
    await db.from('notifications')
      .where('user_id', auth.user!.id)
      .where('is_read', false)
      .update({ is_read: true, updated_at: new Date() })
    return response.json({ success: true })
  }
}
