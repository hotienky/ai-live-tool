import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { getUserShopIds } from '#services/scope_helper'
import { logActivity, Actions } from '#services/activity_log_service'

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

    try { await logActivity({ shopId: Number(data.shopId), userId: auth.user!.id, action: Actions.PRODUCT_CREATED, entityType: 'Product', entityId: product.id, details: { name: product.name } }) } catch { /* best-effort */ }

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

  // ── Product Variants ─────────────────────────────────

  async getVariants({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const product = await Product.query()
      .where('id', params.productId)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!product) return response.notFound({ error: 'Product not found' })

    const ProductVariant = (await import('#models/product_variant')).default
    const variants = await ProductVariant.query()
      .where('productId', product.id)
      .orderBy('created_at', 'desc')
    // B6 Fix: parse attributes JSON string → object for frontend
    const parsed = variants.map((v: any) => {
      const obj = v.serialize()
      if (obj.attributes && typeof obj.attributes === 'string') {
        try { obj.attributes = JSON.parse(obj.attributes) } catch { /* keep string */ }
      }
      return obj
    })
    return response.json(parsed)
  }

  async createVariant({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const product = await Product.query()
      .where('id', params.productId)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!product) return response.notFound({ error: 'Product not found' })

    const data = request.only(['name', 'sku', 'price', 'costPrice', 'stock', 'attributes'])
    if (!data.name) return response.badRequest({ error: 'name is required' })

    const ProductVariant = (await import('#models/product_variant')).default
    const variant = await ProductVariant.create({
      productId: product.id,
      name: data.name,
      sku: data.sku || null,
      price: Number(data.price) || null,
      costPrice: Number(data.costPrice) || null,
      stock: Number(data.stock) || 0,
      attributes: data.attributes ? JSON.stringify(data.attributes) : null,
      isActive: true,
    })
    return response.json(variant)
  }

  async updateVariant({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const product = await Product.query()
      .where('id', params.productId)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!product) return response.notFound({ error: 'Product not found' })

    const ProductVariant = (await import('#models/product_variant')).default
    const variant = await ProductVariant.query()
      .where('id', params.variantId)
      .where('productId', product.id)
      .first()
    if (!variant) return response.notFound({ error: 'Variant not found' })

    variant.merge(request.only(['name', 'sku', 'price', 'costPrice', 'stock', 'isActive']))
    if (request.input('attributes')) {
      variant.attributes = JSON.stringify(request.input('attributes'))
    }
    await variant.save()
    return response.json(variant)
  }

  async deleteVariant({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const product = await Product.query()
      .where('id', params.productId)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!product) return response.notFound({ error: 'Product not found' })

    const ProductVariant = (await import('#models/product_variant')).default
    const variant = await ProductVariant.query()
      .where('id', params.variantId)
      .where('productId', product.id)
      .first()
    if (!variant) return response.notFound({ error: 'Variant not found' })

    await variant.delete()
    return response.json({ success: true })
  }
}
