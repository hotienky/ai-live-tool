import type { HttpContext } from '@adonisjs/core/http'
import Lead from '#models/lead'
import db from '@adonisjs/lucid/services/db'

export default class LeadsController {
  async index({ request, response }: HttpContext) {
    const { shopId, status, page = 1, limit = 50 } = request.qs()
    const query = Lead.query().orderBy('created_at', 'desc')

    if (status) query.where('status', status)
    if (shopId) {
      query.whereHas('chatLog', (q) => q.where('shop_id', shopId))
    }

    const leads = await query.paginate(Number(page), Number(limit))
    return response.json(leads)
  }

  async show({ params, response }: HttpContext) {
    const lead = await Lead.find(params.id)
    if (!lead) return response.notFound({ error: 'Lead not found' })
    return response.json(lead)
  }

  async update({ params, request, response }: HttpContext) {
    const lead = await Lead.find(params.id)
    if (!lead) return response.notFound({ error: 'Lead not found' })

    const data = request.only(['status', 'notes', 'productIntent'])
    lead.merge(data)
    await lead.save()
    return response.json(lead)
  }

  async destroy({ params, response }: HttpContext) {
    const lead = await Lead.find(params.id)
    if (!lead) return response.notFound({ error: 'Lead not found' })
    await lead.delete()
    return response.json({ success: true })
  }

  async pipelineStats({ request, response }: HttpContext) {
    const { shopId } = request.qs()

    const statuses = ['New', 'Contacting', 'Closed', 'Ignored']
    const pipeline: Record<string, number> = {}

    for (const status of statuses) {
      const query = Lead.query().where('status', status)
      if (shopId) {
        query.whereHas('chatLog', (q) => q.where('shop_id', shopId))
      }
      const count = await query.count('* as total')
      pipeline[status] = Number(count[0].$extras.total)
    }

    return response.json({ pipeline })
  }
}
