/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  masterAuth: {
    login: typeof routes['master_auth.login']
    me: typeof routes['master_auth.me']
    logout: typeof routes['master_auth.logout']
  }
  tenant: {
    index: typeof routes['tenant.index']
    show: typeof routes['tenant.show']
    store: typeof routes['tenant.store']
    update: typeof routes['tenant.update']
    destroy: typeof routes['tenant.destroy']
    suspend: typeof routes['tenant.suspend']
    activate: typeof routes['tenant.activate']
    migrate: typeof routes['tenant.migrate']
    seed: typeof routes['tenant.seed']
  }
  auth: {
    register: typeof routes['auth.register']
    login: typeof routes['auth.login']
    me: typeof routes['auth.me']
  }
  shopAuth: {
    register: typeof routes['shop_auth.register']
    login: typeof routes['shop_auth.login']
    me: typeof routes['shop_auth.me']
    updateProfile: typeof routes['shop_auth.update_profile']
    changePassword: typeof routes['shop_auth.change_password']
    forgotPassword: typeof routes['shop_auth.forgot_password']
    resetPassword: typeof routes['shop_auth.reset_password']
  }
  storefront: {
    products: typeof routes['storefront.products']
    productDetail: typeof routes['storefront.product_detail']
    categories: typeof routes['storefront.categories']
    brands: typeof routes['storefront.brands']
    banners: typeof routes['storefront.banners']
    pages: typeof routes['storefront.pages']
    pageDetail: typeof routes['storefront.page_detail']
    storeInfo: typeof routes['storefront.store_info']
  }
  shops: {
    index: typeof routes['shops.index']
    store: typeof routes['shops.store']
    findOrCreate: typeof routes['shops.find_or_create']
    show: typeof routes['shops.show']
    update: typeof routes['shops.update']
    destroy: typeof routes['shops.destroy']
  }
  keywords: {
    index: typeof routes['keywords.index']
    store: typeof routes['keywords.store']
    destroy: typeof routes['keywords.destroy']
  }
  templates: {
    index: typeof routes['templates.index']
    store: typeof routes['templates.store']
    destroy: typeof routes['templates.destroy']
  }
  products: {
    index: typeof routes['products.index']
    store: typeof routes['products.store']
    update: typeof routes['products.update']
    destroy: typeof routes['products.destroy']
    adjustStock: typeof routes['products.adjust_stock']
  }
  categories: {
    index: typeof routes['categories.index']
    store: typeof routes['categories.store']
    update: typeof routes['categories.update']
    destroy: typeof routes['categories.destroy']
  }
  brands: {
    index: typeof routes['brands.index']
    store: typeof routes['brands.store']
    update: typeof routes['brands.update']
    destroy: typeof routes['brands.destroy']
  }
  leads: {
    index: typeof routes['leads.index']
    stats: typeof routes['leads.stats']
    show: typeof routes['leads.show']
    update: typeof routes['leads.update']
    destroy: typeof routes['leads.destroy']
    pipelineStats: typeof routes['leads.pipeline_stats']
  }
  dashboard: {
    overview: typeof routes['dashboard.overview']
    recentLeads: typeof routes['dashboard.recent_leads']
    analytics: typeof routes['dashboard.analytics']
    topCustomers: typeof routes['dashboard.top_customers']
    orderStats: typeof routes['dashboard.order_stats']
  }
  analytics: {
    daily: typeof routes['analytics.daily']
    hourly: typeof routes['analytics.hourly']
    conversion: typeof routes['analytics.conversion']
    topKeywords: typeof routes['analytics.top_keywords']
    summary: typeof routes['analytics.summary']
    revenue: typeof routes['analytics.revenue']
  }
  notifications: {
    index: typeof routes['notifications.index']
    unreadCount: typeof routes['notifications.unread_count']
    markRead: typeof routes['notifications.mark_read']
    markAllRead: typeof routes['notifications.mark_all_read']
  }
  customers: {
    index: typeof routes['customers.index']
    show: typeof routes['customers.show']
    update: typeof routes['customers.update']
    destroy: typeof routes['customers.destroy']
  }
  sessions: {
    index: typeof routes['sessions.index']
    show: typeof routes['sessions.show']
  }
  orders: {
    index: typeof routes['orders.index']
    stats: typeof routes['orders.stats']
    store: typeof routes['orders.store']
    show: typeof routes['orders.show']
    update: typeof routes['orders.update']
    destroy: typeof routes['orders.destroy']
    getDetails: typeof routes['orders.get_details']
    getTotals: typeof routes['orders.get_totals']
    getHistory: typeof routes['orders.get_history']
    updateStatus: typeof routes['orders.update_status']
    getOrderStatuses: typeof routes['orders.get_order_statuses']
    getPaymentStatuses: typeof routes['orders.get_payment_statuses']
  }
  carts: {
    show: typeof routes['carts.show']
    addItem: typeof routes['carts.add_item']
    updateItem: typeof routes['carts.update_item']
    removeItem: typeof routes['carts.remove_item']
    checkout: typeof routes['carts.checkout']
    showWishlist: typeof routes['carts.show_wishlist']
    addToWishlist: typeof routes['carts.add_to_wishlist']
    removeFromWishlist: typeof routes['carts.remove_from_wishlist']
    showCompare: typeof routes['carts.show_compare']
    addToCompare: typeof routes['carts.add_to_compare']
    removeFromCompare: typeof routes['carts.remove_from_compare']
  }
  schedules: {
    index: typeof routes['schedules.index']
    store: typeof routes['schedules.store']
    show: typeof routes['schedules.show']
    update: typeof routes['schedules.update']
    destroy: typeof routes['schedules.destroy']
  }
  shopCustomers: {
    index: typeof routes['shop_customers.index']
    store: typeof routes['shop_customers.store']
    show: typeof routes['shop_customers.show']
    update: typeof routes['shop_customers.update']
    destroy: typeof routes['shop_customers.destroy']
    listAddresses: typeof routes['shop_customers.list_addresses']
    addAddress: typeof routes['shop_customers.add_address']
    updateAddress: typeof routes['shop_customers.update_address']
    deleteAddress: typeof routes['shop_customers.delete_address']
  }
  promotions: {
    index: typeof routes['promotions.index']
    store: typeof routes['promotions.store']
    destroyPromotion: typeof routes['promotions.destroy_promotion']
    listCoupons: typeof routes['promotions.list_coupons']
    storeCoupon: typeof routes['promotions.store_coupon']
    updateCoupon: typeof routes['promotions.update_coupon']
    destroyCoupon: typeof routes['promotions.destroy_coupon']
    validateCoupon: typeof routes['promotions.validate_coupon']
  }
  cmsPages: {
    index: typeof routes['cms_pages.index']
    store: typeof routes['cms_pages.store']
    show: typeof routes['cms_pages.show']
    update: typeof routes['cms_pages.update']
    destroy: typeof routes['cms_pages.destroy']
  }
  bannersNew: {
    index: typeof routes['banners_new.index']
    store: typeof routes['banners_new.store']
    update: typeof routes['banners_new.update']
    destroy: typeof routes['banners_new.destroy']
  }
  navLinks: {
    index: typeof routes['nav_links.index']
    flat: typeof routes['nav_links.flat']
    store: typeof routes['nav_links.store']
    update: typeof routes['nav_links.update']
    destroy: typeof routes['nav_links.destroy']
    reorder: typeof routes['nav_links.reorder']
  }
  webhooks: {
    index: typeof routes['webhooks.index']
    store: typeof routes['webhooks.store']
    update: typeof routes['webhooks.update']
    destroy: typeof routes['webhooks.destroy']
  }
  activityLogs: {
    index: typeof routes['activity_logs.index']
    stats: typeof routes['activity_logs.stats']
    entityTypes: typeof routes['activity_logs.entity_types']
  }
  roles: {
    index: typeof routes['roles.index']
    permissions: typeof routes['roles.permissions']
    store: typeof routes['roles.store']
    show: typeof routes['roles.show']
    update: typeof routes['roles.update']
    destroy: typeof routes['roles.destroy']
    users: typeof routes['roles.users']
    assignRole: typeof routes['roles.assign_role']
  }
  systemConfig: {
    index: typeof routes['system_config.index']
    show: typeof routes['system_config.show']
    update: typeof routes['system_config.update']
  }
  apiKeys: {
    index: typeof routes['api_keys.index']
    store: typeof routes['api_keys.store']
    update: typeof routes['api_keys.update']
    destroy: typeof routes['api_keys.destroy']
  }
  languages: {
    index: typeof routes['languages.index']
    store: typeof routes['languages.store']
    update: typeof routes['languages.update']
    destroy: typeof routes['languages.destroy']
    getTranslations: typeof routes['languages.get_translations']
    updateTranslations: typeof routes['languages.update_translations']
  }
  customFields: {
    index: typeof routes['custom_fields.index']
    store: typeof routes['custom_fields.store']
    update: typeof routes['custom_fields.update']
    destroy: typeof routes['custom_fields.destroy']
    getValues: typeof routes['custom_fields.get_values']
    saveValues: typeof routes['custom_fields.save_values']
  }
  exports: {
    leads: typeof routes['exports.leads']
    comments: typeof routes['exports.comments']
    customers: typeof routes['exports.customers']
    report: typeof routes['exports.report']
  }
  replies: {
    generate: typeof routes['replies.generate']
    sentiment: typeof routes['replies.sentiment']
  }
}
