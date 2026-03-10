import type { HttpContext } from '@adonisjs/core/http'
import NavLink from '#models/nav_link'
import { getUserShopIds } from '#services/scope_helper'

/**
 * NavLinksController — S-Cart: AdminLinkController pattern
 * CRUD for navigation links with group and hierarchy
 */
export default class NavLinksController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId, group } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const query = NavLink.query()
      .whereIn('store_id', userShopIds)
      .whereNull('collectionId') // Only top-level
      .preload('children', (cq) => cq.orderBy('sort', 'asc'))
      .orderBy('sort', 'asc')
    if (shopId) query.where('storeId', shopId)
    if (group) query.where('group', group)
    const links = await query
    return response.json(links)
  }

  /** Flat list (all links, no hierarchy) */
  async flat({ auth, request, response }: HttpContext) {
    const { shopId, group } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const query = NavLink.query()
      .whereIn('store_id', userShopIds)
      .orderBy('sort', 'asc')
    if (shopId) query.where('storeId', shopId)
    if (group) query.where('group', group)
    const links = await query
    return response.json(links)
  }

  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only([
      'name', 'url', 'group', 'type', 'collectionId', 'target', 'icon', 'sort', 'status', 'storeId',
    ])
    if (!data.storeId || !userShopIds.includes(data.storeId)) {
      return response.forbidden({ error: 'Invalid store' })
    }
    const link = await NavLink.create({
      ...data,
      group: data.group || 'menu',
      type: data.type || 'single',
      target: data.target || '_self',
      status: data.status ?? 1,
      sort: data.sort ?? 0,
    })
    return response.status(201).json(link)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const link = await NavLink.query()
      .where('id', params.id).whereIn('store_id', userShopIds).first()
    if (!link) return response.notFound({ error: 'Link not found' })
    const data = request.only([
      'name', 'url', 'group', 'type', 'collectionId', 'target', 'icon', 'sort', 'status',
    ])
    link.merge(data)
    await link.save()
    return response.json(link)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const link = await NavLink.query()
      .where('id', params.id).whereIn('store_id', userShopIds).first()
    if (!link) return response.notFound({ error: 'Link not found' })
    await link.delete()
    return response.json({ message: 'Deleted' })
  }

  /** Reorder links */
  async reorder({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { items } = request.only(['items']) // [{id, sort}]
    if (!Array.isArray(items)) return response.badRequest({ error: 'items required' })
    for (const item of items) {
      await NavLink.query()
        .where('id', item.id)
        .whereIn('store_id', userShopIds)
        .update({ sort: item.sort })
    }
    return response.json({ message: 'Reordered' })
  }
}
