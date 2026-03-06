import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'

export default class CustomersController {
  async index({ request, response }: HttpContext) {
    const { shopId, search, page = 1, limit = 50 } = request.qs()
    const query = Customer.query().orderBy('updated_at', 'desc')

    if (shopId) query.where('shop_id', shopId)
    if (search) {
      query.where((q) => {
        q.whereILike('nickname', `%${search}%`)
          .orWhereILike('unique_id', `%${search}%`)
      })
    }

    const customers = await query.paginate(Number(page), Number(limit))
    return response.json(customers)
  }

  async show({ params, response }: HttpContext) {
    const customer = await Customer.query()
      .where('id', params.id)
      .preload('chatLogs')
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })
    return response.json(customer)
  }

  async update({ params, request, response }: HttpContext) {
    const customer = await Customer.find(params.id)
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const data = request.only(['nickname', 'tags', 'notes', 'lastLabel'])
    customer.merge(data)
    await customer.save()
    return response.json(customer)
  }

  async destroy({ params, response }: HttpContext) {
    const customer = await Customer.find(params.id)
    if (!customer) return response.notFound({ error: 'Customer not found' })
    await customer.delete()
    return response.json({ message: 'Deleted' })
  }
}
