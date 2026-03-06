import type { HttpContext } from '@adonisjs/core/http'
import Shop from '#models/shop'

export default class ShopsController {
  async index({ response }: HttpContext) {
    const shops = await Shop.query().orderBy('created_at', 'desc')
    return response.json(shops)
  }

  async store({ request, response }: HttpContext) {
    const data = request.only(['shopName', 'platform', 'tiktokUsername', 'shopeeShopId', 'facebookPageId', 'youtubeChannel'])
    if (!data.shopName) {
      return response.badRequest({ error: 'shopName is required' })
    }
    const shop = await Shop.create({ ...data, isActive: true })
    return response.json(shop)
  }

  async show({ params, response }: HttpContext) {
    const shop = await Shop.find(params.id)
    if (!shop) return response.notFound({ error: 'Shop not found' })
    return response.json(shop)
  }

  async update({ params, request, response }: HttpContext) {
    const shop = await Shop.find(params.id)
    if (!shop) return response.notFound({ error: 'Shop not found' })

    const data = request.only(['shopName', 'platform', 'tiktokUsername', 'shopeeShopId', 'facebookPageId', 'youtubeChannel', 'isActive'])
    shop.merge(data)
    await shop.save()
    return response.json(shop)
  }

  async destroy({ params, response }: HttpContext) {
    const shop = await Shop.find(params.id)
    if (!shop) return response.notFound({ error: 'Shop not found' })
    await shop.delete()
    return response.json({ success: true })
  }
}
