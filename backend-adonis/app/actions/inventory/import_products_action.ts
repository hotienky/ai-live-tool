import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { getUserShopIds } from '#services/scope_helper'

export default async function importProductsAction({ auth, request, response }: HttpContext) {
  const userShopIds = await getUserShopIds(auth.user!.id)
  const { shopId, products } = request.only(['shopId', 'products'])

  if (!shopId || !userShopIds.includes(Number(shopId))) {
    return response.forbidden({ error: 'Invalid shopId' })
  }

  if (!Array.isArray(products) || products.length === 0) {
    return response.badRequest({ error: 'products array is required' })
  }

  const results: any[] = []
  let created = 0
  let errors = 0

  for (const row of products) {
    try {
      const product = await Product.create({
        shopId: Number(shopId),
        name: row.name,
        sku: row.sku || null,
        price: Number(row.price) || 0,
        costPrice: row.costPrice ? Number(row.costPrice) : null,
        stock: Number(row.stock) || 0,
        lowStockThreshold: Number(row.lowStockThreshold) || 5,
        category: row.category || null,
        unit: row.unit || 'cái',
        barcode: row.barcode || null,
        keywords: row.keywords || null,
        isActive: true,
      })
      results.push({ name: row.name, success: true, id: product.id })
      created++
    } catch (err: any) {
      results.push({ name: row.name, success: false, error: err.message })
      errors++
    }
  }

  return response.json({ created, errors, total: products.length, results })
}
