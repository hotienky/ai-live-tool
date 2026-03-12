import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'
import { getUserShopIds } from '#services/scope_helper'

export default class CustomersController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId, search, page = 1, limit = 50 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = Customer.query()
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .orderBy('updated_at', 'desc')

    if (shopId) query.where('shop_id', shopId)
    if (search) {
      query.where((q) => {
        q.whereILike('nickname', `%${search}%`)
          .orWhereILike('platform_user_id', `%${search}%`)
      })
    }

    const customers = await query.paginate(Number(page), Number(limit))
    return response.json(customers)
  }

  async show({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await Customer.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .preload('chatLogs')
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })
    return response.json(customer)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await Customer.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const data = request.only(['nickname', 'tags', 'notes', 'lastLabel'])
    customer.merge(data)
    await customer.save()
    return response.json(customer)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await Customer.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })
    await customer.delete()
    return response.json({ message: 'Deleted' })
  }
}
