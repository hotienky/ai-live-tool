import PromotionManager from './components/PromotionManager.vue'
import FlashSaleManager from './components/FlashSaleManager.vue'

const PLUGIN_ID = 'marketing'
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
      key: 'marketing-group',
      label: t('marketing.title', 'Marketing'),
      icon: 'Tag',
      featureGroup: 'store',
      moduleId: 'marketing',
      activeKeys: ['shop/promotions', 'shop/flash-sales', 'shop/flash-sales/create', 'shop/flash-sales/edit'],
      children: [
        { key: 'shop/promotions', view: 'shop/promotions', label: t('marketing.promotions', 'Khuyến mãi'), icon: 'Tag', moduleId: 'marketing' },
        { key: 'shop/flash-sales', view: 'shop/flash-sales', label: 'Flash Sale', icon: 'Zap', moduleId: 'marketing' },
      ],
    })
    return items
  })

  hooks.addFilter('admin_routes', (config) => {
    Object.assign(config.routeToTab, {
      'shop/promotions': 'promotions',
      'shop/flash-sales': 'flash-sales',
      'shop/flash-sales/create': 'flash-sales',
      'shop/flash-sales/edit': 'flash-sales',
    })
    return config
  })
  }
}
const plugin = {
  id: PLUGIN_ID,
  name: 'Marketing & Khuyến mãi',
  version: '1.0.0',
  components: {
    'promotions': PromotionManager,
    'flash-sales': FlashSaleManager,
  },
  sidebar: {
    group: 'Marketing',
    items: [
      { key: 'promotions', label: 'Khuyến mãi', icon: 'Tag', route: 'shop/promotions' },
      { key: 'flash-sales', label: 'Flash Sale', icon: 'Zap', route: 'shop/flash-sales' },
    ],
  },
}


plugin.initHooks = initHooks;
export default plugin
