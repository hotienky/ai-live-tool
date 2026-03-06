import type { HttpContext } from '@adonisjs/core/http'
import Shop from '#models/shop'

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
    ])
    shop.merge(data)
    await shop.save()
    return response.json(shop)
  }

  async findOrCreate({ auth, request, response }: HttpContext) {
    const { platform, tiktokUsername, facebookPageId, youtubeChannel, shopeeShopId, sessionName } = request.only([
      'platform', 'tiktokUsername', 'facebookPageId', 'youtubeChannel', 'shopeeShopId', 'sessionName',
    ])
    if (!platform) return response.badRequest({ error: 'platform is required' })

    // Build lookup query by platform + identifier
    let query = Shop.query().where('userId', auth.user!.id).where('platform', platform)
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
        userId: auth.user!.id,
        shopName: autoName,
        platform,
        tiktokUsername: platform === 'tiktok' ? identifier : null,
        facebookPageId: platform === 'facebook' ? identifier : null,
        youtubeChannel: platform === 'youtube' ? identifier : null,
        shopeeShopId: platform === 'shopee' ? identifier : null,
        isActive: true,
      })
    }
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
