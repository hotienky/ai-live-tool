import type { HttpContext } from '@adonisjs/core/http'
import ScheduledLivestream from '#models/scheduled_livestream'

export default class SchedulesController {
  async index({ request, response }: HttpContext) {
    const { shopId, status } = request.qs()
    const query = ScheduledLivestream.query().orderBy('scheduled_at', 'asc')
    if (shopId) query.where('shopId', shopId)
    if (status) query.where('status', status)
    else query.whereIn('status', ['scheduled', 'live'])
    const schedules = await query
    return response.json(schedules)
  }

  async store({ request, response }: HttpContext) {
    const data = request.only([
      'shopId', 'title', 'description', 'platform',
      'productIds', 'script', 'scheduledAt', 'durationMinutes',
    ])
    data.status = 'scheduled'
    const schedule = await ScheduledLivestream.create(data)
    return response.status(201).json(schedule)
  }

  async show({ params, response }: HttpContext) {
    const schedule = await ScheduledLivestream.findOrFail(params.id)
    return response.json(schedule)
  }

  async update({ params, request, response }: HttpContext) {
    const schedule = await ScheduledLivestream.findOrFail(params.id)
    const data = request.only([
      'title', 'description', 'platform', 'productIds',
      'script', 'scheduledAt', 'durationMinutes', 'status',
    ])
    schedule.merge(data)
    await schedule.save()
    return response.json(schedule)
  }

  async destroy({ params, response }: HttpContext) {
    const schedule = await ScheduledLivestream.findOrFail(params.id)
    await schedule.delete()
    return response.json({ message: 'Deleted' })
  }
}
