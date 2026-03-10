import type { HttpContext } from '@adonisjs/core/http'
import ShopCustomer from '#models/shop_customer'
import CustomerAddress from '#models/customer_address'
import { getUserShopIds } from '#services/scope_helper'
import hash from '@adonisjs/core/services/hash'

/**
 * ShopCustomersController — S-Cart: AdminCustomerController pattern
 * CRUD for e-commerce customers + address management
 */
export default class ShopCustomersController {
  /**
   * GET /shop-customers — List customers for current shop
   */
  async index({ auth, request, response }: HttpContext) {
    const { shopId, search, page = 1, limit = 20 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = ShopCustomer.query()
      .whereIn('store_id', userShopIds)
      .orderBy('created_at', 'desc')
    if (shopId) query.where('storeId', shopId)
    if (search) {
      query.where((q) => {
        q.whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('phone', `%${search}%`)
      })
    }
    const customers = await query.paginate(Number(page), Number(limit))
    return response.json(customers)
  }

  /**
   * POST /shop-customers — Create customer
   */
  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only([
      'firstName', 'lastName', 'email', 'phone', 'password', 'storeId', 'status',
    ])
    if (!data.storeId || !userShopIds.includes(data.storeId)) {
      return response.forbidden({ error: 'Invalid store' })
    }

    // Hash password if provided
    if (data.password) {
      data.password = await hash.make(data.password)
    }

    const customer = await ShopCustomer.create({
      ...data,
      status: data.status ?? 1,
    })
    return response.status(201).json(customer)
  }

  /**
   * GET /shop-customers/:id — Show customer with addresses
   */
  async show({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await ShopCustomer.query()
      .where('id', params.id)
      .whereIn('store_id', userShopIds)
      .preload('addresses')
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })
    return response.json(customer)
  }

  /**
   * PUT /shop-customers/:id — Update customer
   */
  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await ShopCustomer.query()
      .where('id', params.id)
      .whereIn('store_id', userShopIds)
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const data = request.only([
      'firstName', 'lastName', 'email', 'phone', 'status',
    ])
    if (data.password) {
      data.password = await hash.make(data.password)
    }
    customer.merge(data)
    await customer.save()
    return response.json(customer)
  }

  /**
   * DELETE /shop-customers/:id — Delete customer
   */
  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await ShopCustomer.query()
      .where('id', params.id)
      .whereIn('store_id', userShopIds)
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })
    await customer.delete()
    return response.json({ message: 'Deleted' })
  }

  // ── Address Management ──

  /**
   * GET /shop-customers/:customerId/addresses
   */
  async listAddresses({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await ShopCustomer.query()
      .where('id', params.customerId)
      .whereIn('store_id', userShopIds)
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const addresses = await CustomerAddress.query()
      .where('customerId', params.customerId)
      .orderBy('created_at', 'desc')
    return response.json(addresses)
  }

  /**
   * POST /shop-customers/:customerId/addresses
   */
  async addAddress({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await ShopCustomer.query()
      .where('id', params.customerId)
      .whereIn('store_id', userShopIds)
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const data = request.only([
      'firstName', 'lastName', 'phone',
      'address1', 'address2', 'country', 'province', 'city', 'district', 'postcode',
    ])
    const address = await CustomerAddress.create({
      ...data,
      customerId: params.customerId,
    })

    // Set as default if first address
    if (!customer.addressId) {
      customer.addressId = address.id
      await customer.save()
    }

    return response.status(201).json(address)
  }

  /**
   * PUT /shop-customers/:customerId/addresses/:id
   */
  async updateAddress({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await ShopCustomer.query()
      .where('id', params.customerId)
      .whereIn('store_id', userShopIds)
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const address = await CustomerAddress.query()
      .where('id', params.id)
      .where('customerId', params.customerId)
      .first()
    if (!address) return response.notFound({ error: 'Address not found' })

    const data = request.only([
      'firstName', 'lastName', 'phone',
      'address1', 'address2', 'country', 'province', 'city', 'district', 'postcode',
    ])
    address.merge(data)
    await address.save()
    return response.json(address)
  }

  /**
   * DELETE /shop-customers/:customerId/addresses/:id
   */
  async deleteAddress({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const customer = await ShopCustomer.query()
      .where('id', params.customerId)
      .whereIn('store_id', userShopIds)
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const address = await CustomerAddress.query()
      .where('id', params.id)
      .where('customerId', params.customerId)
      .first()
    if (!address) return response.notFound({ error: 'Address not found' })
    await address.delete()

    // Clear default if deleted
    if (customer.addressId === params.id) {
      customer.addressId = null
      await customer.save()
    }

    return response.json({ message: 'Deleted' })
  }
}
