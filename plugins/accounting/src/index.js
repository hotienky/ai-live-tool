import AccountingDashboard from './components/AccountingDashboard.vue'
import PaymentVoucherManager from './components/PaymentVoucherManager.vue'

const PLUGIN_ID = 'accounting'
const bridge = window.__APP_BRIDGE__
const hooks = bridge?.hooks || window.__APP_HOOKS__
const t = bridge?.t || ((k, fb) => fb)

// ── Register via Hooks ──
if (hooks) {
  hooks.addFilter('sidebar_items', (items) => {
    // Accounting adds items into the existing nav structure
    // These will appear as part of the orders/warehouse area
    items.push({
      key: 'accounting-group',
      label: t('accounting.title', 'Kế toán'),
      icon: 'DollarSign',
      featureGroup: 'store',
      moduleId: 'accounting',
      activeKeys: ['orders/accounting', 'warehouse/payment-vouchers'],
      children: [
        { key: 'orders/accounting', view: 'orders/accounting', label: t('accounting.accounting', 'Kế toán'), icon: 'DollarSign', moduleId: 'accounting' },
        { key: 'warehouse/payment-vouchers', view: 'warehouse/payment-vouchers', label: t('accounting.payment_vouchers', 'Thu/Chi'), icon: 'Wallet', moduleId: 'accounting' },
      ],
    })
    return items
  })

  hooks.addFilter('admin_routes', (config) => {
    Object.assign(config.routeToTab, {
      'orders/accounting': 'accounting',
      'warehouse/payment-vouchers': 'payment-vouchers',
    })
    return config
  })
}

const plugin = {
  id: PLUGIN_ID,
  name: 'Kế toán & Tài chính',
  version: '1.0.0',
  components: {
    'accounting': AccountingDashboard,
    'payment-vouchers': PaymentVoucherManager,
  },
  sidebar: {
    group: 'Bán hàng',
    items: [
      { key: 'accounting', label: 'Kế toán', icon: 'DollarSign', route: 'orders/accounting' },
      { key: 'payment-vouchers', label: 'Thu/Chi', icon: 'Wallet', route: 'warehouse/payment-vouchers' },
    ],
  },
}

window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
window.__PLUGIN_REGISTRY__[PLUGIN_ID] = plugin
window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: PLUGIN_ID, plugin } }))

export default plugin
