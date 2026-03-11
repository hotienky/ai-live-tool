/**
 * Socket.IO Setup — Attached after HTTP server starts
 */
import { Server as SocketIOServer } from 'socket.io'
import { Secret } from '@adonisjs/core/helpers'
import connectionManager from '#services/connection_manager'
import { SUPPORTED_PLATFORMS } from '#services/connectors'
import User from '#models/user'
import { startScheduleReminder } from '#services/schedule_reminder_service'

let io: SocketIOServer | null = null

export function getIO(): SocketIOServer | null {
  return io
}

export function setupSocketIO(httpServer: any) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
    },
  })

  // ── Socket.IO Authentication Middleware ──
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.replace('Bearer ', '')
      if (!token) return next(new Error('Authentication required'))

      // Verify token via AdonisJS access tokens
      const accessToken = await User.accessTokens.verify(new Secret(token))
      if (!accessToken) return next(new Error('Invalid token'))

      // Attach user info to socket for authorization
      ;(socket as any).userId = accessToken.tokenableId
      next()
    } catch (err: any) {
      console.warn(`🔒 Socket auth failed: ${err.message}`)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    const userId = (socket as any).userId
    console.log(`✅ Client kết nối: ${socket.id} (user: ${userId})`)

    // Client join shop room
    socket.on('join_shop', (data: any) => {
      const { shopId } = data
      for (const room of socket.rooms) {
        if (room !== socket.id && room.startsWith('shop_')) socket.leave(room)
      }
      socket.join(`shop_${shopId}`)
      console.log(`📌 Client ${socket.id} joined room: shop_${shopId}`)

      const stats = connectionManager.getStats(shopId)
      socket.emit('stats_update', stats)

      const status = connectionManager.isConnected(shopId)
      socket.emit('crawler_status', { status: status || 'waiting' })

      // ── Send existing comments from in-memory store (comment persistence on reload) ──
      const existingComments = connectionManager.leads.get(shopId)
      if (existingComments && existingComments.length > 0) {
        socket.emit('chat_history', existingComments)
      }
    })

    // Start mock mode
    socket.on('start_mock', (data: any) => {
      const { shopId, shopName } = data || {}
      if (shopId && io) {
        connectionManager.startMockConnection(
          { id: shopId, shopName: shopName || 'Mock Shop' },
          io
        )
      }
    })

    // Connect to live platform
    socket.on('connect_live', async (data: any) => {
      const { shop } = data || {}
      if (shop && io) {
        try {
          await connectionManager.startConnection(shop, io)
        } catch (err: any) {
          socket.emit('crawler_status', { status: 'error', message: err.message })
        }
      }
    })

    // Disconnect shop
    socket.on('disconnect_shop', (data: any) => {
      const { shopId } = data || {}
      if (shopId) connectionManager.stopConnection(shopId)
    })

    // Reset stats
    socket.on('reset_stats', (data: any) => {
      const { shopId } = data || {}
      if (shopId) {
        const conn = connectionManager.connections.get(shopId)
        if (conn && io) {
          conn.stats.hot = 0
          conn.stats.warm = 0
          conn.stats.cold = 0
          conn.stats.total = 0
          conn.stats.startTime = new Date().toISOString()
          io.to(`shop_${shopId}`).emit('stats_update', { ...conn.stats })
        }
      }
    })

    socket.on('disconnect', () => {
      console.log(`❌ Client ngắt kết nối: ${socket.id}`)
    })
  })

  console.log('🔌 Socket.IO ready (with auth)')

  // Start schedule reminder service
  startScheduleReminder(io)

  return io
}

