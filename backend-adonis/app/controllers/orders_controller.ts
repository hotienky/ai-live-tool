import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'

export default class OrdersController {
  async index({ request, response }: HttpContext) {
    const { shopId, status, page = 1, limit = 20 } = request.qs()
    const query = Order.query().orderBy('created_at', 'desc')
    if (shopId) query.where('shopId', shopId)
    if (status) query.where('status', status)
    const orders = await query.paginate(Number(page), Number(limit))
    return response.json(orders)
  }

  async store({ request, response }: HttpContext) {
    const data = request.only([
      'shopId', 'sessionId', 'customerId', 'leadId',
      'customerName', 'customerPhone', 'customerAddress',
      'status', 'totalAmount', 'items', 'notes',
      'paymentMethod', 'paymentStatus',
    ])
    const order = await Order.create(data)
    return response.status(201).json(order)
  }

  async show({ params, response }: HttpContext) {
    const order = await Order.query().where('id', params.id).preload('customer').firstOrFail()
    return response.json(order)
  }

  async update({ params, request, response }: HttpContext) {
    const order = await Order.findOrFail(params.id)
    const data = request.only([
      'status', 'notes', 'trackingNumber',
      'paymentMethod', 'paymentStatus',
      'customerName', 'customerPhone', 'customerAddress',
    ])

    // Auto-set timestamp fields based on status
    if (data.status === 'confirmed' && !order.confirmedAt) data.confirmedAt = new Date() as any
    if (data.status === 'shipping' && !order.shippedAt) data.shippedAt = new Date() as any
    if (data.status === 'delivered' && !order.deliveredAt) data.deliveredAt = new Date() as any

    order.merge(data)
    await order.save()
    return response.json(order)
  }

  async destroy({ params, response }: HttpContext) {
    const order = await Order.findOrFail(params.id)
    await order.delete()
    return response.json({ message: 'Deleted' })
  }

  // Stats: revenue summary
  async stats({ request, response }: HttpContext) {
    const { shopId, days = 30 } = request.qs()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number(days))

    const query = Order.query().where('created_at', '>=', startDate.toISOString())
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
      totalOrders,
      totalRevenue,
      paidRevenue,
      pendingOrders,
      deliveredOrders,
      conversionRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
      statusBreakdown,
    })
  }
}
