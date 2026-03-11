import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * StorefrontController — Public storefront API (no auth required)
 * All endpoints scoped by storeId
 */
export default class StorefrontController {
  /**
   * GET /shop/store/:storeId/products — List products (public)
   */
  async products({ params, request, response }: HttpContext) {
    const {
      search,
      category,
      brand,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc',
    } = request.qs()

    const query = db
      .from('products')
      .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
      .leftJoin('product_brands', 'products.brand_id', 'product_brands.id')
      .where('products.shop_id', params.storeId)
      .where('products.is_active', true)
      .select(
        'products.id',
        'products.name',
        'products.sku',
        'products.price',
        'products.promotion_price',
        'products.promotion_start',
        'products.promotion_end',
        'products.image_url as image',
        'products.description',
        'products.stock',
        'products.slug',
        'products.is_featured',
        'products.weight',
        'products.created_at',
        'products.updated_at',
        'product_categories.name as category',
        'product_brands.name as brand'
      )

    if (search) {
      query.where((q: any) => {
        q.whereILike('products.name', `%${search}%`)
          .orWhereILike('products.sku', `%${search}%`)
          .orWhereILike('products.description', `%${search}%`)
      })
    }
    if (category) query.where('products.category_id', category)
    if (brand) query.where('products.brand_id', brand)

    const validSorts = ['created_at', 'price', 'name', 'stock']
    const sortCol = validSorts.indexOf(sort) >= 0 ? sort : 'created_at'
    const sortOrder = order === 'asc' ? 'asc' : 'desc'
    query.orderBy(`products.${sortCol}`, sortOrder as 'asc' | 'desc')

    const result = await query.paginate(Number(page), Number(limit))
    return response.json(result)
  }

  /**
   * GET /shop/store/:storeId/products/:id — Product detail (public)
   */
  async productDetail({ params, response }: HttpContext) {
    const product = await db
      .from('products')
      .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
      .leftJoin('product_brands', 'products.brand_id', 'product_brands.id')
      .where('products.id', params.id)
      .where('products.shop_id', params.storeId)
      .where('products.is_active', true)
      .select(
        'products.*',
        'product_categories.name as category',
        'product_brands.name as brand'
      )
      .first()
    if (!product) return response.notFound({ error: 'Product not found' })
    return response.json(product)
  }

  /**
   * GET /shop/store/:storeId/categories — Categories list (public)
   */
  async categories({ params, response }: HttpContext) {
    const categories = await db
      .from('product_categories')
      .where('shop_id', params.storeId)
      .where('is_active', true)
      .select('id', 'name', 'slug', 'description', 'image_url as image', 'parent_id', 'sort_order as sort')
      .orderBy('sort_order', 'asc')
    return response.json(categories)
  }

  /**
   * GET /shop/store/:storeId/brands — Brands list (public)
   */
  async brands({ params, response }: HttpContext) {
    const brands = await db
      .from('product_brands')
      .where('shop_id', params.storeId)
      .where('is_active', true)
      .select('id', 'name', 'slug', 'description', 'logo_url as image')
      .orderBy('name', 'asc')
    return response.json(brands)
  }

  /**
   * GET /shop/store/:storeId/banners — Active banners (public)
   */
  async banners({ params, response }: HttpContext) {
    try {
      const banners = await db
        .from('banners')
        .where('store_id', params.storeId)
        .where('status', 1)
        .select('id', 'title', 'image', 'url', 'description', 'sort', 'type')
        .orderBy('sort', 'asc')
      return response.json(banners)
    } catch {
      return response.json([])
    }
  }

  /**
   * GET /shop/store/:storeId/pages — Published CMS pages (public)
   */
  async pages({ params, response }: HttpContext) {
    try {
      const pages = await db
        .from('cms_pages')
        .where('store_id', params.storeId)
        .where('status', 1)
        .select('id', 'title', 'alias as slug', 'image', 'created_at')
        .orderBy('sort', 'asc')
      return response.json(pages)
    } catch {
      return response.json([])
    }
  }

  /**
   * GET /shop/store/:storeId/pages/:id — CMS page detail (public)
   */
  async pageDetail({ params, response }: HttpContext) {
    const page = await db
      .from('cms_pages')
      .where('id', params.id)
      .where('store_id', params.storeId)
      .where('status', 1)
      .first()
    if (!page) return response.notFound({ error: 'Page not found' })
    return response.json(page)
  }

  /**
   * GET /shop/store/:storeId/info — Store info (public)
   */
  async storeInfo({ params, response }: HttpContext) {
    const store = await db
      .from('shops')
      .where('id', params.storeId)
      .select('id', 'shop_name', 'platform', 'logo')
      .first()
    if (!store) return response.notFound({ error: 'Store not found' })
    return response.json(store)
  }
}
