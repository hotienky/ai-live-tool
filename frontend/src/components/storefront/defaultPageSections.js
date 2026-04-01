/**
 * Default section presets for each built-in page type.
 * When a user opens a built-in page for the first time and no saved layout exists,
 * these sections are used as the starting point — fully composable via the builder.
 *
 * Each section mirrors the standard sections array format:
 *   { type, enabled, order, params }
 *
 * The storefront renderer reads this JSON and maps each section type
 * to its corresponding Vue component + auto-fetches data from the dataSource.
 */

export const defaultPageSections = {
  products: [
    { type: 'page_breadcrumb', enabled: true, order: 0, params: { showHome: true, separator: '»' } },
    { type: 'page_heading', enabled: true, order: 1, params: { title: 'Sản Phẩm', subtitle: '', alignment: 'left', tag: 'h1' } },
    { type: 'product_grid', enabled: true, order: 2, params: {
      columns: 4, itemsPerPage: 12, sidebarPosition: 'left',
      showFilters_category: true, showFilters_brand: true, showFilters_price: true,
      sortDefault: 'newest', cardStyle: 'default',
    }},
    { type: 'newsletter', enabled: false, order: 3, params: { title: 'Nhận ưu đãi mới nhất', subtitle: 'Đăng ký email để nhận thông tin khuyến mãi', buttonText: 'Đăng ký' } },
  ],

  productDetail: [
    { type: 'page_breadcrumb', enabled: true, order: 0, params: { showHome: true, separator: '»' } },
    { type: 'product_detail_view', enabled: true, order: 1, params: {
      galleryStyle: 'thumbnails', layoutRatio: '50-50',
      showBreadcrumb: false, showSKU: true, showStock: true, showShare: true,
    }},
    { type: 'related_products', enabled: true, order: 2, params: { title: 'Sản phẩm liên quan', count: 6, columns: 4, layoutStyle: 'carousel' } },
    { type: 'product_reviews', enabled: true, order: 3, params: { showRatingSummary: true, showWriteReview: true, perPage: 10 } },
  ],

  cart: [
    { type: 'page_breadcrumb', enabled: true, order: 0, params: { showHome: true, separator: '»' } },
    { type: 'page_heading', enabled: true, order: 1, params: { title: 'Giỏ Hàng', subtitle: '', alignment: 'left', tag: 'h1' } },
    { type: 'cart_summary', enabled: true, order: 2, params: {
      showThumbnails: true, showQuantityControls: true, showCoupon: true, layout: 'full',
    }},
    { type: 'related_products', enabled: false, order: 3, params: { title: 'Có thể bạn cũng thích', count: 4, columns: 4, layoutStyle: 'carousel' } },
  ],

  checkout: [
    { type: 'checkout_form', enabled: true, order: 0, params: {
      layout: 'two-column', showCoupon: true, showNotes: true, showSteps: true,
    }},
  ],

  auth: [
    { type: 'auth_form', enabled: true, order: 0, params: {
      allowRegister: true, allowForgotPassword: true, cardMaxWidth: 440, showSocialLogin: false,
    }},
  ],

  account: [
    { type: 'page_breadcrumb', enabled: true, order: 0, params: { showHome: true, separator: '»' } },
    { type: 'account_dashboard', enabled: true, order: 1, params: {
      sidebarPosition: 'left', showOrders: true, showAddresses: true, showPasswordChange: true,
    }},
  ],

  wishlist: [
    { type: 'page_breadcrumb', enabled: true, order: 0, params: { showHome: true, separator: '»' } },
    { type: 'page_heading', enabled: true, order: 1, params: { title: 'Sản Phẩm Yêu Thích', subtitle: '', alignment: 'left', tag: 'h1' } },
    { type: 'wishlist_grid', enabled: true, order: 2, params: { columns: 4, emptyMessage: 'Chưa có sản phẩm yêu thích nào' } },
  ],

  order_tracking: [
    { type: 'page_breadcrumb', enabled: true, order: 0, params: { showHome: true, separator: '»' } },
    { type: 'page_heading', enabled: true, order: 1, params: { title: 'Tra Cứu Đơn Hàng', subtitle: 'Nhập mã đơn hàng để theo dõi trạng thái', alignment: 'center', tag: 'h1' } },
    { type: 'order_history', enabled: true, order: 2, params: { perPage: 10, showStatus: true } },
  ],

  blog: [
    { type: 'page_breadcrumb', enabled: true, order: 0, params: { showHome: true, separator: '»' } },
    { type: 'page_heading', enabled: true, order: 1, params: { title: 'Blog', subtitle: '', alignment: 'left', tag: 'h1' } },
    { type: 'blog_listing', enabled: true, order: 2, params: { columns: 3, postsPerPage: 9, layout: 'grid', showSidebar: false } },
    { type: 'newsletter', enabled: false, order: 3, params: { title: 'Đăng ký nhận bài mới', subtitle: '', buttonText: 'Đăng ký' } },
  ],
}

/**
 * Maps built-in page IDs (e.g. '__products') to their slug used in defaultPageSections.
 */
export function getPageSlugFromId(pageId) {
  if (!pageId || !pageId.startsWith('__')) return null
  if (pageId.startsWith('__template_')) return null
  return pageId.slice(2) // '__products' → 'products'
}

/**
 * Get default sections for a built-in page type.
 * Returns a deep copy so mutations don't affect the defaults.
 */
export function getDefaultSectionsForPage(pageSlug) {
  const defaults = defaultPageSections[pageSlug]
  if (!defaults) return []
  return JSON.parse(JSON.stringify(defaults))
}
