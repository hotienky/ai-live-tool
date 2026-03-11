/**
 * Activity Logs Controller — View + filter activity history
 * S-CART aligned: date range, entity type, user filter, action stats
 */
import type { HttpContext } from '@adonisjs/core/http'
import { ActivityLogSchema } from '../../database/schema.js'
import { getUserShopIds } from '#services/scope_helper'

export default class ActivityLogsController {
  /**
   * List activity logs with full filtering
   */
  async index({ auth, request, response }: HttpContext) {
    const {
      shopId,
      page = 1,
      limit = 50,
      action,
      entityType,
      userId,
      startDate,
      endDate,
      search,
    } = request.qs()

    const userShopIds = await getUserShopIds(auth.user!.id)
    const targetShopId = Number(shopId) || Number(userShopIds[0])
    if (!userShopIds.map(Number).includes(targetShopId)) {
      return response.forbidden({ error: 'Access denied' })
    }

    const query = ActivityLogSchema.query()
      .where('shopId', targetShopId)
      .orderBy('createdAt', 'desc')

    // Filters
    if (action) query.where('action', action)
    if (entityType) query.where('entityType', entityType)
    if (userId) query.where('userId', Number(userId))
    if (startDate) query.where('createdAt', '>=', new Date(startDate).toISOString())
    if (endDate) query.where('createdAt', '<=', new Date(endDate).toISOString())
    if (search) query.whereILike('action', `%${search}%`)

    const offset = (Number(page) - 1) * Number(limit)
    const [logs, countResult] = await Promise.all([
      query.clone().offset(offset).limit(Number(limit)),
      query.clone().count('* as total'),
    ])

    return response.json({
      data: logs,
      meta: {
        total: Number((countResult[0] as any).$extras?.total || 0),
        page: Number(page),
        limit: Number(limit),
        lastPage: Math.ceil(Number((countResult[0] as any).$extras?.total || 0) / Number(limit)),
      },
    })
  }

  /**
   * Get activity log statistics (per action type counts)
   */
  async stats({ auth, request, response }: HttpContext) {
    const { shopId, days = 7 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const targetShopId = Number(shopId) || Number(userShopIds[0])
    if (!userShopIds.map(Number).includes(targetShopId)) {
      return response.forbidden({ error: 'Access denied' })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    const stats = await ActivityLogSchema.query()
      .where('shopId', targetShopId)
      .where('createdAt', '>=', startDate.toISOString())
      .select('action')
      .count('* as count')
      .groupBy('action')
      .orderBy('count', 'desc')

    const totalCount = await ActivityLogSchema.query()
      .where('shopId', targetShopId)
      .where('createdAt', '>=', startDate.toISOString())
      .count('* as total')

    return response.json({
      actions: stats.map((s: any) => ({
        action: s.action,
        count: Number(s.$extras?.count || 0),
      })),
      total: Number((totalCount[0] as any).$extras?.total || 0),
      days: Number(days),
    })
  }

  /**
   * Get available entity types for filter dropdown
   */
  async entityTypes({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const targetShopId = Number(shopId) || Number(userShopIds[0])
    if (!userShopIds.map(Number).includes(targetShopId)) {
      return response.forbidden({ error: 'Access denied' })
    }

    const entityTypes = await ActivityLogSchema.query()
      .where('shopId', targetShopId)
      .whereNotNull('entityType')
      .select('entityType')
      .distinct('entityType')

    return response.json(entityTypes.map((e: any) => e.entityType).filter(Boolean))
  }
}
