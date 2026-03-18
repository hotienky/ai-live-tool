// Warehouse Plugin — Entry Point
// Registers components to window.__PLUGIN_REGISTRY__ for dynamic loading
import StockReceiptManager from './components/StockReceiptManager.vue'
import SupplierManager from './components/SupplierManager.vue'
import PurchaseOrderManager from './components/PurchaseOrderManager.vue'
import InventoryReportPanel from './components/InventoryReportPanel.vue'

const PLUGIN_ID = 'warehouse'

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
      { key: 'purchase-orders', label: 'Đơn mua hàng', icon: 'ShoppingCart', route: 'warehouse/purchase-orders' },
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
