import type { HttpContext } from '@adonisjs/core/http'
import { getUserShopIds } from '#services/scope_helper'
import ExportLeadsAction from '#actions/exports/export_leads_action'
import ExportCommentsAction from '#actions/exports/export_comments_action'
import ExportCustomersAction from '#actions/exports/export_customers_action'
import GenerateReportAction from '#actions/exports/generate_report_action'

export default class ExportsController {
  async leads({ auth, request, response }: HttpContext) {
    const { shopId, format = 'csv' } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { leads, csv } = await ExportLeadsAction.handle({ userShopIds, shopId })

    if (format === 'csv') {
      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', `attachment; filename=leads_${Date.now()}.csv`)
      return response.send(csv)
    }
    return response.json(leads)
  }

  async comments({ auth, request, response }: HttpContext) {
    const { shopId, sessionId, format = 'csv' } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { comments, csv } = await ExportCommentsAction.handle({ userShopIds, shopId, sessionId })

    if (format === 'csv') {
      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', `attachment; filename=comments_${Date.now()}.csv`)
      return response.send(csv)
    }
    return response.json(comments)
  }

  async customers({ auth, request, response }: HttpContext) {
    const { shopId, format = 'csv' } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { customers, csv } = await ExportCustomersAction.handle({ userShopIds, shopId })

    if (format === 'csv') {
      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', `attachment; filename=customers_${Date.now()}.csv`)
      return response.send(csv)
    }
    return response.json(customers)
  }

  async report({ auth, request, response }: HttpContext) {
    const { shopId, days = 7 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { html } = await GenerateReportAction.handle({ userShopIds, shopId, days: Number(days) })

    response.header('Content-Type', 'text/html')
    return response.send(html)
  }
}
