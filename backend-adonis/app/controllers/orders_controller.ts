import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * OrdersController — Full CRUD with raw DB queries (tenant-safe)
 * Tables: orders, order_details, order_totals, order_history, order_statuses, payment_statuses
 */
export default class OrdersController {
  /**
   * GET /orders — List orders with pagination
   */
  async index({ request, response }: HttpContext) {
    try {
      const { status, page = 1, limit = 20 } = request.qs()
      const offset = (Number(page) - 1) * Number(limit)

      let query = db.from('orders').orderBy('created_at', 'desc')
      if (status) query = query.where('status', status)

      const [countResult] = await db.from('orders')
        .count('* as total')
        .modify((q: any) => { if (status) q.where('status', status) })
      const total = Number(countResult?.total || 0)

      const data = await query.offset(offset).limit(Number(limit))
      return response.json({
        data,
        meta: { total, page: Number(page), perPage: Number(limit), lastPage: Math.ceil(total / Number(limit)) || 1 },
      })
    } catch (err: any) {
      console.error('Orders index error:', err.message)
      return response.json({ data: [], meta: { total: 0, page: 1, perPage: 20, lastPage: 1 } })
    }
  }

  /**
   * POST /orders — Create order with line items
   */
  async store({ request, response }: HttpContext) {
    const data = request.only([
      'customerName', 'customerPhone', 'customerAddress',
      'status', 'totalAmount', 'items', 'notes',
      'paymentMethod', 'paymentStatus',
    ])
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return response.badRequest({ error: 'Cần ít nhất 1 sản phẩm' })
    }

    try {
      // Create order
      const [order] = await db.table('orders').insert({
        customer_name: data.customerName || null,
        customer_phone: data.customerPhone || null,
        customer_address: data.customerAddress || null,
        status: data.status || 'pending',
        total_amount: Number(data.totalAmount) || 0,
        items: JSON.stringify(data.items),
        notes: data.notes || null,
        payment_method: data.paymentMethod || 'cod',
        payment_status: data.paymentStatus || 'unpaid',
      }).returning('*')

      // Create order details
      for (const item of data.items) {
        await db.table('order_details').insert({
          order_id: order.id,
          product_id: item.productId || null,
          name: item.name || 'Sản phẩm',
          sku: item.sku || null,
          price: Number(item.price) || 0,
          qty: Number(item.qty) || 1,
          total_price: (Number(item.price) || 0) * (Number(item.qty) || 1),
        })
      }

      // Create order totals
      const subtotal = data.items.reduce((sum: number, i: any) =>
        sum + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)
      await db.table('order_totals').insert([
        { order_id: order.id, title: 'Tạm tính', code: 'subtotal', value: subtotal, sort: 1 },
        { order_id: order.id, title: 'Phí vận chuyển', code: 'shipping', value: 0, sort: 2 },
        { order_id: order.id, title: 'Tổng cộng', code: 'total', value: Number(data.totalAmount) || subtotal, sort: 100 },
      ])

      // Create order history entry
      await db.table('order_history').insert({
        order_id: order.id,
        order_status_id: 1, // pending
        content: 'Đơn hàng mới được tạo',
      })

      return response.status(201).json(order)
    } catch (err: any) {
      console.error('Order create error:', err.message)
      return response.internalServerError({ error: 'Không thể tạo đơn: ' + err.message })
    }
  }

  /**
   * GET /orders/:id — Show single order
   */
  async show({ params, response }: HttpContext) {
    const order = await db.from('orders').where('id', params.id).first()
    if (!order) return response.notFound({ error: 'Order not found' })
    return response.json(order)
  }

  /**
   * PUT /orders/:id — Update order
   */
  async update({ params, request, response }: HttpContext) {
    const order = await db.from('orders').where('id', params.id).first()
    if (!order) return response.notFound({ error: 'Order not found' })

    const data = request.only([
      'status', 'notes', 'trackingNumber',
      'paymentMethod', 'paymentStatus',
      'customerName', 'customerPhone', 'customerAddress',
    ])
    const updateData: any = { updated_at: new Date() }
    const fieldMap: any = {
      trackingNumber: 'tracking_number',
      paymentMethod: 'payment_method',
      paymentStatus: 'payment_status',
      customerName: 'customer_name',
      customerPhone: 'customer_phone',
      customerAddress: 'customer_address',
    }
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        updateData[fieldMap[key] || key] = val
      }
    }

    await db.from('orders').where('id', params.id).update(updateData)
    const updated = await db.from('orders').where('id', params.id).first()
    return response.json(updated)
  }

  /**
   * DELETE /orders/:id
   */
  async destroy({ params, response }: HttpContext) {
    const order = await db.from('orders').where('id', params.id).first()
    if (!order) return response.notFound({ error: 'Order not found' })
    await db.from('order_history').where('order_id', params.id).delete()
    await db.from('order_totals').where('order_id', params.id).delete()
    await db.from('order_details').where('order_id', params.id).delete()
    await db.from('orders').where('id', params.id).delete()
    return response.json({ success: true })
  }

  /**
   * GET /orders/stats — Order statistics
   */
  async stats({ response }: HttpContext) {
    try {
      const [totalResult] = await db.from('orders').count('* as total')
      const [revenueResult] = await db.from('orders').sum('total_amount as total')
      const [paidResult] = await db.from('orders').where('payment_status', 'paid').sum('total_amount as total')
      const [deliveredResult] = await db.from('orders').where('status', 'delivered').count('* as total')

      const totalOrders = Number(totalResult?.total || 0)
      const deliveredOrders = Number(deliveredResult?.total || 0)

      return response.json({
        totalOrders,
        totalRevenue: Number(revenueResult?.total || 0),
        paidRevenue: Number(paidResult?.total || 0),
        conversionRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
      })
    } catch {
      return response.json({ totalOrders: 0, totalRevenue: 0, paidRevenue: 0, conversionRate: 0 })
    }
  }

  /**
   * GET /orders/:id/details — Line items
   */
  async getDetails({ params, response }: HttpContext) {
    try {
      const details = await db.from('order_details')
        .where('order_id', params.id)
        .orderBy('created_at', 'asc')
      return response.json(details)
    } catch {
      return response.json([])
    }
  }

  /**
   * GET /orders/:id/totals — Order totals breakdown
   */
  async getTotals({ params, response }: HttpContext) {
    try {
      const totals = await db.from('order_totals')
        .where('order_id', params.id)
        .orderBy('sort', 'asc')
      return response.json(totals)
    } catch {
      return response.json([])
    }
  }

  /**
   * GET /orders/:id/history — Status change timeline
   */
  async getHistory({ params, response }: HttpContext) {
    try {
      const history = await db.from('order_history')
        .where('order_id', params.id)
        .orderBy('add_date', 'desc')
      return response.json(history)
    } catch {
      return response.json([])
    }
  }

  /**
   * PUT /orders/:id/status — Change order status
   */
  async updateStatus({ params, request, response }: HttpContext) {
    const { statusId, content } = request.only(['statusId', 'content'])
    if (!statusId) return response.badRequest({ error: 'statusId is required' })

    const statusRow = await db.from('order_statuses').where('id', statusId).first()
    if (!statusRow) return response.badRequest({ error: `Invalid statusId: ${statusId}` })

    const order = await db.from('orders').where('id', params.id).first()
    if (!order) return response.notFound({ error: 'Order not found' })

    const oldStatus = order.status
    const updateData: any = { status: statusRow.name, updated_at: new Date() }

    if (statusRow.name === 'delivered') updateData.delivered_at = new Date()
    if (statusRow.name === 'confirmed') updateData.confirmed_at = new Date()
    if (statusRow.name === 'shipping') updateData.shipped_at = new Date()

    await db.from('orders').where('id', params.id).update(updateData)

    // Log history
    await db.table('order_history').insert({
      order_id: params.id,
      order_status_id: statusId,
      content: content || `Trạng thái: ${oldStatus} → ${statusRow.name}`,
    })

    const updated = await db.from('orders').where('id', params.id).first()
    return response.json(updated)
  }

  /**
   * GET /order-statuses — List all statuses
   */
  async getOrderStatuses({ response }: HttpContext) {
    try {
      const statuses = await db.from('order_statuses').orderBy('sort', 'asc')
      return response.json(statuses)
    } catch {
      return response.json([])
    }
  }

  /**
   * GET /payment-statuses — List all payment statuses
   */
  async getPaymentStatuses({ response }: HttpContext) {
    try {
      const statuses = await db.from('payment_statuses').orderBy('sort', 'asc')
      return response.json(statuses)
    } catch {
      return response.json([])
    }
  }
}
