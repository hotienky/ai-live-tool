import type { HttpContext } from '@adonisjs/core/http'
import { adjustStock } from '#services/inventory_service'
import Product from '#models/product'
import { getUserShopIds } from '#services/scope_helper'

export default async function adjustStockAction({ auth, params, request, response }: HttpContext) {
  const userShopIds = await getUserShopIds(auth.user!.id)
  const product = await Product.query()
    .where('id', params.id)
    .whereIn('shop_id', userShopIds)
    .first()

  if (!product) return response.notFound({ error: 'Product not found' })

  const { newStock, reason } = request.only(['newStock', 'reason'])
  if (newStock === undefined || newStock === null) {
    return response.badRequest({ error: 'newStock is required' })
  }

  const updated = await adjustStock(product.id, Number(newStock), {
    userId: auth.user!.id,
    reason: reason || 'Điều chỉnh kho',
  })

  return response.json(updated)
}
