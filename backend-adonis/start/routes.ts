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
const SchedulesController = () => import('#controllers/schedules_controller')

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

// ──── API Routes ────
router.group(() => {
  // Shops CRUD
  router.get('/shops', [ShopsController, 'index'])
  router.post('/shops', [ShopsController, 'store'])
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

  // Leads
  router.get('/leads', [LeadsController, 'index'])
  router.get('/leads/:id', [LeadsController, 'show'])
  router.put('/leads/:id', [LeadsController, 'update'])
  router.delete('/leads/:id', [LeadsController, 'destroy'])
  router.get('/leads-pipeline', [LeadsController, 'pipelineStats'])

  // Dashboard
  router.get('/dashboard/overview', [DashboardController, 'overview'])
  router.get('/dashboard/recent-leads', [DashboardController, 'recentLeads'])
  router.get('/dashboard/analytics', [DashboardController, 'analytics'])
  router.get('/dashboard/top-customers', [DashboardController, 'topCustomers'])

  // Analytics
  router.get('/analytics/daily', [AnalyticsController, 'daily'])
  router.get('/analytics/hourly', [AnalyticsController, 'hourly'])
  router.get('/analytics/conversion', [AnalyticsController, 'conversion'])
  router.get('/analytics/top-keywords', [AnalyticsController, 'topKeywords'])
  router.get('/analytics/summary', [AnalyticsController, 'summary'])

  // Customers
  router.get('/customers', [CustomersController, 'index'])
  router.get('/customers/:id', [CustomersController, 'show'])
  router.put('/customers/:id', [CustomersController, 'update'])
  router.delete('/customers/:id', [CustomersController, 'destroy'])

  // Sessions
  router.get('/sessions', [SessionsController, 'index'])
  router.get('/sessions/:id', [SessionsController, 'show'])

  // Orders — NEW
  router.get('/orders', [OrdersController, 'index'])
  router.get('/orders/stats', [OrdersController, 'stats'])
  router.post('/orders', [OrdersController, 'store'])
  router.get('/orders/:id', [OrdersController, 'show'])
  router.put('/orders/:id', [OrdersController, 'update'])
  router.delete('/orders/:id', [OrdersController, 'destroy'])

  // Scheduled Livestreams — NEW
  router.get('/schedules', [SchedulesController, 'index'])
  router.post('/schedules', [SchedulesController, 'store'])
  router.get('/schedules/:id', [SchedulesController, 'show'])
  router.put('/schedules/:id', [SchedulesController, 'update'])
  router.delete('/schedules/:id', [SchedulesController, 'destroy'])

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
    await connectionManager.stopConnection(Number(params.id))
    return response.json({ success: true })
  })

  router.get('/shops/:id/stats', async ({ auth, params, response }) => {
    const Shop = (await import('#models/shop')).default
    const shop = await Shop.query().where('id', params.id).where('userId', auth.user!.id).first()
    if (!shop) return response.notFound({ error: 'Shop not found' })
    const connectionManager = (await import('#services/connection_manager')).default
    const stats = connectionManager.getStats(Number(params.id))
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
        { id: Number(params.id), shopName: shop.shopName || 'Mock Shop' },
        io
      )
      return response.json({ success: true })
    } catch (err: any) {
      return response.internalServerError({ error: err.message })
    }
  })
}).prefix('/api').use(middleware.auth())
