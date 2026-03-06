import type { HttpContext } from '@adonisjs/core/http'
import ChatLog from '#models/chat_log'
import Lead from '#models/lead'
import Customer from '#models/customer'
import { getUserShopIds } from '#services/scope_helper'

export default class ExportsController {
  async leads({ auth, request, response }: HttpContext) {
    const { shopId, format = 'csv' } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = Lead.query()
      .whereIn('chat_log_id',
        ChatLog.query().select('id').whereIn('shop_id', userShopIds)
      )
      .orderBy('created_at', 'desc')
    if (shopId) query.whereHas('chatLog', (q) => q.where('shop_id', shopId))
    const leads = await query

    if (format === 'csv') {
      const headers = ['id', 'unique_id', 'nickname', 'comment', 'label', 'status', 'notes', 'product_intent', 'created_at']
      let csv = headers.join(',') + '\n'
      for (const l of leads) {
        const s = l.serialize()
        csv += headers.map((h) => `"${String(s[h] || '').replace(/"/g, '""')}"`).join(',') + '\n'
      }
      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', `attachment; filename=leads_${Date.now()}.csv`)
      return response.send(csv)
    }
    return response.json(leads)
  }

  async comments({ auth, request, response }: HttpContext) {
    const { shopId, sessionId, format = 'csv' } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = ChatLog.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('created_at', 'desc')
      .limit(10000)
    if (shopId) query.where('shopId', shopId as string)
    if (sessionId) query.where('sessionId', sessionId as string)
    const comments = await query

    if (format === 'csv') {
      const headers = ['id', 'unique_id', 'nickname', 'comment_text', 'ai_label', 'ai_summary', 'product_intent', 'platform', 'created_at']
      let csv = headers.join(',') + '\n'
      for (const c of comments) {
        const s = c.serialize()
        csv += headers.map((h) => `"${String(s[h] || '').replace(/"/g, '""')}"`).join(',') + '\n'
      }
      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', `attachment; filename=comments_${Date.now()}.csv`)
      return response.send(csv)
    }
    return response.json(comments)
  }

  async customers({ auth, request, response }: HttpContext) {
    const { shopId, format = 'csv' } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = Customer.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('updated_at', 'desc')
    if (shopId) query.where('shopId', shopId as string)
    const customers = await query

    if (format === 'csv') {
      const headers = ['id', 'unique_id', 'nickname', 'total_comments', 'hot_count', 'last_label', 'platform', 'created_at']
      let csv = headers.join(',') + '\n'
      for (const c of customers) {
        const s = c.serialize()
        csv += headers.map((h) => `"${String(s[h] || '').replace(/"/g, '""')}"`).join(',') + '\n'
      }
      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', `attachment; filename=customers_${Date.now()}.csv`)
      return response.send(csv)
    }
    return response.json(customers)
  }

  async report({ auth, request, response }: HttpContext) {
    const { shopId, days = 7 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    let totalComments = 0, totalHot = 0, totalWarm = 0, totalCold = 0, totalLeads = 0, conversionRate = 0

    try {
      const query = ChatLog.query()
        .where('created_at', '>=', startDate.toISOString())
        .whereIn('shop_id', userShopIds)
      if (shopId) query.where('shopId', shopId as string)
      const comments = await query

      totalComments = comments.length
      totalHot = comments.filter((c) => c.aiLabel === 'HOT').length
      totalWarm = comments.filter((c) => c.aiLabel === 'WARM').length
      totalCold = comments.filter((c) => c.aiLabel === 'COLD').length

      const leads = await Lead.query()
        .where('created_at', '>=', startDate.toISOString())
        .whereIn('chat_log_id',
          ChatLog.query().select('id').whereIn('shop_id', userShopIds)
        )
      totalLeads = leads.length
      const closed = leads.filter((l) => l.status === 'Closed').length
      conversionRate = totalLeads > 0 ? Math.round((closed / totalLeads) * 100) : 0
    } catch { /* DB might be empty */ }

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Report</title>
<style>
body{font-family:system-ui;padding:40px;max-width:800px;margin:0 auto;color:#1a1a1a}
h1{color:#ff3b5c;border-bottom:2px solid #ff3b5c;padding-bottom:8px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}
.stat{background:#f8f9fa;border-radius:8px;padding:16px;text-align:center}
.stat-value{font-size:28px;font-weight:800}
.stat-label{font-size:12px;color:#666;margin-top:4px}
.hot{color:#ef4444}.warm{color:#f59e0b}.cold{color:#6b7280}
.footer{margin-top:40px;font-size:11px;color:#999;text-align:center}
</style></head><body>
<h1>📊 AI Live-Commerce Report</h1>
<p>Khoảng thời gian: ${days} ngày gần nhất</p>
<div class="stats">
  <div class="stat"><div class="stat-value">${totalComments}</div><div class="stat-label">Tổng Comments</div></div>
  <div class="stat"><div class="stat-value hot">${totalHot}</div><div class="stat-label">HOT Leads</div></div>
  <div class="stat"><div class="stat-value warm">${totalWarm}</div><div class="stat-label">WARM</div></div>
  <div class="stat"><div class="stat-value cold">${totalCold}</div><div class="stat-label">COLD</div></div>
  <div class="stat"><div class="stat-value">${totalLeads}</div><div class="stat-label">Tổng Leads</div></div>
  <div class="stat"><div class="stat-value" style="color:#10b981">${conversionRate}%</div><div class="stat-label">Conversion Rate</div></div>
</div>
<div class="footer">Generated by AI Live-Commerce Tool • ${new Date().toLocaleString('vi-VN')}</div>
</body></html>`

    response.header('Content-Type', 'text/html')
    return response.send(html)
  }
}
