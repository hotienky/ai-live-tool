/**
 * Webhooks Controller — CRUD for webhook management
 */
import type { HttpContext } from '@adonisjs/core/http'
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook } from '#services/webhook_service'
import { logActivity, Actions } from '#services/activity_log_service'

async function getUserShopIds(userId: number) {
  const Shop = (await import('#models/shop')).default
  const shops = await Shop.query().where('userId', userId).select('id')
  return shops.map((s) => s.id)
}

export default class WebhooksController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const targetShopId = Number(shopId) || userShopIds[0]
    if (!userShopIds.includes(targetShopId)) return response.forbidden({ error: 'Access denied' })

    const webhooks = await getWebhooks(targetShopId)
    return response.json(webhooks)
  }

  async store({ auth, request, response }: HttpContext) {
    const { shopId, url, events } = request.only(['shopId', 'url', 'events'])
    if (!shopId || !url) return response.badRequest({ error: 'shopId and url are required' })

    const userShopIds = await getUserShopIds(auth.user!.id)
    if (!userShopIds.includes(Number(shopId))) return response.forbidden({ error: 'Access denied' })

    const webhook = await createWebhook(Number(shopId), url, events)
    await logActivity({
      shopId: Number(shopId),
      userId: auth.user!.id,
      action: Actions.WEBHOOK_CREATED,
      entityType: 'Webhook',
      entityId: webhook.id,
      details: { url, events },
    })
    return response.created(webhook)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const data = request.only(['url', 'events', 'isActive'])
    const userShopIds = await getUserShopIds(auth.user!.id)

    // Get webhook to check shop ownership
    const { WebhookSchema } = await import('../../database/schema.js')
    const wh = await WebhookSchema.find(params.id)
    if (!wh || !userShopIds.includes(wh.shopId)) return response.forbidden({ error: 'Access denied' })

    const webhook = await updateWebhook(Number(params.id), wh.shopId, data)
    return response.json(webhook)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { WebhookSchema } = await import('../../database/schema.js')
    const wh = await WebhookSchema.find(params.id)
    if (!wh || !userShopIds.includes(wh.shopId)) return response.forbidden({ error: 'Access denied' })

    await deleteWebhook(Number(params.id), wh.shopId)
    await logActivity({
      shopId: wh.shopId,
      userId: auth.user!.id,
      action: Actions.WEBHOOK_DELETED,
      entityType: 'Webhook',
      entityId: Number(params.id),
    })
    return response.json({ success: true })
  }
}
