import type { HttpContext } from '@adonisjs/core/http'
import ScheduledLivestream from '#models/scheduled_livestream'
import { getUserShopIds } from '#services/scope_helper'

export default class SchedulesController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId, status } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = ScheduledLivestream.query()
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .orderBy('scheduled_at', 'asc')
    if (shopId) query.where('shopId', shopId)
    if (status) query.where('status', status)
    else query.whereIn('status', ['scheduled', 'live'])
    const schedules = await query
    return response.json(schedules)
  }

  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only([
      'shopId', 'title', 'description', 'platform',
      'productIds', 'script', 'scheduledAt', 'durationMinutes',
    ])
    if (data.shopId && !userShopIds.includes(String(data.shopId))) {
      return response.forbidden({ error: 'Shop not found' })
    }
    data.status = 'scheduled'
    const schedule = await ScheduledLivestream.create(data)
    return response.status(201).json(schedule)
  }

  async show({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const schedule = await ScheduledLivestream.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .first()
    if (!schedule) return response.notFound({ error: 'Schedule not found' })
    return response.json(schedule)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const schedule = await ScheduledLivestream.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .first()
    if (!schedule) return response.notFound({ error: 'Schedule not found' })

    const data = request.only([
      'title', 'description', 'platform', 'productIds',
      'script', 'scheduledAt', 'durationMinutes', 'status',
    ])
    schedule.merge(data)
    await schedule.save()
    return response.json(schedule)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const schedule = await ScheduledLivestream.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .first()
    if (!schedule) return response.notFound({ error: 'Schedule not found' })
    await schedule.delete()
    return response.json({ message: 'Deleted' })
  }
}
