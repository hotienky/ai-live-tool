import db from '@adonisjs/lucid/services/db'

/**
 * ConnectionPoolManager — Manages tenant DB connection lifecycle.
 *
 * Responsibilities:
 * - Track active tenant connections
 * - Close idle connections after timeout
 * - Prevent connection leaks
 *
 * Single Responsibility: Connection pool lifecycle management.
 */
export default class ConnectionPoolManager {
  private static activeConnections = new Map<string, {
    lastUsed: number
    slug: string
  }>()

  /** Idle timeout in ms (default 15 minutes) */
  private static IDLE_TIMEOUT = 15 * 60 * 1000

  /** Max concurrent tenant connections */
  private static MAX_CONNECTIONS = 50

  /**
   * Mark a connection as active (called by TenantMiddleware).
   */
  static markActive(connectionName: string, slug: string) {
    this.activeConnections.set(connectionName, {
      lastUsed: Date.now(),
      slug,
    })
  }

  /**
   * Get current pool stats.
   */
  static getStats() {
    return {
      activeConnections: this.activeConnections.size,
      maxConnections: this.MAX_CONNECTIONS,
      connections: Array.from(this.activeConnections.entries()).map(([name, info]) => ({
        name,
        slug: info.slug,
        idleMs: Date.now() - info.lastUsed,
      })),
    }
  }

  /**
   * Close idle connections that exceed IDLE_TIMEOUT.
   * Should be called periodically (e.g., via setInterval).
   */
  static async cleanupIdle() {
    const now = Date.now()
    const toClose: string[] = []

    for (const [name, info] of this.activeConnections) {
      if (now - info.lastUsed > this.IDLE_TIMEOUT) {
        toClose.push(name)
      }
    }

    for (const name of toClose) {
      try {
        await db.manager.close(name)
        this.activeConnections.delete(name)
        console.log(`[ConnectionPool] Closed idle connection: ${name}`)
      } catch (error: any) {
        console.error(`[ConnectionPool] Failed to close ${name}:`, error.message)
      }
    }

    return toClose.length
  }

  /**
   * Check if we're at connection limit.
   */
  static isAtLimit(): boolean {
    return this.activeConnections.size >= this.MAX_CONNECTIONS
  }

  /**
   * Force close a specific connection.
   */
  static async closeConnection(connectionName: string) {
    try {
      await db.manager.close(connectionName)
      this.activeConnections.delete(connectionName)
    } catch {
      // Connection may already be closed
      this.activeConnections.delete(connectionName)
    }
  }

  /**
   * Close ALL tenant connections. Used for graceful shutdown.
   */
  static async closeAll() {
    for (const [name] of this.activeConnections) {
      try {
        await db.manager.close(name)
      } catch {
        // Ignore errors during shutdown
      }
    }
    this.activeConnections.clear()
    console.log('[ConnectionPool] All tenant connections closed')
  }

  /**
   * Start periodic cleanup (call once at app boot).
   */
  static startCleanupTimer(intervalMs = 5 * 60 * 1000) {
    return setInterval(() => this.cleanupIdle(), intervalMs)
  }
}
