import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * Flash Sales Controller — S-Cart pattern
 * CRUD for flash sale campaigns + storefront public API
 */
export default class FlashSalesController {
  /**
   * GET /flash-sales — List all flash sales (admin)
   */
  async index({ response }: HttpContext) {
    const sales = await db.from('flash_sales')
      .orderBy('start_date', 'desc')
    
    // Attach item count
    for (const sale of sales) {
      const countResult = await db.from('flash_sale_items')
        .where('flash_sale_id', sale.id)
        .count('* as total')
        .first()
      sale.itemCount = Number(countResult?.total || 0)
    }

    return response.json(sales)
  }

  /**
   * GET /flash-sales/:id — Show flash sale detail with items
   */
  async show({ params, response }: HttpContext) {
    const sale = await db.from('flash_sales').where('id', params.id).first()
    if (!sale) return response.notFound({ error: 'Flash sale not found' })

    const items = await db.from('flash_sale_items')
      .join('products', 'flash_sale_items.product_id', 'products.id')
      .where('flash_sale_items.flash_sale_id', sale.id)
      .select(
        'flash_sale_items.*',
        'products.name as product_name',
        'products.image_url as product_image',
        'products.price as current_price',
        'products.stock as product_stock'
      )

    return response.json({ ...sale, items })
  }

  /**
   * POST /flash-sales — Create flash sale
   */
  async store({ request, response }: HttpContext) {
    const { name, startDate, endDate, isActive, items } = request.body()
    if (!name || !startDate || !endDate) {
      return response.badRequest({ error: 'Name, startDate, endDate are required' })
    }

    const [sale] = await db.table('flash_sales').insert({
      name,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      is_active: isActive !== false,
    }).returning('*')

    // Add items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!item.productId || !item.salePrice) continue
        await db.table('flash_sale_items').insert({
          flash_sale_id: sale.id,
          product_id: item.productId,
          sale_price: item.salePrice,
          original_price: item.originalPrice || null,
          stock_limit: item.stockLimit || null,
        })
      }
    }

    return response.status(201).json(sale)
  }

  /**
   * PUT /flash-sales/:id — Update flash sale
   */
  async update({ params, request, response }: HttpContext) {
    const existing = await db.from('flash_sales').where('id', params.id).first()
    if (!existing) return response.notFound({ error: 'Flash sale not found' })

    const { name, startDate, endDate, isActive, items } = request.body()

    await db.from('flash_sales').where('id', params.id).update({
      name: name || existing.name,
      start_date: startDate ? new Date(startDate) : existing.start_date,
      end_date: endDate ? new Date(endDate) : existing.end_date,
      is_active: isActive !== undefined ? isActive : existing.is_active,
      updated_at: db.fn.now(),
    })

    // Replace items if provided
    if (items && Array.isArray(items)) {
      await db.from('flash_sale_items').where('flash_sale_id', params.id).delete()
      for (const item of items) {
        if (!item.productId || !item.salePrice) continue
        await db.table('flash_sale_items').insert({
          flash_sale_id: params.id,
          product_id: item.productId,
          sale_price: item.salePrice,
          original_price: item.originalPrice || null,
          stock_limit: item.stockLimit || null,
        })
      }
    }

    return response.json({ success: true })
  }

  /**
   * DELETE /flash-sales/:id — Delete flash sale
   */
  async destroy({ params, response }: HttpContext) {
    await db.from('flash_sales').where('id', params.id).delete()
    return response.json({ success: true })
  }

  /**
   * GET /storefront/flash-sales — Active flash sales (public API)
   */
  async active({ response }: HttpContext) {
    const now = new Date()
    const sales = await db.from('flash_sales')
      .where('is_active', true)
      .where('start_date', '<=', now.toISOString())
      .where('end_date', '>=', now.toISOString())
      .orderBy('end_date', 'asc')

    for (const sale of sales) {
      sale.items = await db.from('flash_sale_items')
        .join('products', 'flash_sale_items.product_id', 'products.id')
        .where('flash_sale_items.flash_sale_id', sale.id)
        .where('products.is_active', true)
        .select(
          'flash_sale_items.id',
          'flash_sale_items.sale_price',
          'flash_sale_items.original_price',
          'flash_sale_items.stock_limit',
          'flash_sale_items.sold_count',
          'products.id as product_id',
          'products.name',
          'products.slug',
          'products.image_url as image',
          'products.price',
          'products.stock'
        )
    }

    return response.json(sales)
  }
}
