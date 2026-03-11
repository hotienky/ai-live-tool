import router from '@adonisjs/core/services/router'

const ShopsController = () => import('#controllers/shops_controller')
const KeywordsController = () => import('#controllers/keywords_controller')
const TemplatesController = () => import('#controllers/templates_controller')
const SchedulesController = () => import('#controllers/schedules_controller')
const ExportsController = () => import('#controllers/exports_controller')
const RepliesController = () => import('#controllers/replies_controller')

/**
 * Live routes — Shops, Keywords, Templates, Schedules, Exports, AI Reply,
 *               Post-Live Report, Profile/Password, Shop Connections
 */
export function registerLiveRoutes(group: ReturnType<typeof router.group>) {
  // Shops (legacy, will be deprecated)
  group.get('/shops', [ShopsController, 'index'])
  group.post('/shops', [ShopsController, 'store'])
  group.post('/shops/find-or-create', [ShopsController, 'findOrCreate'])
  group.get('/shops/:id', [ShopsController, 'show'])
  group.put('/shops/:id', [ShopsController, 'update'])
  group.delete('/shops/:id', [ShopsController, 'destroy'])

  // Keywords
  group.get('/keywords', [KeywordsController, 'index'])
  group.post('/keywords', [KeywordsController, 'store'])
  group.delete('/keywords/:id', [KeywordsController, 'destroy'])

  // Auto-Reply Templates
  group.get('/templates', [TemplatesController, 'index'])
  group.post('/templates', [TemplatesController, 'store'])
  group.delete('/templates/:id', [TemplatesController, 'destroy'])

  // Schedules
  group.get('/schedules', [SchedulesController, 'index'])
  group.post('/schedules', [SchedulesController, 'store'])
  group.get('/schedules/:id', [SchedulesController, 'show'])
  group.put('/schedules/:id', [SchedulesController, 'update'])
  group.delete('/schedules/:id', [SchedulesController, 'destroy'])

  // Export
  group.get('/export/leads', [ExportsController, 'leads'])
  group.get('/export/comments', [ExportsController, 'comments'])
  group.get('/export/customers', [ExportsController, 'customers'])
  group.get('/export/report', [ExportsController, 'report'])

  // AI Reply
  group.post('/reply/generate', [RepliesController, 'generate'])
  group.post('/reply/sentiment', [RepliesController, 'sentiment'])

  // Post-Live Report
  group.get('/sessions/:id/report', async ({ auth, params, response }: any) => {
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

  // Profile & Password
  group.put('/auth/profile', async ({ auth, request, response }: any) => {
    const user = auth.user
    if (!user) return response.unauthorized({ error: 'Chưa đăng nhập' })
    const { fullName } = request.only(['fullName'])
    if (fullName) user.fullName = fullName
    await user.save()
    return response.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role })
  })

  group.put('/auth/password', async ({ auth, request, response }: any) => {
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

  // Shop Connection Actions
  group.post('/shops/:id/connect', async ({ auth, params, response }: any) => {
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

  group.post('/shops/:id/disconnect', async ({ auth, params, response }: any) => {
    const Shop = (await import('#models/shop')).default
    const shop = await Shop.query().where('id', params.id).where('userId', auth.user!.id).first()
    if (!shop) return response.notFound({ error: 'Shop not found' })
    const connectionManager = (await import('#services/connection_manager')).default
    await connectionManager.stopConnection(params.id)
    return response.json({ success: true })
  })

  group.get('/shops/:id/stats', async ({ auth, params, response }: any) => {
    const Shop = (await import('#models/shop')).default
    const shop = await Shop.query().where('id', params.id).where('userId', auth.user!.id).first()
    if (!shop) return response.notFound({ error: 'Shop not found' })
    const connectionManager = (await import('#services/connection_manager')).default
    const stats = connectionManager.getStats(params.id)
    return response.json(stats)
  })

  group.post('/shops/:id/mock', async ({ auth, params, response }: any) => {
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
}
