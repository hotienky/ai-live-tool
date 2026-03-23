// Plugin API Bridge
// Main app exposes these to window.__APP_BRIDGE__ so plugins can use them
// without importing directly from the main app's modules

import { blockRegistry } from './blockRegistry.js'

export function initPluginBridge(apiFetch, showToast) {
  window.__APP_BRIDGE__ = {
    apiFetch,
    showToast,
    Vue: window.Vue, // exposed by main app

    // ── Block Registry API ──────────────────────────────────────────
    // Plugins call bridge.registerBlock() to contribute blocks to the page builder.

    /** Register a block type from a plugin */
    registerBlock: (blockDef) => blockRegistry.register(blockDef),

    /** Get all registered blocks (across all plugins) */
    getBlocks: () => blockRegistry.getAll(),

    /** Get blocks from a specific plugin */
    getBlocksByPlugin: (pluginId) => blockRegistry.getByPlugin(pluginId),

    /** Find a block definition by type string */
    getBlockByType: (type) => blockRegistry.getByType(type),

    /** Get blocks grouped by plugin — used by the builder palette UI */
    getBlocksGrouped: () => blockRegistry.getGrouped(),

    /** Subscribe to block registration events — returns unsubscribe fn */
    onBlockRegistered: (fn) => blockRegistry.onChange(fn),

    /** Direct access to the registry for advanced use */
    blockRegistry,
  }
}

// Plugin-side helper to access the bridge
export function useAppBridge() {
  const bridge = window.__APP_BRIDGE__
  if (!bridge) {
    console.warn('[Plugin] App bridge not initialized')
    return {
      apiFetch: () => Promise.reject('Bridge not ready'),
      showToast: () => {},
      t: (key, fallback) => fallback || key,
      currentLang: { value: 'vi' },
    }
  }
  return bridge
}

// Plugin-side helper for i18n — use the main app's translation function
export function usePluginI18n() {
  const bridge = window.__APP_BRIDGE__
  const t = bridge?.t || ((key, fallback) => fallback || key)
  const currentLang = bridge?.currentLang || { value: 'vi' }
  return { t, currentLang }
}
