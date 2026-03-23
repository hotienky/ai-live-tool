// E-commerce Core Plugin — Entry Point
// Registers e-commerce navigation, routes, AND components via Hooks + Plugin Registry

import ProductManager from './components/ProductManager.vue'
import OrderManagement from './components/OrderManagement.vue'
import OrderDetailPage from './components/OrderDetailPage.vue'
import CustomerManager from './components/CustomerManager.vue'
import CustomerDetail from './components/CustomerDetail.vue'
import CategoryManager from './components/CategoryManager.vue'
import BrandManager from './components/BrandManager.vue'
import InvoicePreviewModal from './components/InvoicePreviewModal.vue'
import PricingSuggestion from './components/PricingSuggestion.vue'

const PLUGIN_ID = 'ecom'
const bridge = window.__APP_BRIDGE__
const hooks = bridge?.hooks || window.__APP_HOOKS__
const t = bridge?.t || ((k, fb) => fb)
const Icons = window.LucideVueNext || {}

// ══════════════════════════════════════
// Register sidebar items via hooks
// ══════════════════════════════════════
if (hooks) {
  hooks.addFilter('sidebar_items', (items) => {
    // Insert Store group (after Live group)
    const storeGroup = {
      key: 'shop/products',
      label: t('admin.store', 'Cửa hàng'),
      icon: Icons.Store || 'Store',
      featureGroup: 'store',
      permission: 'products.view',
      moduleId: 'ecom',
    }
    items.push(storeGroup)
    return items
  }, 5) // priority 5 = runs before other store-related plugins

  hooks.addFilter('admin_routes', (config) => {
    Object.assign(config.routeToTab, {
      'shop/products': 'products',
      'shop/products/edit': 'products',
      'shop/categories': 'categories',
      'shop/categories/edit': 'categories',
      'shop/brands': 'brands',
      'shop/banners': 'banners',
      'shop/media': 'media',
      'shop/appearance': 'appearance',
      'shop/layout': 'storefront-layout',
      'shop/info': 'store-info',
      'shop/config': 'system-config',
      'shop/payment': 'payment',
      'shop/shipping': 'shipping',
      'shop/languages': 'languages',
      'shop/custom-fields': 'custom-fields',
      'orders': 'orders',
      'orders/customers': 'shop-customers',
      'orders/detail': 'order-detail',
    })
    return config
  }, 5)
}

const plugin = {
  id: PLUGIN_ID,
  name: 'E-commerce Core',
  version: '1.0.0',
  components: {
    'products': ProductManager,
    'categories': CategoryManager,
    'brands': BrandManager,
    'orders': OrderManagement,
    'order-detail': OrderDetailPage,
    'shop-customers': CustomerManager,
    'customer-detail': CustomerDetail,
    'invoice-preview': InvoicePreviewModal,
    'pricing-suggestion': PricingSuggestion,
  },
  sidebar: {
    group: 'Cửa hàng',
    items: [
      { key: 'products', label: 'Sản phẩm', icon: 'ShoppingBag', route: 'shop/products' },
      { key: 'categories', label: 'Danh mục', icon: 'FolderTree', route: 'shop/categories' },
      { key: 'brands', label: 'Thương hiệu', icon: 'Award', route: 'shop/brands' },
      { key: 'orders', label: 'Đơn hàng', icon: 'Receipt', route: 'orders' },
      { key: 'customers', label: 'Khách hàng', icon: 'Users', route: 'orders/customers' },
    ],
  },
}

// ── Register Ecom page builder blocks ───────────────────────────────
if (bridge?.registerBlock) {
  bridge.registerBlock({
    type: 'product-listing',
    plugin: 'ecom',
    name: 'Danh sách sản phẩm',
    icon: 'ShoppingBag',
    description: 'Hiển thị lưới sản phẩm từ danh mục hoặc thương hiệu',
    defaultSettings: {
      title: 'Sản phẩm',
      category_id: null,
      brand_id: null,
      limit: 8,
      sort: 'newest',
      layout: 'grid',
      show_view_all: true,
    },
    settingsSchema: [
      { key: 'title', type: 'text', label: 'Tiêu đề section' },
      { key: 'category_id', type: 'api-select', label: 'Danh mục', endpoint: '/categories', placeholder: 'Tất cả danh mục' },
      { key: 'brand_id', type: 'api-select', label: 'Thương hiệu', endpoint: '/brands', placeholder: 'Tất cả thương hiệu' },
      { key: 'limit', type: 'number', label: 'Số sản phẩm hiển thị', placeholder: '8' },
      { key: 'sort', type: 'select', label: 'Sắp xếp', options: [
        { value: 'newest', label: 'Mới nhất' },
        { value: 'popular', label: 'Bán chạy' },
        { value: 'price_asc', label: 'Giá tăng dần' },
        { value: 'price_desc', label: 'Giá giảm dần' },
      ]},
      { key: 'layout', type: 'radio', label: 'Kiểu hiển thị', options: [
        { value: 'grid', label: 'Lưới' },
        { value: 'list', label: 'Danh sách' },
      ]},
      { key: 'show_view_all', type: 'toggle', label: 'Hiển thị nút "Xem tất cả"' },
    ],
  })

  bridge.registerBlock({
    type: 'featured-products',
    plugin: 'ecom',
    name: 'Sản phẩm nổi bật',
    icon: 'Star',
    description: 'Hiển thị sản phẩm được gắn cờ nổi bật',
    defaultSettings: {
      title: 'Sản phẩm nổi bật',
      limit: 4,
    },
    settingsSchema: [
      { key: 'title', type: 'text', label: 'Tiêu đề section' },
      { key: 'limit', type: 'number', label: 'Số sản phẩm', placeholder: '4' },
    ],
  })

  bridge.registerBlock({
    type: 'product-categories',
    plugin: 'ecom',
    name: 'Danh mục sản phẩm',
    icon: 'FolderTree',
    description: 'Hiển thị lưới danh mục sản phẩm có ảnh',
    defaultSettings: {
      title: 'Danh mục',
      limit: 6,
      show_count: true,
    },
    settingsSchema: [
      { key: 'title', type: 'text', label: 'Tiêu đề section' },
      { key: 'limit', type: 'number', label: 'Số danh mục hiển thị', placeholder: '6' },
      { key: 'show_count', type: 'toggle', label: 'Hiển thị số lượng sản phẩm' },
    ],
  })
}

window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
window.__PLUGIN_REGISTRY__[PLUGIN_ID] = plugin
window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: PLUGIN_ID, plugin } }))

export default plugin
