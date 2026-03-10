import type { HttpContext } from '@adonisjs/core/http'
import ProductPromotion from '#models/product_promotion'
import Coupon from '#models/coupon'
import { getUserShopIds } from '#services/scope_helper'

/**
 * PromotionsController
 * Manages product promotions + coupons
 */
export default class PromotionsController {
  // ── Product Promotions ──

  /**
   * GET /promotions — List promotions with product info
   */
  async index({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = ProductPromotion.query()
      .preload('product', (q) => {
        q.whereIn('shop_id', userShopIds)
        if (shopId) q.where('shopId', shopId)
      })
      .orderBy('created_at', 'desc')
    const promotions = await query
    // Filter out promotions without accessible products
    const filtered = promotions.filter((p) => p.product)
    return response.json(filtered)
  }

  /**
   * POST /promotions — Create/update product promotion
   */
  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only(['productId', 'pricePromotion', 'dateStart', 'dateEnd', 'status'])

    // Verify product belongs to user's shop
    const Product = (await import('#models/product')).default
    const product = await Product.query()
      .where('id', data.productId)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!product) return response.forbidden({ error: 'Product not found or access denied' })

    // Upsert (S-Cart: product_id is PK)
    const existing = await ProductPromotion.find(data.productId)
    if (existing) {
      existing.merge({
        pricePromotion: data.pricePromotion,
        dateStart: data.dateStart || null,
        dateEnd: data.dateEnd || null,
        status: data.status ?? 1,
      })
      await existing.save()
      return response.json(existing)
    }

    const promo = await ProductPromotion.create({
      productId: data.productId,
      pricePromotion: data.pricePromotion,
      dateStart: data.dateStart || null,
      dateEnd: data.dateEnd || null,
      status: data.status ?? 1,
    })
    return response.status(201).json(promo)
  }

  /**
   * DELETE /promotions/:productId — Remove promotion
   */
  async destroyPromotion({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const Product = (await import('#models/product')).default
    const product = await Product.query()
      .where('id', params.productId)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!product) return response.forbidden({ error: 'Access denied' })

    const promo = await ProductPromotion.find(params.productId)
    if (!promo) return response.notFound({ error: 'Promotion not found' })
    await promo.delete()
    return response.json({ message: 'Deleted' })
  }

  // ── Coupons ──

  /**
   * GET /coupons — List coupons
   */
  async listCoupons({ auth, request, response }: HttpContext) {
    const { shopId, page = 1, limit = 20 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = Coupon.query()
      .whereIn('store_id', userShopIds)
      .orderBy('created_at', 'desc')
    if (shopId) query.where('storeId', shopId)
    const coupons = await query.paginate(Number(page), Number(limit))
    return response.json(coupons)
  }

  /**
   * POST /coupons — Create coupon
   */
  async storeCoupon({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only([
      'code', 'type', 'value', 'minOrder', 'maxUses',
      'storeId', 'dateStart', 'dateEnd', 'status',
    ])
    if (!data.storeId || !userShopIds.includes(data.storeId)) {
      return response.forbidden({ error: 'Invalid store' })
    }

    const coupon = await Coupon.create({
      ...data,
      code: data.code.toUpperCase(),
      status: data.status ?? 1,
      usedCount: 0,
    })
    return response.status(201).json(coupon)
  }

  /**
   * PUT /coupons/:id — Update coupon
   */
  async updateCoupon({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const coupon = await Coupon.query()
      .where('id', params.id)
      .whereIn('store_id', userShopIds)
      .first()
    if (!coupon) return response.notFound({ error: 'Coupon not found' })

    const data = request.only([
      'code', 'type', 'value', 'minOrder', 'maxUses',
      'dateStart', 'dateEnd', 'status',
    ])
    if (data.code) data.code = data.code.toUpperCase()
    coupon.merge(data)
    await coupon.save()
    return response.json(coupon)
  }

  /**
   * DELETE /coupons/:id — Delete coupon
   */
  async destroyCoupon({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const coupon = await Coupon.query()
      .where('id', params.id)
      .whereIn('store_id', userShopIds)
      .first()
    if (!coupon) return response.notFound({ error: 'Coupon not found' })
    await coupon.delete()
    return response.json({ message: 'Deleted' })
  }

  /**
   * POST /coupons/validate — Validate a coupon code for checkout
   */
  async validateCoupon({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { code, shopId, subtotal = 0 } = request.only(['code', 'shopId', 'subtotal'])

    if (!shopId || !userShopIds.includes(shopId)) {
      return response.forbidden({ error: 'Invalid store' })
    }

    const coupon = await Coupon.query()
      .where('code', code.toUpperCase())
      .where('storeId', shopId)
      .first()
    if (!coupon) return response.notFound({ error: 'Coupon not found' })
    if (!coupon.isValid) return response.badRequest({ error: 'Coupon expired or exhausted' })
    if (subtotal < coupon.minOrder) {
      return response.badRequest({ error: `Minimum order: ${coupon.minOrder}` })
    }

    const discount = coupon.calculateDiscount(Number(subtotal))
    return response.json({ coupon, discount })
  }
}
