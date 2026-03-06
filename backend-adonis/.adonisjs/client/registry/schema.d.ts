/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.register': {
    methods: ["POST"]
    pattern: '/api/auth/register'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['register']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['register']>>>
    }
  }
  'auth.login': {
    methods: ["POST"]
    pattern: '/api/auth/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
    }
  }
  'auth.me': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
    }
  }
  'shops.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/shops'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['index']>>>
    }
  }
  'shops.store': {
    methods: ["POST"]
    pattern: '/api/shops'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['store']>>>
    }
  }
  'shops.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/shops/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['show']>>>
    }
  }
  'shops.update': {
    methods: ["PUT"]
    pattern: '/api/shops/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['update']>>>
    }
  }
  'shops.destroy': {
    methods: ["DELETE"]
    pattern: '/api/shops/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['destroy']>>>
    }
  }
  'keywords.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/shops/:shopId/keywords'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { shopId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/keywords_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/keywords_controller').default['index']>>>
    }
  }
  'keywords.store': {
    methods: ["POST"]
    pattern: '/api/shops/:shopId/keywords'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { shopId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/keywords_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/keywords_controller').default['store']>>>
    }
  }
  'keywords.destroy': {
    methods: ["DELETE"]
    pattern: '/api/shops/:shopId/keywords/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { shopId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/keywords_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/keywords_controller').default['destroy']>>>
    }
  }
  'templates.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/shops/:shopId/templates'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { shopId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/templates_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/templates_controller').default['index']>>>
    }
  }
  'templates.store': {
    methods: ["POST"]
    pattern: '/api/shops/:shopId/templates'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { shopId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/templates_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/templates_controller').default['store']>>>
    }
  }
  'templates.destroy': {
    methods: ["DELETE"]
    pattern: '/api/shops/:shopId/templates/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { shopId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/templates_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/templates_controller').default['destroy']>>>
    }
  }
  'products.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/products'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
    }
  }
  'products.store': {
    methods: ["POST"]
    pattern: '/api/products'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['store']>>>
    }
  }
  'products.update': {
    methods: ["PUT"]
    pattern: '/api/products/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['update']>>>
    }
  }
  'products.destroy': {
    methods: ["DELETE"]
    pattern: '/api/products/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['destroy']>>>
    }
  }
  'leads.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/leads'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['index']>>>
    }
  }
  'leads.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/leads/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['show']>>>
    }
  }
  'leads.update': {
    methods: ["PUT"]
    pattern: '/api/leads/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['update']>>>
    }
  }
  'leads.destroy': {
    methods: ["DELETE"]
    pattern: '/api/leads/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['destroy']>>>
    }
  }
  'leads.pipeline_stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/leads-pipeline'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['pipelineStats']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['pipelineStats']>>>
    }
  }
  'dashboard.overview': {
    methods: ["GET","HEAD"]
    pattern: '/api/dashboard/overview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['overview']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['overview']>>>
    }
  }
  'dashboard.recent_leads': {
    methods: ["GET","HEAD"]
    pattern: '/api/dashboard/recent-leads'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['recentLeads']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['recentLeads']>>>
    }
  }
  'dashboard.analytics': {
    methods: ["GET","HEAD"]
    pattern: '/api/dashboard/analytics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['analytics']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['analytics']>>>
    }
  }
  'dashboard.top_customers': {
    methods: ["GET","HEAD"]
    pattern: '/api/dashboard/top-customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['topCustomers']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['topCustomers']>>>
    }
  }
  'analytics.daily': {
    methods: ["GET","HEAD"]
    pattern: '/api/analytics/daily'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['daily']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['daily']>>>
    }
  }
  'analytics.hourly': {
    methods: ["GET","HEAD"]
    pattern: '/api/analytics/hourly'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['hourly']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['hourly']>>>
    }
  }
  'analytics.conversion': {
    methods: ["GET","HEAD"]
    pattern: '/api/analytics/conversion'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['conversion']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['conversion']>>>
    }
  }
  'analytics.top_keywords': {
    methods: ["GET","HEAD"]
    pattern: '/api/analytics/top-keywords'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['topKeywords']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['topKeywords']>>>
    }
  }
  'analytics.summary': {
    methods: ["GET","HEAD"]
    pattern: '/api/analytics/summary'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['summary']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['summary']>>>
    }
  }
  'customers.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['index']>>>
    }
  }
  'customers.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/customers/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['show']>>>
    }
  }
  'customers.update': {
    methods: ["PUT"]
    pattern: '/api/customers/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['update']>>>
    }
  }
  'customers.destroy': {
    methods: ["DELETE"]
    pattern: '/api/customers/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['destroy']>>>
    }
  }
  'sessions.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/sessions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['index']>>>
    }
  }
  'sessions.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/sessions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['show']>>>
    }
  }
  'orders.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['index']>>>
    }
  }
  'orders.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/orders/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['stats']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['stats']>>>
    }
  }
  'orders.store': {
    methods: ["POST"]
    pattern: '/api/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['store']>>>
    }
  }
  'orders.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/orders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['show']>>>
    }
  }
  'orders.update': {
    methods: ["PUT"]
    pattern: '/api/orders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['update']>>>
    }
  }
  'orders.destroy': {
    methods: ["DELETE"]
    pattern: '/api/orders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['destroy']>>>
    }
  }
  'schedules.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/schedules'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['index']>>>
    }
  }
  'schedules.store': {
    methods: ["POST"]
    pattern: '/api/schedules'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['store']>>>
    }
  }
  'schedules.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/schedules/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['show']>>>
    }
  }
  'schedules.update': {
    methods: ["PUT"]
    pattern: '/api/schedules/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['update']>>>
    }
  }
  'schedules.destroy': {
    methods: ["DELETE"]
    pattern: '/api/schedules/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['destroy']>>>
    }
  }
  'exports.leads': {
    methods: ["GET","HEAD"]
    pattern: '/api/export/leads'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exports_controller').default['leads']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exports_controller').default['leads']>>>
    }
  }
  'exports.comments': {
    methods: ["GET","HEAD"]
    pattern: '/api/export/comments'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exports_controller').default['comments']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exports_controller').default['comments']>>>
    }
  }
  'exports.customers': {
    methods: ["GET","HEAD"]
    pattern: '/api/export/customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exports_controller').default['customers']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exports_controller').default['customers']>>>
    }
  }
  'exports.report': {
    methods: ["GET","HEAD"]
    pattern: '/api/export/report'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exports_controller').default['report']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exports_controller').default['report']>>>
    }
  }
  'replies.generate': {
    methods: ["POST"]
    pattern: '/api/reply/generate'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/replies_controller').default['generate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/replies_controller').default['generate']>>>
    }
  }
  'replies.sentiment': {
    methods: ["POST"]
    pattern: '/api/reply/sentiment'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/replies_controller').default['sentiment']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/replies_controller').default['sentiment']>>>
    }
  }
}
