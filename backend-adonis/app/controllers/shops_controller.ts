import type { HttpContext } from '@adonisjs/core/http'
import Shop from '#models/shop'
import FindOrCreateShopAction from '#actions/shops/find_or_create_shop_action'

export default class ShopsController {
  async index({ auth, response }: HttpContext) {
    const shops = await Shop.query()
      .where('userId', auth.user!.id)
      .orderBy('created_at', 'desc')
    return response.json(shops)
  }

  async store({ auth, request, response }: HttpContext) {
    const data = request.only(['shopName', 'platform', 'tiktokUsername', 'shopeeShopId', 'facebookPageId', 'youtubeChannel'])
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
      'shopName', 'platform', 'tiktokUsername', 'shopeeShopId', 'facebookPageId', 'youtubeChannel',
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
    const { platform, tiktokUsername, facebookPageId, youtubeChannel, shopeeShopId, sessionName } =
      request.only([
        'platform',
        'tiktokUsername',
        'facebookPageId',
        'youtubeChannel',
        'shopeeShopId',
        'sessionName',
      ])
    if (!platform) return response.badRequest({ error: 'platform is required' })

    const shop = await FindOrCreateShopAction.handle({
      userId: auth.user!.id,
      platform,
      tiktokUsername,
      facebookPageId,
      youtubeChannel,
      shopeeShopId,
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
