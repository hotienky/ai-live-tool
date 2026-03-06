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

// ──── Health Check ────
router.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

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

  // Analytics
  router.get('/analytics/daily', [AnalyticsController, 'daily'])
  router.get('/analytics/hourly', [AnalyticsController, 'hourly'])
  router.get('/analytics/conversion', [AnalyticsController, 'conversion'])
  router.get('/analytics/top-keywords', [AnalyticsController, 'topKeywords'])
  router.get('/analytics/summary', [AnalyticsController, 'summary'])

  // Customers
  router.get('/customers', [CustomersController, 'index'])
  router.get('/customers/:id', [CustomersController, 'show'])

  // Sessions
  router.get('/sessions', [SessionsController, 'index'])
  router.get('/sessions/:id', [SessionsController, 'show'])

  // Shop actions (connect/disconnect handled by socket/services)
  router.post('/shops/:id/connect', async ({ params, response }) => {
    // Will be handled by ConnectionManager service
    return response.json({ message: 'Use Socket.IO to connect', shopId: params.id })
  })
  router.post('/shops/:id/disconnect', async ({ params, response }) => {
    return response.json({ message: 'Use Socket.IO to disconnect', shopId: params.id })
  })
  router.get('/shops/:id/stats', async ({ params, response }) => {
    return response.json({ shopId: params.id, stats: {} })
  })
}).prefix('/api')
