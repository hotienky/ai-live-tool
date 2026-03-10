import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'shops.index': { paramsTuple?: []; params?: {} }
    'shops.store': { paramsTuple?: []; params?: {} }
    'shops.find_or_create': { paramsTuple?: []; params?: {} }
    'shops.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shops.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shops.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.index': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'keywords.store': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'keywords.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'shopId': ParamValue,'id': ParamValue} }
    'templates.index': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'templates.store': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'templates.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'shopId': ParamValue,'id': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'products.store': { paramsTuple?: []; params?: {} }
    'products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.index': { paramsTuple?: []; params?: {} }
    'brands.store': { paramsTuple?: []; params?: {} }
    'brands.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.index': { paramsTuple?: []; params?: {} }
    'leads.stats': { paramsTuple?: []; params?: {} }
    'leads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.pipeline_stats': { paramsTuple?: []; params?: {} }
    'dashboard.overview': { paramsTuple?: []; params?: {} }
    'dashboard.recent_leads': { paramsTuple?: []; params?: {} }
    'dashboard.analytics': { paramsTuple?: []; params?: {} }
    'dashboard.top_customers': { paramsTuple?: []; params?: {} }
    'analytics.daily': { paramsTuple?: []; params?: {} }
    'analytics.hourly': { paramsTuple?: []; params?: {} }
    'analytics.conversion': { paramsTuple?: []; params?: {} }
    'analytics.top_keywords': { paramsTuple?: []; params?: {} }
    'analytics.summary': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.unread_count': { paramsTuple?: []; params?: {} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'customers.index': { paramsTuple?: []; params?: {} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sessions.index': { paramsTuple?: []; params?: {} }
    'sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.index': { paramsTuple?: []; params?: {} }
    'orders.stats': { paramsTuple?: []; params?: {} }
    'orders.store': { paramsTuple?: []; params?: {} }
    'orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_details': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_totals': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_history': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_order_statuses': { paramsTuple?: []; params?: {} }
    'orders.get_payment_statuses': { paramsTuple?: []; params?: {} }
    'carts.show': { paramsTuple?: []; params?: {} }
    'carts.add_item': { paramsTuple?: []; params?: {} }
    'carts.update_item': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'carts.remove_item': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'carts.checkout': { paramsTuple?: []; params?: {} }
    'schedules.index': { paramsTuple?: []; params?: {} }
    'schedules.store': { paramsTuple?: []; params?: {} }
    'schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'schedules.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'schedules.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.index': { paramsTuple?: []; params?: {} }
    'shop_customers.store': { paramsTuple?: []; params?: {} }
    'shop_customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.list_addresses': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'shop_customers.add_address': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'shop_customers.update_address': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'shop_customers.delete_address': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'promotions.index': { paramsTuple?: []; params?: {} }
    'promotions.store': { paramsTuple?: []; params?: {} }
    'promotions.destroy_promotion': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'promotions.list_coupons': { paramsTuple?: []; params?: {} }
    'promotions.store_coupon': { paramsTuple?: []; params?: {} }
    'promotions.update_coupon': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'promotions.destroy_coupon': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'promotions.validate_coupon': { paramsTuple?: []; params?: {} }
    'cms_pages.index': { paramsTuple?: []; params?: {} }
    'cms_pages.store': { paramsTuple?: []; params?: {} }
    'cms_pages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cms_pages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cms_pages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners_new.index': { paramsTuple?: []; params?: {} }
    'banners_new.store': { paramsTuple?: []; params?: {} }
    'banners_new.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners_new.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.index': { paramsTuple?: []; params?: {} }
    'nav_links.flat': { paramsTuple?: []; params?: {} }
    'nav_links.store': { paramsTuple?: []; params?: {} }
    'nav_links.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.reorder': { paramsTuple?: []; params?: {} }
    'products.adjust_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exports.leads': { paramsTuple?: []; params?: {} }
    'exports.comments': { paramsTuple?: []; params?: {} }
    'exports.customers': { paramsTuple?: []; params?: {} }
    'exports.report': { paramsTuple?: []; params?: {} }
    'replies.generate': { paramsTuple?: []; params?: {} }
    'replies.sentiment': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'shops.index': { paramsTuple?: []; params?: {} }
    'shops.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.index': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'templates.index': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'brands.index': { paramsTuple?: []; params?: {} }
    'leads.index': { paramsTuple?: []; params?: {} }
    'leads.stats': { paramsTuple?: []; params?: {} }
    'leads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.pipeline_stats': { paramsTuple?: []; params?: {} }
    'dashboard.overview': { paramsTuple?: []; params?: {} }
    'dashboard.recent_leads': { paramsTuple?: []; params?: {} }
    'dashboard.analytics': { paramsTuple?: []; params?: {} }
    'dashboard.top_customers': { paramsTuple?: []; params?: {} }
    'analytics.daily': { paramsTuple?: []; params?: {} }
    'analytics.hourly': { paramsTuple?: []; params?: {} }
    'analytics.conversion': { paramsTuple?: []; params?: {} }
    'analytics.top_keywords': { paramsTuple?: []; params?: {} }
    'analytics.summary': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.unread_count': { paramsTuple?: []; params?: {} }
    'customers.index': { paramsTuple?: []; params?: {} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sessions.index': { paramsTuple?: []; params?: {} }
    'sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.index': { paramsTuple?: []; params?: {} }
    'orders.stats': { paramsTuple?: []; params?: {} }
    'orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_details': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_totals': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_history': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_order_statuses': { paramsTuple?: []; params?: {} }
    'orders.get_payment_statuses': { paramsTuple?: []; params?: {} }
    'carts.show': { paramsTuple?: []; params?: {} }
    'schedules.index': { paramsTuple?: []; params?: {} }
    'schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.index': { paramsTuple?: []; params?: {} }
    'shop_customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.list_addresses': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'promotions.index': { paramsTuple?: []; params?: {} }
    'promotions.list_coupons': { paramsTuple?: []; params?: {} }
    'cms_pages.index': { paramsTuple?: []; params?: {} }
    'cms_pages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners_new.index': { paramsTuple?: []; params?: {} }
    'nav_links.index': { paramsTuple?: []; params?: {} }
    'nav_links.flat': { paramsTuple?: []; params?: {} }
    'exports.leads': { paramsTuple?: []; params?: {} }
    'exports.comments': { paramsTuple?: []; params?: {} }
    'exports.customers': { paramsTuple?: []; params?: {} }
    'exports.report': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'shops.index': { paramsTuple?: []; params?: {} }
    'shops.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.index': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'templates.index': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'brands.index': { paramsTuple?: []; params?: {} }
    'leads.index': { paramsTuple?: []; params?: {} }
    'leads.stats': { paramsTuple?: []; params?: {} }
    'leads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.pipeline_stats': { paramsTuple?: []; params?: {} }
    'dashboard.overview': { paramsTuple?: []; params?: {} }
    'dashboard.recent_leads': { paramsTuple?: []; params?: {} }
    'dashboard.analytics': { paramsTuple?: []; params?: {} }
    'dashboard.top_customers': { paramsTuple?: []; params?: {} }
    'analytics.daily': { paramsTuple?: []; params?: {} }
    'analytics.hourly': { paramsTuple?: []; params?: {} }
    'analytics.conversion': { paramsTuple?: []; params?: {} }
    'analytics.top_keywords': { paramsTuple?: []; params?: {} }
    'analytics.summary': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.unread_count': { paramsTuple?: []; params?: {} }
    'customers.index': { paramsTuple?: []; params?: {} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sessions.index': { paramsTuple?: []; params?: {} }
    'sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.index': { paramsTuple?: []; params?: {} }
    'orders.stats': { paramsTuple?: []; params?: {} }
    'orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_details': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_totals': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_history': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.get_order_statuses': { paramsTuple?: []; params?: {} }
    'orders.get_payment_statuses': { paramsTuple?: []; params?: {} }
    'carts.show': { paramsTuple?: []; params?: {} }
    'schedules.index': { paramsTuple?: []; params?: {} }
    'schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.index': { paramsTuple?: []; params?: {} }
    'shop_customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.list_addresses': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'promotions.index': { paramsTuple?: []; params?: {} }
    'promotions.list_coupons': { paramsTuple?: []; params?: {} }
    'cms_pages.index': { paramsTuple?: []; params?: {} }
    'cms_pages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners_new.index': { paramsTuple?: []; params?: {} }
    'nav_links.index': { paramsTuple?: []; params?: {} }
    'nav_links.flat': { paramsTuple?: []; params?: {} }
    'exports.leads': { paramsTuple?: []; params?: {} }
    'exports.comments': { paramsTuple?: []; params?: {} }
    'exports.customers': { paramsTuple?: []; params?: {} }
    'exports.report': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'shops.store': { paramsTuple?: []; params?: {} }
    'shops.find_or_create': { paramsTuple?: []; params?: {} }
    'keywords.store': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'templates.store': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'products.store': { paramsTuple?: []; params?: {} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'brands.store': { paramsTuple?: []; params?: {} }
    'orders.store': { paramsTuple?: []; params?: {} }
    'carts.add_item': { paramsTuple?: []; params?: {} }
    'carts.checkout': { paramsTuple?: []; params?: {} }
    'schedules.store': { paramsTuple?: []; params?: {} }
    'shop_customers.store': { paramsTuple?: []; params?: {} }
    'shop_customers.add_address': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'promotions.store': { paramsTuple?: []; params?: {} }
    'promotions.store_coupon': { paramsTuple?: []; params?: {} }
    'promotions.validate_coupon': { paramsTuple?: []; params?: {} }
    'cms_pages.store': { paramsTuple?: []; params?: {} }
    'banners_new.store': { paramsTuple?: []; params?: {} }
    'nav_links.store': { paramsTuple?: []; params?: {} }
    'nav_links.reorder': { paramsTuple?: []; params?: {} }
    'products.adjust_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'replies.generate': { paramsTuple?: []; params?: {} }
    'replies.sentiment': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'shops.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'carts.update_item': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'schedules.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.update_address': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'promotions.update_coupon': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cms_pages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners_new.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'shops.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'shopId': ParamValue,'id': ParamValue} }
    'templates.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'shopId': ParamValue,'id': ParamValue} }
    'products.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'carts.remove_item': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'schedules.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.delete_address': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'promotions.destroy_promotion': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'promotions.destroy_coupon': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cms_pages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners_new.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}