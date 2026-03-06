/**
 * Webhook Service — Gửi lead data tới external URLs
 */
const webhookConfigs = new Map<string, Array<{ id: string; url: string; events: string[]; active: boolean }>>()

export function registerWebhook(shopId: string, url: string, events: string[] = ['hot_lead']) {
  if (!webhookConfigs.has(shopId)) webhookConfigs.set(shopId, [])
  webhookConfigs.get(shopId)!.push({ url, events, active: true, id: `wh_${Date.now()}` })
}

export function getWebhooks(shopId: string) {
  return webhookConfigs.get(shopId) || []
}

export function removeWebhook(shopId: string, webhookId: string) {
  const hooks = webhookConfigs.get(shopId) || []
  webhookConfigs.set(shopId, hooks.filter((h) => h.id !== webhookId))
}

export async function triggerWebhook(shopId: string, event: string, payload: any) {
  const hooks = getWebhooks(shopId).filter((h) => h.active && h.events.includes(event))

  for (const hook of hooks) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      await fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          shop_id: shopId,
          data: payload,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      console.log(`🪝 Webhook sent: ${event} → ${hook.url}`)
    } catch (err: any) {
      console.error(`🪝 Webhook failed: ${hook.url}`, err.message)
    }
  }
}
