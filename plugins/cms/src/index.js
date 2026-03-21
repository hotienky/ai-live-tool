import CmsManager from './components/CmsManager.vue'

const PLUGIN_ID = 'cms'
const bridge = window.__APP_BRIDGE__
const hooks = bridge?.hooks || window.__APP_HOOKS__
const t = bridge?.t || ((k, fb) => fb)

// ── Register via Hooks ──
if (hooks) {
  hooks.addFilter('sidebar_items', (items) => {
    items.push({
      key: 'shop/cms',
      label: t('cms.pages', 'Trang CMS'),
      icon: 'BookOpen',
      featureGroup: 'store',
      moduleId: 'cms',
    })
    return items
  })

  hooks.addFilter('admin_routes', (config) => {
    Object.assign(config.routeToTab, {
      'shop/cms': 'cms',
      'shop/cms/create': 'cms',
      'shop/cms/edit': 'cms',
    })
    return config
  })
}

const plugin = {
  id: PLUGIN_ID,
  name: 'Trang CMS',
  version: '1.0.0',
  components: {
    'cms': CmsManager,
  },
  sidebar: {
    group: 'Giao diện',
    items: [
      { key: 'cms', label: 'Trang CMS', icon: 'BookOpen', route: 'shop/cms' },
    ],
  },
}

window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
window.__PLUGIN_REGISTRY__[PLUGIN_ID] = plugin
window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: PLUGIN_ID, plugin } }))

export default plugin
