import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import TenantMiddleware from '../middleware/tenant_middleware.js'

// ── Sub-module route registrations ──
import { registerStorefrontRoutes } from './storefront.routes.js'
import { registerShopAuthRoutes } from './shop_auth.routes.js'
import { registerCatalogRoutes } from './catalog.routes.js'
import { registerCrmRoutes } from './crm.routes.js'
import { registerCommerceRoutes } from './commerce.routes.js'
import { registerContentRoutes } from './content.routes.js'
import { registerSystemRoutes } from './system.routes.js'
import { registerLiveRoutes } from './live.routes.js'

// Tenant middleware handler
const tenantMw = async (ctx: any, next: any) => {
  const mw = new TenantMiddleware()
  return mw.handle(ctx, next)
}

/**
 * Register all tenant-scoped routes.
 *
 * Architecture:
 *   storefront.routes  — Public customer-facing API (no auth)
 *   shop_auth.routes   — Customer registration/login (no auth)
 *   catalog.routes     — Products, Categories, Brands
 *   crm.routes         — Leads, Customers, Sessions
 *   commerce.routes    — Orders, Cart, Promotions, Shop Customers
 *   content.routes     — CMS Pages, Banners, Nav Links
 *   system.routes      — Dashboard, Analytics, Config, Roles, Webhooks, i18n, Custom Fields
 *   live.routes        — Shops, Keywords, Templates, Schedules, Exports, AI Reply, Connections
 */
export function registerTenantRoutes() {
  // 1. Public storefront (tenant-scoped, no auth)
  registerStorefrontRoutes()

  // 2. Shop customer auth (tenant-scoped, no auth)
  registerShopAuthRoutes()

  // 3. Tenant Admin API (authenticated, grouped under /api)
  router.group(() => {
    registerCatalogRoutes(router)
    registerCrmRoutes(router)
    registerCommerceRoutes(router)
    registerContentRoutes(router)
    registerSystemRoutes(router)
    registerLiveRoutes(router)
  }).prefix('/api').use(middleware.auth())
}
