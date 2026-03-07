import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { getUserShopIds } from '#services/scope_helper'

export default class ProductsController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId, category, search } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = Product.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('created_at', 'desc')
    if (shopId) query.where('shop_id', shopId)
    if (category) query.where('category', category)
    if (search) query.where((q) => {
      q.whereILike('name', `%${search}%`)
        .orWhereILike('sku', `%${search}%`)
        .orWhereILike('barcode', `%${search}%`)
    })
    const products = await query
    return response.json(products)
  }

  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only([
      'shopId', 'name', 'price', 'keywords', 'description', 'imageUrl',
      'sku', 'stock', 'lowStockThreshold', 'costPrice', 'category', 'unit', 'barcode',
    ])
    if (!data.name) return response.badRequest({ error: 'name is required' })
    if (data.shopId && !userShopIds.includes(String(data.shopId))) {
      return response.forbidden({ error: 'Shop not found' })
    }
    const product = await Product.create({
      ...data,
      stock: Number(data.stock) || 0,
      lowStockThreshold: Number(data.lowStockThreshold) || 5,
      isActive: true,
    })
    return response.json(product)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const product = await Product.query()
      .where('id', params.id)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!product) return response.notFound({ error: 'Product not found' })
    product.merge(request.only([
      'name', 'price', 'keywords', 'description', 'imageUrl', 'isActive',
      'sku', 'costPrice', 'category', 'unit', 'barcode', 'lowStockThreshold',
    ]))
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

  async stats(ctx: HttpContext) {
    const getInventoryStatsAction = (await import('#actions/inventory/get_inventory_stats_action')).default
    return getInventoryStatsAction(ctx)
  }

  async stockHistory(ctx: HttpContext) {
    const getStockHistoryAction = (await import('#actions/inventory/get_stock_history_action')).default
    return getStockHistoryAction(ctx)
  }

  async adjustStock(ctx: HttpContext) {
    const adjustStockAction = (await import('#actions/inventory/adjust_stock_action')).default
    return adjustStockAction(ctx)
  }

  async importCsv(ctx: HttpContext) {
    const importProductsAction = (await import('#actions/inventory/import_products_action')).default
    return importProductsAction(ctx)
  }

  async exportCsv(ctx: HttpContext) {
    const exportProductsAction = (await import('#actions/inventory/export_products_action')).default
    return exportProductsAction(ctx)
  }
}
