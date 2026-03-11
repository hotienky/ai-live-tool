import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * Phase 9: Languages Controller
 * S-Cart pattern: AdminLanguage — manage i18n languages and translations
 */
export default class LanguagesController {
  /**
   * GET /languages — List all languages
   */
  async index({ response }: HttpContext) {
    const languages = await db.from('languages').orderBy('sort')
    return response.json(languages)
  }

  /**
   * POST /languages — Create a language
   */
  async store({ request, response }: HttpContext) {
    const { code, name, icon, isDefault, isActive, sort } = request.only([
      'code', 'name', 'icon', 'isDefault', 'isActive', 'sort',
    ])
    if (!code || !name) return response.badRequest({ error: 'code and name are required' })

    const existing = await db.from('languages').where('code', code).first()
    if (existing) return response.conflict({ error: 'Language code already exists' })

    // If setting as default, unset others
    if (isDefault) {
      await db.from('languages').update({ is_default: false })
    }

    const [lang] = await db.table('languages').insert({
      code, name, icon: icon || null,
      is_default: isDefault || false,
      is_active: isActive !== false,
      sort: sort || 0,
    }).returning('*')

    return response.json(lang)
  }

  /**
   * PUT /languages/:id — Update a language
   */
  async update({ params, request, response }: HttpContext) {
    const existing = await db.from('languages').where('id', params.id).first()
    if (!existing) return response.notFound({ error: 'Language not found' })

    const data = request.only(['name', 'icon', 'isDefault', 'isActive', 'sort'])

    if (data.isDefault) {
      await db.from('languages').update({ is_default: false })
    }

    await db.from('languages').where('id', params.id).update({
      name: data.name ?? existing.name,
      icon: data.icon ?? existing.icon,
      is_default: data.isDefault ?? existing.is_default,
      is_active: data.isActive ?? existing.is_active,
      sort: data.sort ?? existing.sort,
      updated_at: db.fn.now(),
    })

    const updated = await db.from('languages').where('id', params.id).first()
    return response.json(updated)
  }

  /**
   * DELETE /languages/:id — Delete a language and its translations
   */
  async destroy({ params, response }: HttpContext) {
    const lang = await db.from('languages').where('id', params.id).first()
    if (!lang) return response.notFound({ error: 'Language not found' })
    if (lang.is_default) return response.badRequest({ error: 'Cannot delete default language' })

    await db.from('language_translations').where('language_id', params.id).delete()
    await db.from('languages').where('id', params.id).delete()
    return response.json({ success: true })
  }

  // ── Translations ──

  /**
   * GET /languages/:id/translations — Get translations for a language
   */
  async getTranslations({ params, request, response }: HttpContext) {
    const group = request.qs().group
    let query = db.from('language_translations').where('language_id', params.id)
    if (group) query = query.where('group', group)
    const translations = await query.orderBy('group').orderBy('key')
    return response.json(translations)
  }

  /**
   * PUT /languages/:id/translations — Batch upsert translations
   * Body: { translations: [{ group, key, value }] }
   */
  async updateTranslations({ params, request, response }: HttpContext) {
    const { translations } = request.only(['translations']) as { translations: Array<{ group: string; key: string; value: string }> }
    if (!Array.isArray(translations)) return response.badRequest({ error: 'translations must be an array' })

    for (const t of translations) {
      const existing = await db.from('language_translations')
        .where('language_id', params.id)
        .where('group', t.group)
        .where('key', t.key)
        .first()

      if (existing) {
        await db.from('language_translations').where('id', existing.id).update({ value: t.value })
      } else {
        await db.table('language_translations').insert({
          language_id: params.id,
          group: t.group,
          key: t.key,
          value: t.value,
        })
      }
    }

    return response.json({ success: true, count: translations.length })
  }
}
