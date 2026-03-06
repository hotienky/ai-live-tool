import type { HttpContext } from '@adonisjs/core/http'
import { NotificationSchema } from '../../database/schema.js'

export default class NotificationsController {
  async index({ auth, request, response }: HttpContext) {
    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', 20))
    const notifications = await NotificationSchema.query()
      .where('userId', auth.user!.id)
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
    return response.json(notifications)
  }

  async unreadCount({ auth, response }: HttpContext) {
    const count = await NotificationSchema.query()
      .where('userId', auth.user!.id)
      .where('isRead', false)
      .count('* as total')
    return response.json({ count: Number(count[0].$extras.total || 0) })
  }

  async markRead({ auth, params, response }: HttpContext) {
    const notif = await NotificationSchema.query()
      .where('id', params.id)
      .where('userId', auth.user!.id)
      .first()
    if (!notif) return response.notFound({ error: 'Not found' })
    notif.isRead = true
    await notif.save()
    return response.json(notif)
  }

  async markAllRead({ auth, response }: HttpContext) {
    await NotificationSchema.query()
      .where('userId', auth.user!.id)
      .where('isRead', false)
      .update({ isRead: true })
    return response.json({ success: true })
  }
}
