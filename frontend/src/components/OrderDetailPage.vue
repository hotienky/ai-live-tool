<template>
  <div class="od-page">
    <!-- Back Nav -->
    <div class="od-back" @click="goBack">
      <ArrowLeft :size="16" /> Quay lại danh sách đơn hàng
    </div>

    <!-- Loading -->
    <div v-if="loading" class="od-loading">{{ t('admin.msg_9eaf4e74', 'Đang tải đơn hàng...') }}</div>

    <template v-else-if="order">
      <!-- Header -->
      <div class="od-header">
        <div class="od-header__left">
          <h2>Đơn hàng #{{ order.id }}</h2>
          <span class="od-badge" :class="'od-badge--' + order.status">{{ statusLabels[order.status] || order.status }}</span>
          <span class="od-badge" :class="'od-badge--pay-' + order.paymentStatus">{{ paymentLabels[order.paymentStatus] || order.paymentStatus }}</span>
        </div>
        <div class="od-header__right">
          <button class="od-btn" @click="printInvoice"><Printer :size="14" /> {{ t('admin.msg_a026a3cb', 'In hóa đơn') }}</button>
          <button v-if="order.status === 'pending'" class="od-btn od-btn--primary" @click="updateStatus('confirmed')"><CheckCircle :size="14" /> {{ t('admin.msg_1e2eb2de', 'Xác nhận') }}</button>
          <button v-if="order.status === 'confirmed'" class="od-btn od-btn--primary" @click="$emit('create-shipment', order.id)"><Send :size="14" /> {{ t('admin.msg_cbfa8f47', 'Tạo vận đơn') }}</button>
          <button v-if="order.status === 'confirmed'" class="od-btn od-btn--ship" @click="updateStatus('shipping')"><Truck :size="14" /> {{ t('admin.msg_0cc68993', 'Giao hàng') }}</button>
          <button v-if="order.status === 'shipping'" class="od-btn od-btn--success" @click="updateStatus('delivered')"><Package :size="14" /> {{ t('admin.msg_fb72b8a4', 'Đã giao') }}</button>
          <button v-if="order.status !== 'cancelled' && order.status !== 'delivered'" class="od-btn od-btn--danger" @click="updateStatus('cancelled')"><XCircle :size="14" /> {{ t('admin.msg_380ade01', 'Hủy đơn') }}</button>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="od-grid">
        <!-- Left Column -->
        <div class="od-col-left">
          <!-- Products -->
          <div class="od-card">
            <div class="od-card__header">
              <h3><ShoppingBag :size="16" /> Sản phẩm ({{ items.length }})</h3>
            </div>
            <div class="od-card__body" v-if="items.length">
              <div class="od-item" v-for="item in items" :key="item.id">
                <div class="od-item__img">
                  <img v-if="item.image" :src="item.image" :alt="item.name" />
                  <div v-else class="od-item__img-placeholder"><Package :size="20" /></div>
                </div>
                <div class="od-item__info">
                  <div class="od-item__name">{{ item.name }}</div>
                  <div class="od-item__meta">
                    <span v-if="item.sku" class="od-item__sku">SKU: {{ item.sku }}</span>
                    <span v-if="item.variant_name">{{ item.variant_name }}</span>
                  </div>
                </div>
                <div class="od-item__qty">x{{ item.qty }}</div>
                <div class="od-item__price">{{ formatCurrency(item.price) }}</div>
                <div class="od-item__total">{{ formatCurrency(item.total_price || (item.price * item.qty)) }}</div>
              </div>
            </div>
            <div class="od-card__body od-empty" v-else>
              <ShoppingBag :size="32" class="od-empty__icon" />
              <p>{{ t('admin.msg_e44c91a9', 'Không có sản phẩm') }}</p>
            </div>
          </div>

          <!-- Payment Breakdown -->
          <div class="od-card">
            <div class="od-card__header">
              <h3><CreditCard :size="16" /> {{ t('admin.msg_df3690c5', 'Chi tiết thanh toán') }}</h3>
            </div>
            <div class="od-card__body">
              <div class="od-totals">
                <div class="od-totals__row" v-if="order.subtotal">
                  <span>{{ t('admin.subtotal', 'Tạm tính') }}</span>
                  <span>{{ formatCurrency(order.subtotal) }}</span>
                </div>
                <div class="od-totals__row" v-if="order.discountAmount > 0">
                  <span>{{ t('admin.msg_6b272d01', 'Giảm giá') }}</span>
                  <span class="od-text--discount">-{{ formatCurrency(order.discountAmount) }}</span>
                </div>
                <div class="od-totals__row" v-if="order.shippingFee > 0">
                  <span>{{ t('admin.shipping_fee', 'Phí vận chuyển') }}</span>
                  <span>{{ formatCurrency(order.shippingFee) }}</span>
                </div>
                <div class="od-totals__row" v-if="order.taxAmount > 0">
                  <span>{{ t('admin.msg_500aedd2', 'Thuế') }}</span>
                  <span>{{ formatCurrency(order.taxAmount) }}</span>
                </div>
                <!-- Extra totals from order_totals table -->
                <template v-for="t in totals" :key="t.id">
                  <div class="od-totals__row" v-if="t.code !== 'total'">
                    <span>{{ t.title }}</span>
                    <span>{{ formatCurrency(t.value) }}</span>
                  </div>
                </template>
                <div class="od-totals__row od-totals__row--total">
                  <span>{{ t('admin.total_payment', 'Tổng thanh toán') }}</span>
                  <span>{{ formatCurrency(order.totalAmount) }}</span>
                </div>
              </div>

              <!-- Payment Actions -->
              <div class="od-pay-actions" v-if="order.paymentStatus !== 'refunded'">
                <button v-if="order.paymentStatus === 'unpaid'" class="od-btn od-btn--success od-btn--full" @click="updatePayment('paid')">
                  <DollarSign :size="14" /> Xác nhận đã thanh toán
                </button>
                <button v-if="order.paymentStatus === 'paid'" class="od-btn od-btn--danger od-btn--full" @click="updatePayment('refunded')">
                  <RotateCcw :size="14" /> Hoàn tiền
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="od-col-right">
          <!-- Customer Info -->
          <div class="od-card">
            <div class="od-card__header">
              <h3><User :size="16" /> {{ t('admin.msg_1d20cfc4', 'Thông tin khách hàng') }}</h3>
            </div>
            <div class="od-card__body">
              <div class="od-info-row">
                <span class="od-info-label">{{ t('admin.msg_0caa5ce1', 'Khách hàng') }}</span>
                <span class="od-info-value">{{ order.customerName || '—' }}</span>
              </div>
              <div class="od-info-row">
                <span class="od-info-label">{{ t('admin.phone', 'Số điện thoại') }}</span>
                <span class="od-info-value">{{ order.customerPhone || '—' }}</span>
              </div>
              <div class="od-info-row">
                <span class="od-info-label">Email</span>
                <span class="od-info-value">{{ order.customerEmail || '—' }}</span>
              </div>
              <div class="od-info-row">
                <span class="od-info-label">{{ t('admin.address', 'Địa chỉ') }}</span>
                <span class="od-info-value">{{ order.customerAddress || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Order Info -->
          <div class="od-card">
            <div class="od-card__header">
              <h3><FileText :size="16" /> {{ t('admin.msg_9fb34cdb', 'Thông tin đơn hàng') }}</h3>
            </div>
            <div class="od-card__body">
              <div class="od-info-row">
                <span class="od-info-label">{{ t('admin.order_code', 'Mã đơn') }}</span>
                <span class="od-info-value od-info-value--mono">#{{ order.id }}</span>
              </div>
              <div class="od-info-row">
                <span class="od-info-label">{{ t('admin.created_at', 'Ngày tạo') }}</span>
                <span class="od-info-value">{{ formatDate(order.createdAt || order.created_at) }}</span>
              </div>
              <div class="od-info-row" v-if="order.confirmedAt || order.confirmed_at">
                <span class="od-info-label">{{ t('admin.confirm', 'Xác nhận') }}</span>
                <span class="od-info-value">{{ formatDate(order.confirmedAt || order.confirmed_at) }}</span>
              </div>
              <div class="od-info-row" v-if="order.shippedAt || order.shipped_at">
                <span class="od-info-label">{{ t('admin.msg_0cc68993', 'Giao hàng') }}</span>
                <span class="od-info-value">{{ formatDate(order.shippedAt || order.shipped_at) }}</span>
              </div>
              <div class="od-info-row" v-if="order.deliveredAt || order.delivered_at">
                <span class="od-info-label">{{ t('admin.delivered', 'Đã giao') }}</span>
                <span class="od-info-value">{{ formatDate(order.deliveredAt || order.delivered_at) }}</span>
              </div>
              <div class="od-info-row" v-if="order.notes">
                <span class="od-info-label">{{ t('admin.notes', 'Ghi chú') }}</span>
                <span class="od-info-value">{{ order.notes }}</span>
              </div>
              <div class="od-info-row" v-if="order.couponCode || order.coupon_code">
                <span class="od-info-label">{{ t('admin.coupons', 'Mã giảm giá') }}</span>
                <span class="od-info-value od-info-value--mono">{{ order.couponCode || order.coupon_code }}</span>
              </div>
            </div>
          </div>

          <!-- Shipping Info -->
          <div class="od-card" v-if="order.shippingMethod || order.shipping_method || order.trackingNumber || order.tracking_number">
            <div class="od-card__header">
              <h3><Truck :size="16" /> {{ t('admin.msg_76776039', 'Vận chuyển') }}</h3>
            </div>
            <div class="od-card__body">
              <div class="od-info-row" v-if="order.shippingMethod || order.shipping_method">
                <span class="od-info-label">{{ t('admin.msg_64d47504', 'Đơn vị') }}</span>
                <span class="od-info-value">{{ order.shippingMethod || order.shipping_method }}</span>
              </div>
              <div class="od-info-row" v-if="order.trackingNumber || order.tracking_number">
                <span class="od-info-label">{{ t('admin.tracking_code', 'Mã vận đơn') }}</span>
                <span class="od-info-value od-info-value--mono">{{ order.trackingNumber || order.tracking_number }}</span>
              </div>
            </div>
          </div>

          <!-- History Timeline -->
          <div class="od-card">
            <div class="od-card__header">
              <h3><Clock :size="16" /> {{ t('admin.msg_3061f544', 'Lịch sử') }}</h3>
            </div>
            <div class="od-card__body" v-if="history.length">
              <div class="od-timeline">
                <div class="od-timeline__item" v-for="h in history" :key="h.id">
                  <div class="od-timeline__dot"></div>
                  <div class="od-timeline__content">
                    <div class="od-timeline__text">{{ h.content }}</div>
                    <div class="od-timeline__time">{{ formatDate(h.add_date || h.addDate || h.created_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="od-card__body od-empty" v-else>
              <p>{{ t('admin.msg_03d58f64', 'Chưa có lịch sử') }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="od-loading">{{ t('admin.msg_8fad60d3', 'Không tìm thấy đơn hàng') }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import {
  ArrowLeft, Package, ShoppingBag, CreditCard, User, FileText, Truck, Clock,
  CheckCircle, Send, XCircle, Printer, DollarSign, RotateCcw
} from 'lucide-vue-next'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()

const props = defineProps({
  orderId: { type: [String, Number], required: true },
})
const emit = defineEmits(['back', 'create-shipment'])

const loading = ref(true)
const order = ref(null)
const items = ref([])
const totals = ref([])
const history = ref([])

const statusLabels = {
  pending: t('admin.msg_d0f4e750', 'Chờ xác nhận'), confirmed: t('admin.msg_c6de124c', 'Đã xác nhận'), processing: t('admin.msg_0f0c3d2a', 'Đang xử lý'),
  shipping: t('admin.msg_e61e15e1', 'Đang giao'), delivered: t('admin.msg_fb72b8a4', 'Đã giao'), cancelled: t('admin.msg_1a46e024', 'Đã hủy'),
}
const paymentLabels = { unpaid: t('admin.msg_956718c7', 'Chưa thanh toán'), paid: t('admin.msg_0c9c7bc3', 'Đã thanh toán'), refunded: t('admin.msg_12add562', 'Đã hoàn tiền') }

// formatCurrency from useI18n
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function normalizeOrder(raw) {
  return {
    id: raw.id,
    status: raw.status,
    paymentStatus: raw.payment_status || raw.paymentStatus,
    paymentMethod: raw.payment_method || raw.paymentMethod,
    customerName: raw.customer_name || raw.customerName || '',
    customerPhone: raw.customer_phone || raw.customerPhone || '',
    customerEmail: raw.customer_email || raw.customerEmail || '',
    customerAddress: raw.customer_address || raw.customerAddress || '',
    subtotal: raw.subtotal || 0,
    totalAmount: raw.total_amount || raw.totalAmount || 0,
    discountAmount: raw.discount_amount || raw.discountAmount || 0,
    shippingFee: raw.shipping_fee || raw.shippingFee || 0,
    taxAmount: raw.tax_amount || raw.taxAmount || 0,
    notes: raw.notes || '',
    couponCode: raw.coupon_code || raw.couponCode || '',
    shippingMethod: raw.shipping_method || raw.shippingMethod || '',
    trackingNumber: raw.tracking_number || raw.trackingNumber || '',
    confirmedAt: raw.confirmed_at,
    shippedAt: raw.shipped_at,
    deliveredAt: raw.delivered_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

async function loadOrder() {
  loading.value = true
  try {
    const res = await apiFetch(`/orders/${props.orderId}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const raw = json.data || json
    order.value = normalizeOrder(raw)

    const [detailsRes, totalsRes, historyRes] = await Promise.allSettled([
      apiFetch(`/orders/${props.orderId}/details`),
      apiFetch(`/orders/${props.orderId}/totals`),
      apiFetch(`/orders/${props.orderId}/history`),
    ])
    if (detailsRes.status === 'fulfilled' && detailsRes.value.ok) {
      const d = await detailsRes.value.json()
      items.value = Array.isArray(d) ? d : (d.data || [])
    }
    if (totalsRes.status === 'fulfilled' && totalsRes.value.ok) {
      const t = await totalsRes.value.json()
      totals.value = Array.isArray(t) ? t : (t.data || [])
    }
    if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
      const h = await historyRes.value.json()
      history.value = Array.isArray(h) ? h : (h.data || [])
    }
  } catch (err) {
    console.error('Failed to load order:', err)
    order.value = null
  } finally {
    loading.value = false
  }
}

async function updateStatus(newStatus) {
  if (newStatus === 'cancelled' && !confirm(t('admin.msg_0ac73757', 'Bạn có chắc muốn hủy đơn này?'))) return
  try {
    const res = await apiFetch(`/orders/${props.orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    order.value = data.data || data
    showToast?.(t('admin.msg_0575df04', 'Cập nhật trạng thái thành công'), 'success')
    loadOrder()
  } catch (err) {
    showToast?.(t('admin.msg_98cd02e4', 'Cập nhật thất bại: ') + err.message, 'error')
  }
}

async function updatePayment(newStatus) {
  try {
    const res = await apiFetch(`/orders/${props.orderId}/payment`, {
      method: 'PUT',
      body: JSON.stringify({ payment_status: newStatus }),
    })
    const data = await res.json()
    order.value = data.data || data
    showToast?.(`Đã cập nhật thanh toán: ${paymentLabels[newStatus]}`, 'success')
    loadOrder()
  } catch (err) {
    showToast?.(t('admin.msg_e009e9b3', 'Cập nhật thất bại'), 'error')
  }
}

function printInvoice() {
  window.open(`/api/invoices/order/${props.orderId}/pdf`, '_blank')
}

function goBack() {
  emit('back')
}

onMounted(loadOrder)
</script>

<style scoped>
.od-page { padding: 24px; overflow-y: auto; height: 100%; }

/* Back Link */
.od-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--color-text-muted);
  cursor: pointer; margin-bottom: 16px; transition: color 0.2s;
}
.od-back:hover { color: var(--color-accent-primary); }

/* Header */
.od-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 24px;
}
.od-header__left { display: flex; align-items: center; gap: 10px; }
.od-header__left h2 { margin: 0; font-size: 20px; font-weight: 800; color: var(--color-text-primary); }
.od-header__right { display: flex; gap: 8px; flex-wrap: wrap; }

/* Badges */
.od-badge {
  display: inline-flex; padding: 3px 10px; border-radius: 8px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.2px;
}
.od-badge--pending { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.od-badge--confirmed { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.od-badge--processing { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
.od-badge--shipping { background: rgba(14, 165, 233, 0.12); color: #0ea5e9; }
.od-badge--delivered { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.od-badge--cancelled { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.od-badge--pay-unpaid { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.od-badge--pay-paid { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.od-badge--pay-refunded { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }

/* Grid Layout */
.od-grid {
  display: grid; grid-template-columns: 1fr 360px; gap: 20px;
}
@media (max-width: 900px) {
  .od-grid { grid-template-columns: 1fr; }
}
.od-col-left { display: flex; flex-direction: column; gap: 20px; }
.od-col-right { display: flex; flex-direction: column; gap: 20px; }

/* Cards */
.od-card {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 14px; overflow: hidden;
}
.od-card__header {
  padding: 14px 20px; border-bottom: 1px solid var(--color-border);
}
.od-card__header h3 {
  margin: 0; font-size: 14px; font-weight: 700;
  display: flex; align-items: center; gap: 8px; color: var(--color-text-primary);
}
.od-card__body { padding: 16px 20px; }

/* Product Items */
.od-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid var(--color-border);
}
.od-item:last-child { border-bottom: none; }
.od-item__img { width: 48px; height: 48px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
.od-item__img img { width: 100%; height: 100%; object-fit: cover; }
.od-item__img-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-elevated); color: var(--color-text-muted);
}
.od-item__info { flex: 1; min-width: 0; }
.od-item__name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.od-item__meta { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; display: flex; gap: 8px; }
.od-item__sku { background: var(--color-bg-elevated); padding: 1px 6px; border-radius: 4px; }
.od-item__qty { font-size: 13px; color: var(--color-text-muted); font-weight: 600; white-space: nowrap; }
.od-item__price { font-size: 13px; color: var(--color-text-secondary); white-space: nowrap; }
.od-item__total { font-size: 13px; font-weight: 700; color: var(--color-text-primary); white-space: nowrap; }

/* Totals */
.od-totals { display: flex; flex-direction: column; }
.od-totals__row {
  display: flex; justify-content: space-between; padding: 8px 0;
  font-size: 13px; color: var(--color-text-secondary);
  border-bottom: 1px dashed var(--color-border);
}
.od-totals__row:last-child { border-bottom: none; }
.od-totals__row--total {
  border-top: 2px solid var(--color-border); border-bottom: none;
  margin-top: 8px; padding-top: 12px;
  font-size: 16px; font-weight: 800; color: var(--color-text-primary);
}
.od-totals__row--total span:last-child { color: #34d399; }
.od-text--discount { color: #ef4444; font-weight: 600; }

.od-pay-actions { margin-top: 16px; }

/* Info Rows */
.od-info-row {
  display: flex; justify-content: space-between; gap: 12px;
  padding: 8px 0; font-size: 13px;
  border-bottom: 1px solid var(--color-border);
}
.od-info-row:last-child { border-bottom: none; }
.od-info-label { color: var(--color-text-muted); font-weight: 600; white-space: nowrap; }
.od-info-value { color: var(--color-text-primary); text-align: right; word-break: break-word; }
.od-info-value--mono { font-family: monospace; font-weight: 700; }

/* Timeline */
.od-timeline { display: flex; flex-direction: column; gap: 0; }
.od-timeline__item {
  display: flex; gap: 12px; padding: 10px 0;
  position: relative;
}
.od-timeline__item::before {
  content: ''; position: absolute; left: 5px; top: 30px; bottom: -10px;
  width: 1px; background: var(--color-border);
}
.od-timeline__item:last-child::before { display: none; }
.od-timeline__dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--color-accent-primary); flex-shrink: 0; margin-top: 4px;
}
.od-timeline__content { flex: 1; }
.od-timeline__text { font-size: 13px; color: var(--color-text-primary); }
.od-timeline__time { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }

/* Buttons */
.od-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); cursor: pointer; transition: all 0.25s;
}
.od-btn:hover { border-color: var(--color-border-hover); transform: translateY(-1px); }
.od-btn--primary { background: var(--accent-gradient); color: #fff; border: none; box-shadow: var(--accent-shadow); }
.od-btn--success { background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; }
.od-btn--danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
.od-btn--danger:hover { background: rgba(239, 68, 68, 0.2); }
.od-btn--ship { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #fff; border: none; }
.od-btn--full { width: 100%; justify-content: center; }

/* Empty States */
.od-empty { text-align: center; padding: 32px 20px; color: var(--color-text-muted); }
.od-empty__icon { opacity: 0.3; margin-bottom: 8px; }
.od-empty p { font-size: 13px; margin: 0; }

.od-loading { text-align: center; padding: 64px; color: var(--color-text-muted); font-size: 14px; }
</style>
