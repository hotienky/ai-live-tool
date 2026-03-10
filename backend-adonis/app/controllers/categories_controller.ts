import type { HttpContext } from '@adonisjs/core/http'
import ProductCategory from '#models/product_category'
import { getUserShopIds } from '#services/scope_helper'

export default class CategoriesController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = ProductCategory.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
    if (shopId) query.where('shop_id', shopId)
    const categories = await query
    return response.json(categories)
  }

  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only([
      'shopId', 'name', 'description', 'imageUrl', 'parentId', 'sortOrder',
    ])
    if (!data.name) return response.badRequest({ error: 'Tên danh mục là bắt buộc' })
    if (data.shopId && !userShopIds.includes(String(data.shopId))) {
      return response.forbidden({ error: 'Shop not found' })
    }

    // Auto-generate slug
    const slug = data.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    try {
      const category = await ProductCategory.create({
        ...data,
        slug,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: true,
      })
      return response.json(category)
    } catch (err: any) {
      return response.internalServerError({ error: 'Không thể tạo danh mục: ' + err.message })
    }
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const category = await ProductCategory.query()
      .whereIn('shop_id', userShopIds)
      .where('id', params.id)
      .first()
    if (!category) return response.notFound({ error: 'Category not found' })

    const data = request.only([
      'name', 'description', 'imageUrl', 'parentId', 'sortOrder', 'isActive',
    ])
    if (data.name) {
      data.slug = data.name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }
    category.merge(data)
    await category.save()
    return response.json(category)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const category = await ProductCategory.query()
      .whereIn('shop_id', userShopIds)
      .where('id', params.id)
      .first()
    if (!category) return response.notFound({ error: 'Category not found' })
    await category.delete()
    return response.json({ success: true })
  }
}
