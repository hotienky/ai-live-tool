import type { HttpContext } from '@adonisjs/core/http'
import { generateReply, analyzeSentiment } from '#services/reply_service'

export default class RepliesController {
  async generate({ request, response }: HttpContext) {
    const { comment, label, nickname } = request.only(['comment', 'label', 'nickname'])
    if (!comment) return response.badRequest({ error: 'comment is required' })

    const reply = await generateReply(comment, label || '[WARM]', nickname || 'bạn')
    return response.json({ reply })
  }

  async sentiment({ request, response }: HttpContext) {
    const { comments } = request.only(['comments'])
    const result = await analyzeSentiment(comments || [])
    return response.json(result)
  }
}
