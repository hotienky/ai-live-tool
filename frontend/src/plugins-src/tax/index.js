import TaxManagement from './components/TaxManagement.vue'

const PLUGIN_ID = 'tax'
const bridge = window.__APP_BRIDGE__
const hooks = bridge?.hooks || window.__APP_HOOKS__
const t = bridge?.t || ((k, fb) => fb)

// ── Register via Hooks ──

const initHooks = () => {
  const bridge = window.__APP_BRIDGE__
  const hooks = bridge?.hooks || window.__APP_HOOKS__
  const t = bridge?.t || ((k, fb) => fb)
  const Icons = window.LucideVueNext || {}
  if (hooks) {
    
  hooks.addFilter('sidebar_items', (items) => {
    items.push({
      key: 'shop/tax',
      label: t('tax.title', 'Thuế'),
      icon: 'Receipt',
      featureGroup: 'store',
      moduleId: 'tax',
    })
    return items
  })

  hooks.addFilter('admin_routes', (config) => {
    Object.assign(config.routeToTab, {
      'shop/tax': 'tax',
    })
    return config
  })
  }
}
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


plugin.initHooks = initHooks;
export default plugin
