/**
 * Webhook Service
 * Gửi lead data tới external URLs khi có HOT lead mới
 */

// In-memory webhook configs
const webhookConfigs = new Map(); // shopId -> { url, events[], active }

function registerWebhook(shopId, url, events = ["hot_lead"]) {
  if (!webhookConfigs.has(shopId)) webhookConfigs.set(shopId, []);
  webhookConfigs.get(shopId).push({ url, events, active: true, id: `wh_${Date.now()}` });
}

function getWebhooks(shopId) {
  return webhookConfigs.get(shopId) || [];
}

function removeWebhook(shopId, webhookId) {
  const hooks = webhookConfigs.get(shopId) || [];
  webhookConfigs.set(shopId, hooks.filter((h) => h.id !== webhookId));
}

/**
 * Gửi webhook event
 */
async function triggerWebhook(shopId, event, payload) {
  const hooks = getWebhooks(shopId).filter(
    (h) => h.active && h.events.includes(event)
  );

  for (const hook of hooks) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      await fetch(hook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          shop_id: shopId,
          data: payload,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`🪝 Webhook sent: ${event} → ${hook.url}`);
    } catch (err) {
      console.error(`🪝 Webhook failed: ${hook.url}`, err.message);
    }
  }
}

module.exports = {
  registerWebhook,
  getWebhooks,
  removeWebhook,
  triggerWebhook,
};
