import type { HttpContext } from '@adonisjs/core/http'
import { getUserShopIds } from '#services/scope_helper'
import GetDashboardOverviewAction from '#actions/dashboard/get_dashboard_overview_action'
import GetRecentLeadsAction from '#actions/dashboard/get_recent_leads_action'
import GetDashboardAnalyticsAction from '#actions/dashboard/get_dashboard_analytics_action'
import GetTopCustomersAction from '#actions/dashboard/get_top_customers_action'

export default class DashboardController {
  async overview({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetDashboardOverviewAction.handle({ userShopIds, shopId })
    return response.json(result)
  }

  async recentLeads({ auth, request, response }: HttpContext) {
    const { limit = 20, shopId } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const leads = await GetRecentLeadsAction.handle({ userShopIds, shopId, limit: Number(limit) })
    return response.json(leads)
  }

  async analytics({ auth, request, response }: HttpContext) {
    const { shopId, days = 7 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetDashboardAnalyticsAction.handle({ userShopIds, shopId, days: Number(days) })
    return response.json(result)
  }

  async topCustomers({ auth, request, response }: HttpContext) {
    const { limit = 10 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customers = await GetTopCustomersAction.handle({ userShopIds, limit: Number(limit) })
    return response.json(customers)
  }
}
