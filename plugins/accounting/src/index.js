import AccountingDashboard from './components/AccountingDashboard.vue'
import PaymentVoucherManager from './components/PaymentVoucherManager.vue'

const PLUGIN_ID = 'accounting'

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
