/**
 * hooks.js — Central Hook System for KAC CMS Platform
 * 
 * Provides WordPress-like actions and filters for plugin interoperability.
 * 
 * Actions: side-effect callbacks (no return value)
 *   hooks.addAction('after_content_save', callback, priority)
 *   hooks.doAction('after_content_save', contentType, data)
 * 
 * Filters: data transformers (return modified value)
 *   hooks.addFilter('sidebar_items', callback, priority)
 *   const items = hooks.applyFilters('sidebar_items', defaultItems)
 */

class HookSystem {
  constructor() {
    this.actions = {}   // { hookName: [{ callback, priority, id }] }
    this.filters = {}   // { hookName: [{ callback, priority, id }] }
    this._idCounter = 0
  }

  // ══════════════════════════════════════
  // ACTIONS — side effects, no return value
  // ══════════════════════════════════════

  /**
   * Register a callback for an action hook
   * @param {string} hookName - Hook name
   * @param {Function} callback - Callback function
   * @param {number} priority - Lower = runs first (default: 10)
   * @returns {number} Hook ID for removal
   */
  addAction(hookName, callback, priority = 10) {
    if (!this.actions[hookName]) this.actions[hookName] = []
    const id = ++this._idCounter
    this.actions[hookName].push({ callback, priority, id })
    this.actions[hookName].sort((a, b) => a.priority - b.priority)
    return id
  }

  /**
   * Trigger all callbacks registered for an action
   * @param {string} hookName - Hook name
   * @param {...any} args - Arguments passed to callbacks
   */
  async doAction(hookName, ...args) {
    const hooks = this.actions[hookName] || []
    for (const { callback } of hooks) {
      try {
        await callback(...args)
      } catch (err) {
        console.error(`[Hooks] Error in action "${hookName}":`, err)
      }
    }
  }

  /**
   * Synchronous version of doAction
   */
  doActionSync(hookName, ...args) {
    const hooks = this.actions[hookName] || []
    for (const { callback } of hooks) {
      try {
        callback(...args)
      } catch (err) {
        console.error(`[Hooks] Error in action "${hookName}":`, err)
      }
    }
  }

  /**
   * Remove a specific action callback
   */
  removeAction(hookName, callbackOrId) {
    if (!this.actions[hookName]) return
    if (typeof callbackOrId === 'number') {
      this.actions[hookName] = this.actions[hookName].filter(h => h.id !== callbackOrId)
    } else {
      this.actions[hookName] = this.actions[hookName].filter(h => h.callback !== callbackOrId)
    }
  }

  // ══════════════════════════════════════
  // FILTERS — data transformers, return value
  // ══════════════════════════════════════

  /**
   * Register a callback for a filter hook
   * @param {string} hookName - Hook name
   * @param {Function} callback - fn(value, ...args) => modifiedValue
   * @param {number} priority - Lower = runs first (default: 10)
   * @returns {number} Hook ID for removal
   */
  addFilter(hookName, callback, priority = 10) {
    if (!this.filters[hookName]) this.filters[hookName] = []
    const id = ++this._idCounter
    this.filters[hookName].push({ callback, priority, id })
    this.filters[hookName].sort((a, b) => a.priority - b.priority)
    return id
  }

  /**
   * Pass a value through all registered filter callbacks
   * @param {string} hookName - Hook name
   * @param {any} value - Initial value
   * @param {...any} args - Additional arguments
   * @returns {any} Filtered value
   */
  applyFilters(hookName, value, ...args) {
    const hooks = this.filters[hookName] || []
    let result = value
    for (const { callback } of hooks) {
      try {
        const filtered = callback(result, ...args)
        if (filtered !== undefined) result = filtered
      } catch (err) {
        console.error(`[Hooks] Error in filter "${hookName}":`, err)
      }
    }
    return result
  }

  /**
   * Remove a specific filter callback
   */
  removeFilter(hookName, callbackOrId) {
    if (!this.filters[hookName]) return
    if (typeof callbackOrId === 'number') {
      this.filters[hookName] = this.filters[hookName].filter(h => h.id !== callbackOrId)
    } else {
      this.filters[hookName] = this.filters[hookName].filter(h => h.callback !== callbackOrId)
    }
  }

  // ══════════════════════════════════════
  // UTILITIES
  // ══════════════════════════════════════

  /**
   * Check if a hook has any registered callbacks
   */
  hasAction(hookName) {
    return (this.actions[hookName]?.length || 0) > 0
  }

  hasFilter(hookName) {
    return (this.filters[hookName]?.length || 0) > 0
  }

  /**
   * Remove all hooks for a specific hookName (used when unloading plugins)
   */
  removeAll(hookName) {
    delete this.actions[hookName]
    delete this.filters[hookName]
  }

  /**
   * Remove all hooks registered by a specific ID range (used for plugin cleanup)
   */
  removeByIds(ids) {
    const idSet = new Set(ids)
    for (const hookName of Object.keys(this.actions)) {
      this.actions[hookName] = this.actions[hookName].filter(h => !idSet.has(h.id))
    }
    for (const hookName of Object.keys(this.filters)) {
      this.filters[hookName] = this.filters[hookName].filter(h => !idSet.has(h.id))
    }
  }

  /**
   * Debug: list all registered hooks
   */
  debug() {
    console.group('[Hooks] Registered hooks:')
    console.log('Actions:', Object.entries(this.actions).map(([k, v]) => `${k} (${v.length})`))
    console.log('Filters:', Object.entries(this.filters).map(([k, v]) => `${k} (${v.length})`))
    console.groupEnd()
  }
}

// Singleton instance
export const hooks = new HookSystem()

// Also expose globally for plugins that load before module system
window.__APP_HOOKS__ = hooks

export default hooks
