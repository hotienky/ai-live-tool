/**
 * Spam Filter Service — Comment moderation
 */

interface ModerationConfig {
  hideSpam: boolean
  rateLimitEnabled: boolean
  maxPerMinute: number
  blacklist: string
}

class SpamFilter {
  private blacklists = new Map<string, Set<string>>()
  private userRateLimits = new Map<string, { count: number; lastReset: number }>()
  private bannedUsers = new Map<string, Set<string>>()
  private configs = new Map<string, ModerationConfig>()

  setConfig(shopId: string, config: ModerationConfig) {
    this.configs.set(shopId, config)
    const words = (config.blacklist || '')
      .split(/\n|,/)
      .map((w: string) => w.trim().toLowerCase())
      .filter((w: string) => w.length > 0)
    this.blacklists.set(shopId, new Set(words))
  }

  getConfig(shopId: string): ModerationConfig {
    return this.configs.get(shopId) || { hideSpam: true, rateLimitEnabled: false, maxPerMinute: 5, blacklist: '' }
  }

  banUser(shopId: string, userId: string) {
    if (!this.bannedUsers.has(shopId)) this.bannedUsers.set(shopId, new Set())
    this.bannedUsers.get(shopId)!.add(userId)
  }

  unbanUser(shopId: string, userId: string) {
    this.bannedUsers.get(shopId)?.delete(userId)
  }

  checkComment(shopId: string, userId: string, commentText: string): { allowed: boolean; reason: string } {
    if (this.bannedUsers.get(shopId)?.has(userId)) {
      return { allowed: false, reason: 'banned_user' }
    }

    const config = this.getConfig(shopId)
    const text = commentText.toLowerCase()

    if (config.hideSpam) {
      const blacklist = this.blacklists.get(shopId) || new Set()
      for (const word of blacklist) {
        if (text.includes(word)) return { allowed: false, reason: `blacklisted: ${word}` }
      }
      if (/(.)\1{7,}/.test(text)) return { allowed: false, reason: 'spam_pattern' }
    }

    if (config.rateLimitEnabled) {
      const key = `${shopId}:${userId}`
      let limiter = this.userRateLimits.get(key)
      const now = Date.now()
      if (!limiter || now - limiter.lastReset > 60000) {
        limiter = { count: 0, lastReset: now }
        this.userRateLimits.set(key, limiter)
      }
      limiter.count++
      if (limiter.count > config.maxPerMinute) return { allowed: false, reason: 'rate_limited' }
    }

    return { allowed: true, reason: '' }
  }
}

export default new SpamFilter()
