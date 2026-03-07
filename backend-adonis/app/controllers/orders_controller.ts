import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import { getUserShopIds } from '#services/scope_helper'
import CreateOrderAction from '#actions/orders/create_order_action'
import UpdateOrderAction from '#actions/orders/update_order_action'
import GetOrderStatsAction from '#actions/orders/get_order_stats_action'
import { triggerWebhook } from '#services/webhook_service'
import { logActivity, Actions } from '#services/activity_log_service'

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

    const { error, order } = await CreateOrderAction.handle({ userShopIds, data })
    if (error) return response.forbidden({ error })

    // Webhook + Activity log
    try {
      await triggerWebhook(Number(data.shopId), 'order.created', { order })
      await logActivity({ shopId: Number(data.shopId), userId: auth.user!.id, action: Actions.ORDER_CREATED, entityType: 'Order', entityId: order.id, details: { totalAmount: order.totalAmount } })
    } catch { /* best-effort */ }

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
    const data = request.only([
      'status', 'notes', 'trackingNumber',
      'paymentMethod', 'paymentStatus',
      'customerName', 'customerPhone', 'customerAddress',
    ])

    try {
      const order = await UpdateOrderAction.handle({
        userShopIds,
        orderId: params.id,
        userId: auth.user!.id,
        data,
      })
      if (!order) return response.notFound({ error: 'Order not found' })

      // Activity log for status changes
      try {
        await logActivity({ shopId: order.shopId, userId: auth.user!.id, action: Actions.ORDER_UPDATED, entityType: 'Order', entityId: order.id, details: { status: data.status } })
      } catch { /* best-effort */ }

      return response.json(order)
    } catch (err: any) {
      return response.unprocessableEntity({ error: err.message })
    }
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

  async stats({ auth, request, response }: HttpContext) {
    const { shopId, days = 30 } = request.qs()
    const userShopIds = await getUserShopIds(auth.user!.id)
    const result = await GetOrderStatsAction.handle({ userShopIds, shopId, days: Number(days) })
    return response.json(result)
  }
}
