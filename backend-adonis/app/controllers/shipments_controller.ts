/**
 * Shipments Controller — CRUD for shipments/tracking (tenant-safe)
 * Uses raw DB queries to avoid model resolution issues.
 */
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class ShipmentsController {
  async index({ request, response }: HttpContext) {
    const { status, carrier, page = 1, limit = 50 } = request.qs()
    const offset = (Number(page) - 1) * Number(limit)

    const buildWhere = (q: any) => {
      if (status) q.where('status', status)
      if (carrier) q.where('carrier', carrier)
      return q
    }

    const [data, countResult] = await Promise.all([
      buildWhere(db.from('shipments'))
        .orderBy('created_at', 'desc')
        .offset(offset)
        .limit(Number(limit)),
      buildWhere(db.from('shipments'))
        .count('* as total')
        .first(),
    ])
    const total = Number(countResult?.total || 0)

    return response.json({
      data,
      meta: { total, page: Number(page), limit: Number(limit), lastPage: Math.ceil(total / Number(limit)) },
    })
  }

  async store({ request, response }: HttpContext) {
    const data = request.only([
      'order_id', 'carrier', 'tracking_code',
      'sender_name', 'sender_phone', 'sender_address',
      'receiver_name', 'receiver_phone', 'receiver_address',
      'receiver_ward', 'receiver_district', 'receiver_province',
      'shipping_fee', 'cod_amount', 'insurance_fee',
      'weight', 'notes',
    ])

    const [shipment] = await db.table('shipments').insert({
      order_id: data.order_id || null,
      carrier: data.carrier || 'manual',
      tracking_code: data.tracking_code || '',
      status: 'draft',
      sender_name: data.sender_name || '',
      sender_phone: data.sender_phone || '',
      sender_address: data.sender_address || '',
      receiver_name: data.receiver_name || '',
      receiver_phone: data.receiver_phone || '',
      receiver_address: data.receiver_address || '',
      receiver_ward: data.receiver_ward || '',
      receiver_district: data.receiver_district || '',
      receiver_province: data.receiver_province || '',
      shipping_fee: Number(data.shipping_fee) || 0,
      cod_amount: Number(data.cod_amount) || 0,
      insurance_fee: Number(data.insurance_fee) || 0,
      weight: Number(data.weight) || 500,
      notes: data.notes || '',
    }).returning('*')

    // Log first history entry
    await db.table('shipment_history').insert({
      shipment_id: shipment.id,
      status: 'draft',
      description: 'Vận đơn được tạo',
      source: 'system',
    })

    return response.json(shipment)
  }

  async show({ params, response }: HttpContext) {
    const shipment = await db.from('shipments').where('id', params.id).first()
    if (!shipment) return response.notFound({ error: 'Shipment not found' })

    const history = await db.from('shipment_history')
      .where('shipment_id', shipment.id)
      .orderBy('created_at', 'desc')

    return response.json({ ...shipment, history })
  }

  async updateStatus({ params, request, response }: HttpContext) {
    const shipment = await db.from('shipments').where('id', params.id).first()
    if (!shipment) return response.notFound({ error: 'Shipment not found' })

    const { status, description, location } = request.only(['status', 'description', 'location'])
    const validStatuses = [
      'draft', 'pending', 'picked_up', 'in_transit',
      'out_for_delivery', 'delivered', 'returned', 'cancelled',
    ]
    if (!validStatuses.includes(status)) {
      return response.badRequest({ error: 'Invalid status' })
    }

    const updateData: any = { status, updated_at: new Date() }
    if (status === 'delivered') updateData.delivered_at = new Date()
    await db.from('shipments').where('id', params.id).update(updateData)

    // Log history
    await db.table('shipment_history').insert({
      shipment_id: shipment.id,
      status,
      description: description || statusLabels[status] || status,
      location: location || null,
      source: 'manual',
    })

    // Update order status if delivered
    if (status === 'delivered' && shipment.order_id) {
      try {
        await db.from('orders').where('id', shipment.order_id).update({
          status: 'delivered',
          updated_at: new Date(),
        })
      } catch { /* silent */ }
    }

    const updated = await db.from('shipments').where('id', params.id).first()
    return response.json(updated)
  }

  async tracking({ params, response }: HttpContext) {
    const shipment = await db.from('shipments').where('id', params.id).first()
    if (!shipment) return response.notFound({ error: 'Shipment not found' })

    const history = await db.from('shipment_history')
      .where('shipment_id', shipment.id)
      .orderBy('created_at', 'desc')

    return response.json({
      local: history,
      trackingCode: shipment.tracking_code,
      carrierName: shipment.carrier,
    })
  }

  async stats({ response }: HttpContext) {
    const results = await db.from('shipments')
      .select('status')
      .count('* as count')
      .groupBy('status')

    const total = results.reduce((sum: number, r: any) => sum + Number(r.count), 0)
    const statusCounts: Record<string, number> = {}
    for (const r of results) {
      statusCounts[r.status] = Number(r.count)
    }

    const feeResult = await db.from('shipments')
      .sum('shipping_fee as total_fees')
      .first()

    return response.json({
      total,
      totalFees: Number(feeResult?.total_fees || 0),
      statusCounts,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const shipment = await db.from('shipments').where('id', params.id).first()
    if (!shipment) return response.notFound({ error: 'Shipment not found' })
    if (shipment.status !== 'draft') {
      return response.badRequest({ error: 'Only draft shipments can be deleted' })
    }
    await db.from('shipment_history').where('shipment_id', params.id).delete()
    await db.from('shipments').where('id', params.id).delete()
    return response.json({ success: true })
  }
}

const statusLabels: Record<string, string> = {
  draft: 'Nháp',
  pending: 'Chờ lấy hàng',
  picked_up: 'Đã lấy hàng',
  in_transit: 'Đang vận chuyển',
  out_for_delivery: 'Đang giao',
  delivered: 'Đã giao',
  returned: 'Hoàn hàng',
  cancelled: 'Đã hủy',
}
