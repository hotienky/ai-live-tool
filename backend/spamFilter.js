/**
 * Spam Filter / Comment Moderation Service
 */

class SpamFilter {
  constructor() {
    this.blacklists = new Map(); // shopId -> Set<word>
    this.userRateLimits = new Map(); // `shopId:userId` -> { count, lastReset }
    this.bannedUsers = new Map(); // shopId -> Set<userId>
    this.configs = new Map(); // shopId -> { hideSpam, rateLimitEnabled, maxPerMinute }
  }

  /**
   * Set moderation config for a shop
   */
  setConfig(shopId, config) {
    this.configs.set(shopId, {
      hideSpam: config.hideSpam !== false,
      rateLimitEnabled: config.rateLimitEnabled || false,
      maxPerMinute: config.maxPerMinute || 5,
      blacklist: config.blacklist || "",
    });

    // Parse blacklist
    const words = (config.blacklist || "")
      .split(/\n|,/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);
    this.blacklists.set(shopId, new Set(words));
  }

  getConfig(shopId) {
    return this.configs.get(shopId) || { hideSpam: true, rateLimitEnabled: false, maxPerMinute: 5, blacklist: "" };
  }

  /**
   * Ban / unban user
   */
  banUser(shopId, userId) {
    if (!this.bannedUsers.has(shopId)) this.bannedUsers.set(shopId, new Set());
    this.bannedUsers.get(shopId).add(userId);
  }

  unbanUser(shopId, userId) {
    this.bannedUsers.get(shopId)?.delete(userId);
  }

  getBannedUsers(shopId) {
    return [...(this.bannedUsers.get(shopId) || [])];
  }

  /**
   * Check if comment should be filtered
   * Returns: { allowed: boolean, reason: string }
   */
  checkComment(shopId, userId, commentText) {
    // 1. Check banned users
    if (this.bannedUsers.get(shopId)?.has(userId)) {
      return { allowed: false, reason: "banned_user" };
    }

    const config = this.getConfig(shopId);
    const text = commentText.toLowerCase();

    // 2. Blacklist check
    if (config.hideSpam) {
      const blacklist = this.blacklists.get(shopId) || new Set();
      for (const word of blacklist) {
        if (text.includes(word)) {
          return { allowed: false, reason: `blacklisted_word: ${word}` };
        }
      }
    }

    // 3. Rate limiting
    if (config.rateLimitEnabled) {
      const key = `${shopId}:${userId}`;
      let limiter = this.userRateLimits.get(key);
      const now = Date.now();

      if (!limiter || now - limiter.lastReset > 60000) {
        limiter = { count: 0, lastReset: now };
        this.userRateLimits.set(key, limiter);
      }

      limiter.count++;
      if (limiter.count > config.maxPerMinute) {
        return { allowed: false, reason: "rate_limited" };
      }
    }

    // 4. Basic spam patterns
    if (config.hideSpam) {
      // Repeated characters (e.g., "aaaaaaaa")
      if (/(.)\1{7,}/.test(text)) {
        return { allowed: false, reason: "repeated_chars" };
      }
      // All caps (when > 20 chars)
      if (text.length > 20 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
        return { allowed: false, reason: "all_caps" };
      }
    }

    return { allowed: true, reason: "" };
  }
}

// Singleton
const spamFilter = new SpamFilter();

module.exports = spamFilter;
