import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'shops.index': { paramsTuple?: []; params?: {} }
    'shops.store': { paramsTuple?: []; params?: {} }
    'shops.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shops.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shops.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shops.find_or_create': { paramsTuple?: []; params?: {} }
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
    'leads.index': { paramsTuple?: []; params?: {} }
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
    'auth.me': { paramsTuple?: []; params?: {} }
    'shops.index': { paramsTuple?: []; params?: {} }
    'shops.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.index': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'templates.index': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'products.index': { paramsTuple?: []; params?: {} }
    'leads.index': { paramsTuple?: []; params?: {} }
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
    'schedules.index': { paramsTuple?: []; params?: {} }
    'schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'leads.index': { paramsTuple?: []; params?: {} }
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
    'schedules.index': { paramsTuple?: []; params?: {} }
    'schedules.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'orders.store': { paramsTuple?: []; params?: {} }
    'schedules.store': { paramsTuple?: []; params?: {} }
    'replies.generate': { paramsTuple?: []; params?: {} }
    'replies.sentiment': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'shops.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'schedules.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'shops.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'shopId': ParamValue,'id': ParamValue} }
    'templates.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'shopId': ParamValue,'id': ParamValue} }
    'products.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'schedules.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}