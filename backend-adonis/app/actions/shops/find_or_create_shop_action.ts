import Shop from '#models/shop'

interface Params {
  userId: number
  platform: string
  tiktokUsername?: string
  facebookPageId?: string
  youtubeChannel?: string
  shopeeShopId?: string
  sessionName?: string
}

export default class FindOrCreateShopAction {
  static async handle({ userId, platform, tiktokUsername, facebookPageId, youtubeChannel, shopeeShopId, sessionName }: Params) {
    // Build lookup query by platform + identifier
    let query = Shop.query().where('userId', userId).where('platform', platform)
    let identifier = ''

    if (platform === 'tiktok' && tiktokUsername) {
      query = query.where('tiktokUsername', tiktokUsername.replace(/^@/, ''))
      identifier = tiktokUsername.replace(/^@/, '')
    } else if (platform === 'facebook' && facebookPageId) {
      query = query.where('facebookPageId', facebookPageId)
      identifier = facebookPageId
    } else if (platform === 'youtube' && youtubeChannel) {
      query = query.where('youtubeChannel', youtubeChannel)
      identifier = youtubeChannel
    } else if (platform === 'shopee' && shopeeShopId) {
      query = query.where('shopeeShopId', shopeeShopId)
      identifier = shopeeShopId
    }

    let shop = await query.first()
    if (!shop) {
      const autoName = sessionName || `${platform} - ${identifier || 'Live'}`
      shop = await Shop.create({
        userId,
        shopName: autoName,
        platform,
        tiktokUsername: platform === 'tiktok' ? identifier : null,
        facebookPageId: platform === 'facebook' ? identifier : null,
        youtubeChannel: platform === 'youtube' ? identifier : null,
        shopeeShopId: platform === 'shopee' ? identifier : null,
        isActive: true,
      })
    }

    return shop
  }
}
