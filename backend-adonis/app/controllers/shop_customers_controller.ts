import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * ShopCustomersController — Tenant-safe CRUD using raw DB queries
 */
export default class ShopCustomersController {
  async index({ request, response }: HttpContext) {
    try {
      const { search, page = 1, limit = 20 } = request.qs()
      const offset = (Number(page) - 1) * Number(limit)

      let query = db.from('shop_customers').orderBy('created_at', 'desc')
      if (search) {
        query = query.where((q: any) => {
          q.whereILike('first_name', `%${search}%`)
            .orWhereILike('last_name', `%${search}%`)
            .orWhereILike('email', `%${search}%`)
            .orWhereILike('phone', `%${search}%`)
        })
      }

      const [countResult] = await db.from('shop_customers')
        .count('* as total')
        .then((r: any) => r)
      const total = Number(countResult?.total || 0)

      const data = await query.offset(offset).limit(Number(limit))
      return response.json({
        data,
        meta: { total, page: Number(page), perPage: Number(limit), lastPage: Math.ceil(total / Number(limit)) },
      })
    } catch {
      return response.json({ data: [], meta: { total: 0, page: 1, perPage: 20, lastPage: 1 } })
    }
  }

  async store({ request, response }: HttpContext) {
    const data = request.only(['first_name', 'last_name', 'email', 'phone', 'status'])
    if (!data.first_name && !data.email) {
      return response.badRequest({ error: 'Tên hoặc email là bắt buộc' })
    }
    const [customer] = await db.table('shop_customers').insert({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || null,
      phone: data.phone || null,
      status: data.status ?? 1,
    }).returning('*')
    return response.status(201).json(customer)
  }

  async show({ params, response }: HttpContext) {
    const customer = await db.from('shop_customers').where('id', params.id).first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    let addresses: any[] = []
    try {
      addresses = await db.from('customer_addresses')
        .where('customer_id', params.id)
        .orderBy('created_at', 'desc')
    } catch { /* table may not exist */ }

    return response.json({ ...customer, addresses })
  }

  async update({ params, request, response }: HttpContext) {
    const customer = await db.from('shop_customers').where('id', params.id).first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const data = request.only(['first_name', 'last_name', 'email', 'phone', 'status'])
    const updateData: any = { updated_at: new Date() }
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) updateData[key] = val
    }

    await db.from('shop_customers').where('id', params.id).update(updateData)
    const updated = await db.from('shop_customers').where('id', params.id).first()
    return response.json(updated)
  }

  async destroy({ params, response }: HttpContext) {
    const customer = await db.from('shop_customers').where('id', params.id).first()
    if (!customer) return response.notFound({ error: 'Customer not found' })
    await db.from('customer_addresses').where('customer_id', params.id).delete()
    await db.from('shop_customers').where('id', params.id).delete()
    return response.json({ success: true })
  }

  // ── Address Management ──

  async listAddresses({ params, response }: HttpContext) {
    const customer = await db.from('shop_customers').where('id', params.id || params.customerId).first()
    if (!customer) return response.notFound({ error: 'Customer not found' })
    const addresses = await db.from('customer_addresses')
      .where('customer_id', customer.id)
      .orderBy('created_at', 'desc')
    return response.json(addresses)
  }

  async addAddress({ params, request, response }: HttpContext) {
    const customerId = params.customerId
    const customer = await db.from('shop_customers').where('id', customerId).first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const data = request.only([
      'first_name', 'last_name', 'phone', 'address1', 'address2',
      'country', 'province', 'city', 'district', 'postcode',
    ])
    const [address] = await db.table('customer_addresses').insert({
      customer_id: customerId,
      ...data,
    }).returning('*')

    if (!customer.address_id) {
      await db.from('shop_customers').where('id', customerId).update({ address_id: address.id })
    }
    return response.status(201).json(address)
  }

  async updateAddress({ params, request, response }: HttpContext) {
    const address = await db.from('customer_addresses')
      .where('id', params.id).where('customer_id', params.customerId).first()
    if (!address) return response.notFound({ error: 'Address not found' })

    const data = request.only([
      'first_name', 'last_name', 'phone', 'address1', 'address2',
      'country', 'province', 'city', 'district', 'postcode',
    ])
    const updateData: any = { updated_at: new Date() }
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) updateData[key] = val
    }
    await db.from('customer_addresses').where('id', params.id).update(updateData)
    const updated = await db.from('customer_addresses').where('id', params.id).first()
    return response.json(updated)
  }

  async deleteAddress({ params, response }: HttpContext) {
    const address = await db.from('customer_addresses')
      .where('id', params.id).where('customer_id', params.customerId).first()
    if (!address) return response.notFound({ error: 'Address not found' })
    await db.from('customer_addresses').where('id', params.id).delete()
    return response.json({ success: true })
  }
}
