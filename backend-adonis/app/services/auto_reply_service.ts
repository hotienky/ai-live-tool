/**
 * AutoReplyService — Handles automatic responses to HOT/WARM comments
 *
 * Features:
 *   - Template-based reply matching by AI label (HOT, WARM)
 *   - Per-user cooldown (1 reply per user per 5 minutes)
 *   - Shop-level toggle (auto_reply_enabled)
 *   - Emits socket events for frontend display
 */
import AutoReplyTemplate from '#models/auto_reply_template'

interface ReplyResult {
  shouldReply: boolean
  templateText?: string
  triggerLabel?: string
  cooldownRemaining?: number
}

class AutoReplyService {
  // cooldownMap: "shopId:uniqueId" → last reply timestamp
  private cooldowns = new Map<string, number>()
  private readonly COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

  // Template cache: shopId → templates[] (TTL 60s)
  private templateCache = new Map<string, { templates: any[]; cachedAt: number }>()
  private readonly CACHE_TTL = 60 * 1000

  /**
   * Check if we should auto-reply to this comment
   */
  async shouldAutoReply(
    shopId: string | number,
    uniqueId: string,
    aiLabel: string
  ): Promise<ReplyResult> {
    const normalizedLabel = aiLabel.replace(/[\[\]]/g, '').toUpperCase()

    // Only reply to HOT and WARM
    if (normalizedLabel !== 'HOT' && normalizedLabel !== 'WARM') {
      return { shouldReply: false }
    }

    // Check cooldown
    const cooldownKey = `${shopId}:${uniqueId}`
    const lastReply = this.cooldowns.get(cooldownKey)
    if (lastReply) {
      const elapsed = Date.now() - lastReply
      if (elapsed < this.COOLDOWN_MS) {
        return {
          shouldReply: false,
          cooldownRemaining: Math.ceil((this.COOLDOWN_MS - elapsed) / 1000),
        }
      }
    }

    // Get matching template
    const templates = await this.getTemplates(String(shopId))
    const template = templates.find((t) => {
      const tLabel = t.triggerLabel.replace(/[\[\]]/g, '').toUpperCase()
      return tLabel === normalizedLabel
    })

    if (!template) {
      return { shouldReply: false }
    }

    // Set cooldown
    this.cooldowns.set(cooldownKey, Date.now())

    return {
      shouldReply: true,
      templateText: template.templateText,
      triggerLabel: normalizedLabel,
    }
  }

  /**
   * Get templates for a shop (cached 60s)
   */
  private async getTemplates(shopId: string): Promise<any[]> {
    const cached = this.templateCache.get(shopId)
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL) {
      return cached.templates
    }

    try {
      const templates = await AutoReplyTemplate.query()
        .where('shop_id', shopId)
        .where('is_active', true)
        .orderBy('created_at', 'desc')
      this.templateCache.set(shopId, { templates, cachedAt: Date.now() })
      return templates
    } catch {
      return []
    }
  }

  /**
   * Personalize template text with variables
   */
  personalizeText(template: string, vars: Record<string, string>): string {
    let text = template
    for (const [key, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
    return text
  }

  /**
   * Cleanup old cooldowns (call periodically)
   */
  cleanup() {
    const now = Date.now()
    for (const [key, timestamp] of this.cooldowns.entries()) {
      if (now - timestamp > this.COOLDOWN_MS * 2) {
        this.cooldowns.delete(key)
      }
    }
  }
}

export default new AutoReplyService()
