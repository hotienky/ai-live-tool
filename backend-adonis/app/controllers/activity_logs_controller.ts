/**
 * Activity Logs Controller — View activity history
 */
import type { HttpContext } from '@adonisjs/core/http'
import { getActivityLogs } from '#services/activity_log_service'

async function getUserShopIds(userId: number) {
  const Shop = (await import('#models/shop')).default
  const shops = await Shop.query().where('userId', userId).select('id')
  return shops.map((s) => s.id)
}

export default class ActivityLogsController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId, page = 1, limit = 50, action } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const targetShopId = Number(shopId) || userShopIds[0]
    if (!userShopIds.includes(targetShopId)) return response.forbidden({ error: 'Access denied' })

    const result = await getActivityLogs(targetShopId, {
      page: Number(page),
      limit: Number(limit),
      action,
    })
    return response.json(result)
  }
}
