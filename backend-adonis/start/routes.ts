/*
|--------------------------------------------------------------------------
| Routes file — giống routes/api.php trong Laravel
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// ──── Controllers ────
const AuthController = () => import('#controllers/auth_controller')
const ShopsController = () => import('#controllers/shops_controller')
const ProductsController = () => import('#controllers/products_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const BrandsController = () => import('#controllers/brands_controller')
const ShipmentsController = () => import('#controllers/shipments_controller')
const KeywordsController = () => import('#controllers/keywords_controller')
const TemplatesController = () => import('#controllers/templates_controller')
const LeadsController = () => import('#controllers/leads_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const AnalyticsController = () => import('#controllers/analytics_controller')
const CustomersController = () => import('#controllers/customers_controller')
const SessionsController = () => import('#controllers/sessions_controller')
const ExportsController = () => import('#controllers/exports_controller')
const RepliesController = () => import('#controllers/replies_controller')
const OrdersController = () => import('#controllers/orders_controller')
const CartsController = () => import('#controllers/carts_controller')
const SchedulesController = () => import('#controllers/schedules_controller')
const NotificationsController = () => import('#controllers/notifications_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')
const ShopCustomersController = () => import('#controllers/shop_customers_controller')
const PromotionsController = () => import('#controllers/promotions_controller')
const CmsPagesController = () => import('#controllers/cms_pages_controller')
const BannersNewController = () => import('#controllers/banners_controller')
const NavLinksController = () => import('#controllers/nav_links_controller')
const ActivityLogsController = () => import('#controllers/activity_logs_controller')
const RolesController = () => import('#controllers/roles_controller')

// ──── Health Check ────
router.get('/api/health', async () => {
  const connectionManager = (await import('#services/connection_manager')).default
  const { isConfigured } = await import('#services/telegram_service')
  const aiQueue = (await import('#services/ai_queue')).default
  return {
    status: 'ok',
    uptime: process.uptime(),
    activeConnections: connectionManager.connections.size,
    telegram: isConfigured(),
    aiQueue: aiQueue.getStats(),
    timestamp: new Date().toISOString(),
  }
})

// Supported platforms
router.get('/api/platforms', async () => {
  const { SUPPORTED_PLATFORMS } = await import('#services/connectors')
  return SUPPORTED_PLATFORMS
})

// ──── Auth Routes (Public) ────
router.group(() => {
  router.post('/register', [AuthController, 'register'])
  router.post('/login', [AuthController, 'login'])
  router.get('/me', [AuthController, 'me']).use(middleware.auth())
}).prefix('/api/auth')

// ──── Storefront Customer Auth (Public — S-Cart: Shop\Auth pattern) ────
const ShopAuthController = () => import('#controllers/shop_auth_controller')
router.group(() => {
  router.post('/register', [ShopAuthController, 'register'])
  router.post('/login', [ShopAuthController, 'login'])
  router.get('/me', [ShopAuthController, 'me'])
  router.put('/profile', [ShopAuthController, 'updateProfile'])
  router.put('/password', [ShopAuthController, 'changePassword'])
  router.post('/forgot-password', [ShopAuthController, 'forgotPassword'])
  router.post('/reset-password', [ShopAuthController, 'resetPassword'])
}).prefix('/api/shop/auth')

// ──── Storefront Public API (S-Cart: Front\Controllers pattern) ────
const StorefrontController = () => import('#controllers/storefront_controller')
router.group(() => {
  router.get('/products', [StorefrontController, 'products'])
  router.get('/products/:id', [StorefrontController, 'productDetail'])
  router.get('/categories', [StorefrontController, 'categories'])
  router.get('/brands', [StorefrontController, 'brands'])
  router.get('/banners', [StorefrontController, 'banners'])
  router.get('/pages', [StorefrontController, 'pages'])
  router.get('/pages/:id', [StorefrontController, 'pageDetail'])
  router.get('/info', [StorefrontController, 'storeInfo'])
}).prefix('/api/shop/store/:storeId')

// ──── API Routes ────
router.group(() => {
  // Shops CRUD
  router.get('/shops', [ShopsController, 'index'])
  router.post('/shops', [ShopsController, 'store'])
  router.post('/shops/find-or-create', [ShopsController, 'findOrCreate'])
  router.get('/shops/:id', [ShopsController, 'show'])
  router.put('/shops/:id', [ShopsController, 'update'])
  router.delete('/shops/:id', [ShopsController, 'destroy'])

  // Shop Keywords
  router.get('/shops/:shopId/keywords', [KeywordsController, 'index'])
  router.post('/shops/:shopId/keywords', [KeywordsController, 'store'])
  router.delete('/shops/:shopId/keywords/:id', [KeywordsController, 'destroy'])

  // Shop Templates
  router.get('/shops/:shopId/templates', [TemplatesController, 'index'])
  router.post('/shops/:shopId/templates', [TemplatesController, 'store'])
  router.delete('/shops/:shopId/templates/:id', [TemplatesController, 'destroy'])

  // Products
  router.get('/products', [ProductsController, 'index'])
  router.post('/products', [ProductsController, 'store'])
  router.put('/products/:id', [ProductsController, 'update'])
  router.delete('/products/:id', [ProductsController, 'destroy'])

  // Categories
  router.get('/categories', [CategoriesController, 'index'])
  router.post('/categories', [CategoriesController, 'store'])
  router.put('/categories/:id', [CategoriesController, 'update'])
  router.delete('/categories/:id', [CategoriesController, 'destroy'])

  // Brands
  router.get('/brands', [BrandsController, 'index'])
  router.post('/brands', [BrandsController, 'store'])
  router.put('/brands/:id', [BrandsController, 'update'])
  router.delete('/brands/:id', [BrandsController, 'destroy'])

  // Leads
  router.get('/leads', [LeadsController, 'index'])
  router.get('/leads/stats', [LeadsController, 'pipelineStats']).as('leads.stats')
  router.get('/leads/:id', [LeadsController, 'show'])
  router.put('/leads/:id', [LeadsController, 'update'])
  router.delete('/leads/:id', [LeadsController, 'destroy'])
  router.get('/leads-pipeline', [LeadsController, 'pipelineStats'])

  // Dashboard
  router.get('/dashboard/overview', [DashboardController, 'overview'])
  router.get('/dashboard/recent-leads', [DashboardController, 'recentLeads'])
  router.get('/dashboard/analytics', [DashboardController, 'analytics'])
  router.get('/dashboard/top-customers', [DashboardController, 'topCustomers'])
  router.get('/dashboard/order-stats', [DashboardController, 'orderStats'])

  // Analytics
  router.get('/analytics/daily', [AnalyticsController, 'daily'])
  router.get('/analytics/hourly', [AnalyticsController, 'hourly'])
  router.get('/analytics/conversion', [AnalyticsController, 'conversion'])
  router.get('/analytics/top-keywords', [AnalyticsController, 'topKeywords'])
  router.get('/analytics/summary', [AnalyticsController, 'summary'])
  router.get('/analytics/revenue', [AnalyticsController, 'revenue'])

  // Notifications
  router.get('/notifications', [NotificationsController, 'index'])
  router.get('/notifications/unread-count', [NotificationsController, 'unreadCount'])
  router.put('/notifications/:id/read', [NotificationsController, 'markRead'])
  router.put('/notifications/read-all', [NotificationsController, 'markAllRead'])

  // Customers
  router.get('/customers', [CustomersController, 'index'])
  router.get('/customers/:id', [CustomersController, 'show'])
  router.put('/customers/:id', [CustomersController, 'update'])
  router.delete('/customers/:id', [CustomersController, 'destroy'])

  // Sessions
  router.get('/sessions', [SessionsController, 'index'])
  router.get('/sessions/:id', [SessionsController, 'show'])

  // ── Orders (S-Cart aligned) ──
  router.get('/orders', [OrdersController, 'index'])
  router.get('/orders/stats', [OrdersController, 'stats'])
  router.post('/orders', [OrdersController, 'store'])
  router.get('/orders/:id', [OrdersController, 'show'])
  router.put('/orders/:id', [OrdersController, 'update'])
  router.delete('/orders/:id', [OrdersController, 'destroy'])
  router.get('/orders/:id/details', [OrdersController, 'getDetails'])
  router.get('/orders/:id/totals', [OrdersController, 'getTotals'])
  router.get('/orders/:id/history', [OrdersController, 'getHistory'])
  router.put('/orders/:id/status', [OrdersController, 'updateStatus'])
  router.get('/order-statuses', [OrdersController, 'getOrderStatuses'])
  router.get('/payment-statuses', [OrdersController, 'getPaymentStatuses'])

  // ── Cart (S-Cart aligned) ──
  router.get('/cart', [CartsController, 'show'])
  router.post('/cart/items', [CartsController, 'addItem'])
  router.put('/cart/items/:productId', [CartsController, 'updateItem'])
  router.delete('/cart/items/:productId', [CartsController, 'removeItem'])
  router.post('/cart/checkout', [CartsController, 'checkout'])

  // Scheduled Livestreams — NEW
  router.get('/schedules', [SchedulesController, 'index'])
  router.post('/schedules', [SchedulesController, 'store'])
  router.get('/schedules/:id', [SchedulesController, 'show'])
  router.put('/schedules/:id', [SchedulesController, 'update'])
  router.delete('/schedules/:id', [SchedulesController, 'destroy'])

  // ── Shop Customers (S-Cart: ShopCustomer) ──
  router.get('/shop-customers', [ShopCustomersController, 'index'])
  router.post('/shop-customers', [ShopCustomersController, 'store'])
  router.get('/shop-customers/:id', [ShopCustomersController, 'show'])
  router.put('/shop-customers/:id', [ShopCustomersController, 'update'])
  router.delete('/shop-customers/:id', [ShopCustomersController, 'destroy'])
  router.get('/shop-customers/:customerId/addresses', [ShopCustomersController, 'listAddresses'])
  router.post('/shop-customers/:customerId/addresses', [ShopCustomersController, 'addAddress'])
  router.put('/shop-customers/:customerId/addresses/:id', [ShopCustomersController, 'updateAddress'])
  router.delete('/shop-customers/:customerId/addresses/:id', [ShopCustomersController, 'deleteAddress'])

  // ── Promotions + Coupons ──
  router.get('/promotions', [PromotionsController, 'index'])
  router.post('/promotions', [PromotionsController, 'store'])
  router.delete('/promotions/:productId', [PromotionsController, 'destroyPromotion'])
  router.get('/coupons', [PromotionsController, 'listCoupons'])
  router.post('/coupons', [PromotionsController, 'storeCoupon'])
  router.put('/coupons/:id', [PromotionsController, 'updateCoupon'])
  router.delete('/coupons/:id', [PromotionsController, 'destroyCoupon'])
  router.post('/coupons/validate', [PromotionsController, 'validateCoupon'])

  // ── CMS Pages (S-Cart: FrontPage) ──
  router.get('/cms-pages', [CmsPagesController, 'index'])
  router.post('/cms-pages', [CmsPagesController, 'store'])
  router.get('/cms-pages/:id', [CmsPagesController, 'show'])
  router.put('/cms-pages/:id', [CmsPagesController, 'update'])
  router.delete('/cms-pages/:id', [CmsPagesController, 'destroy'])

  // ── Banners (S-Cart: FrontBanner) ──
  router.get('/banners', [BannersNewController, 'index'])
  router.post('/banners', [BannersNewController, 'store'])
  router.put('/banners/:id', [BannersNewController, 'update'])
  router.delete('/banners/:id', [BannersNewController, 'destroy'])

  // ── Nav Links (S-Cart: FrontLink) ──
  router.get('/nav-links', [NavLinksController, 'index'])
  router.get('/nav-links/flat', [NavLinksController, 'flat'])
  router.post('/nav-links', [NavLinksController, 'store'])
  router.put('/nav-links/:id', [NavLinksController, 'update'])
  router.delete('/nav-links/:id', [NavLinksController, 'destroy'])
  router.post('/nav-links/reorder', [NavLinksController, 'reorder'])
  // ── Webhooks ──
  router.get('/webhooks', [WebhooksController, 'index'])
  router.post('/webhooks', [WebhooksController, 'store'])
  router.put('/webhooks/:id', [WebhooksController, 'update'])
  router.delete('/webhooks/:id', [WebhooksController, 'destroy'])

  // ── Activity Logs ──
  router.get('/activity-logs', [ActivityLogsController, 'index'])
  router.get('/activity-logs/stats', [ActivityLogsController, 'stats'])
  router.get('/activity-logs/entity-types', [ActivityLogsController, 'entityTypes'])

  // ── Roles & Permissions ──
  router.get('/roles', [RolesController, 'index'])
  router.get('/roles/permissions', [RolesController, 'permissions'])
  router.post('/roles', [RolesController, 'store'])
  router.get('/roles/:id', [RolesController, 'show'])
  router.put('/roles/:id', [RolesController, 'update'])
  router.delete('/roles/:id', [RolesController, 'destroy'])
  router.get('/users', [RolesController, 'users'])
  router.put('/users/:id/role', [RolesController, 'assignRole'])

  // ── Wishlist & Compare (Phase 7) ──
  router.get('/wishlist', [CartsController, 'showWishlist'])
  router.post('/wishlist', [CartsController, 'addToWishlist'])
  router.delete('/wishlist/:productId', [CartsController, 'removeFromWishlist'])
  router.get('/compare', [CartsController, 'showCompare'])
  router.post('/compare', [CartsController, 'addToCompare'])
  router.delete('/compare/:productId', [CartsController, 'removeFromCompare'])

  // ── System Config (Phase 8) ──
  const SystemConfigController = () => import('#controllers/system_config_controller')
  router.get('/system-config', [SystemConfigController, 'index'])
  router.get('/system-config/:group', [SystemConfigController, 'show'])
  router.put('/system-config/:group', [SystemConfigController, 'update'])

  // ── API Keys (Phase 8) ──
  const ApiKeysController = () => import('#controllers/api_keys_controller')
  router.get('/api-keys', [ApiKeysController, 'index'])
  router.post('/api-keys', [ApiKeysController, 'store'])
  router.put('/api-keys/:id', [ApiKeysController, 'update'])
  router.delete('/api-keys/:id', [ApiKeysController, 'destroy'])

  // ── Languages (Phase 9) ──
  const LanguagesController = () => import('#controllers/languages_controller')
  router.get('/languages', [LanguagesController, 'index'])
  router.post('/languages', [LanguagesController, 'store'])
  router.put('/languages/:id', [LanguagesController, 'update'])
  router.delete('/languages/:id', [LanguagesController, 'destroy'])
  router.get('/languages/:id/translations', [LanguagesController, 'getTranslations'])
  router.put('/languages/:id/translations', [LanguagesController, 'updateTranslations'])

  // ── Custom Fields (Phase 10) ──
  const CustomFieldsController = () => import('#controllers/custom_fields_controller')
  router.get('/custom-fields', [CustomFieldsController, 'index'])
  router.post('/custom-fields', [CustomFieldsController, 'store'])
  router.put('/custom-fields/:id', [CustomFieldsController, 'update'])
  router.delete('/custom-fields/:id', [CustomFieldsController, 'destroy'])
  router.get('/custom-fields/values/:entityType/:entityId', [CustomFieldsController, 'getValues'])
  router.put('/custom-fields/values/:entityType/:entityId', [CustomFieldsController, 'saveValues'])

  // Post-Live Report
  router.get('/sessions/:id/report', async ({ auth, params, response }) => {
    const { generatePostLiveReport } = await import('#services/post_live_report_service')
    const Session = (await import('#models/livestream_session')).default
    const Shop = (await import('#models/shop')).default
    const session = await Session.find(params.id)
    if (!session) return response.notFound({ error: 'Session not found' })
    const shop = await Shop.query().where('id', session.shopId).where('userId', auth.user!.id).first()
    if (!shop) return response.forbidden({ error: 'Access denied' })
    const report = await generatePostLiveReport(
      session.id, session.shopId, shop.shopName || 'Shop',
      session.platform || 'tiktok', session.startedAt?.toISO() || new Date().toISOString(),
      { hot: 0, warm: 0, cold: 0, total: 0 }, session.peakViewers || 0
    )
    return response.json(report)
  })

  // ── Inventory: stock adjustment (used by ShopSettings product tab) ──
  router.post('/products/:id/adjust-stock', [ProductsController, 'adjustStock'])
  // router.get('/products/:id/stock-history', [ProductsController, 'stockHistory'])
  // router.post('/products/import', [ProductsController, 'importCsv'])
  // router.get('/products/export', [ProductsController, 'exportCsv'])

  // ── DISABLED: Product Variants (frontend removed) ──
  // router.get('/products/:productId/variants', [ProductsController, 'getVariants'])
  // router.post('/products/:productId/variants', [ProductsController, 'createVariant'])
  // router.put('/products/:productId/variants/:variantId', [ProductsController, 'updateVariant'])
  // router.delete('/products/:productId/variants/:variantId', [ProductsController, 'deleteVariant'])

  // ── DISABLED: Shipping (frontend removed) ──
  // router.get('/shipments', [ShipmentsController, 'index'])
  // router.post('/shipments', [ShipmentsController, 'store'])
  // router.get('/shipments/stats', [ShipmentsController, 'stats'])
  // router.get('/shipments/:id', [ShipmentsController, 'show'])
  // router.put('/shipments/:id/status', [ShipmentsController, 'updateStatus'])
  // router.get('/shipments/:id/tracking', [ShipmentsController, 'tracking'])
  // router.delete('/shipments/:id', [ShipmentsController, 'destroy'])
  // router.get('/shipping/config', [ShipmentsController, 'getConfig'])
  // router.put('/shipping/config', [ShipmentsController, 'saveConfig'])
  // router.post('/shipping/test-connection', [ShipmentsController, 'testConnection'])
  // router.post('/shipping/calculate-fee', [ShipmentsController, 'calculateFee'])
  // router.get('/shipping/carriers', [ShipmentsController, 'getCarriers'])

  // Profile & Password
  router.put('/auth/profile', async ({ auth, request, response }: any) => {
    const user = auth.user
    if (!user) return response.unauthorized({ error: 'Chưa đăng nhập' })
    const { fullName } = request.only(['fullName'])
    if (fullName) user.fullName = fullName
    await user.save()
    return response.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role })
  })

  router.put('/auth/password', async ({ auth, request, response }: any) => {
    const user = auth.user
    if (!user) return response.unauthorized({ error: 'Chưa đăng nhập' })
    const { currentPassword, newPassword } = request.only(['currentPassword', 'newPassword'])
    if (!currentPassword || !newPassword) return response.badRequest({ error: 'Thiếu thông tin' })
    if (newPassword.length < 6) return response.badRequest({ error: 'Mật khẩu mới tối thiểu 6 ký tự' })
    const User = (await import('#models/user')).default
    const valid = await User.verifyCredentials(user.email, currentPassword).catch(() => null)
    if (!valid) return response.badRequest({ error: 'Mật khẩu hiện tại không đúng' })
    user.password = newPassword
    await user.save()
    return response.json({ message: 'Đổi mật khẩu thành công' })
  })

  // Export
  router.get('/export/leads', [ExportsController, 'leads'])
  router.get('/export/comments', [ExportsController, 'comments'])
  router.get('/export/customers', [ExportsController, 'customers'])
  router.get('/export/report', [ExportsController, 'report'])

  // Reply
  router.post('/reply/generate', [RepliesController, 'generate'])
  router.post('/reply/sentiment', [RepliesController, 'sentiment'])

  // Shop actions (connect/disconnect via ConnectionManager) — user scoped
  router.post('/shops/:id/connect', async ({ auth, params, response }) => {
    const connectionManager = (await import('#services/connection_manager')).default
    const { getIO } = await import('#start/socket')
    const io = getIO()
    if (!io) return response.serviceUnavailable({ error: 'Socket.IO not ready' })
    const Shop = (await import('#models/shop')).default
    const shop = await Shop.query().where('id', params.id).where('userId', auth.user!.id).first()
    if (!shop) return response.notFound({ error: 'Shop not found' })
    try {
      const result = await connectionManager.startConnection(shop.serialize(), io)
      return response.json(result)
    } catch (err: any) {
      return response.internalServerError({ error: err.message })
    }
  })

  router.post('/shops/:id/disconnect', async ({ auth, params, response }) => {
    const Shop = (await import('#models/shop')).default
    const shop = await Shop.query().where('id', params.id).where('userId', auth.user!.id).first()
    if (!shop) return response.notFound({ error: 'Shop not found' })
    const connectionManager = (await import('#services/connection_manager')).default
    await connectionManager.stopConnection(params.id)
    return response.json({ success: true })
  })

  router.get('/shops/:id/stats', async ({ auth, params, response }) => {
    const Shop = (await import('#models/shop')).default
    const shop = await Shop.query().where('id', params.id).where('userId', auth.user!.id).first()
    if (!shop) return response.notFound({ error: 'Shop not found' })
    const connectionManager = (await import('#services/connection_manager')).default
    const stats = connectionManager.getStats(params.id)
    return response.json(stats)
  })

  router.post('/shops/:id/mock', async ({ auth, params, response }) => {
    const Shop = (await import('#models/shop')).default
    const shop = await Shop.query().where('id', params.id).where('userId', auth.user!.id).first()
    if (!shop) return response.notFound({ error: 'Shop not found' })
    const connectionManager = (await import('#services/connection_manager')).default
    const { getIO } = await import('#start/socket')
    const io = getIO()
    if (!io) return response.serviceUnavailable({ error: 'Socket.IO not ready' })
    try {
      await connectionManager.startMockConnection(
        { id: params.id, shopName: shop.shopName || 'Mock Shop', platform: shop.platform || 'tiktok' },
        io
      )
      return response.json({ success: true })
    } catch (err: any) {
      return response.internalServerError({ error: err.message })
    }
  })
}).prefix('/api').use(middleware.auth())
