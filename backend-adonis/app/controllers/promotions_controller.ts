import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * PromotionsController — CRUD for promotions (tenant-safe, raw DB queries)
 */
export default class PromotionsController {
  async index({ response }: HttpContext) {
    try {
      const promotions = await db.from('promotions').orderBy('created_at', 'desc')
      return response.json(promotions)
    } catch {
      return response.json([])
    }
  }

  async store({ request, response }: HttpContext) {
    const data = request.only([
      'name', 'type', 'value', 'min_order', 'max_discount',
      'start_date', 'end_date', 'is_active', 'usage_limit', 'applicable_products',
    ])

    const [promo] = await db.table('promotions').insert({
      name: data.name || 'Khuyến mãi mới',
      type: data.type || 'discount',
      value: Number(data.value) || 0,
      min_order: Number(data.min_order) || 0,
      max_discount: data.max_discount ? Number(data.max_discount) : null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      is_active: data.is_active ?? true,
      usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
      applicable_products: data.applicable_products ? JSON.stringify(data.applicable_products) : null,
    }).returning('*')
    return response.status(201).json(promo)
  }

  async update({ params, request, response }: HttpContext) {
    const existing = await db.from('promotions').where('id', params.id).first()
    if (!existing) return response.notFound({ error: 'Promotion not found' })

    const data = request.only([
      'name', 'type', 'value', 'min_order', 'max_discount',
      'start_date', 'end_date', 'is_active', 'usage_limit', 'applicable_products',
    ])
    const updateData: any = { updated_at: new Date() }
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) updateData[key] = val
    }
    if (updateData.applicable_products) {
      updateData.applicable_products = JSON.stringify(updateData.applicable_products)
    }

    await db.from('promotions').where('id', params.id).update(updateData)
    const updated = await db.from('promotions').where('id', params.id).first()
    return response.json(updated)
  }

  async destroy({ params, response }: HttpContext) {
    const existing = await db.from('promotions').where('id', params.id).first()
    if (!existing) return response.notFound({ error: 'Promotion not found' })
    await db.from('promotions').where('id', params.id).delete()
    return response.json({ success: true })
  }
}
