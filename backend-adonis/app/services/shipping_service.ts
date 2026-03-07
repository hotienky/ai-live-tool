/**
 * Shipping Service — Unified provider abstraction for GHN, GHTK, Viettel Post
 * Self-service: shop owners configure API tokens in Settings UI
 */
import { ShopSchema } from '../../database/schema.js'

// ─── Provider interfaces ───
interface CreateShipmentRequest {
  senderName: string
  senderPhone: string
  senderAddress: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverWard?: string
  receiverDistrict?: string
  receiverProvince?: string
  weight: number // grams
  codAmount: number
  insuranceFee?: number
  notes?: string
}

interface CreateShipmentResponse {
  trackingCode: string
  carrierOrderCode: string
  expectedDelivery?: string
  shippingFee?: number
}

interface TrackingEvent {
  status: string
  description: string
  location?: string
  timestamp: string
}

interface FeeCalculation {
  fee: number
  estimatedDays: number
}

// ─── GHN Provider ───
const GHN = {
  BASE_URL: 'https://online-gateway.ghn.vn/shiip/public-api',

  async testConnection(config: { token: string; shopId: string }) {
    const res = await fetch(`${GHN.BASE_URL}/v2/shop/all`, {
      method: 'GET',
      headers: { 'Token': config.token, 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    return { ok: data.code === 200, message: data.message || (data.code === 200 ? 'Kết nối thành công' : 'Token không hợp lệ') }
  },

  async calculateFee(config: { token: string; shopId: string }, params: any): Promise<FeeCalculation> {
    const res = await fetch(`${GHN.BASE_URL}/v2/shipping-order/fee`, {
      method: 'POST',
      headers: {
        'Token': config.token,
        'ShopId': config.shopId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_type_id: 2, // Standard
        to_ward_code: params.receiverWardCode || '',
        to_district_id: Number(params.receiverDistrictId) || 0,
        weight: params.weight || 500,
        insurance_value: params.insuranceFee || 0,
        cod_value: params.codAmount || 0,
      }),
    })
    const data = await res.json()
    return {
      fee: data.data?.total || 0,
      estimatedDays: data.data?.expected_delivery_time ? 3 : 3,
    }
  },

  async createShipment(config: { token: string; shopId: string }, req: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    const res = await fetch(`${GHN.BASE_URL}/v2/shipping-order/create`, {
      method: 'POST',
      headers: {
        'Token': config.token,
        'ShopId': config.shopId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to_name: req.receiverName,
        to_phone: req.receiverPhone,
        to_address: req.receiverAddress,
        to_ward_name: req.receiverWard || '',
        to_district_name: req.receiverDistrict || '',
        weight: req.weight || 500,
        cod_amount: req.codAmount || 0,
        insurance_value: req.insuranceFee || 0,
        service_type_id: 2,
        payment_type_id: 2, // Receiver pays shipping
        required_note: 'KHONGCHOXEMHANG',
        note: req.notes || '',
        items: [{ name: 'Đơn hàng', quantity: 1, weight: req.weight || 500 }],
      }),
    })
    const data = await res.json()
    if (data.code !== 200) throw new Error(data.message || 'GHN: Lỗi tạo vận đơn')
    return {
      trackingCode: data.data?.order_code || '',
      carrierOrderCode: data.data?.order_code || '',
      expectedDelivery: data.data?.expected_delivery_time || '',
      shippingFee: data.data?.total_fee || 0,
    }
  },

  async getTracking(config: { token: string }, trackingCode: string): Promise<TrackingEvent[]> {
    const res = await fetch(`${GHN.BASE_URL}/v2/shipping-order/detail`, {
      method: 'POST',
      headers: { 'Token': config.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_code: trackingCode }),
    })
    const data = await res.json()
    const logs = data.data?.log || []
    return logs.map((log: any) => ({
      status: log.status || 'unknown',
      description: log.status || '',
      timestamp: log.updated_date || new Date().toISOString(),
    }))
  },

  async cancelShipment(config: { token: string; shopId: string }, orderCodes: string[]) {
    const res = await fetch(`${GHN.BASE_URL}/v2/switch-status/cancel`, {
      method: 'POST',
      headers: {
        'Token': config.token,
        'ShopId': config.shopId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_codes: orderCodes }),
    })
    const data = await res.json()
    return { ok: data.code === 200, message: data.message }
  },
}

// ─── GHTK Provider ───
const GHTK = {
  BASE_URL: 'https://services.giaohangtietkiem.vn',

  async testConnection(config: { token: string }) {
    try {
      const res = await fetch(`${GHTK.BASE_URL}/services/shipment/list`, {
        method: 'GET',
        headers: { 'Token': config.token },
      })
      return { ok: res.ok, message: res.ok ? 'Kết nối thành công' : 'Token không hợp lệ' }
    } catch {
      return { ok: false, message: 'Không thể kết nối GHTK' }
    }
  },

  async calculateFee(config: { token: string }, params: any): Promise<FeeCalculation> {
    const qs = new URLSearchParams({
      pick_province: params.senderProvince || 'Hồ Chí Minh',
      pick_district: params.senderDistrict || 'Quận 1',
      province: params.receiverProvince || '',
      district: params.receiverDistrict || '',
      weight: String(params.weight || 500),
      value: String(params.codAmount || 0),
    })
    const res = await fetch(`${GHTK.BASE_URL}/services/shipment/fee?${qs}`, {
      headers: { 'Token': config.token },
    })
    const data = await res.json()
    return {
      fee: data.fee?.fee || 0,
      estimatedDays: data.fee?.delivery || 3,
    }
  },

  async createShipment(config: { token: string }, req: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    const res = await fetch(`${GHTK.BASE_URL}/services/shipment/order`, {
      method: 'POST',
      headers: { 'Token': config.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: {
          id: `SHOP-${Date.now()}`,
          pick_name: req.senderName,
          pick_tel: req.senderPhone,
          pick_address: req.senderAddress,
          name: req.receiverName,
          tel: req.receiverPhone,
          address: req.receiverAddress,
          ward: req.receiverWard || '',
          district: req.receiverDistrict || '',
          province: req.receiverProvince || '',
          hamlet: 'Khác',
          weight: (req.weight || 500) / 1000, // GHTK expects kg
          pick_money: req.codAmount || 0,
          note: req.notes || '',
          value: req.insuranceFee || 0,
        },
      }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message || 'GHTK: Lỗi tạo vận đơn')
    return {
      trackingCode: data.order?.label || '',
      carrierOrderCode: data.order?.partner_id || '',
      shippingFee: data.order?.fee || 0,
    }
  },

  async getTracking(config: { token: string }, trackingCode: string): Promise<TrackingEvent[]> {
    const res = await fetch(`${GHTK.BASE_URL}/services/shipment/v2/${trackingCode}`, {
      headers: { 'Token': config.token },
    })
    const data = await res.json()
    if (!data.success) return []
    const order = data.order || {}
    return [
      { status: order.status_text || 'unknown', description: order.status_text || '', timestamp: order.modified || new Date().toISOString() },
    ]
  },

  async cancelShipment(config: { token: string }, trackingCode: string) {
    const res = await fetch(`${GHTK.BASE_URL}/services/shipment/cancel/${trackingCode}`, {
      method: 'POST',
      headers: { 'Token': config.token },
    })
    const data = await res.json()
    return { ok: data.success, message: data.message }
  },
}

// ─── Viettel Post Provider ───
const VTP = {
  BASE_URL: 'https://partner.viettelpost.vn/v2',

  async testConnection(config: { token: string }) {
    try {
      const res = await fetch(`${VTP.BASE_URL}/user/ownerconnect`, {
        method: 'GET',
        headers: { 'Token': config.token },
      })
      return { ok: res.ok, message: res.ok ? 'Kết nối thành công' : 'Token không hợp lệ' }
    } catch {
      return { ok: false, message: 'Không thể kết nối Viettel Post' }
    }
  },

  async calculateFee(config: { token: string }, params: any): Promise<FeeCalculation> {
    const res = await fetch(`${VTP.BASE_URL}/order/getPriceAll`, {
      method: 'POST',
      headers: { 'Token': config.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        SENDER_PROVINCE: params.senderProvince || '',
        SENDER_DISTRICT: params.senderDistrict || '',
        RECEIVER_PROVINCE: params.receiverProvince || '',
        RECEIVER_DISTRICT: params.receiverDistrict || '',
        PRODUCT_WEIGHT: params.weight || 500,
        PRODUCT_TYPE: 'HH', // Hàng hóa
        ORDER_SERVICE: 'VCN', // Nhanh
        MONEY_COLLECTION: params.codAmount || 0,
      }),
    })
    const data = await res.json()
    const cheapest = Array.isArray(data) ? data[0] : data
    return {
      fee: cheapest?.GIA_CUOC || 0,
      estimatedDays: 3,
    }
  },

  async createShipment(config: { token: string }, req: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    const res = await fetch(`${VTP.BASE_URL}/order/createOrder`, {
      method: 'POST',
      headers: { 'Token': config.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ORDER_NUMBER: `VTP-${Date.now()}`,
        SENDER_FULLNAME: req.senderName,
        SENDER_PHONE: req.senderPhone,
        SENDER_ADDRESS: req.senderAddress,
        RECEIVER_FULLNAME: req.receiverName,
        RECEIVER_PHONE: req.receiverPhone,
        RECEIVER_ADDRESS: req.receiverAddress,
        PRODUCT_WEIGHT: req.weight || 500,
        MONEY_COLLECTION: req.codAmount || 0,
        ORDER_PAYMENT: 3, // Receiver pays
        PRODUCT_TYPE: 'HH',
        ORDER_SERVICE: 'VCN',
        ORDER_NOTE: req.notes || '',
      }),
    })
    const data = await res.json()
    if (data.status !== 200) throw new Error(data.message || 'VTP: Lỗi tạo vận đơn')
    return {
      trackingCode: data.data?.ORDER_NUMBER || '',
      carrierOrderCode: data.data?.ORDER_NUMBER || '',
      shippingFee: data.data?.MONEY_TOTAL || 0,
    }
  },

  async getTracking(config: { token: string }, trackingCode: string): Promise<TrackingEvent[]> {
    const res = await fetch(`${VTP.BASE_URL}/order/tracking`, {
      method: 'POST',
      headers: { 'Token': config.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ORDER_NUMBER: trackingCode }),
    })
    const data = await res.json()
    if (!Array.isArray(data.data)) return []
    return data.data.map((e: any) => ({
      status: e.NOTE || '',
      description: e.NOTE || '',
      location: e.LOCATION || '',
      timestamp: e.TIME || new Date().toISOString(),
    }))
  },

  async cancelShipment(config: { token: string }, trackingCode: string) {
    const res = await fetch(`${VTP.BASE_URL}/order/UpdateOrder`, {
      method: 'POST',
      headers: { 'Token': config.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ORDER_NUMBER: trackingCode, STATUS: 4 }),
    })
    const data = await res.json()
    return { ok: data.status === 200, message: data.message }
  },
}

// ─── Manual Provider (no external API) ───
const ManualProvider = {
  async testConnection() { return { ok: true, message: 'Thủ công — luôn sẵn sàng' } },
  async calculateFee(): Promise<FeeCalculation> { return { fee: 0, estimatedDays: 1 } },
  async createShipment(_: any, req: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    return {
      trackingCode: `MANUAL-${Date.now()}`,
      carrierOrderCode: `MANUAL-${Date.now()}`,
      shippingFee: 0,
    }
  },
  async getTracking(): Promise<TrackingEvent[]> { return [] },
  async cancelShipment() { return { ok: true, message: 'Đã hủy' } },
}

// ─── Provider Registry ───
const providers: Record<string, any> = {
  ghn: GHN,
  ghtk: GHTK,
  viettel_post: VTP,
  manual: ManualProvider,
}

// ─── Public API ───
export default class ShippingService {
  /** Get carrier config from shop */
  static async getShopConfig(shopId: number) {
    const shop = await ShopSchema.find(shopId)
    if (!shop) throw new Error('Shop not found')
    return {
      shippingConfig: shop.shippingConfig || {},
      defaultCarrier: shop.defaultCarrier || 'manual',
      senderName: shop.senderName || '',
      senderPhone: shop.senderPhone || '',
      senderAddress: shop.senderAddress || '',
    }
  }

  /** Save carrier config for shop */
  static async saveShopConfig(shopId: number, data: {
    shippingConfig?: Record<string, any>
    defaultCarrier?: string
    senderName?: string
    senderPhone?: string
    senderAddress?: string
  }) {
    const shop = await ShopSchema.find(shopId)
    if (!shop) throw new Error('Shop not found')
    if (data.shippingConfig !== undefined) shop.shippingConfig = data.shippingConfig
    if (data.defaultCarrier) shop.defaultCarrier = data.defaultCarrier
    if (data.senderName !== undefined) shop.senderName = data.senderName
    if (data.senderPhone !== undefined) shop.senderPhone = data.senderPhone
    if (data.senderAddress !== undefined) shop.senderAddress = data.senderAddress
    await shop.save()
    return shop
  }

  /** Test carrier connection */
  static async testConnection(carrier: string, config: Record<string, any>) {
    const provider = providers[carrier]
    if (!provider) return { ok: false, message: `Không hỗ trợ: ${carrier}` }
    try {
      return await provider.testConnection(config)
    } catch (err: any) {
      return { ok: false, message: `Lỗi: ${err.message}` }
    }
  }

  /** Calculate shipping fee */
  static async calculateFee(shopId: number, carrier: string, params: any) {
    const shopConfig = await this.getShopConfig(shopId)
    const carrierConfig = shopConfig.shippingConfig[carrier] || {}
    const provider = providers[carrier]
    if (!provider) throw new Error(`Không hỗ trợ: ${carrier}`)
    try {
      return await provider.calculateFee(carrierConfig, { ...params, senderProvince: '', senderDistrict: '' })
    } catch (err: any) {
      throw new Error(`Tính phí lỗi: ${err.message}`)
    }
  }

  /** Create shipment on carrier */
  static async createShipment(shopId: number, carrier: string, request: CreateShipmentRequest) {
    if (carrier === 'manual') return ManualProvider.createShipment(null, request)

    const shopConfig = await this.getShopConfig(shopId)
    const carrierConfig = shopConfig.shippingConfig[carrier] || {}
    const provider = providers[carrier]
    if (!provider) throw new Error(`Không hỗ trợ: ${carrier}`)

    // Auto-fill sender from shop config
    const req = {
      ...request,
      senderName: request.senderName || shopConfig.senderName,
      senderPhone: request.senderPhone || shopConfig.senderPhone,
      senderAddress: request.senderAddress || shopConfig.senderAddress,
    }

    return await provider.createShipment(carrierConfig, req)
  }

  /** Get tracking events from carrier */
  static async getTracking(shopId: number, carrier: string, trackingCode: string): Promise<TrackingEvent[]> {
    if (carrier === 'manual') return []
    const shopConfig = await this.getShopConfig(shopId)
    const carrierConfig = shopConfig.shippingConfig[carrier] || {}
    const provider = providers[carrier]
    if (!provider) return []
    try {
      return await provider.getTracking(carrierConfig, trackingCode)
    } catch {
      return []
    }
  }

  /** Cancel shipment on carrier */
  static async cancelShipment(shopId: number, carrier: string, trackingCode: string) {
    if (carrier === 'manual') return { ok: true, message: 'Đã hủy' }
    const shopConfig = await this.getShopConfig(shopId)
    const carrierConfig = shopConfig.shippingConfig[carrier] || {}
    const provider = providers[carrier]
    if (!provider) return { ok: false, message: `Không hỗ trợ: ${carrier}` }
    try {
      return await provider.cancelShipment(carrierConfig, trackingCode)
    } catch (err: any) {
      return { ok: false, message: err.message }
    }
  }

  /** Get list of connected carriers for a shop */
  static async getConnectedCarriers(shopId: number) {
    const config = await this.getShopConfig(shopId)
    const connected: Array<{ key: string; name: string; connected: boolean }> = [
      { key: 'manual', name: 'Thủ công', connected: true },
      { key: 'ghn', name: 'Giao Hàng Nhanh', connected: !!(config.shippingConfig as any)?.ghn?.token },
      { key: 'ghtk', name: 'Giao Hàng Tiết Kiệm', connected: !!(config.shippingConfig as any)?.ghtk?.token },
      { key: 'viettel_post', name: 'Viettel Post', connected: !!(config.shippingConfig as any)?.viettel_post?.token },
    ]
    return connected
  }
}
