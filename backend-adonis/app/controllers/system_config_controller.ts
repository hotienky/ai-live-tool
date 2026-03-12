import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * Phase 8: System Configuration Controller
 * S-Cart pattern: AdminConfig — cache, mail, queue, general settings
 * Note: DB column is `group_name`, not `group`
 */
export default class SystemConfigController {
  /**
   * GET /system-config — List all config grouped
   */
  async index({ response }: HttpContext) {
    const rows = await db.from('system_configs').orderBy('group_name').orderBy('key')
    const grouped: Record<string, Record<string, string>> = {}
    for (const row of rows) {
      const g = row.group_name || 'general'
      if (!grouped[g]) grouped[g] = {}
      grouped[g][row.key] = row.value
    }
    return response.json(grouped)
  }

  /**
   * GET /system-config/group/:group — Get config for a specific group
   */
  async showGroup({ params, response }: HttpContext) {
    const rows = await db.from('system_configs').where('group_name', params.group)
    const config: Record<string, string> = {}
    for (const row of rows) {
      config[row.key] = row.value
    }
    return response.json(config)
  }

  /**
   * PUT /system-config/group/:group — Update config for a group (batch upsert)
   */
  async updateGroup({ params, request, response }: HttpContext) {
    const data = request.body() as Record<string, string>
    const groupName = params.group

    for (const [key, value] of Object.entries(data)) {
      const existing = await db.from('system_configs')
        .where('group_name', groupName)
        .where('key', key)
        .first()

      if (existing) {
        await db.from('system_configs')
          .where('id', existing.id)
          .update({ value: String(value), updated_at: db.fn.now() })
      } else {
        await db.table('system_configs').insert({
          group_name: groupName,
          key,
          value: String(value),
        })
      }
    }

    return response.json({ success: true, group: groupName })
  }

  /**
   * POST /system-config — Single key upsert
   */
  async store({ request, response }: HttpContext) {
    const { key, value, group } = request.only(['key', 'value', 'group'])
    if (!key) return response.badRequest({ error: 'key is required' })

    const existing = await db.from('system_configs').where('key', key).first()
    if (existing) {
      await db.from('system_configs').where('id', existing.id).update({
        value: String(value || ''),
        group_name: group || existing.group_name,
        updated_at: db.fn.now(),
      })
    } else {
      await db.table('system_configs').insert({
        key,
        value: String(value || ''),
        group_name: group || 'general',
      })
    }
    return response.json({ success: true })
  }
}
