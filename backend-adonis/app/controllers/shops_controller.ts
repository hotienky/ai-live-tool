import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * ShopsController — Tenant-safe
 * In tenant mode, the `shops` table doesn't exist (each tenant IS a shop).
 * Returns empty array / null gracefully.
 */
export default class ShopsController {
  async index({ auth, response }: HttpContext) {
    try {
      const shops = await db.from('shops')
        .where('user_id', auth.user!.id)
        .orderBy('created_at', 'desc')
      return response.json(shops)
    } catch {
      // Table doesn't exist in tenant DB — return empty
      return response.json([])
    }
  }

  async store({ auth, request, response }: HttpContext) {
    try {
      const data = request.only(['shop_name', 'platform', 'tiktok_username'])
      const [shop] = await db.table('shops').insert({
        user_id: auth.user!.id,
        shop_name: data.shop_name || 'Default Shop',
        platform: data.platform || 'tiktok',
        is_active: true,
      }).returning('*')
      return response.json(shop)
    } catch {
      return response.json({ error: 'shops table not available in tenant mode' })
    }
  }

  async show({ auth, params, response }: HttpContext) {
    try {
      const shop = await db.from('shops')
        .where('id', params.id)
        .where('user_id', auth.user!.id)
        .first()
      if (!shop) return response.notFound({ error: 'Shop not found' })
      return response.json(shop)
    } catch {
      return response.notFound({ error: 'Shop not found' })
    }
  }

  async update({ auth, params, request, response }: HttpContext) {
    try {
      const existing = await db.from('shops')
        .where('id', params.id)
        .where('user_id', auth.user!.id)
        .first()
      if (!existing) return response.notFound({ error: 'Shop not found' })

      const data = request.only(['shop_name', 'platform', 'is_active'])
      await db.from('shops').where('id', params.id).update(data)
      const updated = await db.from('shops').where('id', params.id).first()
      return response.json(updated)
    } catch {
      return response.json({ error: 'Not available' })
    }
  }

  async findOrCreate({ auth, request, response }: HttpContext) {
    try {
      const { platform } = request.only(['platform'])
      let shop = await db.from('shops')
        .where('user_id', auth.user!.id)
        .where('platform', platform || 'tiktok')
        .first()
      if (!shop) {
        const [created] = await db.table('shops').insert({
          user_id: auth.user!.id,
          shop_name: 'Default Shop',
          platform: platform || 'tiktok',
          is_active: true,
        }).returning('*')
        shop = created
      }
      return response.json(shop)
    } catch {
      return response.json({ id: null, shop_name: 'Default', platform: 'tiktok' })
    }
  }

  async destroy({ auth, params, response }: HttpContext) {
    try {
      const deleted = await db.from('shops')
        .where('id', params.id)
        .where('user_id', auth.user!.id)
        .delete()
      if (!deleted) return response.notFound({ error: 'Shop not found' })
      return response.json({ success: true })
    } catch {
      return response.notFound({ error: 'Not available' })
    }
  }
}
