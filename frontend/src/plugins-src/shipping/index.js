// Shipping Plugin — Entry Point
// Registers shipping navigation, routes, AND components via Hooks + Plugin Registry
import ShippingManagement from './components/ShippingManagement.vue'

const PLUGIN_ID = 'shipping'

const initHooks = () => {
  const bridge = window.__APP_BRIDGE__
  const hooks = bridge?.hooks || window.__APP_HOOKS__
  const t = bridge?.t || ((k, fb) => fb)
  const Icons = window.LucideVueNext || {}
  if (hooks) {
    
  hooks.addFilter('sidebar_items', (items) => {
    items.push({
      key: 'shop/shipping',
      label: t('shipping.title', 'Vận chuyển'),
      icon: Icons.Truck || 'Truck',
      featureGroup: 'store',
      moduleId: 'shipping',
    })
    return items
  })

  hooks.addFilter('admin_routes', (config) => {
    Object.assign(config.routeToTab, {
      'shop/shipping': 'shipping',
    })
    return config
  })
  }
}
const plugin = {
  id: PLUGIN_ID,
  name: 'Quản lý Vận chuyển',
  version: '1.0.0',
  components: {
    'shipping': ShippingManagement,
  },
}


plugin.initHooks = initHooks;
export default plugin
