/**
 * ConnectionManager — Quản lý nhiều kết nối Livestream đồng thời
 */
import type { Server as SocketIOServer } from 'socket.io'
import { DateTime } from 'luxon'
import { analyzeComment } from '#services/ai_service'
import { sendHotLeadAlert } from '#services/telegram_service'
import { matchProduct } from '#services/product_match_service'
import autoReplyService from '#services/auto_reply_service'
import spamFilter from '#services/spam_filter'
import notificationService from '#services/notification_service'
import { createConnector, type BaseConnector } from '#services/connectors'
import { MOCK_COMMENTS, AVATARS } from '#services/mock_service'
import LivestreamSession from '#models/livestream_session'
import Product from '#models/product'
import ShopKeyword from '#models/shop_keyword'
import ChatLog from '#models/chat_log'
import Customer from '#models/customer'
import Lead from '#models/lead'

interface ConnInfo {
  connection: BaseConnector | null
  mockInterval: ReturnType<typeof setInterval> | null
  viewerInterval: ReturnType<typeof setInterval> | null
  stats: { hot: number; warm: number; cold: number; total: number; startTime: string }
  shopName: string
  platform: string
  status: string
  peakViewers: number
  sessionId: number | null
  products: any[]
  keywords: any[]
}

class ConnectionManager {
  connections = new Map<number, ConnInfo>()
  leads = new Map<number, any[]>()

  getStats(shopId: number) {
    const conn = this.connections.get(shopId)
    if (!conn) return { hot: 0, warm: 0, cold: 0, total: 0 }
    return { ...conn.stats }
  }

  getAllStatus() {
    const result: Record<string, any> = {}
    for (const [shopId, conn] of this.connections) {
      result[shopId] = { shopName: conn.shopName, status: conn.status, stats: { ...conn.stats } }
    }
    return result
  }

  // Convert snake_case keys to camelCase for connector compatibility
  private toCamel(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      result[camelKey] = obj[key]
    }
    return result
  }

  async startConnection(shop: any, io: SocketIOServer) {
    const shopData = this.toCamel(shop)
    const { id: shopId, shopName, platform = 'tiktok' } = shopData

    if (this.connections.has(shopId)) await this.stopConnection(shopId)

    const stats = { hot: 0, warm: 0, cold: 0, total: 0, startTime: new Date().toISOString() }
    const connInfo: ConnInfo = {
      connection: null, mockInterval: null, viewerInterval: null,
      stats, shopName, platform, status: 'connecting', peakViewers: 0, sessionId: null,
      products: [], keywords: [],
    }
    this.connections.set(shopId, connInfo)

    const icons: Record<string, string> = { tiktok: '🎵', shopee: '🛒', facebook: '📘', youtube: '🎬' }
    console.log(`${icons[platform] || '📡'} [${shopName}] Đang kết nối ${platform}...`)

    try {
      const connector = createConnector(platform, shopData)
      connInfo.connection = connector
      const state = await connector.connect()
      connInfo.status = 'connected'

      // Save session
      try {
        const session = await LivestreamSession.create({
          shopId, platform, roomId: state.roomId, status: 'live',
          viewerCount: state.viewerCount, commentCount: 0, hotLeadCount: 0, startedAt: DateTime.now(),
        })
        connInfo.sessionId = session.id

        // Webhook: session.started
        try {
          const { triggerWebhook } = await import('#services/webhook_service')
          await triggerWebhook(shopId, 'session.started', { sessionId: session.id, platform, shopName })
        } catch { /* best-effort */ }
      } catch (e: any) { console.error(`⚠️ Session save error:`, e.message) }

      // Load products
      try {
        const prods = await Product.query().where('shop_id', shopId)
        connInfo.products = prods.map(p => p.serialize())
      } catch { /* silent */ }

      // Load keywords
      try {
        const kws = await ShopKeyword.query().where('shop_id', shopId).where('is_active', true)
        connInfo.keywords = kws.map(k => k.serialize())
      } catch { /* silent */ }

      io.to(`shop_${shopId}`).emit('crawler_status', { status: 'connected', platform, shopName })

      const linkBuilders: Record<string, (uid: string) => string> = {
        tiktok: (uid) => `https://www.tiktok.com/@${uid}`,
        shopee: (uid) => `https://shopee.vn/shop/${uid}`,
        facebook: (uid) => `https://www.facebook.com/${uid}`,
        youtube: (uid) => `https://www.youtube.com/@${uid}`,
      }
      const buildLink = linkBuilders[platform] || ((uid: string) => `#${uid}`)

      // Chat listener
      connector.on('chat', async (data: any) => {
        try {
          // P0 Fix: Spam check BEFORE AI analysis (saves AI cost)
          const spamCheck = spamFilter.checkComment(String(shopId), data.uniqueId, data.comment)
          if (!spamCheck.allowed) {
            io.to(`shop_${shopId}`).emit('comment_blocked', {
              nickname: data.nickname, comment: data.comment, reason: spamCheck.reason,
            })
            return // Skip AI analysis for spam
          }

          const label = await analyzeComment(data.comment)
          // ── Normalize label to [HOT]/[WARM]/[COLD] format (frontend expects brackets) ──
          const rawLabel = typeof label === 'string' ? label : label.label || 'COLD'
          const normalizedLabel = rawLabel.startsWith('[') ? rawLabel : `[${rawLabel.replace(/[\[\]]/g, '').toUpperCase()}]`

          const commentData: any = {
            id: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            shopId, platform, nickname: data.nickname, uniqueId: data.uniqueId,
            comment: data.comment, label: normalizedLabel,
            profileLink: buildLink(data.uniqueId), profilePictureUrl: data.profilePictureUrl,
            timestamp: new Date().toISOString(),
            aiSummary: typeof label === 'object' ? label.summary : '',
            productIntent: typeof label === 'object' ? label.product_intent : '',
          }

          if (normalizedLabel === '[HOT]') {
            stats.hot++; sendHotLeadAlert(commentData, shopName)
            // In-app notification for HOT lead
            try {
              const shopModel = await (await import('#models/shop')).default.find(shopId)
              if (shopModel?.userId) {
                notificationService.hotLead(shopModel.userId, String(shopId), data.nickname, data.comment)
              }
            } catch { /* best-effort */ }
          }
          else if (normalizedLabel === '[WARM]') stats.warm++
          else stats.cold++
          stats.total++

          // Product matching
          if ((normalizedLabel === '[HOT]' || normalizedLabel === '[WARM]') && connInfo.products.length > 0) {
            try {
              const match = await matchProduct(data.comment, connInfo.products)
              if (match) commentData.matchedProduct = match
            } catch { /* silent */ }
          }

          // F4: Auto-Order Pipeline — HOT comment + matched product → draft order
          if (normalizedLabel === '[HOT]' && commentData.matchedProduct?.product?.id) {
            try {
              const Order = (await import('#models/order')).default
              // Detect quantity from comment: "+2", "lấy 3 cái", "2 cái", etc
              const qtyMatch = data.comment.match(/[+]?\s*(\d+)\s*(cái|chiếc|bộ|hộp|chai|kg|gói)?/i)
              const qty = qtyMatch ? Math.min(parseInt(qtyMatch[1]) || 1, 99) : 1
              const product = commentData.matchedProduct.product

              // Check if this user already has a pending draft for same product in this session
              const existingDraft = await Order.query()
                .where('shop_id', shopId)
                .where('customer_name', data.nickname)
                .where('status', 'draft')
                .where('notes', 'like', `%Auto-order%`)
                .orderBy('created_at', 'desc')
                .first()

              if (!existingDraft) {
                const draftOrder = await Order.create({
                  shopId,
                  sessionId: connInfo.sessionId,
                  customerName: data.nickname,
                  status: 'draft',
                  paymentStatus: 'unpaid',
                  totalAmount: (product.price || 0) * qty,
                  items: JSON.stringify([{
                    productId: product.id,
                    name: product.name,
                    price: product.price || 0,
                    qty,
                    imageUrl: product.image_url || '',
                  }]),
                  notes: `Auto-order từ comment: "${data.comment.substring(0, 100)}"`,
                })

                commentData.draftOrderId = draftOrder.id
                io.to(`shop_${shopId}`).emit('draft_order_created', {
                  orderId: draftOrder.id,
                  customerName: data.nickname,
                  product: product.name,
                  qty,
                  totalAmount: draftOrder.totalAmount,
                  comment: data.comment,
                })
              }
            } catch { /* auto-order is best-effort */ }
          }

          // Keyword matching
          if (connInfo.keywords.length > 0) {
            const lower = data.comment.toLowerCase()
            const matched = connInfo.keywords.filter((kw: any) => lower.includes(kw.keyword.toLowerCase()))
            if (matched.length > 0) {
              commentData.matchedKeywords = matched.map((kw: any) => ({ keyword: kw.keyword, color: kw.color, alertType: kw.alertType }))

              // Auto-reply: emit event for keywords with auto_reply type
              // PRIORITY: keyword auto-reply takes precedence over template auto-reply
              const autoReplyKws = matched.filter((kw: any) => kw.alertType === 'auto_reply' && kw.autoReplyText)
              if (autoReplyKws.length > 0) {
                commentData._keywordReplied = true // Flag to skip template reply
                io.to(`shop_${shopId}`).emit('auto_reply', {
                  commentId: commentData.id,
                  nickname: data.nickname,
                  comment: data.comment,
                  replyText: autoReplyKws[0].autoReplyText,
                  keyword: autoReplyKws[0].keyword,
                })
              }
            }
          }

          // Auto-reply by label (HOT/WARM → template)
          // SKIP if keyword auto-reply already fired (priority: keyword > template)
          try {
            if (!commentData._keywordReplied) {
              const shopModel = await (await import('#models/shop')).default.find(shopId)
              if (shopModel?.autoReplyEnabled) {
                const reply = await autoReplyService.shouldAutoReply(shopId, data.uniqueId, commentData.label)
                if (reply.shouldReply && reply.templateText) {
                  const replyText = autoReplyService.personalizeText(reply.templateText, {
                    nickname: data.nickname,
                    product: commentData.matchedProduct?.product?.name || '',
                    shop: shopName,
                  })
                  commentData.autoReply = replyText
                  io.to(`shop_${shopId}`).emit('auto_reply', {
                    commentId: commentData.id,
                    nickname: data.nickname,
                    comment: data.comment,
                    replyText,
                    triggerLabel: reply.triggerLabel,
                  })
                }
              }
            }
          } catch { /* auto-reply is best-effort */ }

          io.to(`shop_${shopId}`).emit('new_comment', commentData)
          io.to(`shop_${shopId}`).emit('stats_update', { ...stats })

          if (!this.leads.has(shopId)) this.leads.set(shopId, [])
          this.leads.get(shopId)!.push(commentData)

          // Save to DB
          this._saveComment(commentData, connInfo.sessionId)
        } catch (err: any) {
          console.error(`❌ [${shopName}] Error:`, err.message)
        }
      })

      connector.on('roomUser', (data: any) => {
        io.to(`shop_${shopId}`).emit('viewer_count', { count: data.viewerCount })
        if (data.viewerCount > connInfo.peakViewers) connInfo.peakViewers = data.viewerCount
      })

      connector.on('disconnected', () => {
        connInfo.status = 'disconnected'
        io.to(`shop_${shopId}`).emit('crawler_status', { status: 'disconnected' })
      })

      return { success: true, roomId: state.roomId, viewers: state.viewerCount }
    } catch (err: any) {
      connInfo.status = 'error'
      io.to(`shop_${shopId}`).emit('crawler_status', { status: 'error', message: err.message })
      throw err
    }
  }

  async startMockConnection(shop: any, io: SocketIOServer) {
    const { id: shopId, shopName, platform = 'tiktok' } = shop
    if (this.connections.has(shopId)) await this.stopConnection(shopId)

    const stats = { hot: 0, warm: 0, cold: 0, total: 0, startTime: new Date().toISOString() }
    let commentIndex = 0
    let mockViewers = Math.floor(800 + Math.random() * 2200)
    let peakViewers = mockViewers

    const mockPlatform = platform || 'tiktok'
    const connInfo: ConnInfo = {
      connection: null, mockInterval: null, viewerInterval: null,
      stats, shopName, platform: mockPlatform, status: 'mock', peakViewers,
      sessionId: null, products: [], keywords: [],
    }

    // B2 Fix: Load products + keywords for mock mode too
    try {
      const Product = (await import('#models/product')).default
      const prods = await Product.query().where('shop_id', shopId)
      connInfo.products = prods.map((p: any) => p.serialize())
    } catch { /* silent */ }
    try {
      const ShopKeyword = (await import('#models/shop_keyword')).default
      const kws = await ShopKeyword.query().where('shop_id', shopId).where('is_active', true)
      connInfo.keywords = kws.map((k: any) => k.serialize())
    } catch { /* silent */ }

    const linkBuilders: Record<string, (uid: string) => string> = {
      tiktok: (uid) => `https://www.tiktok.com/@${uid}`,
      shopee: (uid) => `https://shopee.vn/shop/${uid}`,
      facebook: (uid) => `https://www.facebook.com/${uid}`,
      youtube: (uid) => `https://www.youtube.com/@${uid}`,
    }
    const buildLink = linkBuilders[mockPlatform] || ((uid: string) => `#${uid}`)

    const interval = setInterval(async () => {
      const mockData = MOCK_COMMENTS[commentIndex % MOCK_COMMENTS.length]
      const avatarUrl = AVATARS[commentIndex % AVATARS.length]

      const commentData: any = {
        id: `${mockPlatform}_mock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        shopId, platform: mockPlatform, nickname: mockData.nickname, uniqueId: mockData.uniqueId,
        comment: mockData.comment, label: mockData.expectedLabel,
        profileLink: buildLink(mockData.uniqueId),
        profilePictureUrl: avatarUrl, timestamp: new Date().toISOString(),
      }

      if (commentData.label === '[HOT]') { stats.hot++; sendHotLeadAlert(commentData, shopName) }
      else if (commentData.label === '[WARM]') stats.warm++
      else stats.cold++
      stats.total++

      // B2 Fix: Keyword matching in mock mode (same logic as live mode)
      if (connInfo.keywords.length > 0) {
        const lower = mockData.comment.toLowerCase()
        const matched = connInfo.keywords.filter((kw: any) => lower.includes(kw.keyword.toLowerCase()))
        if (matched.length > 0) {
          commentData.matchedKeywords = matched.map((kw: any) => ({ keyword: kw.keyword, color: kw.color, alertType: kw.alertType }))
          const autoReplyKws = matched.filter((kw: any) => kw.alertType === 'auto_reply' && kw.autoReplyText)
          if (autoReplyKws.length > 0) {
            commentData._keywordReplied = true
            io.to(`shop_${shopId}`).emit('auto_reply', {
              commentId: commentData.id, nickname: mockData.nickname,
              comment: mockData.comment, replyText: autoReplyKws[0].autoReplyText,
              keyword: autoReplyKws[0].keyword,
            })
          }
        }
      }

      // Auto-reply for mock mode — skip if keyword already replied (priority: keyword > template)
      try {
        if (!commentData._keywordReplied) {
          const shopModel = await (await import('#models/shop')).default.find(shopId)
          if (shopModel?.autoReplyEnabled) {
            const reply = await autoReplyService.shouldAutoReply(shopId, mockData.uniqueId, commentData.label)
            if (reply.shouldReply && reply.templateText) {
              const replyText = autoReplyService.personalizeText(reply.templateText, {
                nickname: mockData.nickname,
                product: '',
                shop: shopName,
              })
              commentData.autoReply = replyText
              io.to(`shop_${shopId}`).emit('auto_reply', {
                commentId: commentData.id, nickname: mockData.nickname,
                comment: mockData.comment, replyText,
                triggerLabel: reply.triggerLabel,
              })
            }
          }
        }
      } catch { /* auto-reply is best-effort */ }

      io.to(`shop_${shopId}`).emit('new_comment', commentData)
      io.to(`shop_${shopId}`).emit('stats_update', { ...stats })

      if (!this.leads.has(shopId)) this.leads.set(shopId, [])
      this.leads.get(shopId)!.push(commentData)

      this._saveComment(commentData, connInfo.sessionId)
      commentIndex++
    }, 2000 + Math.random() * 2000)

    const viewerInterval = setInterval(() => {
      mockViewers += Math.floor(Math.random() * 200 - 80)
      mockViewers = Math.max(100, mockViewers)
      if (mockViewers > peakViewers) peakViewers = mockViewers
      connInfo.peakViewers = peakViewers
      io.to(`shop_${shopId}`).emit('viewer_count', { count: mockViewers })
    }, 5000)

    connInfo.mockInterval = interval
    connInfo.viewerInterval = viewerInterval
    this.connections.set(shopId, connInfo)

    // Save session
    try {
      const session = await LivestreamSession.create({
        shopId, platform: mockPlatform, status: 'live', viewerCount: mockViewers,
        commentCount: 0, hotLeadCount: 0, startedAt: DateTime.now(),
      })
      connInfo.sessionId = session.id
    } catch (e: any) { console.error(`⚠️ Mock session error:`, e.message) }

    const icons: Record<string, string> = { tiktok: '🎵', shopee: '🛒', facebook: '📘', youtube: '🎬' }
    io.to(`shop_${shopId}`).emit('crawler_status', { status: 'mock', platform: mockPlatform, shopName })
    io.to(`shop_${shopId}`).emit('viewer_count', { count: mockViewers })
    console.log(`🎭 ${icons[mockPlatform] || '📡'} [${shopName}] Mock mode started (${mockPlatform})`)
    return { success: true }
  }

  async stopConnection(shopId: number) {
    const conn = this.connections.get(shopId)
    if (!conn) return

    if (conn.sessionId) {
      try {
        const session = await LivestreamSession.find(conn.sessionId)
        if (session) {
          session.status = 'ended'
          session.commentCount = conn.stats.total
          session.hotLeadCount = conn.stats.hot
          session.endedAt = DateTime.now()
          await session.save()
        }

        // Generate Post-Live Report + persist to DB
        try {
          const { generatePostLiveReport } = await import('#services/post_live_report_service')
          const report = await generatePostLiveReport(
            conn.sessionId, shopId, conn.shopName,
            conn.platform, conn.stats.startTime,
            conn.stats, conn.peakViewers
          )

          // P1 Fix: Persist report to session record (survives user offline)
          if (session) {
            session.reportData = JSON.stringify(report)
            await session.save()
          }

          // Emit report to shop room (real-time if user online)
          const { getIO } = await import('#start/socket')
          const io = getIO()
          if (io) {
            io.to(`shop_${shopId}`).emit('post_live_report', report)
          }
          console.log(`📊 Post-live report generated + saved for session ${conn.sessionId}`)
        } catch (e: any) { console.error(`⚠️ Post-live report error:`, e.message) }

        // Log activity
        try {
          const { logActivity, Actions } = await import('#services/activity_log_service')
          await logActivity({
            shopId,
            action: Actions.SESSION_ENDED,
            entityType: 'Session',
            entityId: conn.sessionId,
            details: {
              duration: conn.stats.startTime,
              totalComments: conn.stats.total,
              hotLeads: conn.stats.hot,
              warmLeads: conn.stats.warm,
            },
          })
        } catch (e: any) { console.error(`⚠️ Activity log error:`, e.message) }

        // Webhook: session.ended
        try {
          const { triggerWebhook } = await import('#services/webhook_service')
          await triggerWebhook(shopId, 'session.ended', {
            sessionId: conn.sessionId, stats: conn.stats, peakViewers: conn.peakViewers,
          })
        } catch { /* best-effort */ }
      } catch (e: any) { console.error(`⚠️ Session end error:`, e.message) }
    }

    if (conn.connection) conn.connection.disconnect()
    if (conn.mockInterval) clearInterval(conn.mockInterval)
    if (conn.viewerInterval) clearInterval(conn.viewerInterval)

    console.log(`🛑 [${conn.shopName}] Connection stopped`)
    this.connections.delete(shopId)
  }

  stopAll() {
    for (const [shopId] of this.connections) this.stopConnection(shopId)
    console.log('🛑 All connections stopped')
  }

  isConnected(shopId: number) {
    const conn = this.connections.get(shopId)
    return conn ? conn.status : null
  }

  private async _saveComment(commentData: any, sessionId: number | null) {
    try {
      // Find or create customer
      let customer = await Customer.query()
        .where('platform_user_id', commentData.uniqueId)
        .where('platform', commentData.platform)
        .first()
      if (!customer) {
        customer = await Customer.create({
          uniqueId: commentData.uniqueId,
          nickname: commentData.nickname,
          profilePictureUrl: commentData.profilePictureUrl,
          profileLink: commentData.profileLink,
          platform: commentData.platform,
          totalComments: 1,
          hotCount: commentData.label?.includes('HOT') ? 1 : 0,
          lastLabel: commentData.label,
          shopId: commentData.shopId,
        })
      } else {
        customer.totalComments = (customer.totalComments || 0) + 1
        if (commentData.label?.includes('HOT')) customer.hotCount = (customer.hotCount || 0) + 1
        customer.lastLabel = commentData.label
        customer.nickname = commentData.nickname
        await customer.save()
      }

      // Save chat log
      const chatLog = await ChatLog.create({
        shopId: commentData.shopId,
        sessionId,
        customerId: customer.id,
        uniqueId: commentData.uniqueId,
        nickname: commentData.nickname,
        commentText: commentData.comment,
        aiLabel: commentData.label?.replace(/[\[\]]/g, '') || 'COLD',
        aiSummary: commentData.aiSummary || null,
        productIntent: commentData.matchedProduct?.product?.name || null,
        platform: commentData.platform,
        profileLink: commentData.profileLink,
      })

      // Create lead for HOT/WARM
      const lbl = commentData.label || ''
      if (lbl.includes('HOT') || lbl.includes('WARM')) {
        const lead = await Lead.create({
          chatLogId: chatLog.id,
          customerId: customer.id,
          uniqueId: commentData.uniqueId,
          nickname: commentData.nickname,
          comment: commentData.comment,
          label: lbl.replace(/[\[\]]/g, ''),
          status: 'New',
          productIntent: commentData.matchedProduct?.product?.name || null,
        })

        // Webhook: hot_lead (only for HOT)
        if (lbl.includes('HOT')) {
          try {
            const { triggerWebhook } = await import('#services/webhook_service')
            await triggerWebhook(commentData.shopId, 'hot_lead', {
              lead: lead.serialize(), customer: customer.serialize(), comment: commentData.comment,
            })
          } catch { /* best-effort */ }
        }
      }
    } catch (err: any) {
      // Silent — DB save is best-effort
      if (!err.message?.includes('connect')) {
        console.error('💾 Save error:', err.message)
      }
    }
  }
}

export default new ConnectionManager()
