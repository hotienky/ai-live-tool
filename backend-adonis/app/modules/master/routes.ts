import router from '@adonisjs/core/services/router'

/**
 * Master Module Routes — Tenant management, master auth.
 * All routes prefixed with /api/master
 */

const MasterAuthController = () =>
  import('#modules/master/controllers/master_auth_controller')
const TenantController = () =>
  import('#modules/master/controllers/tenant_controller')

export function registerMasterRoutes() {
  // ──── Public: Master Auth ────
  router.group(() => {
    router.post('/login', [MasterAuthController, 'login'])
  }).prefix('/api/master/auth')

  // ──── Protected: Master Panel ────
  router.group(() => {
    // Auth
    router.get('/auth/me', [MasterAuthController, 'me'])
    router.post('/auth/logout', [MasterAuthController, 'logout'])

    // Tenant CRUD
    router.get('/tenants', [TenantController, 'index'])
    router.get('/tenants/:id', [TenantController, 'show'])
    router.post('/tenants', [TenantController, 'store'])
    router.put('/tenants/:id', [TenantController, 'update'])
    router.delete('/tenants/:id', [TenantController, 'destroy'])

    // Tenant lifecycle actions
    router.post('/tenants/:id/suspend', [TenantController, 'suspend'])
    router.post('/tenants/:id/activate', [TenantController, 'activate'])
    router.post('/tenants/:id/migrate', [TenantController, 'migrate'])
    router.post('/tenants/:id/seed', [TenantController, 'seed'])
  }).prefix('/api/master').use(async (ctx: any, next: any) => {
    // Inline master auth (will be replaced with named middleware later)
    const authHeader = ctx.request.header('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }
    const token = authHeader.slice(7)
    const db = (await import('@adonisjs/lucid/services/db')).default
    const tokenRecord = await db.connection('master')
      .from('master_access_tokens')
      .where('token', token)
      .where('expires_at', '>', new Date())
      .first()
    if (!tokenRecord) {
      return ctx.response.unauthorized({ error: 'Invalid or expired token' })
    }
    const user = await db.connection('master')
      .from('master_users')
      .where('id', tokenRecord.user_id)
      .select('id', 'email', 'name', 'role')
      .first()
    if (!user) return ctx.response.unauthorized({ error: 'User not found' })
    ctx.masterUser = user
    return next()
  })
}
