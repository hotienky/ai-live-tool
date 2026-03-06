/**
 * ConnectionManager — Quản lý nhiều kết nối Livestream đồng thời
 */
import type { Server as SocketIOServer } from 'socket.io'
import { analyzeComment } from '#services/ai_service'
import { sendHotLeadAlert } from '#services/telegram_service'
import { matchProduct } from '#services/product_match_service'
import autoReplyService from '#services/auto_reply_service'
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

  async startConnection(shop: any, io: SocketIOServer) {
    const { id: shopId, shopName, platform = 'tiktok' } = shop

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
      const connector = createConnector(platform, shop)
      connInfo.connection = connector
      const state = await connector.connect()
      connInfo.status = 'connected'

      // Save session
      try {
        const session = await LivestreamSession.create({
          shopId, platform, roomId: state.roomId, status: 'live',
          viewerCount: state.viewerCount, commentCount: 0, hotLeadCount: 0, startedAt: new Date() as any,
        })
        connInfo.sessionId = session.id
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
          const label = await analyzeComment(data.comment)
          const commentData: any = {
            id: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            shopId, platform, nickname: data.nickname, uniqueId: data.uniqueId,
            comment: data.comment, label: label.label || label,
            profileLink: buildLink(data.uniqueId), profilePictureUrl: data.profilePictureUrl,
            timestamp: new Date().toISOString(),
          }

          const lbl = typeof label === 'string' ? label : label.label
          if (lbl === '[HOT]' || lbl === 'HOT') { stats.hot++; sendHotLeadAlert(commentData, shopName) }
          else if (lbl === '[WARM]' || lbl === 'WARM') stats.warm++
          else stats.cold++
          stats.total++

          // Product matching
          if ((lbl === '[HOT]' || lbl === 'HOT' || lbl === '[WARM]' || lbl === 'WARM') && connInfo.products.length > 0) {
            try {
              const match = await matchProduct(data.comment, connInfo.products)
              if (match) commentData.matchedProduct = match
            } catch { /* silent */ }
          }

          // Keyword matching
          if (connInfo.keywords.length > 0) {
            const lower = data.comment.toLowerCase()
            const matched = connInfo.keywords.filter((kw: any) => lower.includes(kw.keyword.toLowerCase()))
            if (matched.length > 0) {
              commentData.matchedKeywords = matched.map((kw: any) => ({ keyword: kw.keyword, color: kw.color, alertType: kw.alertType }))

              // Auto-reply: emit event for keywords with auto_reply type
              const autoReplyKws = matched.filter((kw: any) => kw.alertType === 'auto_reply' && kw.autoReplyText)
              if (autoReplyKws.length > 0) {
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
          try {
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
    const { id: shopId, shopName } = shop
    if (this.connections.has(shopId)) await this.stopConnection(shopId)

    const stats = { hot: 0, warm: 0, cold: 0, total: 0, startTime: new Date().toISOString() }
    let commentIndex = 0
    let mockViewers = Math.floor(800 + Math.random() * 2200)
    let peakViewers = mockViewers

    const connInfo: ConnInfo = {
      connection: null, mockInterval: null, viewerInterval: null,
      stats, shopName, platform: 'mock', status: 'mock', peakViewers,
      sessionId: null, products: [], keywords: [],
    }

    const interval = setInterval(async () => {
      const mockData = MOCK_COMMENTS[commentIndex % MOCK_COMMENTS.length]
      const avatarUrl = AVATARS[commentIndex % AVATARS.length]

      const commentData: any = {
        id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        shopId, platform: 'mock', nickname: mockData.nickname, uniqueId: mockData.uniqueId,
        comment: mockData.comment, label: mockData.expectedLabel,
        profileLink: `https://www.tiktok.com/@${mockData.uniqueId}`,
        profilePictureUrl: avatarUrl, timestamp: new Date().toISOString(),
      }

      if (commentData.label === '[HOT]') { stats.hot++; sendHotLeadAlert(commentData, shopName) }
      else if (commentData.label === '[WARM]') stats.warm++
      else stats.cold++
      stats.total++

      // Auto-reply for mock mode too
      try {
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
              commentId: commentData.id,
              nickname: mockData.nickname,
              comment: mockData.comment,
              replyText,
              triggerLabel: reply.triggerLabel,
            })
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
        shopId, platform: 'mock', status: 'live', viewerCount: mockViewers,
        commentCount: 0, hotLeadCount: 0, startedAt: new Date() as any,
      })
      connInfo.sessionId = session.id
    } catch (e: any) { console.error(`⚠️ Mock session error:`, e.message) }

    io.to(`shop_${shopId}`).emit('crawler_status', { status: 'mock', shopName })
    io.to(`shop_${shopId}`).emit('viewer_count', { count: mockViewers })
    console.log(`🎭 [${shopName}] Mock mode started`)
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
          session.endedAt = new Date() as any
          await session.save()
        }
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
      let customer = await Customer.query().where('unique_id', commentData.uniqueId).first()
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
        await Lead.create({
          chatLogId: chatLog.id,
          customerId: customer.id,
          uniqueId: commentData.uniqueId,
          nickname: commentData.nickname,
          comment: commentData.comment,
          label: lbl.replace(/[\[\]]/g, ''),
          status: 'New',
          productIntent: commentData.matchedProduct?.product?.name || null,
        })
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
