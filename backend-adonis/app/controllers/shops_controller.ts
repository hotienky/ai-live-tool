import type { HttpContext } from '@adonisjs/core/http'
import Shop from '#models/shop'
import FindOrCreateShopAction from '#actions/shops/find_or_create_shop_action'

export default class ShopsController {
  async index({ auth, response }: HttpContext) {
    let shops = await Shop.query()
      .where('userId', auth.user!.id)
      .orderBy('created_at', 'desc')

    // 1 user = 1 shop: auto-create if user has no shop yet
    if (shops.length === 0) {
      const user = auth.user!
      const shop = await Shop.create({
        userId: user.id,
        shopName: `${user.fullName || user.email.split('@')[0]}'s Shop`,
        platform: 'tiktok',
        isActive: true,
      })
      shops = [shop]
    }

    return response.json(shops)
  }

  async store({ auth, request, response }: HttpContext) {
    const data = request.only(['shopName', 'platform', 'tiktokUsername', 'shopeeId', 'facebookPageId', 'youtubeChannelId'])
    if (!data.shopName) {
      return response.badRequest({ error: 'shopName is required' })
    }
    const shop = await Shop.create({ ...data, userId: auth.user!.id, isActive: true })
    return response.json(shop)
  }

  async show({ auth, params, response }: HttpContext) {
    const shop = await Shop.query()
      .where('id', params.id)
      .where('userId', auth.user!.id)
      .first()
    if (!shop) return response.notFound({ error: 'Shop not found' })
    return response.json(shop)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const shop = await Shop.query()
      .where('id', params.id)
      .where('userId', auth.user!.id)
      .first()
    if (!shop) return response.notFound({ error: 'Shop not found' })

    const data = request.only([
      'shopName', 'platform', 'tiktokUsername', 'shopeeId', 'facebookPageId', 'youtubeChannelId',
      'isActive', 'autoReplyEnabled',
      'facebookAccessToken', 'youtubeApiKey',
      'shopeePartnerId', 'shopeePartnerKey', 'shopeeShopIdApi',
      'moderationBlacklist', 'moderationHideSpam', 'moderationRateLimit', 'moderationMaxPerMinute',
    ])
    shop.merge(data)
    await shop.save()
    return response.json(shop)
  }

  async findOrCreate({ auth, request, response }: HttpContext) {
    const { platform, tiktokUsername, facebookPageId, youtubeChannelId, shopeeId, sessionName } =
      request.only([
        'platform',
        'tiktokUsername',
        'facebookPageId',
        'youtubeChannelId',
        'shopeeId',
        'sessionName',
      ])
    if (!platform) return response.badRequest({ error: 'platform is required' })

    const shop = await FindOrCreateShopAction.handle({
      userId: auth.user!.id,
      platform,
      tiktokUsername,
      facebookPageId,
      youtubeChannelId,
      shopeeId,
      sessionName,
    })
    return response.json(shop)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const shop = await Shop.query()
      .where('id', params.id)
      .where('userId', auth.user!.id)
      .first()
    if (!shop) return response.notFound({ error: 'Shop not found' })
    await shop.delete()
    return response.json({ success: true })
  }
}
