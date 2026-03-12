import type { HttpContext } from '@adonisjs/core/http'
import ShopKeyword from '#models/shop_keyword'

export default class KeywordsController {
  async index({ params, response }: HttpContext) {
    const query = ShopKeyword.query().orderBy('created_at', 'desc')
    if (params.shopId) query.where('shop_id', params.shopId)
    const keywords = await query
    return response.json(keywords)
  }

  async store({ params, request, response }: HttpContext) {
    const { keyword, alertType, color, autoReplyText } = request.only(['keyword', 'alertType', 'color', 'autoReplyText'])
    if (!keyword) return response.badRequest({ error: 'keyword is required' })

    const kw = await ShopKeyword.create({
      shopId: params.shopId || null,
      keyword,
      alertType: alertType || 'highlight',
      color: color || '#ff3b5c',
      autoReplyText,
      isActive: true,
    })
    return response.json(kw)
  }

  async destroy({ params, response }: HttpContext) {
    const query = ShopKeyword.query().where('id', params.id)
    if (params.shopId) query.where('shop_id', params.shopId)
    const kw = await query.first()
    if (!kw) return response.notFound({ error: 'Keyword not found' })
    await kw.delete()
    return response.json({ success: true })
  }
}
