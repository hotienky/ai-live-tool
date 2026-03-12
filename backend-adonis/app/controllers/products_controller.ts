import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * ProductsController — CRUD (tenant-safe, raw DB queries)
 */
export default class ProductsController {
  async index({ request, response }: HttpContext) {
    try {
      const { category, search, page = 1, limit = 50 } = request.qs()
      const offset = (Number(page) - 1) * Number(limit)

      let query = db.from('products').orderBy('created_at', 'desc')
      if (category) query = query.where('category', category)
      if (search) {
        query = query.where((q: any) => {
          q.whereILike('name', `%${search}%`)
            .orWhereILike('sku', `%${search}%`)
        })
      }

      const data = await query.offset(offset).limit(Number(limit))
      return response.json(data)
    } catch (err: any) {
      console.error('Products index error:', err.message)
      return response.json([])
    }
  }

  async store({ request, response }: HttpContext) {
    const data = request.only([
      'name', 'price', 'keywords', 'description', 'imageUrl',
      'sku', 'stock', 'costPrice', 'category', 'unit', 'barcode',
      'image', 'image_url', 'promotion_price', 'status', 'low_stock_threshold',
      'cost_price',
    ])
    if (!data.name) return response.badRequest({ error: 'Tên sản phẩm là bắt buộc' })

    // Convert keywords
    let keywords = null
    if (typeof data.keywords === 'string' && data.keywords.trim()) {
      keywords = JSON.stringify(data.keywords.split(',').map((k: string) => k.trim()).filter(Boolean))
    }

    try {
      const [product] = await db.table('products').insert({
        name: data.name,
        sku: data.sku || null,
        price: Number(data.price) || 0,
        promotion_price: data.promotion_price ? Number(data.promotion_price) : null,
        cost_price: data.costPrice || data.cost_price ? Number(data.costPrice || data.cost_price) : null,
        stock: Number(data.stock) || 0,
        category: data.category || null,
        keywords: keywords,
        description: data.description || null,
        image_url: data.imageUrl || data.image_url || data.image || null,
        barcode: data.barcode || null,
        unit: data.unit || 'cái',
        is_active: data.status !== 0 && data.status !== false,
        low_stock_threshold: Number(data.low_stock_threshold) || 5,
      }).returning('*')
      return response.status(201).json(product)
    } catch (err: any) {
      console.error('Product create error:', err.message)
      return response.internalServerError({ error: 'Không thể tạo sản phẩm: ' + err.message })
    }
  }

  async show({ params, response }: HttpContext) {
    const product = await db.from('products').where('id', params.id).first()
    if (!product) return response.notFound({ error: 'Product not found' })
    return response.json(product)
  }

  async update({ params, request, response }: HttpContext) {
    const product = await db.from('products').where('id', params.id).first()
    if (!product) return response.notFound({ error: 'Product not found' })

    const data = request.only([
      'name', 'price', 'keywords', 'description', 'imageUrl', 'is_active',
      'sku', 'cost_price', 'category', 'unit', 'barcode', 'low_stock_threshold',
      'stock', 'promotion_price', 'image_url',
    ])
    const updateData: any = { updated_at: new Date() }
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) updateData[key] = val
    }
    if (typeof updateData.keywords === 'string') {
      updateData.keywords = JSON.stringify(
        updateData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      )
    }

    await db.from('products').where('id', params.id).update(updateData)
    const updated = await db.from('products').where('id', params.id).first()
    return response.json(updated)
  }

  async destroy({ params, response }: HttpContext) {
    const product = await db.from('products').where('id', params.id).first()
    if (!product) return response.notFound({ error: 'Product not found' })
    await db.from('products').where('id', params.id).delete()
    return response.json({ success: true })
  }

  async stats({ response }: HttpContext) {
    try {
      const [totalResult] = await db.from('products').count('* as total')
      const [activeResult] = await db.from('products').where('is_active', true).count('* as total')
      const [lowStockResult] = await db.rawQuery(
        'SELECT COUNT(*) as total FROM products WHERE stock <= low_stock_threshold AND is_active = true'
      )

      return response.json({
        total: Number(totalResult?.total || 0),
        active: Number(activeResult?.total || 0),
        lowStock: Number(lowStockResult?.rows?.[0]?.total || 0),
      })
    } catch {
      return response.json({ total: 0, active: 0, lowStock: 0 })
    }
  }

  async stockHistory({ response }: HttpContext) {
    try {
      const history = await db.from('stock_history').orderBy('created_at', 'desc').limit(50)
      return response.json(history)
    } catch {
      return response.json([])
    }
  }

  async adjustStock({ params, request, response }: HttpContext) {
    const product = await db.from('products').where('id', params.id).first()
    if (!product) return response.notFound({ error: 'Product not found' })

    const { adjustment, reason } = request.only(['adjustment', 'reason'])
    const newStock = product.stock + Number(adjustment)
    if (newStock < 0) return response.badRequest({ error: 'Tồn kho không thể âm' })

    await db.from('products').where('id', params.id).update({
      stock: newStock,
      updated_at: new Date(),
    })

    try {
      await db.table('stock_history').insert({
        product_id: params.id,
        previous_stock: product.stock,
        new_stock: newStock,
        adjustment: Number(adjustment),
        reason: reason || 'Điều chỉnh thủ công',
      })
    } catch { /* stock_history may not exist */ }

    return response.json({ success: true, stock: newStock })
  }
}
