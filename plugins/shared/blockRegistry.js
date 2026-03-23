// Block Registry — singleton store for all registered page builder blocks
// Usage: bridge.registerBlock(blockDef) from any plugin
//
// blockDef shape:
// {
//   type: string          - unique key, e.g. 'blog-collection'
//   plugin: string        - owning plugin ID, e.g. 'blog'
//   name: string          - display name shown in builder palette
//   icon: string          - Lucide icon name
//   description: string   - short description
//   settingsSchema: Array - config field definitions (used by BlockConfigPanel)
//   defaultSettings: Object - default values for settings
// }
//
// settingsSchema field shape:
// { key, type, label, placeholder?, options?, default? }
// Supported types: text, textarea, richtext, code, number, select, radio, toggle, image, api-select

const _blocks = []
const _listeners = []

function notify(block) {
  _listeners.forEach(fn => {
    try { fn(block) } catch {}
  })
}

export const blockRegistry = {
  /**
   * Register a block type. Plugins call bridge.registerBlock() which delegates here.
   */
  register(blockDef) {
    if (!blockDef?.type || !blockDef?.plugin) {
      console.warn('[BlockRegistry] Missing required fields: type, plugin', blockDef)
      return
    }
    // Prevent duplicate registration
    if (_blocks.find(b => b.plugin === blockDef.plugin && b.type === blockDef.type)) return

    const block = {
      type: blockDef.type,
      plugin: blockDef.plugin,
      name: blockDef.name || blockDef.type,
      icon: blockDef.icon || 'Box',
      description: blockDef.description || '',
      settingsSchema: Array.isArray(blockDef.settingsSchema) ? blockDef.settingsSchema : [],
      defaultSettings: blockDef.defaultSettings || {},
    }

    _blocks.push(block)
    notify(block)
    window.dispatchEvent(new CustomEvent('block:registered', { detail: block }))
  },

  /** Get all registered blocks across all plugins */
  getAll() {
    return [..._blocks]
  },

  /** Get all blocks registered by a specific plugin */
  getByPlugin(pluginId) {
    return _blocks.filter(b => b.plugin === pluginId)
  },

  /** Find a single block definition by type */
  getByType(type) {
    return _blocks.find(b => b.type === type) || null
  },

  /**
   * Subscribe to new block registrations.
   * Returns an unsubscribe function.
   */
  onChange(fn) {
    _listeners.push(fn)
    return () => {
      const i = _listeners.indexOf(fn)
      if (i !== -1) _listeners.splice(i, 1)
    }
  },

  /** Get blocks grouped by plugin — used by BlockPalette UI */
  getGrouped() {
    const groups = {}
    for (const block of _blocks) {
      if (!groups[block.plugin]) groups[block.plugin] = []
      groups[block.plugin].push(block)
    }
    return groups
  },
}
