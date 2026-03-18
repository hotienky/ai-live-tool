import PromotionManager from './components/PromotionManager.vue'
import FlashSaleManager from './components/FlashSaleManager.vue'

const PLUGIN_ID = 'marketing'

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

window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
window.__PLUGIN_REGISTRY__[PLUGIN_ID] = plugin
window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: PLUGIN_ID, plugin } }))

export default plugin
