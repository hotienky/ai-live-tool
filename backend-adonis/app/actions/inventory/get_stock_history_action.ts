import type { HttpContext } from '@adonisjs/core/http'
import { StockHistorySchema } from '../../../database/schema.js'
import Product from '#models/product'
import { getUserShopIds } from '#services/scope_helper'

export default async function getStockHistoryAction({ auth, params, request, response }: HttpContext) {
  const userShopIds = await getUserShopIds(auth.user!.id)
  const product = await Product.query()
    .where('id', params.id)
    .whereIn('shop_id', userShopIds)
    .first()

  if (!product) return response.notFound({ error: 'Product not found' })

  const { page = 1, limit = 30 } = request.qs()
  const history = await StockHistorySchema.query()
    .where('productId', product.id)
    .orderBy('created_at', 'desc')
    .paginate(Number(page), Number(limit))

  return response.json(history)
}
