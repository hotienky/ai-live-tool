import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * Phase 8: System Configuration Controller
 * S-Cart pattern: AdminConfig — cache, mail, queue, general settings
 */
export default class SystemConfigController {
  /**
   * GET /system-config — List all config grouped
   */
  async index({ response }: HttpContext) {
    const rows = await db.from('system_configs').orderBy('group').orderBy('key')
    const grouped: Record<string, Record<string, string>> = {}
    for (const row of rows) {
      if (!grouped[row.group]) grouped[row.group] = {}
      grouped[row.group][row.key] = row.value
    }
    return response.json(grouped)
  }

  /**
   * GET /system-config/:group — Get config for a specific group
   */
  async show({ params, response }: HttpContext) {
    const rows = await db.from('system_configs').where('group', params.group)
    const config: Record<string, string> = {}
    for (const row of rows) {
      config[row.key] = row.value
    }
    return response.json(config)
  }

  /**
   * PUT /system-config/:group — Update config for a group (batch upsert)
   */
  async update({ params, request, response }: HttpContext) {
    const data = request.body() as Record<string, string>
    const group = params.group

    for (const [key, value] of Object.entries(data)) {
      const existing = await db.from('system_configs')
        .where('group', group)
        .where('key', key)
        .first()

      if (existing) {
        await db.from('system_configs')
          .where('id', existing.id)
          .update({ value: String(value), updated_at: db.fn.now() })
      } else {
        await db.table('system_configs').insert({
          group,
          key,
          value: String(value),
        })
      }
    }

    return response.json({ success: true, group })
  }
}
