/**
 * Notification Service — Auto-creates in-app notifications
 */
import { NotificationSchema } from '../../database/schema.js'

export type NotificationType = 'hot_lead' | 'disconnect' | 'connect' | 'info' | 'warning'

interface CreateNotifOpts {
  userId: number
  shopId?: string
  type: NotificationType
  title: string
  message?: string
  link?: string
}

class NotificationService {
  async create(opts: CreateNotifOpts) {
    try {
      return await NotificationSchema.create({
        userId: opts.userId,
        shopId: opts.shopId || null,
        type: opts.type,
        title: opts.title,
        message: opts.message || null,
        link: opts.link || null,
        isRead: false,
      })
    } catch (err: any) {
      console.error('🔔 Notification create error:', err.message)
      return null
    }
  }

  async hotLead(userId: number, shopId: string, nickname: string, comment: string) {
    return this.create({
      userId, shopId,
      type: 'hot_lead',
      title: `🔥 HOT Lead: ${nickname}`,
      message: comment.substring(0, 200),
      link: '/crm',
    })
  }

  async disconnected(userId: number, shopId: string, shopName: string) {
    return this.create({
      userId, shopId,
      type: 'disconnect',
      title: `⚠️ Mất kết nối: ${shopName}`,
      message: 'Livestream đã ngắt kết nối. Vui lòng kết nối lại.',
      link: '/live-monitor',
    })
  }

  async connected(userId: number, shopId: string, shopName: string, platform: string) {
    return this.create({
      userId, shopId,
      type: 'connect',
      title: `✅ Đã kết nối: ${shopName}`,
      message: `Đang theo dõi live trên ${platform}`,
    })
  }
}

export default new NotificationService()
