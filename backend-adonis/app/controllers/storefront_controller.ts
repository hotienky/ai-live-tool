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
    try {
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
    } catch (error: any) {
      console.error('[Storefront] products error:', error.message)
      return response.json({ meta: { total: 0, per_page: 20, current_page: 1 }, data: [] })
    }
  }

  /**
   * GET /storefront/products/:slug — Product detail by slug (public)
   */
  async productDetail({ params, response }: HttpContext) {
    try {
      const identifier = params.id
      const isNumeric = /^\d+$/.test(identifier)

      const query = db
        .from('products')
        .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
        .leftJoin('product_brands', 'products.brand_id', 'product_brands.id')
        .where('products.is_active', true)
        .select(
          'products.*',
          'product_categories.name as category',
          'product_brands.name as brand'
        )

      if (isNumeric) {
        query.where('products.id', identifier)
      } else {
        query.where((q: any) => {
          q.where('products.slug', identifier).orWhere('products.sku', identifier)
        })
      }

      const product = await query.first()
      if (!product) return response.notFound({ error: 'Product not found' })
      return response.json(product)
    } catch (error: any) {
      console.error('[Storefront] productDetail error:', error.message)
      return response.notFound({ error: 'Product not found' })
    }
  }

  /**
   * GET /shop/store/:storeId/categories — Categories list (public)
   */
  async categories({ params, response }: HttpContext) {
    try {
      const categories = await db
        .from('product_categories')
        .where('is_active', true)
        .select('id', 'name', 'slug', 'description', 'image_url as image', 'parent_id', 'sort_order as sort')
        .orderBy('sort_order', 'asc')
      return response.json(categories)
    } catch (error: any) {
      console.error('[Storefront] categories error:', error.message)
      return response.json([])
    }
  }

  /**
   * GET /shop/store/:storeId/brands — Brands list (public)
   */
  async brands({ params, response }: HttpContext) {
    try {
      const brands = await db
        .from('product_brands')
        .where('is_active', true)
        .select('id', 'name', 'slug', 'description', 'logo_url as image')
        .orderBy('name', 'asc')
      return response.json(brands)
    } catch (error: any) {
      console.error('[Storefront] brands error:', error.message)
      return response.json([])
    }
  }

  /**
   * GET /shop/store/:storeId/banners — Active banners (public)
   */
  async banners({ params, response }: HttpContext) {
    try {
      const banners = await db
        .from('banners')
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
        .where('status', 1)
        .select('id', 'title', 'alias as slug', 'image', 'created_at')
        .orderBy('sort', 'asc')
      return response.json(pages)
    } catch {
      return response.json([])
    }
  }

  /**
   * GET /storefront/pages/:slug — CMS page detail by slug (public)
   */
  async pageDetail({ params, response }: HttpContext) {
    try {
      const identifier = params.id
      const isNumeric = /^\d+$/.test(identifier)

      const query = db.from('cms_pages').where('status', 1)

      if (isNumeric) {
        query.where('id', identifier)
      } else {
        query.where('alias', identifier)
      }

      const page = await query.first()
      if (!page) return response.notFound({ error: 'Page not found' })
      return response.json(page)
    } catch (error: any) {
      console.error('[Storefront] pageDetail error:', error.message)
      return response.notFound({ error: 'Page not found' })
    }
  }

  /**
   * GET /shop/store/:storeId/info — Store info (public)
   */
  async storeInfo({ response }: HttpContext) {
    try {
      const info = await db.from('system_configs')
        .where('group_name', 'store')
        .select('key', 'value')
      const config: Record<string, string> = {}
      for (const r of info) {
        config[r.key] = r.value
      }
      return response.json(config)
    } catch {
      return response.json({})
    }
  }

  /**
   * POST /api/storefront/checkout — Guest checkout (no auth required)
   */
  async checkout({ request, response }: HttpContext) {
    const { customerName, customerPhone, customerAddress, paymentMethod, notes, items, totalAmount } = request.body()

    if (!customerName || !customerPhone || !customerAddress) {
      return response.badRequest({ error: 'Vui lòng điền đầy đủ họ tên, SĐT và địa chỉ' })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return response.badRequest({ error: 'Giỏ hàng trống' })
    }

    try {
      const subtotal = items.reduce((sum: number, i: any) =>
        sum + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)
      const finalTotal = Number(totalAmount) || subtotal

      const [order] = await db.table('orders').insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        status: 'pending',
        total_amount: finalTotal,
        items: JSON.stringify(items),
        notes: notes || null,
        payment_method: paymentMethod || 'cod',
        payment_status: 'unpaid',
      }).returning('*')

      for (const item of items) {
        await db.table('order_details').insert({
          order_id: order.id,
          product_id: item.productId || null,
          name: item.name || 'Sản phẩm',
          sku: item.sku || null,
          price: Number(item.price) || 0,
          qty: Number(item.qty) || 1,
          total_price: (Number(item.price) || 0) * (Number(item.qty) || 1),
        })
      }

      await db.table('order_totals').insert([
        { order_id: order.id, title: 'Tạm tính', code: 'subtotal', value: subtotal, sort: 1 },
        { order_id: order.id, title: 'Phí vận chuyển', code: 'shipping', value: 0, sort: 2 },
        { order_id: order.id, title: 'Tổng cộng', code: 'total', value: finalTotal, sort: 100 },
      ])

      await db.table('order_history').insert({
        order_id: order.id,
        order_status_id: 1,
        content: 'Đơn hàng mới từ website',
      })

      return response.status(201).json({
        id: order.id,
        status: order.status,
        totalAmount: order.total_amount,
        message: 'Đặt hàng thành công!',
      })
    } catch (err: any) {
      console.error('Checkout error:', err.message)
      return response.internalServerError({ error: 'Đặt hàng thất bại: ' + err.message })
    }
  }

  // ══════════════════════════════════════
  //  i18n Public API
  // ══════════════════════════════════════

  /** GET /api/storefront/languages — Active languages */
  async languages({ response }: HttpContext) {
    try {
      const langs = await db.from('languages')
        .where('is_active', true)
        .orderBy('sort', 'asc')
        .select('id', 'code', 'name', 'icon', 'is_default')
      return response.json(langs)
    } catch {
      return response.json([])
    }
  }

  /** GET /api/storefront/translations/:langCode — UI translations for a language */
  async translations({ params, response }: HttpContext) {
    try {
      const lang = await db.from('languages').where('code', params.langCode).first()
      if (!lang) return response.json({})

      const rows = await db.from('language_translations')
        .where('language_id', lang.id)
        .select('group', 'key', 'value')

      // Build flat object: { "storefront.home": "Home", ... }
      const translations: Record<string, string> = {}
      for (const r of rows) {
        translations[`${r.group}.${r.key}`] = r.value
      }
      return response.json(translations)
    } catch {
      return response.json({})
    }
  }

  /** GET /api/storefront/theme — Theme settings (public) */
  async theme({ response }: HttpContext) {
    try {
      const rows = await db.from('system_configs')
        .where('group_name', 'theme')
        .select('key', 'value')
      const config: Record<string, string> = {}
      for (const r of rows) {
        config[r.key] = r.value
      }
      return response.json(config)
    } catch {
      return response.json({})
    }
  }
}
