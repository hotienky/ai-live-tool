/*
|--------------------------------------------------------------------------
| Routes file — giống routes/api.php trong Laravel
|--------------------------------------------------------------------------
|
| Clean modular routing:
| 1. Health Check + Platforms (public)
| 2. Auth Routes (AdonisJS built-in auth)
| 3. Master Module → registerMasterRoutes()
| 4. Tenant Module → registerTenantRoutes()
|     - Storefront public API
|     - Shop customer auth
|     - Tenant admin API (all CRUD)
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// ──── Controllers ────
const AuthController = () => import('#controllers/auth_controller')

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

// ════════════════════════════════════════════════════════════
// ──── MASTER PANEL API (Multi-Tenant Management) ────
// ════════════════════════════════════════════════════════════
import { registerMasterRoutes } from '#modules/master/routes'
registerMasterRoutes()

// ──── Auth Routes (Public) ────
router.group(() => {
  router.post('/register', [AuthController, 'register'])
  router.post('/login', [AuthController, 'login'])
  router.get('/me', [AuthController, 'me']).use(middleware.auth())
}).prefix('/api/auth')

// ════════════════════════════════════════════════════════════
// ──── TENANT MODULE ────
// (Storefront + Shop Auth + Tenant Admin API)
// ════════════════════════════════════════════════════════════
import { registerTenantRoutes } from '#modules/tenant/routes'
registerTenantRoutes()
