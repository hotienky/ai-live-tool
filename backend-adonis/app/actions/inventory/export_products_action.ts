import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { getUserShopIds } from '#services/scope_helper'

export default async function exportProductsAction({ auth, request, response }: HttpContext) {
  const userShopIds = await getUserShopIds(auth.user!.id)
  const { shopId } = request.qs()
  const targetShopId = Number(shopId) || userShopIds[0]

  if (!userShopIds.includes(targetShopId)) {
    return response.forbidden({ error: 'Access denied' })
  }

  const products = await Product.query()
    .where('shopId', targetShopId)
    .where('isActive', true)
    .orderBy('name', 'asc')

  // Build CSV
  const headers = ['name', 'sku', 'price', 'cost_price', 'stock', 'low_stock_threshold', 'category', 'unit', 'barcode', 'keywords']
  const rows = products.map(p => [
    p.name,
    p.sku || '',
    p.price || 0,
    p.costPrice || '',
    p.stock,
    p.lowStockThreshold,
    p.category || '',
    p.unit || 'cái',
    p.barcode || '',
    p.keywords || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv = [headers.join(','), ...rows].join('\n')

  response.header('Content-Type', 'text/csv; charset=utf-8')
  response.header('Content-Disposition', `attachment; filename="products_${targetShopId}_${Date.now()}.csv"`)
  return response.send(csv)
}
