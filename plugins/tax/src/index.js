import TaxManagement from './components/TaxManagement.vue'

const PLUGIN_ID = 'tax'

const plugin = {
  id: PLUGIN_ID,
  name: 'Quản lý Thuế',
  version: '1.0.0',
  components: {
    'tax': TaxManagement,
  },
  sidebar: {
    group: 'Bán hàng',
    items: [
      { key: 'tax', label: 'Thuế', icon: 'Receipt', route: 'shop/tax' },
    ],
  },
}

window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
window.__PLUGIN_REGISTRY__[PLUGIN_ID] = plugin
window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: PLUGIN_ID, plugin } }))

export default plugin
