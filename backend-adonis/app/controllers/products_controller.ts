import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { getUserShopIds } from '#services/scope_helper'

export default class ProductsController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = Product.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('created_at', 'desc')
    if (shopId) query.where('shop_id', shopId)
    const products = await query
    return response.json(products)
  }

  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only(['shopId', 'name', 'price', 'keywords', 'description', 'imageUrl'])
    if (!data.name) return response.badRequest({ error: 'name is required' })
    if (data.shopId && !userShopIds.includes(String(data.shopId))) {
      return response.forbidden({ error: 'Shop not found' })
    }
    const product = await Product.create({ ...data, isActive: true })
    return response.json(product)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const product = await Product.query()
      .where('id', params.id)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!product) return response.notFound({ error: 'Product not found' })
    product.merge(request.only(['name', 'price', 'keywords', 'description', 'imageUrl', 'isActive']))
    await product.save()
    return response.json(product)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const product = await Product.query()
      .where('id', params.id)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!product) return response.notFound({ error: 'Product not found' })
    await product.delete()
    return response.json({ success: true })
  }
}
