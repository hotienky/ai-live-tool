/**
 * Webhooks Controller — CRUD for webhook management
 * Tenant-safe: uses shared getUserShopIds; in tenant mode (null), skips shop scoping
 */
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { getUserShopIds } from '#services/scope_helper'

export default class WebhooksController {
  async index({ auth, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const query = db.from('webhooks').orderBy('created_at', 'desc')
    if (userShopIds) query.whereIn('user_id', [auth.user!.id])
    const webhooks = await query
    return response.json(webhooks)
  }

  async store({ auth, request, response }: HttpContext) {
    const { url, events } = request.only(['url', 'events'])
    if (!url) return response.badRequest({ error: 'url is required' })

    const [webhook] = await db.table('webhooks').insert({
      user_id: auth.user!.id,
      url,
      events: JSON.stringify(events || []),
      is_active: true,
    }).returning('*')
    return response.status(201).json(webhook)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const data = request.only(['url', 'events', 'is_active'])
    const wh = await db.from('webhooks').where('id', params.id).where('user_id', auth.user!.id).first()
    if (!wh) return response.notFound({ error: 'Webhook not found' })

    const updateData: any = {}
    if (data.url !== undefined) updateData.url = data.url
    if (data.events !== undefined) updateData.events = JSON.stringify(data.events)
    if (data.is_active !== undefined) updateData.is_active = data.is_active
    updateData.updated_at = db.fn.now()

    await db.from('webhooks').where('id', params.id).update(updateData)
    const updated = await db.from('webhooks').where('id', params.id).first()
    return response.json(updated)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const wh = await db.from('webhooks').where('id', params.id).where('user_id', auth.user!.id).first()
    if (!wh) return response.notFound({ error: 'Webhook not found' })
    await db.from('webhooks').where('id', params.id).delete()
    return response.json({ success: true })
  }
}
