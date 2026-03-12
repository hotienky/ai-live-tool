import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'master_auth.login': { paramsTuple?: []; params?: {} }
    'master_auth.me': { paramsTuple?: []; params?: {} }
    'master_auth.logout': { paramsTuple?: []; params?: {} }
    'tenant.index': { paramsTuple?: []; params?: {} }
    'tenant.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tenant.store': { paramsTuple?: []; params?: {} }
    'tenant.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tenant.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tenant.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tenant.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tenant.migrate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tenant.seed': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'storefront.products': { paramsTuple?: []; params?: {} }
    'storefront.product_detail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.categories': { paramsTuple?: []; params?: {} }
    'storefront.brands': { paramsTuple?: []; params?: {} }
    'storefront.banners': { paramsTuple?: []; params?: {} }
    'storefront.pages': { paramsTuple?: []; params?: {} }
    'storefront.page_detail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.store_info': { paramsTuple?: []; params?: {} }
    'legacy.storefront.products': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.productDetail': { paramsTuple: [ParamValue,ParamValue]; params: {'storeId': ParamValue,'id': ParamValue} }
    'legacy.storefront.categories': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.brands': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.banners': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.pages': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.pageDetail': { paramsTuple: [ParamValue,ParamValue]; params: {'storeId': ParamValue,'id': ParamValue} }
    'legacy.storefront.storeInfo': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'shop_auth.register': { paramsTuple?: []; params?: {} }
    'shop_auth.login': { paramsTuple?: []; params?: {} }
    'shop_auth.me': { paramsTuple?: []; params?: {} }
    'shop_auth.update_profile': { paramsTuple?: []; params?: {} }
    'shop_auth.change_password': { paramsTuple?: []; params?: {} }
    'shop_auth.forgot_password': { paramsTuple?: []; params?: {} }
    'shop_auth.reset_password': { paramsTuple?: []; params?: {} }
    'products.index': { paramsTuple?: []; params?: {} }
    'products.store': { paramsTuple?: []; params?: {} }
    'products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.adjust_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.index': { paramsTuple?: []; params?: {} }
    'brands.store': { paramsTuple?: []; params?: {} }
    'brands.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.index': { paramsTuple?: []; params?: {} }
    'leads.pipeline_stats': { paramsTuple?: []; params?: {} }
    'leads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.pipelineLegacy': { paramsTuple?: []; params?: {} }
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
    'carts.show_wishlist': { paramsTuple?: []; params?: {} }
    'carts.add_to_wishlist': { paramsTuple?: []; params?: {} }
    'carts.remove_from_wishlist': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'carts.show_compare': { paramsTuple?: []; params?: {} }
    'carts.add_to_compare': { paramsTuple?: []; params?: {} }
    'carts.remove_from_compare': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'promotions.index': { paramsTuple?: []; params?: {} }
    'promotions.store': { paramsTuple?: []; params?: {} }
    'promotions.destroy_promotion': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'promotions.list_coupons': { paramsTuple?: []; params?: {} }
    'promotions.store_coupon': { paramsTuple?: []; params?: {} }
    'promotions.update_coupon': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'promotions.destroy_coupon': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'promotions.validate_coupon': { paramsTuple?: []; params?: {} }
    'shop_customers.index': { paramsTuple?: []; params?: {} }
    'shop_customers.store': { paramsTuple?: []; params?: {} }
    'shop_customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.list_addresses': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'shop_customers.add_address': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'shop_customers.update_address': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'shop_customers.delete_address': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'cms_pages.index': { paramsTuple?: []; params?: {} }
    'cms_pages.store': { paramsTuple?: []; params?: {} }
    'cms_pages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cms_pages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'cms_pages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners.index': { paramsTuple?: []; params?: {} }
    'banners.store': { paramsTuple?: []; params?: {} }
    'banners.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.index': { paramsTuple?: []; params?: {} }
    'nav_links.flat': { paramsTuple?: []; params?: {} }
    'nav_links.store': { paramsTuple?: []; params?: {} }
    'nav_links.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.reorder': { paramsTuple?: []; params?: {} }
    'dashboard.overview': { paramsTuple?: []; params?: {} }
    'dashboard.recent_leads': { paramsTuple?: []; params?: {} }
    'dashboard.analytics': { paramsTuple?: []; params?: {} }
    'dashboard.top_customers': { paramsTuple?: []; params?: {} }
    'dashboard.order_stats': { paramsTuple?: []; params?: {} }
    'analytics.daily': { paramsTuple?: []; params?: {} }
    'analytics.hourly': { paramsTuple?: []; params?: {} }
    'analytics.conversion': { paramsTuple?: []; params?: {} }
    'analytics.top_keywords': { paramsTuple?: []; params?: {} }
    'analytics.summary': { paramsTuple?: []; params?: {} }
    'analytics.revenue': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.unread_count': { paramsTuple?: []; params?: {} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'webhooks.index': { paramsTuple?: []; params?: {} }
    'webhooks.store': { paramsTuple?: []; params?: {} }
    'webhooks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'webhooks.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'activity_logs.index': { paramsTuple?: []; params?: {} }
    'activity_logs.stats': { paramsTuple?: []; params?: {} }
    'activity_logs.entity_types': { paramsTuple?: []; params?: {} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.permissions': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.users': { paramsTuple?: []; params?: {} }
    'roles.assign_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'system_config.index': { paramsTuple?: []; params?: {} }
    'system_config.show': { paramsTuple: [ParamValue]; params: {'group': ParamValue} }
    'system_config.update': { paramsTuple: [ParamValue]; params: {'group': ParamValue} }
    'api_keys.index': { paramsTuple?: []; params?: {} }
    'api_keys.store': { paramsTuple?: []; params?: {} }
    'api_keys.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api_keys.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'languages.index': { paramsTuple?: []; params?: {} }
    'languages.store': { paramsTuple?: []; params?: {} }
    'languages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'languages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'languages.get_translations': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'languages.update_translations': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'custom_fields.index': { paramsTuple?: []; params?: {} }
    'custom_fields.store': { paramsTuple?: []; params?: {} }
    'custom_fields.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'custom_fields.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'custom_fields.get_values': { paramsTuple: [ParamValue,ParamValue]; params: {'entityType': ParamValue,'entityId': ParamValue} }
    'custom_fields.save_values': { paramsTuple: [ParamValue,ParamValue]; params: {'entityType': ParamValue,'entityId': ParamValue} }
    'shops.index': { paramsTuple?: []; params?: {} }
    'shops.store': { paramsTuple?: []; params?: {} }
    'shops.find_or_create': { paramsTuple?: []; params?: {} }
    'shops.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shops.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shops.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.index': { paramsTuple?: []; params?: {} }
    'keywords.store': { paramsTuple?: []; params?: {} }
    'keywords.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'templates.index': { paramsTuple?: []; params?: {} }
    'templates.store': { paramsTuple?: []; params?: {} }
    'templates.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'schedules.index': { paramsTuple?: []; params?: {} }
    'schedules.store': { paramsTuple?: []; params?: {} }
    'schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'schedules.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'schedules.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exports.leads': { paramsTuple?: []; params?: {} }
    'exports.comments': { paramsTuple?: []; params?: {} }
    'exports.customers': { paramsTuple?: []; params?: {} }
    'exports.report': { paramsTuple?: []; params?: {} }
    'replies.generate': { paramsTuple?: []; params?: {} }
    'replies.sentiment': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'master_auth.me': { paramsTuple?: []; params?: {} }
    'tenant.index': { paramsTuple?: []; params?: {} }
    'tenant.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'storefront.products': { paramsTuple?: []; params?: {} }
    'storefront.product_detail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.categories': { paramsTuple?: []; params?: {} }
    'storefront.brands': { paramsTuple?: []; params?: {} }
    'storefront.banners': { paramsTuple?: []; params?: {} }
    'storefront.pages': { paramsTuple?: []; params?: {} }
    'storefront.page_detail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.store_info': { paramsTuple?: []; params?: {} }
    'legacy.storefront.products': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.productDetail': { paramsTuple: [ParamValue,ParamValue]; params: {'storeId': ParamValue,'id': ParamValue} }
    'legacy.storefront.categories': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.brands': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.banners': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.pages': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.pageDetail': { paramsTuple: [ParamValue,ParamValue]; params: {'storeId': ParamValue,'id': ParamValue} }
    'legacy.storefront.storeInfo': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'shop_auth.me': { paramsTuple?: []; params?: {} }
    'products.index': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'brands.index': { paramsTuple?: []; params?: {} }
    'leads.index': { paramsTuple?: []; params?: {} }
    'leads.pipeline_stats': { paramsTuple?: []; params?: {} }
    'leads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.pipelineLegacy': { paramsTuple?: []; params?: {} }
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
    'carts.show_wishlist': { paramsTuple?: []; params?: {} }
    'carts.show_compare': { paramsTuple?: []; params?: {} }
    'promotions.index': { paramsTuple?: []; params?: {} }
    'promotions.list_coupons': { paramsTuple?: []; params?: {} }
    'shop_customers.index': { paramsTuple?: []; params?: {} }
    'shop_customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.list_addresses': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'cms_pages.index': { paramsTuple?: []; params?: {} }
    'cms_pages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners.index': { paramsTuple?: []; params?: {} }
    'nav_links.index': { paramsTuple?: []; params?: {} }
    'nav_links.flat': { paramsTuple?: []; params?: {} }
    'dashboard.overview': { paramsTuple?: []; params?: {} }
    'dashboard.recent_leads': { paramsTuple?: []; params?: {} }
    'dashboard.analytics': { paramsTuple?: []; params?: {} }
    'dashboard.top_customers': { paramsTuple?: []; params?: {} }
    'dashboard.order_stats': { paramsTuple?: []; params?: {} }
    'analytics.daily': { paramsTuple?: []; params?: {} }
    'analytics.hourly': { paramsTuple?: []; params?: {} }
    'analytics.conversion': { paramsTuple?: []; params?: {} }
    'analytics.top_keywords': { paramsTuple?: []; params?: {} }
    'analytics.summary': { paramsTuple?: []; params?: {} }
    'analytics.revenue': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.unread_count': { paramsTuple?: []; params?: {} }
    'webhooks.index': { paramsTuple?: []; params?: {} }
    'activity_logs.index': { paramsTuple?: []; params?: {} }
    'activity_logs.stats': { paramsTuple?: []; params?: {} }
    'activity_logs.entity_types': { paramsTuple?: []; params?: {} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.permissions': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.users': { paramsTuple?: []; params?: {} }
    'system_config.index': { paramsTuple?: []; params?: {} }
    'system_config.show': { paramsTuple: [ParamValue]; params: {'group': ParamValue} }
    'api_keys.index': { paramsTuple?: []; params?: {} }
    'languages.index': { paramsTuple?: []; params?: {} }
    'languages.get_translations': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'custom_fields.index': { paramsTuple?: []; params?: {} }
    'custom_fields.get_values': { paramsTuple: [ParamValue,ParamValue]; params: {'entityType': ParamValue,'entityId': ParamValue} }
    'shops.index': { paramsTuple?: []; params?: {} }
    'shops.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.index': { paramsTuple?: []; params?: {} }
    'templates.index': { paramsTuple?: []; params?: {} }
    'schedules.index': { paramsTuple?: []; params?: {} }
    'schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exports.leads': { paramsTuple?: []; params?: {} }
    'exports.comments': { paramsTuple?: []; params?: {} }
    'exports.customers': { paramsTuple?: []; params?: {} }
    'exports.report': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'master_auth.me': { paramsTuple?: []; params?: {} }
    'tenant.index': { paramsTuple?: []; params?: {} }
    'tenant.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'storefront.products': { paramsTuple?: []; params?: {} }
    'storefront.product_detail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.categories': { paramsTuple?: []; params?: {} }
    'storefront.brands': { paramsTuple?: []; params?: {} }
    'storefront.banners': { paramsTuple?: []; params?: {} }
    'storefront.pages': { paramsTuple?: []; params?: {} }
    'storefront.page_detail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.store_info': { paramsTuple?: []; params?: {} }
    'legacy.storefront.products': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.productDetail': { paramsTuple: [ParamValue,ParamValue]; params: {'storeId': ParamValue,'id': ParamValue} }
    'legacy.storefront.categories': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.brands': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.banners': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.pages': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'legacy.storefront.pageDetail': { paramsTuple: [ParamValue,ParamValue]; params: {'storeId': ParamValue,'id': ParamValue} }
    'legacy.storefront.storeInfo': { paramsTuple: [ParamValue]; params: {'storeId': ParamValue} }
    'shop_auth.me': { paramsTuple?: []; params?: {} }
    'products.index': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'brands.index': { paramsTuple?: []; params?: {} }
    'leads.index': { paramsTuple?: []; params?: {} }
    'leads.pipeline_stats': { paramsTuple?: []; params?: {} }
    'leads.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.pipelineLegacy': { paramsTuple?: []; params?: {} }
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
    'carts.show_wishlist': { paramsTuple?: []; params?: {} }
    'carts.show_compare': { paramsTuple?: []; params?: {} }
    'promotions.index': { paramsTuple?: []; params?: {} }
    'promotions.list_coupons': { paramsTuple?: []; params?: {} }
    'shop_customers.index': { paramsTuple?: []; params?: {} }
    'shop_customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.list_addresses': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'cms_pages.index': { paramsTuple?: []; params?: {} }
    'cms_pages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners.index': { paramsTuple?: []; params?: {} }
    'nav_links.index': { paramsTuple?: []; params?: {} }
    'nav_links.flat': { paramsTuple?: []; params?: {} }
    'dashboard.overview': { paramsTuple?: []; params?: {} }
    'dashboard.recent_leads': { paramsTuple?: []; params?: {} }
    'dashboard.analytics': { paramsTuple?: []; params?: {} }
    'dashboard.top_customers': { paramsTuple?: []; params?: {} }
    'dashboard.order_stats': { paramsTuple?: []; params?: {} }
    'analytics.daily': { paramsTuple?: []; params?: {} }
    'analytics.hourly': { paramsTuple?: []; params?: {} }
    'analytics.conversion': { paramsTuple?: []; params?: {} }
    'analytics.top_keywords': { paramsTuple?: []; params?: {} }
    'analytics.summary': { paramsTuple?: []; params?: {} }
    'analytics.revenue': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.unread_count': { paramsTuple?: []; params?: {} }
    'webhooks.index': { paramsTuple?: []; params?: {} }
    'activity_logs.index': { paramsTuple?: []; params?: {} }
    'activity_logs.stats': { paramsTuple?: []; params?: {} }
    'activity_logs.entity_types': { paramsTuple?: []; params?: {} }
    'roles.index': { paramsTuple?: []; params?: {} }
    'roles.permissions': { paramsTuple?: []; params?: {} }
    'roles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.users': { paramsTuple?: []; params?: {} }
    'system_config.index': { paramsTuple?: []; params?: {} }
    'system_config.show': { paramsTuple: [ParamValue]; params: {'group': ParamValue} }
    'api_keys.index': { paramsTuple?: []; params?: {} }
    'languages.index': { paramsTuple?: []; params?: {} }
    'languages.get_translations': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'custom_fields.index': { paramsTuple?: []; params?: {} }
    'custom_fields.get_values': { paramsTuple: [ParamValue,ParamValue]; params: {'entityType': ParamValue,'entityId': ParamValue} }
    'shops.index': { paramsTuple?: []; params?: {} }
    'shops.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.index': { paramsTuple?: []; params?: {} }
    'templates.index': { paramsTuple?: []; params?: {} }
    'schedules.index': { paramsTuple?: []; params?: {} }
    'schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exports.leads': { paramsTuple?: []; params?: {} }
    'exports.comments': { paramsTuple?: []; params?: {} }
    'exports.customers': { paramsTuple?: []; params?: {} }
    'exports.report': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'master_auth.login': { paramsTuple?: []; params?: {} }
    'master_auth.logout': { paramsTuple?: []; params?: {} }
    'tenant.store': { paramsTuple?: []; params?: {} }
    'tenant.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tenant.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tenant.migrate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tenant.seed': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'shop_auth.register': { paramsTuple?: []; params?: {} }
    'shop_auth.login': { paramsTuple?: []; params?: {} }
    'shop_auth.forgot_password': { paramsTuple?: []; params?: {} }
    'shop_auth.reset_password': { paramsTuple?: []; params?: {} }
    'products.store': { paramsTuple?: []; params?: {} }
    'products.adjust_stock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'brands.store': { paramsTuple?: []; params?: {} }
    'orders.store': { paramsTuple?: []; params?: {} }
    'carts.add_item': { paramsTuple?: []; params?: {} }
    'carts.checkout': { paramsTuple?: []; params?: {} }
    'carts.add_to_wishlist': { paramsTuple?: []; params?: {} }
    'carts.add_to_compare': { paramsTuple?: []; params?: {} }
    'promotions.store': { paramsTuple?: []; params?: {} }
    'promotions.store_coupon': { paramsTuple?: []; params?: {} }
    'promotions.validate_coupon': { paramsTuple?: []; params?: {} }
    'shop_customers.store': { paramsTuple?: []; params?: {} }
    'shop_customers.add_address': { paramsTuple: [ParamValue]; params: {'customerId': ParamValue} }
    'cms_pages.store': { paramsTuple?: []; params?: {} }
    'banners.store': { paramsTuple?: []; params?: {} }
    'nav_links.store': { paramsTuple?: []; params?: {} }
    'nav_links.reorder': { paramsTuple?: []; params?: {} }
    'webhooks.store': { paramsTuple?: []; params?: {} }
    'roles.store': { paramsTuple?: []; params?: {} }
    'api_keys.store': { paramsTuple?: []; params?: {} }
    'languages.store': { paramsTuple?: []; params?: {} }
    'custom_fields.store': { paramsTuple?: []; params?: {} }
    'shops.store': { paramsTuple?: []; params?: {} }
    'shops.find_or_create': { paramsTuple?: []; params?: {} }
    'keywords.store': { paramsTuple?: []; params?: {} }
    'templates.store': { paramsTuple?: []; params?: {} }
    'schedules.store': { paramsTuple?: []; params?: {} }
    'replies.generate': { paramsTuple?: []; params?: {} }
    'replies.sentiment': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'tenant.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_auth.update_profile': { paramsTuple?: []; params?: {} }
    'shop_auth.change_password': { paramsTuple?: []; params?: {} }
    'products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'carts.update_item': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'promotions.update_coupon': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.update_address': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'cms_pages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'webhooks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.assign_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'system_config.update': { paramsTuple: [ParamValue]; params: {'group': ParamValue} }
    'api_keys.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'languages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'languages.update_translations': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'custom_fields.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'custom_fields.save_values': { paramsTuple: [ParamValue,ParamValue]; params: {'entityType': ParamValue,'entityId': ParamValue} }
    'shops.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'schedules.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'tenant.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'brands.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'carts.remove_item': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'carts.remove_from_wishlist': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'carts.remove_from_compare': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'promotions.destroy_promotion': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'promotions.destroy_coupon': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shop_customers.delete_address': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'cms_pages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'banners.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'nav_links.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'webhooks.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api_keys.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'languages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'custom_fields.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shops.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'templates.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'schedules.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}