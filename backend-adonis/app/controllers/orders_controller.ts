import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import { getUserShopIds } from '#services/scope_helper'

export default class OrdersController {
  async index({ auth, request, response }: HttpContext) {
    const { shopId, status, page = 1, limit = 20 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)

    const query = Order.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('created_at', 'desc')
    if (shopId) query.where('shopId', shopId)
    if (status) query.where('status', status)
    const orders = await query.paginate(Number(page), Number(limit))
    return response.json(orders)
  }

  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only([
      'shopId', 'sessionId', 'customerId', 'leadId',
      'customerName', 'customerPhone', 'customerAddress',
      'status', 'totalAmount', 'items', 'notes',
      'paymentMethod', 'paymentStatus',
    ])
    // Verify shop belongs to user
    if (data.shopId && !userShopIds.includes(String(data.shopId))) {
      return response.forbidden({ error: 'Shop not found' })
    }
    const order = await Order.create(data)
    return response.status(201).json(order)
  }

  async show({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const order = await Order.query()
      .where('id', params.id)
      .whereIn('shop_id', userShopIds)
      .preload('customer')
      .first()
    if (!order) return response.notFound({ error: 'Order not found' })
    return response.json(order)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const order = await Order.query()
      .where('id', params.id)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!order) return response.notFound({ error: 'Order not found' })

    const data = request.only([
      'status', 'notes', 'trackingNumber',
      'paymentMethod', 'paymentStatus',
      'customerName', 'customerPhone', 'customerAddress',
    ])

    if (data.status === 'confirmed' && !order.confirmedAt) data.confirmedAt = new Date() as any
    if (data.status === 'shipping' && !order.shippedAt) data.shippedAt = new Date() as any
    if (data.status === 'delivered' && !order.deliveredAt) data.deliveredAt = new Date() as any

    order.merge(data)
    await order.save()
    return response.json(order)
  }

  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const order = await Order.query()
      .where('id', params.id)
      .whereIn('shop_id', userShopIds)
      .first()
    if (!order) return response.notFound({ error: 'Order not found' })
    await order.delete()
    return response.json({ message: 'Deleted' })
  }

  // Stats: revenue summary — scoped
  async stats({ auth, request, response }: HttpContext) {
    const { shopId, days = 30 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    const query = Order.query()
      .where('created_at', '>=', startDate.toISOString())
      .whereIn('shop_id', userShopIds)
    if (shopId) query.where('shopId', shopId)
    const orders = await query

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid')
    const paidRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length

    const statusBreakdown: Record<string, number> = {}
    for (const o of orders) {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1
    }

    return response.json({
      totalOrders, totalRevenue, paidRevenue,
      pendingOrders, deliveredOrders,
      conversionRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
      statusBreakdown,
    })
  }
}
