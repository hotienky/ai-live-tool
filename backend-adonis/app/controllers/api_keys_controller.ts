import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { randomBytes } from 'node:crypto'

/**
 * Phase 8: API Keys Controller
 * S-Cart pattern: AdminApiConnection — manage API keys per user
 */
export default class ApiKeysController {
  /**
   * GET /api-keys — List user's API keys
   */
  async index({ auth, response }: HttpContext) {
    const keys = await db.from('api_keys')
      .where('user_id', auth.user!.id)
      .orderBy('created_at', 'desc')
    return response.json(keys)
  }

  /**
   * POST /api-keys — Generate a new API key
   */
  async store({ auth, request, response }: HttpContext) {
    const { name, permissions, expiresAt } = request.only(['name', 'permissions', 'expiresAt'])
    if (!name) return response.badRequest({ error: 'name is required' })

    const key = `ak_${randomBytes(24).toString('hex')}`
    const secret = `sk_${randomBytes(32).toString('hex')}`

    const [row] = await db.table('api_keys').insert({
      user_id: auth.user!.id,
      name,
      key,
      secret,
      permissions: permissions ? JSON.stringify(permissions) : null,
      is_active: true,
      expires_at: expiresAt || null,
    }).returning('*')

    return response.json({ ...row, secret }) // Only show secret on creation
  }

  /**
   * PUT /api-keys/:id — Update key settings (name, permissions, active)
   */
  async update({ auth, params, request, response }: HttpContext) {
    const existing = await db.from('api_keys')
      .where('id', params.id)
      .where('user_id', auth.user!.id)
      .first()
    if (!existing) return response.notFound({ error: 'API key not found' })

    const data = request.only(['name', 'permissions', 'is_active'])
    await db.from('api_keys').where('id', params.id).update({
      ...data,
      permissions: data.permissions ? JSON.stringify(data.permissions) : existing.permissions,
      updated_at: db.fn.now(),
    })

    const updated = await db.from('api_keys').where('id', params.id).first()
    return response.json(updated)
  }

  /**
   * DELETE /api-keys/:id — Revoke (delete) an API key
   */
  async destroy({ auth, params, response }: HttpContext) {
    const deleted = await db.from('api_keys')
      .where('id', params.id)
      .where('user_id', auth.user!.id)
      .delete()
    if (!deleted) return response.notFound({ error: 'API key not found' })
    return response.json({ success: true })
  }
}
