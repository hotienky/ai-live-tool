import type { HttpContext } from '@adonisjs/core/http'
import ProductBrand from '#models/product_brand'
import { getUserShopIds } from '#services/scope_helper'

export default class BrandsController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = ProductBrand.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('name', 'asc')
    if (shopId) query.where('shop_id', shopId)
    const brands = await query
    return response.json(brands)
  }

  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only(['shopId', 'name', 'description', 'logoUrl'])
    if (!data.name) return response.badRequest({ error: 'Tên thương hiệu là bắt buộc' })
    if (data.shopId && !userShopIds.includes(String(data.shopId))) {
      return response.forbidden({ error: 'Shop not found' })
    }

    const slug = data.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    try {
      const brand = await ProductBrand.create({
        ...data,
        slug,
        isActive: true,
      })
      return response.json(brand)
    } catch (err: any) {
      return response.internalServerError({ error: 'Không thể tạo thương hiệu: ' + err.message })
    }
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const brand = await ProductBrand.query()
      .whereIn('shop_id', userShopIds)
      .where('id', params.id)
      .first()
    if (!brand) return response.notFound({ error: 'Brand not found' })

    const data = request.only(['name', 'description', 'logoUrl', 'isActive'])
    if (data.name) {
      data.slug = data.name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }
    brand.merge(data)
    await brand.save()
    return response.json(brand)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const brand = await ProductBrand.query()
      .whereIn('shop_id', userShopIds)
      .where('id', params.id)
      .first()
    if (!brand) return response.notFound({ error: 'Brand not found' })
    await brand.delete()
    return response.json({ success: true })
  }
}
