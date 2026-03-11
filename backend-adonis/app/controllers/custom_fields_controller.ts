import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * Phase 10: Custom Fields Controller
 * S-Cart pattern: AdminCustomField — dynamic fields for products/categories
 */
export default class CustomFieldsController {
  /**
   * GET /custom-fields — List all custom fields (optionally filtered by shop)
   */
  async index({ request, response }: HttpContext) {
    const shopId = request.qs().shopId
    let query = db.from('custom_fields').orderBy('sort')
    if (shopId) query = query.where('shop_id', shopId)
    const fields = await query
    return response.json(fields)
  }

  /**
   * POST /custom-fields — Create a custom field
   */
  async store({ request, response }: HttpContext) {
    const { shopId, name, code, type, options, required, group, sort } = request.only([
      'shopId', 'name', 'code', 'type', 'options', 'required', 'group', 'sort',
    ])
    if (!name || !code) return response.badRequest({ error: 'name and code are required' })

    const [field] = await db.table('custom_fields').insert({
      shop_id: shopId || null,
      name,
      code,
      type: type || 'text',
      options: options ? JSON.stringify(options) : null,
      required: required || false,
      group: group || null,
      sort: sort || 0,
      is_active: true,
    }).returning('*')

    return response.json(field)
  }

  /**
   * PUT /custom-fields/:id — Update a custom field
   */
  async update({ params, request, response }: HttpContext) {
    const existing = await db.from('custom_fields').where('id', params.id).first()
    if (!existing) return response.notFound({ error: 'Custom field not found' })

    const data = request.only(['name', 'code', 'type', 'options', 'required', 'group', 'sort', 'isActive'])
    await db.from('custom_fields').where('id', params.id).update({
      name: data.name ?? existing.name,
      code: data.code ?? existing.code,
      type: data.type ?? existing.type,
      options: data.options ? JSON.stringify(data.options) : existing.options,
      required: data.required ?? existing.required,
      group: data.group ?? existing.group,
      sort: data.sort ?? existing.sort,
      is_active: data.isActive ?? existing.is_active,
      updated_at: db.fn.now(),
    })

    const updated = await db.from('custom_fields').where('id', params.id).first()
    return response.json(updated)
  }

  /**
   * DELETE /custom-fields/:id — Delete a custom field and all its values
   */
  async destroy({ params, response }: HttpContext) {
    const field = await db.from('custom_fields').where('id', params.id).first()
    if (!field) return response.notFound({ error: 'Custom field not found' })

    await db.from('custom_field_values').where('custom_field_id', params.id).delete()
    await db.from('custom_fields').where('id', params.id).delete()
    return response.json({ success: true })
  }

  // ── Field Values ──

  /**
   * GET /custom-fields/values/:entityType/:entityId — Get field values for an entity
   */
  async getValues({ params, response }: HttpContext) {
    const values = await db.from('custom_field_values')
      .join('custom_fields', 'custom_fields.id', 'custom_field_values.custom_field_id')
      .where('entity_type', params.entityType)
      .where('entity_id', params.entityId)
      .select('custom_field_values.*', 'custom_fields.name', 'custom_fields.code', 'custom_fields.type')
    return response.json(values)
  }

  /**
   * PUT /custom-fields/values/:entityType/:entityId — Save field values for an entity
   * Body: { values: [{ fieldId, value }] }
   */
  async saveValues({ params, request, response }: HttpContext) {
    const { values } = request.only(['values']) as { values: Array<{ fieldId: number; value: string }> }
    if (!Array.isArray(values)) return response.badRequest({ error: 'values must be an array' })

    for (const v of values) {
      const existing = await db.from('custom_field_values')
        .where('custom_field_id', v.fieldId)
        .where('entity_type', params.entityType)
        .where('entity_id', params.entityId)
        .first()

      if (existing) {
        await db.from('custom_field_values').where('id', existing.id).update({ value: v.value })
      } else {
        await db.table('custom_field_values').insert({
          custom_field_id: v.fieldId,
          entity_type: params.entityType,
          entity_id: params.entityId,
          value: v.value,
        })
      }
    }

    return response.json({ success: true, count: values.length })
  }
}
