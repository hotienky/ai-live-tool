/**
 * Webhook Service — Persistent DB-backed webhooks with HMAC signatures
 */
import { WebhookSchema } from '../../database/schema.js'
import crypto from 'node:crypto'

export async function getWebhooks(shopId: number) {
  return WebhookSchema.query().where('shopId', shopId).orderBy('createdAt', 'desc')
}

export async function createWebhook(shopId: number, url: string, events: string[] = ['hot_lead']) {
  const secret = crypto.randomBytes(16).toString('hex')
  return WebhookSchema.create({
    shopId,
    url,
    events: JSON.stringify(events),
    isActive: true,
    secret,
  })
}

export async function updateWebhook(id: number, shopId: number, data: any) {
  const webhook = await WebhookSchema.query().where('id', id).where('shopId', shopId).firstOrFail()
  if (data.url !== undefined) webhook.url = data.url
  if (data.events !== undefined) webhook.events = JSON.stringify(data.events)
  if (data.isActive !== undefined) webhook.isActive = data.isActive
  await webhook.save()
  return webhook
}

export async function deleteWebhook(id: number, shopId: number) {
  const webhook = await WebhookSchema.query().where('id', id).where('shopId', shopId).firstOrFail()
  await webhook.delete()
}

export async function triggerWebhook(shopId: number, event: string, payload: any) {
  const hooks = await WebhookSchema.query()
    .where('shopId', shopId)
    .where('isActive', true)

  for (const hook of hooks) {
    const events: string[] = typeof hook.events === 'string' ? JSON.parse(hook.events) : hook.events
    if (!events.includes(event)) continue

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      shop_id: shopId,
      data: payload,
    })

    // HMAC signature
    const signature = hook.secret
      ? crypto.createHmac('sha256', hook.secret).update(body).digest('hex')
      : ''

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(signature ? { 'X-Webhook-Signature': `sha256=${signature}` } : {}),
        },
        body,
        signal: controller.signal,
      })

      clearTimeout(timeout)
      hook.lastStatus = res.status
      hook.lastTriggeredAt = new Date() as any
      await hook.save()
      console.log(`🪝 Webhook sent: ${event} → ${hook.url} (${res.status})`)
    } catch (err: any) {
      hook.lastStatus = 0
      hook.lastTriggeredAt = new Date() as any
      await hook.save()
      console.error(`🪝 Webhook failed: ${hook.url}`, err.message)
    }
  }
}
