/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'master_auth.login': {
    methods: ["POST"]
    pattern: '/api/master/auth/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/master_auth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/master_auth_controller').default['login']>>>
    }
  }
  'master_auth.me': {
    methods: ["GET","HEAD"]
    pattern: '/api/master/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/master_auth_controller').default['me']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/master_auth_controller').default['me']>>>
    }
  }
  'master_auth.logout': {
    methods: ["POST"]
    pattern: '/api/master/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/master_auth_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/master_auth_controller').default['logout']>>>
    }
  }
  'tenant.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/master/tenants'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['index']>>>
    }
  }
  'tenant.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/master/tenants/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['show']>>>
    }
  }
  'tenant.store': {
    methods: ["POST"]
    pattern: '/api/master/tenants'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['store']>>>
    }
  }
  'tenant.update': {
    methods: ["PUT"]
    pattern: '/api/master/tenants/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['update']>>>
    }
  }
  'tenant.destroy': {
    methods: ["DELETE"]
    pattern: '/api/master/tenants/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['destroy']>>>
    }
  }
  'tenant.suspend': {
    methods: ["POST"]
    pattern: '/api/master/tenants/:id/suspend'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['suspend']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['suspend']>>>
    }
  }
  'tenant.activate': {
    methods: ["POST"]
    pattern: '/api/master/tenants/:id/activate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['activate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['activate']>>>
    }
  }
  'tenant.migrate': {
    methods: ["POST"]
    pattern: '/api/master/tenants/:id/migrate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['migrate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['migrate']>>>
    }
  }
  'tenant.seed': {
    methods: ["POST"]
    pattern: '/api/master/tenants/:id/seed'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['seed']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/tenant_controller').default['seed']>>>
    }
  }
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
  'shop_auth.register': {
    methods: ["POST"]
    pattern: '/api/shop/auth/register'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['register']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['register']>>>
    }
  }
  'shop_auth.login': {
    methods: ["POST"]
    pattern: '/api/shop/auth/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['login']>>>
    }
  }
  'shop_auth.me': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['me']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['me']>>>
    }
  }
  'shop_auth.update_profile': {
    methods: ["PUT"]
    pattern: '/api/shop/auth/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['updateProfile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['updateProfile']>>>
    }
  }
  'shop_auth.change_password': {
    methods: ["PUT"]
    pattern: '/api/shop/auth/password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['changePassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['changePassword']>>>
    }
  }
  'shop_auth.forgot_password': {
    methods: ["POST"]
    pattern: '/api/shop/auth/forgot-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['forgotPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['forgotPassword']>>>
    }
  }
  'shop_auth.reset_password': {
    methods: ["POST"]
    pattern: '/api/shop/auth/reset-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['resetPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_auth_controller').default['resetPassword']>>>
    }
  }
  'storefront.products': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop/store/:storeId/products'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { storeId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['products']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['products']>>>
    }
  }
  'storefront.product_detail': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop/store/:storeId/products/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { storeId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['productDetail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['productDetail']>>>
    }
  }
  'storefront.categories': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop/store/:storeId/categories'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { storeId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['categories']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['categories']>>>
    }
  }
  'storefront.brands': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop/store/:storeId/brands'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { storeId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['brands']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['brands']>>>
    }
  }
  'storefront.banners': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop/store/:storeId/banners'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { storeId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['banners']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['banners']>>>
    }
  }
  'storefront.pages': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop/store/:storeId/pages'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { storeId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['pages']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['pages']>>>
    }
  }
  'storefront.page_detail': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop/store/:storeId/pages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { storeId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['pageDetail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['pageDetail']>>>
    }
  }
  'storefront.store_info': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop/store/:storeId/info'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { storeId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['storeInfo']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_controller').default['storeInfo']>>>
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
  'shops.find_or_create': {
    methods: ["POST"]
    pattern: '/api/shops/find-or-create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['findOrCreate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shops_controller').default['findOrCreate']>>>
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
  'categories.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['index']>>>
    }
  }
  'categories.store': {
    methods: ["POST"]
    pattern: '/api/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['store']>>>
    }
  }
  'categories.update': {
    methods: ["PUT"]
    pattern: '/api/categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['update']>>>
    }
  }
  'categories.destroy': {
    methods: ["DELETE"]
    pattern: '/api/categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['destroy']>>>
    }
  }
  'brands.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/brands'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/brands_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/brands_controller').default['index']>>>
    }
  }
  'brands.store': {
    methods: ["POST"]
    pattern: '/api/brands'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/brands_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/brands_controller').default['store']>>>
    }
  }
  'brands.update': {
    methods: ["PUT"]
    pattern: '/api/brands/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/brands_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/brands_controller').default['update']>>>
    }
  }
  'brands.destroy': {
    methods: ["DELETE"]
    pattern: '/api/brands/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/brands_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/brands_controller').default['destroy']>>>
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
  'leads.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/leads/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['pipelineStats']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/leads_controller').default['pipelineStats']>>>
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
  'dashboard.order_stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/dashboard/order-stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['orderStats']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['orderStats']>>>
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
  'analytics.revenue': {
    methods: ["GET","HEAD"]
    pattern: '/api/analytics/revenue'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['revenue']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['revenue']>>>
    }
  }
  'notifications.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/notifications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['index']>>>
    }
  }
  'notifications.unread_count': {
    methods: ["GET","HEAD"]
    pattern: '/api/notifications/unread-count'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['unreadCount']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['unreadCount']>>>
    }
  }
  'notifications.mark_read': {
    methods: ["PUT"]
    pattern: '/api/notifications/:id/read'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markRead']>>>
    }
  }
  'notifications.mark_all_read': {
    methods: ["PUT"]
    pattern: '/api/notifications/read-all'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markAllRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markAllRead']>>>
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
  'orders.get_details': {
    methods: ["GET","HEAD"]
    pattern: '/api/orders/:id/details'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getDetails']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getDetails']>>>
    }
  }
  'orders.get_totals': {
    methods: ["GET","HEAD"]
    pattern: '/api/orders/:id/totals'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getTotals']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getTotals']>>>
    }
  }
  'orders.get_history': {
    methods: ["GET","HEAD"]
    pattern: '/api/orders/:id/history'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getHistory']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getHistory']>>>
    }
  }
  'orders.update_status': {
    methods: ["PUT"]
    pattern: '/api/orders/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['updateStatus']>>>
    }
  }
  'orders.get_order_statuses': {
    methods: ["GET","HEAD"]
    pattern: '/api/order-statuses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getOrderStatuses']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getOrderStatuses']>>>
    }
  }
  'orders.get_payment_statuses': {
    methods: ["GET","HEAD"]
    pattern: '/api/payment-statuses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getPaymentStatuses']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['getPaymentStatuses']>>>
    }
  }
  'carts.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/cart'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['show']>>>
    }
  }
  'carts.add_item': {
    methods: ["POST"]
    pattern: '/api/cart/items'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['addItem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['addItem']>>>
    }
  }
  'carts.update_item': {
    methods: ["PUT"]
    pattern: '/api/cart/items/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['updateItem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['updateItem']>>>
    }
  }
  'carts.remove_item': {
    methods: ["DELETE"]
    pattern: '/api/cart/items/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['removeItem']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['removeItem']>>>
    }
  }
  'carts.checkout': {
    methods: ["POST"]
    pattern: '/api/cart/checkout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['checkout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['checkout']>>>
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
  'shop_customers.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop-customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['index']>>>
    }
  }
  'shop_customers.store': {
    methods: ["POST"]
    pattern: '/api/shop-customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['store']>>>
    }
  }
  'shop_customers.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop-customers/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['show']>>>
    }
  }
  'shop_customers.update': {
    methods: ["PUT"]
    pattern: '/api/shop-customers/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['update']>>>
    }
  }
  'shop_customers.destroy': {
    methods: ["DELETE"]
    pattern: '/api/shop-customers/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['destroy']>>>
    }
  }
  'shop_customers.list_addresses': {
    methods: ["GET","HEAD"]
    pattern: '/api/shop-customers/:customerId/addresses'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { customerId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['listAddresses']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['listAddresses']>>>
    }
  }
  'shop_customers.add_address': {
    methods: ["POST"]
    pattern: '/api/shop-customers/:customerId/addresses'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { customerId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['addAddress']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['addAddress']>>>
    }
  }
  'shop_customers.update_address': {
    methods: ["PUT"]
    pattern: '/api/shop-customers/:customerId/addresses/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { customerId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['updateAddress']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['updateAddress']>>>
    }
  }
  'shop_customers.delete_address': {
    methods: ["DELETE"]
    pattern: '/api/shop-customers/:customerId/addresses/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { customerId: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['deleteAddress']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shop_customers_controller').default['deleteAddress']>>>
    }
  }
  'promotions.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/promotions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['index']>>>
    }
  }
  'promotions.store': {
    methods: ["POST"]
    pattern: '/api/promotions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['store']>>>
    }
  }
  'promotions.destroy_promotion': {
    methods: ["DELETE"]
    pattern: '/api/promotions/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['destroyPromotion']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['destroyPromotion']>>>
    }
  }
  'promotions.list_coupons': {
    methods: ["GET","HEAD"]
    pattern: '/api/coupons'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['listCoupons']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['listCoupons']>>>
    }
  }
  'promotions.store_coupon': {
    methods: ["POST"]
    pattern: '/api/coupons'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['storeCoupon']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['storeCoupon']>>>
    }
  }
  'promotions.update_coupon': {
    methods: ["PUT"]
    pattern: '/api/coupons/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['updateCoupon']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['updateCoupon']>>>
    }
  }
  'promotions.destroy_coupon': {
    methods: ["DELETE"]
    pattern: '/api/coupons/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['destroyCoupon']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['destroyCoupon']>>>
    }
  }
  'promotions.validate_coupon': {
    methods: ["POST"]
    pattern: '/api/coupons/validate'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['validateCoupon']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/promotions_controller').default['validateCoupon']>>>
    }
  }
  'cms_pages.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/cms-pages'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['index']>>>
    }
  }
  'cms_pages.store': {
    methods: ["POST"]
    pattern: '/api/cms-pages'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['store']>>>
    }
  }
  'cms_pages.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/cms-pages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['show']>>>
    }
  }
  'cms_pages.update': {
    methods: ["PUT"]
    pattern: '/api/cms-pages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['update']>>>
    }
  }
  'cms_pages.destroy': {
    methods: ["DELETE"]
    pattern: '/api/cms-pages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cms_pages_controller').default['destroy']>>>
    }
  }
  'banners_new.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/banners'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['index']>>>
    }
  }
  'banners_new.store': {
    methods: ["POST"]
    pattern: '/api/banners'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['store']>>>
    }
  }
  'banners_new.update': {
    methods: ["PUT"]
    pattern: '/api/banners/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['update']>>>
    }
  }
  'banners_new.destroy': {
    methods: ["DELETE"]
    pattern: '/api/banners/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/banners_controller').default['destroy']>>>
    }
  }
  'nav_links.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/nav-links'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['index']>>>
    }
  }
  'nav_links.flat': {
    methods: ["GET","HEAD"]
    pattern: '/api/nav-links/flat'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['flat']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['flat']>>>
    }
  }
  'nav_links.store': {
    methods: ["POST"]
    pattern: '/api/nav-links'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['store']>>>
    }
  }
  'nav_links.update': {
    methods: ["PUT"]
    pattern: '/api/nav-links/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['update']>>>
    }
  }
  'nav_links.destroy': {
    methods: ["DELETE"]
    pattern: '/api/nav-links/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['destroy']>>>
    }
  }
  'nav_links.reorder': {
    methods: ["POST"]
    pattern: '/api/nav-links/reorder'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['reorder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/nav_links_controller').default['reorder']>>>
    }
  }
  'webhooks.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/webhooks'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['index']>>>
    }
  }
  'webhooks.store': {
    methods: ["POST"]
    pattern: '/api/webhooks'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['store']>>>
    }
  }
  'webhooks.update': {
    methods: ["PUT"]
    pattern: '/api/webhooks/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['update']>>>
    }
  }
  'webhooks.destroy': {
    methods: ["DELETE"]
    pattern: '/api/webhooks/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['destroy']>>>
    }
  }
  'activity_logs.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/activity-logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_logs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_logs_controller').default['index']>>>
    }
  }
  'activity_logs.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/activity-logs/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_logs_controller').default['stats']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_logs_controller').default['stats']>>>
    }
  }
  'activity_logs.entity_types': {
    methods: ["GET","HEAD"]
    pattern: '/api/activity-logs/entity-types'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/activity_logs_controller').default['entityTypes']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/activity_logs_controller').default['entityTypes']>>>
    }
  }
  'roles.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['index']>>>
    }
  }
  'roles.permissions': {
    methods: ["GET","HEAD"]
    pattern: '/api/roles/permissions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['permissions']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['permissions']>>>
    }
  }
  'roles.store': {
    methods: ["POST"]
    pattern: '/api/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['store']>>>
    }
  }
  'roles.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['show']>>>
    }
  }
  'roles.update': {
    methods: ["PUT"]
    pattern: '/api/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['update']>>>
    }
  }
  'roles.destroy': {
    methods: ["DELETE"]
    pattern: '/api/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['destroy']>>>
    }
  }
  'roles.users': {
    methods: ["GET","HEAD"]
    pattern: '/api/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['users']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['users']>>>
    }
  }
  'roles.assign_role': {
    methods: ["PUT"]
    pattern: '/api/users/:id/role'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['assignRole']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/roles_controller').default['assignRole']>>>
    }
  }
  'carts.show_wishlist': {
    methods: ["GET","HEAD"]
    pattern: '/api/wishlist'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['showWishlist']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['showWishlist']>>>
    }
  }
  'carts.add_to_wishlist': {
    methods: ["POST"]
    pattern: '/api/wishlist'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['addToWishlist']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['addToWishlist']>>>
    }
  }
  'carts.remove_from_wishlist': {
    methods: ["DELETE"]
    pattern: '/api/wishlist/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['removeFromWishlist']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['removeFromWishlist']>>>
    }
  }
  'carts.show_compare': {
    methods: ["GET","HEAD"]
    pattern: '/api/compare'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['showCompare']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['showCompare']>>>
    }
  }
  'carts.add_to_compare': {
    methods: ["POST"]
    pattern: '/api/compare'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['addToCompare']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['addToCompare']>>>
    }
  }
  'carts.remove_from_compare': {
    methods: ["DELETE"]
    pattern: '/api/compare/:productId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['removeFromCompare']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/carts_controller').default['removeFromCompare']>>>
    }
  }
  'system_config.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/system-config'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/system_config_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/system_config_controller').default['index']>>>
    }
  }
  'system_config.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/system-config/:group'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { group: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/system_config_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/system_config_controller').default['show']>>>
    }
  }
  'system_config.update': {
    methods: ["PUT"]
    pattern: '/api/system-config/:group'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { group: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/system_config_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/system_config_controller').default['update']>>>
    }
  }
  'api_keys.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/api-keys'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/api_keys_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/api_keys_controller').default['index']>>>
    }
  }
  'api_keys.store': {
    methods: ["POST"]
    pattern: '/api/api-keys'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/api_keys_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/api_keys_controller').default['store']>>>
    }
  }
  'api_keys.update': {
    methods: ["PUT"]
    pattern: '/api/api-keys/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/api_keys_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/api_keys_controller').default['update']>>>
    }
  }
  'api_keys.destroy': {
    methods: ["DELETE"]
    pattern: '/api/api-keys/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/api_keys_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/api_keys_controller').default['destroy']>>>
    }
  }
  'languages.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/languages'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['index']>>>
    }
  }
  'languages.store': {
    methods: ["POST"]
    pattern: '/api/languages'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['store']>>>
    }
  }
  'languages.update': {
    methods: ["PUT"]
    pattern: '/api/languages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['update']>>>
    }
  }
  'languages.destroy': {
    methods: ["DELETE"]
    pattern: '/api/languages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['destroy']>>>
    }
  }
  'languages.get_translations': {
    methods: ["GET","HEAD"]
    pattern: '/api/languages/:id/translations'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['getTranslations']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['getTranslations']>>>
    }
  }
  'languages.update_translations': {
    methods: ["PUT"]
    pattern: '/api/languages/:id/translations'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['updateTranslations']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/languages_controller').default['updateTranslations']>>>
    }
  }
  'custom_fields.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/custom-fields'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['index']>>>
    }
  }
  'custom_fields.store': {
    methods: ["POST"]
    pattern: '/api/custom-fields'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['store']>>>
    }
  }
  'custom_fields.update': {
    methods: ["PUT"]
    pattern: '/api/custom-fields/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['update']>>>
    }
  }
  'custom_fields.destroy': {
    methods: ["DELETE"]
    pattern: '/api/custom-fields/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['destroy']>>>
    }
  }
  'custom_fields.get_values': {
    methods: ["GET","HEAD"]
    pattern: '/api/custom-fields/values/:entityType/:entityId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { entityType: ParamValue; entityId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['getValues']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['getValues']>>>
    }
  }
  'custom_fields.save_values': {
    methods: ["PUT"]
    pattern: '/api/custom-fields/values/:entityType/:entityId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { entityType: ParamValue; entityId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['saveValues']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/custom_fields_controller').default['saveValues']>>>
    }
  }
  'products.adjust_stock': {
    methods: ["POST"]
    pattern: '/api/products/:id/adjust-stock'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['adjustStock']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['adjustStock']>>>
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
