import type { HttpContext } from '@adonisjs/core/http'
import CmsPage from '#models/cms_page'
import { getUserShopIds } from '#services/scope_helper'

/**
 * CmsPagesController — S-Cart: AdminPageController pattern
 * CRUD for CMS content pages
 */
export default class CmsPagesController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const query = CmsPage.query()
      .whereIn('store_id', userShopIds)
      .orderBy('sort', 'asc')
      .orderBy('created_at', 'desc')
    if (shopId) query.where('storeId', shopId)
    const pages = await query
    return response.json(pages)
  }

  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only(['title', 'alias', 'content', 'image', 'status', 'sort', 'storeId'])
    if (!data.storeId || !userShopIds.includes(data.storeId)) {
      return response.forbidden({ error: 'Invalid store' })
    }
    // Auto-generate alias from title if not provided
    if (!data.alias) {
      data.alias = data.title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    const page = await CmsPage.create({ ...data, status: data.status ?? 1, sort: data.sort ?? 0 })
    return response.status(201).json(page)
  }

  async show({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const page = await CmsPage.query()
      .where('id', params.id).whereIn('store_id', userShopIds).first()
    if (!page) return response.notFound({ error: 'Page not found' })
    return response.json(page)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const page = await CmsPage.query()
      .where('id', params.id).whereIn('store_id', userShopIds).first()
    if (!page) return response.notFound({ error: 'Page not found' })
    const data = request.only(['title', 'alias', 'content', 'image', 'status', 'sort'])
    page.merge(data)
    await page.save()
    return response.json(page)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const page = await CmsPage.query()
      .where('id', params.id).whereIn('store_id', userShopIds).first()
    if (!page) return response.notFound({ error: 'Page not found' })
    await page.delete()
    return response.json({ message: 'Deleted' })
  }
}
