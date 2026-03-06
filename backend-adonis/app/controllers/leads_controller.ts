import type { HttpContext } from '@adonisjs/core/http'
import Lead from '#models/lead'
import ChatLog from '#models/chat_log'
import { getUserShopIds } from '#services/scope_helper'
import GetPipelineStatsAction from '#actions/leads/get_pipeline_stats_action'

export default class LeadsController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId, status, page = 1, limit = 50 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = Lead.query()
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
      .orderBy('created_at', 'desc')

    if (status) query.where('status', status)
    if (shopId) query.whereHas('chatLog', (q) => q.where('shop_id', shopId))

    const leads = await query.paginate(Number(page), Number(limit))
    return response.json(leads)
  }

  async show({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const lead = await Lead.query()
      .where('id', params.id)
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
      .first()
    if (!lead) return response.notFound({ error: 'Lead not found' })
    return response.json(lead)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const lead = await Lead.query()
      .where('id', params.id)
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
      .first()
    if (!lead) return response.notFound({ error: 'Lead not found' })

    const data = request.only(['status', 'notes', 'productIntent'])
    lead.merge(data)
    await lead.save()
    return response.json(lead)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const lead = await Lead.query()
      .where('id', params.id)
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
      .first()
    if (!lead) return response.notFound({ error: 'Lead not found' })
    await lead.delete()
    return response.json({ success: true })
  }

  async pipelineStats({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetPipelineStatsAction.handle({ userShopIds, shopId })
    return response.json(result)
  }
}
