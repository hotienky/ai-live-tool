import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * LanguagesController — Manage i18n languages, UI translations, and content translations
 * Tables: languages, language_translations, content_translations
 */
export default class LanguagesController {
  // ══════════════════════════════════════
  //  Languages CRUD
  // ══════════════════════════════════════

  /** GET /languages — List all languages */
  async index({ response }: HttpContext) {
    const languages = await db.from('languages').orderBy('sort')
    return response.json(languages)
  }

  /** POST /languages — Create a language */
  async store({ request, response }: HttpContext) {
    const { code, name, icon, isDefault, isActive, sort } = request.only([
      'code', 'name', 'icon', 'isDefault', 'isActive', 'sort',
    ])
    if (!code || !name) return response.badRequest({ error: 'code and name are required' })

    const existing = await db.from('languages').where('code', code).first()
    if (existing) return response.conflict({ error: 'Language code already exists' })

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

  /** PUT /languages/:id — Update a language */
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

  /** DELETE /languages/:id — Delete a language and its translations */
  async destroy({ params, response }: HttpContext) {
    const lang = await db.from('languages').where('id', params.id).first()
    if (!lang) return response.notFound({ error: 'Language not found' })
    if (lang.is_default) return response.badRequest({ error: 'Cannot delete default language' })

    await db.from('content_translations').where('language_id', params.id).delete()
    await db.from('language_translations').where('language_id', params.id).delete()
    await db.from('languages').where('id', params.id).delete()
    return response.json({ success: true })
  }

  // ══════════════════════════════════════
  //  UI String Translations (language_translations)
  // ══════════════════════════════════════

  /** GET /languages/:id/translations — Get UI translations for a language */
  async getTranslations({ params, request, response }: HttpContext) {
    const group = request.qs().group
    let query = db.from('language_translations').where('language_id', params.id)
    if (group) query = query.where('group', group)
    const translations = await query.orderBy('group').orderBy('key')
    return response.json(translations)
  }

  /** PUT /languages/:id/translations — Batch upsert UI translations */
  async updateTranslations({ params, request, response }: HttpContext) {
    const { translations } = request.only(['translations'])
    if (!translations) return response.badRequest({ error: 'translations required' })

    // Support both array and object formats
    const items: Array<{ group: string; key: string; value: string }> = Array.isArray(translations)
      ? translations
      : Object.entries(translations).map(([key, value]) => ({
          group: 'common', key, value: String(value),
        }))

    for (const t of items) {
      const existing = await db.from('language_translations')
        .where('language_id', params.id)
        .where('group', t.group || 'common')
        .where('key', t.key)
        .first()

      if (existing) {
        await db.from('language_translations').where('id', existing.id).update({
          value: t.value,
          updated_at: db.fn.now(),
        })
      } else {
        await db.table('language_translations').insert({
          language_id: params.id,
          group: t.group || 'common',
          key: t.key,
          value: t.value,
        })
      }
    }

    return response.json({ success: true, count: items.length })
  }

  // ══════════════════════════════════════
  //  Content Translations (content_translations)
  //  For products, categories, pages, etc.
  // ══════════════════════════════════════

  /** GET /languages/content/:tableName/:rowId — Get all translations for a record */
  async getContentTranslations({ params, response }: HttpContext) {
    const { tableName, rowId } = params
    const rows = await db.from('content_translations')
      .where('table_name', tableName)
      .where('row_id', rowId)
      .orderBy('language_id')
      .orderBy('field_name')

    // Group by language_id for easier consumption
    const grouped: Record<number, Record<string, string>> = {}
    for (const r of rows) {
      if (!grouped[r.language_id]) grouped[r.language_id] = {}
      grouped[r.language_id][r.field_name] = r.value
    }
    return response.json({ raw: rows, grouped })
  }

  /**
   * PUT /languages/content/:tableName/:rowId — Batch upsert content translations
   * Body: { translations: { [languageId]: { fieldName: value } } }
   * Example: { translations: { "2": { "name": "T-shirt", "description": "Cool shirt" } } }
   */
  async updateContentTranslations({ params, request, response }: HttpContext) {
    const { tableName, rowId } = params
    const { translations } = request.only(['translations'])
    if (!translations || typeof translations !== 'object') {
      return response.badRequest({ error: 'translations object required: { langId: { field: value } }' })
    }

    let count = 0
    for (const [langId, fields] of Object.entries(translations) as any) {
      for (const [fieldName, value] of Object.entries(fields as Record<string, string>)) {
        const existing = await db.from('content_translations')
          .where('table_name', tableName)
          .where('row_id', rowId)
          .where('field_name', fieldName)
          .where('language_id', Number(langId))
          .first()

        if (existing) {
          await db.from('content_translations').where('id', existing.id).update({
            value: String(value),
            updated_at: db.fn.now(),
          })
        } else {
          await db.table('content_translations').insert({
            table_name: tableName,
            row_id: rowId,
            field_name: fieldName,
            language_id: Number(langId),
            value: String(value),
          })
        }
        count++
      }
    }

    return response.json({ success: true, count })
  }
}
