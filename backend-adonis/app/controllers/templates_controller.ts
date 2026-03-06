import type { HttpContext } from '@adonisjs/core/http'
import AutoReplyTemplate from '#models/auto_reply_template'

export default class TemplatesController {
  async index({ params, response }: HttpContext) {
    const templates = await AutoReplyTemplate.query()
      .where('shop_id', params.shopId)
      .orderBy('created_at', 'desc')
    return response.json(templates)
  }

  async store({ params, request, response }: HttpContext) {
    const { triggerLabel, templateText } = request.only(['triggerLabel', 'templateText'])
    if (!triggerLabel || !templateText) {
      return response.badRequest({ error: 'triggerLabel and templateText are required' })
    }

    const t = await AutoReplyTemplate.create({
      shopId: params.shopId,
      triggerLabel,
      templateText,
      isActive: true,
    })
    return response.json(t)
  }

  async destroy({ params, response }: HttpContext) {
    const t = await AutoReplyTemplate.query()
      .where('id', params.id)
      .where('shop_id', params.shopId)
      .first()
    if (!t) return response.notFound({ error: 'Template not found' })
    await t.delete()
    return response.json({ success: true })
  }
}
