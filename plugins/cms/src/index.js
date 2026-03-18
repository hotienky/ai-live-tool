import CmsManager from './components/CmsManager.vue'

const PLUGIN_ID = 'cms'

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
