import type { HttpContext } from '@adonisjs/core/http'
import { getUserShopIds } from '#services/scope_helper'
import GetDailyAnalyticsAction from '#actions/analytics/get_daily_analytics_action'
import GetHourlyAnalyticsAction from '#actions/analytics/get_hourly_analytics_action'
import GetConversionStatsAction from '#actions/analytics/get_conversion_stats_action'
import GetTopKeywordsAction from '#actions/analytics/get_top_keywords_action'
import GetAnalyticsSummaryAction from '#actions/analytics/get_analytics_summary_action'
import GetRevenueTrendsAction from '#actions/analytics/get_revenue_trends_action'

export default class AnalyticsController {
  async daily({ auth, request, response }: HttpContext) {
    const { shopId, days = 7 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetDailyAnalyticsAction.handle({ userShopIds, shopId, days: Number(days) })
    return response.json(result)
  }

  async hourly({ auth, request, response }: HttpContext) {
    const { shopId, date } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetHourlyAnalyticsAction.handle({ userShopIds, shopId, date })
    return response.json(result)
  }

  async conversion({ auth, request, response }: HttpContext) {
    const { days = 30 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetConversionStatsAction.handle({ userShopIds, days: Number(days) })
    return response.json(result)
  }

  async topKeywords({ auth, request, response }: HttpContext) {
    const { shopId, days = 7, limit = 20 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetTopKeywordsAction.handle({ userShopIds, shopId, days: Number(days), limit: Number(limit) })
    return response.json(result)
  }

  async summary({ auth, request, response }: HttpContext) {
    const { shopId, days = 7 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetAnalyticsSummaryAction.handle({ userShopIds, shopId, days: Number(days) })
    return response.json(result)
  }

  async revenue({ auth, request, response }: HttpContext) {
    const { shopId, days = 30 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetRevenueTrendsAction.handle({ userShopIds, shopId, days: Number(days) })
    return response.json(result)
  }
}
