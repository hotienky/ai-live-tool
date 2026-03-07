/**
 * Connectors — Multi-platform connector factory
 *
 * Supported platforms:
 *   - TikTok:  tiktok-live-connector (WebSocket)
 *   - Facebook: Graph API polling on /{live-video-id}/live_comments
 *   - YouTube:  Data API v3 polling on liveChatMessages.list
 *   - Shopee:   Open Platform API v2.livestream.get_latest_comment_list
 */
import { EventEmitter } from 'node:events'
import crypto from 'node:crypto'

export const SUPPORTED_PLATFORMS = [
  { id: 'tiktok', name: 'TikTok Live', icon: '🎵', configField: 'tiktok_username' },
  { id: 'shopee', name: 'Shopee Live', icon: '🛒', configField: 'shopee_id' },
  { id: 'facebook', name: 'Facebook Live', icon: '📘', configField: 'facebook_page_id' },
  { id: 'youtube', name: 'YouTube Live', icon: '🎬', configField: 'youtube_channel_id' },
]

export class BaseConnector extends EventEmitter {
  platform: string
  protected polling: ReturnType<typeof setTimeout> | null = null
  // P3: Adaptive polling state
  protected pollInterval: number = 3000
  protected readonly MIN_POLL_MS = 1500
  protected readonly MAX_POLL_MS = 10000
  protected _destroyed = false

  constructor(platform: string) {
    super()
    this.platform = platform
  }

  async connect(): Promise<{ roomId: string; viewerCount: number }> {
    throw new Error('connect() not implemented')
  }

  // P3: Schedule next poll with adaptive interval
  protected schedulePoll(fn: () => Promise<void>) {
    if (this._destroyed) return
    this.polling = setTimeout(async () => {
      await fn()
      this.schedulePoll(fn)
    }, this.pollInterval)
  }

  // P3: Adjust interval based on comment count
  protected adaptInterval(commentCount: number) {
    if (commentCount > 5) this.pollInterval = this.MIN_POLL_MS
    else if (commentCount > 0) this.pollInterval = 2000
    else this.pollInterval = Math.min(this.pollInterval + 500, this.MAX_POLL_MS)
  }

  disconnect() {
    this._destroyed = true
    if (this.polling) {
      clearTimeout(this.polling)
      this.polling = null
    }
  }
}

// ──── TikTok ───────────────────────────────────────────
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

// ──── Facebook Live ────────────────────────────────────
// Uses Graph API: GET /{live-video-id}/comments?order=reverse_chronological
// Requires: Page Access Token + live video ID (from facebook_page_id)
export class FacebookConnector extends BaseConnector {
  private accessToken: string
  private pageId: string
  private liveVideoId: string | null = null
  private lastCommentTime: string | null = null

  constructor(config: { facebookAccessToken: string; facebookPageId: string }) {
    super('facebook')
    this.accessToken = config.facebookAccessToken || ''
    this.pageId = config.facebookPageId || ''
  }

  async connect() {
    if (!this.accessToken) throw new Error('Facebook Access Token chưa được cấu hình. Vào Settings → Kết nối để thêm.')
    if (!this.pageId) throw new Error('Facebook Page ID chưa được cấu hình.')

    // Find active live video for this page
    const liveRes = await fetch(
      `https://graph.facebook.com/v19.0/${this.pageId}/live_videos?status=LIVE_NOW&fields=id,title,live_views&access_token=${this.accessToken}`
    )
    const liveData = await liveRes.json() as any
    if (liveData.error) throw new Error(`Facebook API: ${liveData.error.message}`)

    const videos = liveData.data || []
    if (videos.length === 0) throw new Error('Không tìm thấy live video nào đang phát trên Page này.')

    this.liveVideoId = videos[0].id
    const viewerCount = videos[0].live_views || 0
    console.log(`📘 Facebook Live found: ${this.liveVideoId} (${viewerCount} viewers)`)

    // P3: Start adaptive polling (initial 3s, adjusts based on activity)
    this.pollInterval = 3000
    this.pollComments() // initial fetch
    this.schedulePoll(() => this.pollComments())

    return { roomId: this.liveVideoId!, viewerCount }
  }

  private async pollComments() {
    if (!this.liveVideoId) return
    try {
      let url = `https://graph.facebook.com/v19.0/${this.liveVideoId}/comments?order=reverse_chronological&limit=25&fields=from,message,created_time&access_token=${this.accessToken}`
      if (this.lastCommentTime) {
        url += `&since=${this.lastCommentTime}`
      }

      const res = await fetch(url)
      const data = await res.json() as any
      if (data.error) {
        console.error('📘 FB Comments error:', data.error.message)
        return
      }

      const comments = (data.data || []).reverse() // oldest first
      this.adaptInterval(comments.length) // P3: adaptive
      for (const c of comments) {
        this.lastCommentTime = c.created_time
        this.emit('chat', {
          nickname: c.from?.name || 'Facebook User',
          uniqueId: c.from?.id || 'unknown',
          comment: c.message || '',
          profilePictureUrl: c.from?.id
            ? `https://graph.facebook.com/v19.0/${c.from.id}/picture?type=small&access_token=${this.accessToken}`
            : '',
        })
      }

      // Also poll viewer count
      const videoRes = await fetch(
        `https://graph.facebook.com/v19.0/${this.liveVideoId}?fields=live_views&access_token=${this.accessToken}`
      )
      const videoData = await videoRes.json() as any
      if (videoData.live_views !== undefined) {
        this.emit('roomUser', { viewerCount: videoData.live_views })
      }
    } catch (err: any) {
      console.error('📘 FB poll error:', err.message)
    }
  }

  disconnect() {
    super.disconnect()
    this.liveVideoId = null
    this.lastCommentTime = null
  }
}

// ──── YouTube Live ─────────────────────────────────────
// Uses YouTube Data API v3: liveChatMessages.list
// Requires: API Key + channel/video ID
export class YouTubeConnector extends BaseConnector {
  private apiKey: string
  private channelId: string
  private liveChatId: string | null = null
  private nextPageToken: string | null = null

  constructor(config: { youtubeApiKey: string; youtubeChannel: string }) {
    super('youtube')
    this.apiKey = config.youtubeApiKey || ''
    this.channelId = config.youtubeChannel || ''
  }

  async connect() {
    if (!this.apiKey) throw new Error('YouTube API Key chưa được cấu hình. Vào Settings → Kết nối để thêm.')
    if (!this.channelId) throw new Error('YouTube Channel ID chưa được cấu hình.')

    // Step 1: Find active live broadcast
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${this.channelId}&type=video&eventType=live&key=${this.apiKey}`
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json() as any
    if (searchData.error) throw new Error(`YouTube API: ${searchData.error.message}`)

    const items = searchData.items || []
    if (items.length === 0) throw new Error('Không tìm thấy live stream nào đang phát trên channel này.')

    const videoId = items[0].id.videoId

    // Step 2: Get liveChatId from video details
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,statistics&id=${videoId}&key=${this.apiKey}`
    const videoRes = await fetch(videoUrl)
    const videoData = await videoRes.json() as any
    const video = videoData.items?.[0]
    if (!video) throw new Error('Không thể lấy thông tin live stream.')

    this.liveChatId = video.liveStreamingDetails?.activeLiveChatId
    if (!this.liveChatId) throw new Error('Live chat chưa được bật cho stream này.')

    const viewerCount = parseInt(video.liveStreamingDetails?.concurrentViewers || '0', 10)
    console.log(`🎬 YouTube Live found: ${videoId}, chatId: ${this.liveChatId} (${viewerCount} viewers)`)

    // P3: Start adaptive polling (initial 5s, adjusts based on activity)
    this.pollInterval = 5000
    this.pollChat() // initial fetch
    this.schedulePoll(() => this.pollChat())

    return { roomId: videoId, viewerCount }
  }

  private async pollChat() {
    if (!this.liveChatId) return
    try {
      let url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${this.liveChatId}&part=snippet,authorDetails&key=${this.apiKey}`
      if (this.nextPageToken) url += `&pageToken=${this.nextPageToken}`

      const res = await fetch(url)
      const data = await res.json() as any
      if (data.error) {
        if (data.error.code === 403 && data.error.errors?.[0]?.reason === 'liveChatEnded') {
          this.emit('disconnected')
          this.disconnect()
          return
        }
        console.error('🎬 YT Chat error:', data.error.message)
        return
      }

      this.nextPageToken = data.nextPageToken || null

      for (const item of (data.items || [])) {
        const snippet = item.snippet || {}
        const author = item.authorDetails || {}
        if (snippet.type === 'textMessageEvent') {
          this.emit('chat', {
            nickname: author.displayName || 'YouTube User',
            uniqueId: author.channelId || 'unknown',
            comment: snippet.textMessageDetails?.messageText || snippet.displayMessage || '',
            profilePictureUrl: author.profileImageUrl || '',
          })
        }
      }
      this.adaptInterval((data.items || []).length) // P3: adaptive
    } catch (err: any) {
      console.error('🎬 YT poll error:', err.message)
    }
  }

  disconnect() {
    super.disconnect()
    this.liveChatId = null
    this.nextPageToken = null
  }
}

// ──── Shopee Live ──────────────────────────────────────
// Uses Shopee Open Platform: v2.livestream.get_latest_comment_list
// Requires: Partner ID, Partner Key, Shop ID
export class ShopeeConnector extends BaseConnector {
  private partnerId: string
  private partnerKey: string
  private shopId: string
  private sessionId: string | null = null

  constructor(config: { shopeePartnerId: string; shopeePartnerKey: string; shopeeShopIdApi: string }) {
    super('shopee')
    this.partnerId = config.shopeePartnerId || ''
    this.partnerKey = config.shopeePartnerKey || ''
    this.shopId = config.shopeeShopIdApi || ''
  }

  async connect() {
    if (!this.partnerId || !this.partnerKey) throw new Error('Shopee Partner ID/Key chưa được cấu hình. Vào Settings → Kết nối để thêm.')
    if (!this.shopId) throw new Error('Shopee Shop ID chưa được cấu hình.')

    // Get active live session
    const sessionData = await this.shopeeApi('/api/v2/livestream/get_session_list', {
      page_size: 1,
      page_number: 1,
      status: 'live',
    })

    const sessions = sessionData?.session_list || []
    if (sessions.length === 0) throw new Error('Không tìm thấy live session nào đang phát trên Shopee.')

    this.sessionId = sessions[0].session_id
    const viewerCount = sessions[0].viewer_count || 0
    console.log(`🛒 Shopee Live found: session ${this.sessionId} (${viewerCount} viewers)`)

    // P3: Start adaptive polling (initial 3s, adjusts based on activity)
    this.pollInterval = 3000
    this.schedulePoll(() => this.pollComments())

    return { roomId: String(this.sessionId), viewerCount }
  }

  private async pollComments() {
    if (!this.sessionId) return
    try {
      const data = await this.shopeeApi('/api/v2/livestream/get_latest_comment_list', {
        session_id: this.sessionId,
      })

      for (const c of (data?.comment_list || [])) {
        this.emit('chat', {
          nickname: c.user_name || 'Shopee User',
          uniqueId: String(c.user_id || 'unknown'),
          comment: c.content || '',
          profilePictureUrl: '',
        })
      }
      this.adaptInterval((data?.comment_list || []).length) // P3: adaptive

      // Poll metrics
      const metrics = await this.shopeeApi('/api/v2/livestream/get_session_metric', {
        session_id: this.sessionId,
      })
      if (metrics?.view_count !== undefined) {
        this.emit('roomUser', { viewerCount: metrics.view_count })
      }
    } catch (err: any) {
      console.error('🛒 Shopee poll error:', err.message)
    }
  }

  private async shopeeApi(path: string, params: Record<string, any> = {}): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000)
    const baseString = `${this.partnerId}${path}${timestamp}${this.shopId}`
    const sign = crypto.createHmac('sha256', this.partnerKey).update(baseString).digest('hex')

    const queryParams = new URLSearchParams({
      partner_id: this.partnerId,
      timestamp: String(timestamp),
      sign,
      shop_id: this.shopId,
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    })

    const url = `https://partner.shopeemobile.com${path}?${queryParams.toString()}`
    const res = await fetch(url)
    const data = await res.json() as any
    if (data.error) throw new Error(`Shopee API: ${data.message || data.error}`)
    return data.response || data
  }

  disconnect() {
    super.disconnect()
    this.sessionId = null
  }
}

// ──── Factory ──────────────────────────────────────────
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
