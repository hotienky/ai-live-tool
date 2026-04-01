import PromotionManager from './components/PromotionManager.vue'
import FlashSaleManager from './components/FlashSaleManager.vue'

const PLUGIN_ID = 'marketing'

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
  
  // Register Marketing blocks for CMS Page Builder
  if (bridge?.registerBlock) {
    bridge.registerBlock({
      type: 'flash-sale-list',
      plugin: 'marketing',
      name: 'Flash Sale (Giờ Vàng)',
      icon: 'Zap', // Map to Zap or similar later
      description: 'Hiển thị danh sách sản phẩm Flash Sale đang diễn ra kèm đồng hồ đếm ngược',
      defaultSettings: {
        title: '⚡ FLASH SALE ĐANG DIỄN RA',
        limit: 5,
        show_countdown: true,
      },
      settingsSchema: [
        { key: 'title', type: 'text', label: 'Tiêu đề' },
        { key: 'limit', type: 'number', label: 'Số sản phẩm', placeholder: '5' },
        { key: 'show_countdown', type: 'toggle', label: 'Hiển thị đếm ngược' },
      ],
    })
  }
  
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
}


plugin.initHooks = initHooks;
export default plugin
