/**
 * Shipments Controller — CRUD for shipments, status updates, tracking, carrier integration
 */
import type { HttpContext } from '@adonisjs/core/http'
import { ShipmentSchema, ShipmentHistorySchema } from '../../database/schema.js'
import Order from '#models/order'
import { getUserShopIds } from '#services/scope_helper'
import ShippingService from '#services/shipping_service'

export default class ShipmentsController {
  /** List shipments for user's shops */
  async index({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { shopId, status, carrier } = request.qs()

    const query = ShipmentSchema.query()
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .orderBy('created_at', 'desc')
    if (shopId) query.where('shop_id', shopId)
    if (status) query.where('status', status)
    if (carrier) query.where('carrier', carrier)
    const shipments = await query
    return response.json(shipments)
  }

  /** Create a new shipment — calls carrier API if not manual */
  async store({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only([
      'orderId', 'shopId', 'carrier',
      'senderName', 'senderPhone', 'senderAddress',
      'senderWard', 'senderDistrict', 'senderProvince',
      'receiverName', 'receiverPhone', 'receiverAddress',
      'receiverWard', 'receiverDistrict', 'receiverProvince',
      'shippingFee', 'codAmount', 'insuranceFee',
      'weight', 'dimensions', 'notes',
    ])

    if (!data.shopId || !userShopIds.includes(Number(data.shopId))) {
      return response.forbidden({ error: 'Invalid shopId' })
    }

    // Validate order belongs to shop
    if (data.orderId) {
      const order = await Order.query()
        .where('id', data.orderId)
        .where('shopId', data.shopId)
        .first()
      if (!order) return response.notFound({ error: 'Order not found' })
    }

    // Call carrier API if not manual
    let trackingCode = ''
    let carrierOrderCode = ''
    let initialStatus = 'draft'
    const carrier = data.carrier || 'manual'

    if (carrier !== 'manual') {
      try {
        const result = await ShippingService.createShipment(Number(data.shopId), carrier, {
          senderName: data.senderName || '',
          senderPhone: data.senderPhone || '',
          senderAddress: data.senderAddress || '',
          receiverName: data.receiverName || '',
          receiverPhone: data.receiverPhone || '',
          receiverAddress: data.receiverAddress || '',
          receiverWard: data.receiverWard || '',
          receiverDistrict: data.receiverDistrict || '',
          receiverProvince: data.receiverProvince || '',
          weight: Number(data.weight) || 500,
          codAmount: Number(data.codAmount) || 0,
          insuranceFee: Number(data.insuranceFee) || 0,
          notes: data.notes || '',
        })
        trackingCode = result.trackingCode
        carrierOrderCode = result.carrierOrderCode
        if (result.shippingFee) data.shippingFee = result.shippingFee
        initialStatus = 'pending'
      } catch (err: any) {
        return response.badRequest({
          error: `Lỗi tạo vận đơn ${carrier}: ${err.message}`,
        })
      }
    }

    const shipment = await ShipmentSchema.create({
      ...data,
      carrier,
      trackingCode,
      carrierOrderCode,
      status: initialStatus,
      shippingFee: Number(data.shippingFee) || 0,
      codAmount: Number(data.codAmount) || 0,
      insuranceFee: Number(data.insuranceFee) || 0,
      weight: Number(data.weight) || 500,
    })

    // Log first history entry
    const desc = carrier === 'manual'
      ? 'Vận đơn được tạo (thủ công)'
      : `Đã tạo VĐ ${carrier.toUpperCase()} — ${trackingCode}`
    await ShipmentHistorySchema.create({
      shipmentId: shipment.id,
      status: initialStatus,
      description: desc,
      source: 'system',
    })

    // Emit socket event
    try {
      const { getIO } = await import('../../start/socket.js')
      const io = getIO()
      if (io) {
        io.to(`shop_${data.shopId}`).emit('shipment_created', {
          id: shipment.id,
          orderId: data.orderId,
          status: initialStatus,
          carrier,
          trackingCode,
        })
      }
    } catch {
      /* silent */
    }

    return response.json(shipment)
  }

  /** Show a single shipment with history */
  async show({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const shipment = await ShipmentSchema.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .preload('history')
      .first()
    if (!shipment) return response.notFound({ error: 'Shipment not found' })
    return response.json(shipment)
  }

  /** Update shipment status */
  async updateStatus({ auth, params, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const shipment = await ShipmentSchema.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .first()
    if (!shipment) return response.notFound({ error: 'Shipment not found' })

    const { status, description, location } = request.only([
      'status', 'description', 'location',
    ])
    const validStatuses = [
      'draft', 'pending', 'picked_up', 'in_transit',
      'out_for_delivery', 'delivered', 'returned', 'cancelled',
    ]
    if (!validStatuses.includes(status)) {
      return response.badRequest({ error: 'Invalid status' })
    }

    // If cancelling and has carrier tracking — cancel on carrier too
    if (
      status === 'cancelled' &&
      shipment.trackingCode &&
      shipment.carrier !== 'manual'
    ) {
      try {
        await ShippingService.cancelShipment(
          shipment.shopId,
          shipment.carrier,
          shipment.trackingCode,
        )
      } catch {
        /* best effort */
      }
    }

    shipment.status = status
    if (status === 'delivered') {
      shipment.deliveredAt = new Date() as any
    }
    await shipment.save()

    // Log history
    await ShipmentHistorySchema.create({
      shipmentId: shipment.id,
      status,
      description: description || statusLabels[status] || status,
      location: location || null,
      source: 'manual',
    })

    // Emit socket event
    try {
      const { getIO } = await import('../../start/socket.js')
      const io = getIO()
      if (io) {
        io.to(`shop_${shipment.shopId}`).emit('shipment_updated', {
          id: shipment.id,
          orderId: shipment.orderId,
          status,
        })
      }
    } catch {
      /* silent */
    }

    // If delivered, update the order status too
    if (status === 'delivered' && shipment.orderId) {
      try {
        const order = await Order.find(shipment.orderId)
        if (order && order.status !== 'delivered') {
          order.status = 'delivered'
          await order.save()
        }
      } catch {
        /* silent */
      }
    }

    return response.json(shipment)
  }

  /** Get shipment tracking — merge local history + carrier API */
  async tracking({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const shipment = await ShipmentSchema.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .first()
    if (!shipment) return response.notFound({ error: 'Shipment not found' })

    // Local history
    const localHistory = await ShipmentHistorySchema.query()
      .where('shipmentId', shipment.id)
      .orderBy('created_at', 'desc')

    // Try to get live carrier tracking
    let carrierEvents: any[] = []
    if (shipment.trackingCode && shipment.carrier !== 'manual') {
      try {
        carrierEvents = await ShippingService.getTracking(
          shipment.shopId,
          shipment.carrier,
          shipment.trackingCode,
        )
      } catch {
        /* silent */
      }
    }

    return response.json({
      local: localHistory,
      carrier: carrierEvents,
      trackingCode: shipment.trackingCode,
      carrierName: shipment.carrier,
    })
  }

  /** Get shipping stats */
  async stats({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { shopId } = request.qs()
    const targetShopId = Number(shopId) || userShopIds[0]
    if (!userShopIds.includes(targetShopId)) {
      return response.forbidden({ error: 'Access denied' })
    }

    const shipments = await ShipmentSchema.query().where('shopId', targetShopId)
    const total = shipments.length
    const statusCounts: Record<string, number> = {}
    let totalFees = 0
    for (const s of shipments) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
      totalFees += Number(s.shippingFee) || 0
    }
    return response.json({ total, totalFees, statusCounts })
  }

  /** Delete shipment (draft only) */
  async destroy({ auth, params, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const shipment = await ShipmentSchema.query()
      .where('id', params.id)
      ; if (userShopIds) query.whereIn("shop_id", userShopIds)
      .first()
    if (!shipment) return response.notFound({ error: 'Shipment not found' })
    if (shipment.status !== 'draft') {
      return response.badRequest({ error: 'Only draft shipments can be deleted' })
    }
    await shipment.delete()
    return response.json({ success: true })
  }

  // ─── Carrier Config APIs (self-service) ───

  /** Get shop shipping config */
  async getConfig({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const shopId = Number(request.qs().shopId) || userShopIds[0]
    if (!userShopIds.includes(shopId)) {
      return response.forbidden({ error: 'Access denied' })
    }
    try {
      const config = await ShippingService.getShopConfig(shopId)
      return response.json(config)
    } catch (err: any) {
      return response.badRequest({ error: err.message })
    }
  }

  /** Save shop shipping config */
  async saveConfig({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const data = request.only([
      'shopId', 'shippingConfig', 'defaultCarrier',
      'senderName', 'senderPhone', 'senderAddress',
    ])
    const shopId = Number(data.shopId)
    if (!shopId || !userShopIds.includes(shopId)) {
      return response.forbidden({ error: 'Access denied' })
    }
    try {
      await ShippingService.saveShopConfig(shopId, data)
      return response.json({ success: true })
    } catch (err: any) {
      return response.badRequest({ error: err.message })
    }
  }

  /** Test carrier connection */
  async testConnection({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { shopId, carrier, config } = request.only([
      'shopId', 'carrier', 'config',
    ])
    if (!userShopIds.includes(Number(shopId))) {
      return response.forbidden({ error: 'Access denied' })
    }
    const result = await ShippingService.testConnection(carrier, config)
    return response.json(result)
  }

  /** Calculate shipping fee via carrier API */
  async calculateFee({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const { shopId, carrier, ...params } = request.only([
      'shopId', 'carrier', 'weight', 'codAmount', 'insuranceFee',
      'receiverProvince', 'receiverDistrict',
      'receiverWardCode', 'receiverDistrictId',
    ])
    if (!userShopIds.includes(Number(shopId))) {
      return response.forbidden({ error: 'Access denied' })
    }
    try {
      const result = await ShippingService.calculateFee(
        Number(shopId), carrier, params,
      )
      return response.json(result)
    } catch (err: any) {
      return response.badRequest({ error: err.message })
    }
  }

  /** Get connected carriers for a shop */
  async getCarriers({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const shopId = Number(request.qs().shopId) || userShopIds[0]
    if (!userShopIds.includes(shopId)) {
      return response.forbidden({ error: 'Access denied' })
    }
    const carriers = await ShippingService.getConnectedCarriers(shopId)
    return response.json(carriers)
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
