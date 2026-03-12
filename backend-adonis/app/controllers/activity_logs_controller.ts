/**
 * Activity Logs Controller — View + filter activity history
 * Tenant-safe: in tenant mode, skip shop scoping (DB is already tenant-scoped)
 */
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class ActivityLogsController {
  /**
   * List activity logs with full filtering
   */
  async index({ request, response }: HttpContext) {
    const {
      page = 1,
      limit = 50,
      action,
      entityType,
      userId,
      startDate,
      endDate,
      search,
    } = request.qs()

    // Build WHERE conditions separately (no ORDER BY for count)
    const buildWhere = (q: any) => {
      if (action) q.where('action', action)
      if (entityType) q.where('entity_type', entityType)
      if (userId) q.where('user_id', Number(userId))
      if (startDate) q.where('created_at', '>=', new Date(startDate).toISOString())
      if (endDate) q.where('created_at', '<=', new Date(endDate).toISOString())
      if (search) q.whereILike('action', `%${search}%`)
      return q
    }

    const offset = (Number(page) - 1) * Number(limit)

    // Data query with ORDER BY
    const dataQuery = buildWhere(db.from('activity_logs'))
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(Number(limit))

    // Count query WITHOUT ORDER BY
    const countQuery = buildWhere(db.from('activity_logs'))
      .count('* as total')
      .first()

    const [data, countResult] = await Promise.all([dataQuery, countQuery])
    const total = Number(countResult?.total || 0)

    return response.json({
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        lastPage: Math.ceil(total / Number(limit)),
      },
    })
  }

  /**
   * Get activity log statistics (per action type counts)
   */
  async stats({ request, response }: HttpContext) {
    const { days = 7 } = request.qs()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    const stats = await db.from('activity_logs')
      .where('created_at', '>=', startDate.toISOString())
      .select('action')
      .count('* as count')
      .groupBy('action')
      .orderBy('count', 'desc')

    const totalResult = await db.from('activity_logs')
      .where('created_at', '>=', startDate.toISOString())
      .count('* as total')
      .first()

    return response.json({
      actions: stats.map((s: any) => ({
        action: s.action,
        count: Number(s.count || 0),
      })),
      total: Number(totalResult?.total || 0),
      days: Number(days),
    })
  }
}
