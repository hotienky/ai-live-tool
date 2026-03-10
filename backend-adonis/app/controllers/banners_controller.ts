import type { HttpContext } from '@adonisjs/core/http'
import Banner from '#models/banner'
import { getUserShopIds } from '#services/scope_helper'

/**
 * BannersController — S-Cart: AdminBannerController pattern
 * CRUD for image banners with type filter
 */
export default class BannersController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId, type } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const query = Banner.query()
      .whereIn('store_id', userShopIds)
      .orderBy('sort', 'asc')
      .orderBy('created_at', 'desc')
    if (shopId) query.where('storeId', shopId)
    if (type) query.where('type', type)
    const banners = await query
    return response.json(banners)
  }

  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only(['title', 'image', 'url', 'type', 'sort', 'status', 'storeId'])
    if (!data.storeId || !userShopIds.includes(data.storeId)) {
      return response.forbidden({ error: 'Invalid store' })
    }
    const banner = await Banner.create({
      ...data,
      type: data.type || 'banner',
      status: data.status ?? 1,
      sort: data.sort ?? 0,
    })
    return response.status(201).json(banner)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const banner = await Banner.query()
      .where('id', params.id).whereIn('store_id', userShopIds).first()
    if (!banner) return response.notFound({ error: 'Banner not found' })
    const data = request.only(['title', 'image', 'url', 'type', 'sort', 'status'])
    banner.merge(data)
    await banner.save()
    return response.json(banner)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const banner = await Banner.query()
      .where('id', params.id).whereIn('store_id', userShopIds).first()
    if (!banner) return response.notFound({ error: 'Banner not found' })
    await banner.delete()
    return response.json({ message: 'Deleted' })
  }
}
