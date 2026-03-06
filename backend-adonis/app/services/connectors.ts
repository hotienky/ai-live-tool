/**
 * Connectors — Multi-platform connector factory
 */
import { EventEmitter } from 'node:events'

export const SUPPORTED_PLATFORMS = [
  { id: 'tiktok', name: 'TikTok Live', icon: '🎵', configField: 'tiktok_username' },
  { id: 'shopee', name: 'Shopee Live', icon: '🛒', configField: 'shopee_id' },
  { id: 'facebook', name: 'Facebook Live', icon: '📘', configField: 'facebook_page_id' },
  { id: 'youtube', name: 'YouTube Live', icon: '🎬', configField: 'youtube_channel_id' },
]

export class BaseConnector extends EventEmitter {
  platform: string
  constructor(platform: string) {
    super()
    this.platform = platform
  }
  async connect(): Promise<{ roomId: string; viewerCount: number }> {
    throw new Error('connect() not implemented')
  }
  disconnect() {}
}

export class TikTokConnector extends BaseConnector {
  private username: string
  private connection: any

  constructor(username: string) {
    super('tiktok')
    this.username = username
    this.connection = null
  }

  async connect() {
    const { WebcastPushConnection } = await import('tiktok-live-connector')
    this.connection = new WebcastPushConnection(this.username)
    const state = await this.connection.connect()

    this.connection.on('chat', (data: any) => {
      this.emit('chat', {
        nickname: data.nickname,
        uniqueId: data.uniqueId,
        comment: data.comment,
        profilePictureUrl: data.profilePictureUrl,
      })
    })

    this.connection.on('roomUser', (data: any) => {
      this.emit('roomUser', { viewerCount: data.viewerCount })
    })

    this.connection.on('disconnected', () => this.emit('disconnected'))

    return { roomId: state.roomId || '', viewerCount: state.viewerCount || 0 }
  }

  disconnect() {
    if (this.connection) {
      this.connection.disconnect()
      this.connection = null
    }
  }
}

// Placeholder connectors (Shopee, FB, YT — chưa có API chính thức)
export class ShopeeConnector extends BaseConnector {
  constructor(_config: any) { super('shopee') }
  async connect() { throw new Error('Shopee Live connector chưa được hỗ trợ') }
}

export class FacebookConnector extends BaseConnector {
  constructor(_config: any) { super('facebook') }
  async connect() { throw new Error('Facebook Live connector chưa được hỗ trợ') }
}

export class YouTubeConnector extends BaseConnector {
  constructor(_config: any) { super('youtube') }
  async connect() { throw new Error('YouTube Live connector chưa được hỗ trợ') }
}

export function createConnector(platform: string, config: any): BaseConnector {
  switch (platform?.toLowerCase()) {
    case 'tiktok':
      return new TikTokConnector(config.tiktokUsername || config.tiktok_username || config.username)
    case 'shopee':
      return new ShopeeConnector(config)
    case 'facebook':
      return new FacebookConnector(config)
    case 'youtube':
      return new YouTubeConnector(config)
    default:
      throw new Error(`Platform "${platform}" không được hỗ trợ`)
  }
}
