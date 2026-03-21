// Warehouse Plugin — Entry Point
// Registers components to window.__PLUGIN_REGISTRY__ for dynamic loading
import StockReceiptManager from './components/StockReceiptManager.vue'
import SupplierManager from './components/SupplierManager.vue'
import PurchaseOrderManager from './components/PurchaseOrderManager.vue'
import InventoryReportPanel from './components/InventoryReportPanel.vue'

const PLUGIN_ID = 'warehouse'
const bridge = window.__APP_BRIDGE__
const hooks = bridge?.hooks || window.__APP_HOOKS__
const t = bridge?.t || ((k, fb) => fb)

// ── Register via Hooks ──
if (hooks) {
  hooks.addFilter('sidebar_items', (items) => {
    items.push({
      key: 'warehouse-group',
      label: t('warehouse.title', 'Kho & Tài chính'),
      icon: 'ClipboardList',
      featureGroup: 'store',
      moduleId: 'warehouse',
      activeKeys: ['warehouse/stock-receipts', 'warehouse/suppliers', 'warehouse/purchase-orders', 'warehouse/inventory-reports'],
      children: [
        { key: 'warehouse/stock-receipts', view: 'warehouse/stock-receipts', label: t('warehouse.stock_receipts', 'Phiếu kho'), icon: 'ClipboardList', moduleId: 'warehouse' },
        { key: 'warehouse/suppliers', view: 'warehouse/suppliers', label: t('warehouse.suppliers', 'Nhà cung cấp'), icon: 'Briefcase', moduleId: 'warehouse' },
        { key: 'warehouse/purchase-orders', view: 'warehouse/purchase-orders', label: t('warehouse.purchase_orders', 'Đơn Nhập Hàng'), icon: 'ShoppingCart', moduleId: 'warehouse' },
        { key: 'warehouse/inventory-reports', view: 'warehouse/inventory-reports', label: t('warehouse.inventory_reports', 'Báo cáo kho'), icon: 'BarChart2', moduleId: 'warehouse' },
      ],
    })
    return items
  })

  hooks.addFilter('admin_routes', (config) => {
    Object.assign(config.routeToTab, {
      'warehouse/stock-receipts': 'stock-receipts',
      'warehouse/suppliers': 'suppliers',
      'warehouse/purchase-orders': 'purchase-orders',
      'warehouse/inventory-reports': 'inventory-reports',
      'warehouse/payment-vouchers': 'payment-vouchers',
    })
    return config
  })
}

const plugin = {
  id: PLUGIN_ID,
  name: 'Quản lý Kho',
  version: '1.0.0',
  components: {
    'stock-receipts': StockReceiptManager,
    'suppliers': SupplierManager,
    'purchase-orders': PurchaseOrderManager,
    'inventory-reports': InventoryReportPanel,
  },
  sidebar: {
    group: 'Kho & Tài chính',
    items: [
      { key: 'stock-receipts', label: 'Phiếu kho', icon: 'ClipboardList', route: 'warehouse/stock-receipts' },
      { key: 'suppliers', label: 'Nhà cung cấp', icon: 'Briefcase', route: 'warehouse/suppliers' },
      { key: 'purchase-orders', label: 'Đơn Nhập Hàng', icon: 'ShoppingCart', route: 'warehouse/purchase-orders' },
      { key: 'inventory-reports', label: 'Báo cáo kho', icon: 'BarChart2', route: 'warehouse/inventory-reports' },
    ],
  },
}

// Register globally
window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
window.__PLUGIN_REGISTRY__[PLUGIN_ID] = plugin

// Dispatch event so main app knows plugin loaded
window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: PLUGIN_ID, plugin } }))

export default plugin

