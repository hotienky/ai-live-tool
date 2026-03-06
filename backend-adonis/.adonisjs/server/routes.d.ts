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
    'analytics.daily': { paramsTuple?: []; params?: {} }
    'analytics.hourly': { paramsTuple?: []; params?: {} }
    'analytics.conversion': { paramsTuple?: []; params?: {} }
    'analytics.top_keywords': { paramsTuple?: []; params?: {} }
    'analytics.summary': { paramsTuple?: []; params?: {} }
    'customers.index': { paramsTuple?: []; params?: {} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sessions.index': { paramsTuple?: []; params?: {} }
    'sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'analytics.daily': { paramsTuple?: []; params?: {} }
    'analytics.hourly': { paramsTuple?: []; params?: {} }
    'analytics.conversion': { paramsTuple?: []; params?: {} }
    'analytics.top_keywords': { paramsTuple?: []; params?: {} }
    'analytics.summary': { paramsTuple?: []; params?: {} }
    'customers.index': { paramsTuple?: []; params?: {} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sessions.index': { paramsTuple?: []; params?: {} }
    'sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'analytics.daily': { paramsTuple?: []; params?: {} }
    'analytics.hourly': { paramsTuple?: []; params?: {} }
    'analytics.conversion': { paramsTuple?: []; params?: {} }
    'analytics.top_keywords': { paramsTuple?: []; params?: {} }
    'analytics.summary': { paramsTuple?: []; params?: {} }
    'customers.index': { paramsTuple?: []; params?: {} }
    'customers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sessions.index': { paramsTuple?: []; params?: {} }
    'sessions.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'shops.store': { paramsTuple?: []; params?: {} }
    'keywords.store': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'templates.store': { paramsTuple: [ParamValue]; params: {'shopId': ParamValue} }
    'products.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'shops.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'shops.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'keywords.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'shopId': ParamValue,'id': ParamValue} }
    'templates.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'shopId': ParamValue,'id': ParamValue} }
    'products.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leads.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}