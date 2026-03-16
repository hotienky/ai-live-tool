<template>
  <div class="tracking-page container">
    <h1 class="page-title"><Search :size="24" /> Tra cứu đơn hàng</h1>

    <!-- Search Form -->
    <div class="tracking-form" v-if="!orderData">
      <p class="tracking-desc">Nhập số điện thoại và mã đơn hàng để xem trạng thái đơn hàng.</p>
      <div class="search-card">
        <div class="form-row">
          <div class="form-group">
            <label>Số điện thoại</label>
            <input v-model="phone" placeholder="0901234567" required />
          </div>
          <div class="form-group">
            <label>Mã đơn hàng</label>
            <input v-model="orderId" placeholder="VD: 10" required />
          </div>
        </div>
        <button class="btn btn--primary btn--block" @click="trackOrder" :disabled="searching || !phone || !orderId">
          <template v-if="searching">Đang tìm...</template>
          <template v-else><Search :size="16" /> Tra cứu</template>
        </button>
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      </div>
    </div>

    <!-- Order Result -->
    <div v-if="orderData" class="tracking-result">
      <button class="back-btn" @click="orderData = null"><ArrowLeft :size="16" /> Tra cứu đơn khác</button>

      <!-- Status Timeline -->
      <div class="status-timeline">
        <div v-for="(step, i) in statusSteps" :key="step.key"
          class="timeline-step" :class="{ done: step.done, current: step.current }">
          <div class="timeline-dot">
            <CheckCircle v-if="step.done" :size="18" />
            <Clock v-else-if="step.current" :size="18" />
            <Circle v-else :size="18" />
          </div>
          <div class="timeline-label">
            <strong>{{ step.label }}</strong>
            <span v-if="step.date">{{ formatDate(step.date) }}</span>
          </div>
          <div v-if="i < statusSteps.length - 1" class="timeline-line" :class="{ done: step.done }"></div>
        </div>
      </div>

      <!-- Order Info -->
      <div class="result-grid">
        <div class="result-card">
          <h3><Package :size="16" /> Đơn hàng #{{ orderData.id }}</h3>
          <div class="info-rows">
            <div class="info-row"><span>Khách hàng</span><strong>{{ orderData.customer_name }}</strong></div>
            <div class="info-row"><span>Điện thoại</span><strong>{{ orderData.customer_phone }}</strong></div>
            <div class="info-row"><span>Địa chỉ</span><strong>{{ orderData.customer_address }}</strong></div>
            <div class="info-row"><span>Ngày đặt</span><strong>{{ formatDate(orderData.created_at) }}</strong></div>
            <div class="info-row"><span>Phương thức</span><strong>{{ orderData.payment_method === 'bank' ? 'Chuyển khoản' : 'COD' }}</strong></div>
            <div class="info-row"><span>Trạng thái TT</span>
              <span class="badge" :class="'badge--' + (orderData.payment_status || 'pending')">{{ paymentStatusLabel(orderData.payment_status) }}</span>
            </div>
          </div>
          <div class="total-row"><span>Tổng cộng</span><strong class="accent">{{ formatPrice(orderData.total_amount) }}</strong></div>
        </div>

        <!-- Order Details / Items -->
        <div class="result-card" v-if="orderData.details?.length">
          <h3><ShoppingBag :size="16" /> Sản phẩm</h3>
          <div class="items-list">
            <div v-for="item in orderData.details" :key="item.id" class="detail-item">
              <div class="detail-info">
                <strong>{{ item.name }}</strong>
                <span class="detail-meta">{{ item.qty }} × {{ formatPrice(item.price) }}</span>
              </div>
              <span class="detail-total">{{ formatPrice(item.total_price) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bank info if applicable -->
      <div class="result-card bank-card" v-if="orderData.payment_method === 'bank' && orderData.bank_info">
        <h3><Building :size="16" /> Thông tin chuyển khoản</h3>
        <div class="bank-rows">
          <div class="bank-row"><span>Ngân hàng</span><strong>{{ orderData.bank_info.bank_name }}</strong></div>
          <div class="bank-row"><span>Chủ TK</span><strong>{{ orderData.bank_info.account_name }}</strong></div>
          <div class="bank-row"><span>Số TK</span><strong class="mono">{{ orderData.bank_info.account_number }}</strong></div>
          <div class="bank-row"><span>Nội dung CK</span><strong class="mono">{{ orderData.bank_info.note }}</strong></div>
          <div class="bank-row"><span>Số tiền</span><strong class="accent">{{ formatPrice(orderData.total_amount) }}</strong></div>
        </div>
        <div class="qr-section" v-if="vietQrUrl">
          <img :src="vietQrUrl" alt="QR Code" class="qr-img" />
          <p class="qr-hint">Quét mã QR để chuyển khoản - số tiền & nội dung đã điền sẵn</p>
        </div>
      </div>

      <!-- Shipping Tracking Section -->
      <div class="result-card shipping-card">
        <h3><Truck :size="16" /> Vận chuyển</h3>
        <div v-if="shippingLoading" style="text-align:center;padding:20px;color:var(--sf-text-muted)">⏳ Đang tải...</div>
        <div v-else-if="!shippingData || !shippingData.shipment">
          <div class="shipping-empty">
            <Package :size="32" />
            <p>{{ shippingData?.message || 'Đơn hàng chưa được giao cho đơn vị vận chuyển' }}</p>
          </div>
        </div>
        <div v-else>
          <div class="shipping-info">
            <div class="shipping-row">
              <span>Đơn vị vận chuyển</span>
              <strong>{{ carrierLabel(shippingData.carrier) }}</strong>
            </div>
            <div class="shipping-row" v-if="shippingData.tracking_code">
              <span>Mã vận đơn</span>
              <strong class="mono accent">{{ shippingData.tracking_code }}</strong>
            </div>
            <div class="shipping-row">
              <span>Trạng thái</span>
              <span class="badge" :class="'badge--ship-' + shippingData.status">{{ shipStatusLabel(shippingData.status) }}</span>
            </div>
            <div class="shipping-row" v-if="shippingData.shipping_fee > 0">
              <span>Phí vận chuyển</span>
              <strong>{{ formatPrice(shippingData.shipping_fee) }}</strong>
            </div>
            <div class="shipping-row" v-if="shippingData.delivered_at">
              <span>Giao thành công</span>
              <strong>{{ formatDate(shippingData.delivered_at) }}</strong>
            </div>
          </div>

          <!-- Shipment History Timeline -->
          <div v-if="shippingData.history?.length" class="ship-timeline">
            <h4>📋 Lịch sử vận chuyển</h4>
            <div class="ship-timeline-list">
              <div v-for="(evt, i) in shippingData.history" :key="i" class="ship-evt">
                <div class="ship-evt-dot" :class="{ first: i === 0 }"></div>
                <div class="ship-evt-content">
                  <strong>{{ evt.status || evt.event }}</strong>
                  <span>{{ evt.description || evt.note || '' }}</span>
                  <small>{{ formatDate(evt.created_at) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Search, Package, ShoppingBag, ArrowLeft, CheckCircle, Clock, Circle, Building, Truck
} from 'lucide-vue-next'
import { apiFetch } from '../api.js'

const route = useRoute()
const phone = ref(route.query.phone || '')
const orderId = ref(route.query.order_id || '')
const searching = ref(false)
const errorMsg = ref('')
const orderData = ref(null)
const shippingData = ref(null)
const shippingLoading = ref(false)

async function trackOrder() {
  searching.value = true
  errorMsg.value = ''
  try {
    const data = await apiFetch(`/orders/${orderId.value}`, { phone: phone.value })
    if (data && data.id) {
      // Verify phone matches
      if (data.customer_phone !== phone.value) {
        errorMsg.value = 'Số điện thoại không khớp với đơn hàng này'
      } else {
        orderData.value = data
        // Load shipping data
        loadShipping(data.id)
      }
    } else {
      errorMsg.value = 'Không tìm thấy đơn hàng'
    }
  } catch {
    errorMsg.value = 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.'
  }
  searching.value = false
}

async function loadShipping(oid) {
  shippingLoading.value = true
  try {
    shippingData.value = await apiFetch(`/shipment/${oid}`, { phone: phone.value })
  } catch { shippingData.value = null }
  shippingLoading.value = false
}

// Auto-search if query params present
if (phone.value && orderId.value) trackOrder()

const statusFlow = [
  { key: 'pending', label: 'Chờ xác nhận', field: 'created_at' },
  { key: 'confirmed', label: 'Đã xác nhận', field: 'confirmed_at' },
  { key: 'shipped', label: 'Đang giao', field: 'shipped_at' },
  { key: 'delivered', label: 'Đã giao', field: 'delivered_at' },
]

const currentStatusIndex = computed(() => {
  if (!orderData.value) return -1
  const s = orderData.value.status
  if (s === 'cancelled') return -1
  return statusFlow.findIndex(st => st.key === s)
})

const statusSteps = computed(() => {
  const idx = currentStatusIndex.value
  return statusFlow.map((s, i) => ({
    ...s,
    done: i <= idx,
    current: i === idx,
    date: orderData.value?.[s.field] || null,
  }))
})

const paymentStatusMap = {
  pending: 'Chờ xác nhận',
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
}
function paymentStatusLabel(s) { return paymentStatusMap[s] || s }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '' }
function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

const vietQrUrl = computed(() => {
  const d = orderData.value
  if (!d?.bank_info?.bank_bin || !d?.bank_info?.account_number) return ''
  return `https://img.vietqr.io/image/${d.bank_info.bank_bin}-${d.bank_info.account_number}-compact2.png?amount=${Math.round(Number(d.total_amount) || 0)}&addInfo=${encodeURIComponent(d.bank_info.note || '')}&accountName=${encodeURIComponent(d.bank_info.account_name || '')}`
})

const carrierMap = { manual: 'Tự giao', ghn: 'GHN', ghtk: 'GHTK', viettel_post: 'Viettel Post', jt: 'J&T Express', ninja_van: 'Ninja Van', best: 'BEST Express' }
function carrierLabel(c) { return carrierMap[c] || c }

const shipStatusMap = { draft: 'Chờ lấy hàng', picking: 'Đang lấy hàng', picked: 'Đã lấy hàng', delivering: 'Đang giao', delivered: 'Đã giao', returned: 'Hoàn hàng', cancelled: 'Đã hủy' }
function shipStatusLabel(s) { return shipStatusMap[s] || s }
</script>

<style scoped>
.tracking-page { padding: 32px 20px 80px; max-width: 800px; margin: 0 auto; }
.page-title { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 900; margin-bottom: 8px; }
.tracking-desc { color: var(--sf-text-muted, #888); margin-bottom: 24px; font-size: 15px; }

.search-card {
  background: var(--sf-bg-card, #fff); border: 1px solid var(--sf-border, #e5e7eb);
  border-radius: 16px; padding: 24px;
}
.form-row { display: flex; gap: 12px; margin-bottom: 16px; }
.form-row .form-group { flex: 1; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--sf-text-muted); margin-bottom: 6px; }
.form-group input {
  width: 100%; padding: 12px 16px; border: 1px solid var(--sf-border);
  border-radius: 10px; font-size: 15px; outline: none;
  background: var(--sf-bg-secondary, #fafafa); color: var(--sf-text-primary, #333);
  box-sizing: border-box;
}
.form-group input:focus { border-color: var(--sf-accent, #7c3aed); box-shadow: 0 0 0 3px rgba(124,58,237,.1); }

.btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border: none; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; text-decoration: none; transition: all .2s; }
.btn--primary { background: var(--sf-accent, #7c3aed); color: #fff; }
.btn--primary:hover:not(:disabled) { opacity: .9; }
.btn--primary:disabled { opacity: .5; cursor: not-allowed; }
.btn--block { width: 100%; }
.error-msg { color: #ef4444; font-size: 14px; margin-top: 12px; text-align: center; }

.back-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;
  border: 1px solid var(--sf-border); border-radius: 8px;
  background: transparent; color: var(--sf-text-muted);
  font-size: 13px; cursor: pointer; margin-bottom: 20px;
}
.back-btn:hover { border-color: var(--sf-accent); color: var(--sf-accent); }

/* Status Timeline */
.status-timeline {
  display: flex; align-items: flex-start; justify-content: center;
  padding: 24px 0; gap: 0; margin-bottom: 24px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: 16px; padding: 28px 32px;
}
.timeline-step {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  position: relative; min-width: 100px;
}
.timeline-dot {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--sf-bg-secondary); color: var(--sf-text-muted);
  border: 2px solid var(--sf-border);
  transition: all .3s;
}
.timeline-step.done .timeline-dot { background: #10b981; color: #fff; border-color: #10b981; }
.timeline-step.current .timeline-dot { background: var(--sf-accent); color: #fff; border-color: var(--sf-accent); animation: pulse 2s infinite; }
.timeline-label { text-align: center; }
.timeline-label strong { display: block; font-size: 12px; color: var(--sf-text-primary); }
.timeline-label span { font-size: 11px; color: var(--sf-text-muted); }
.timeline-line {
  position: absolute; top: 18px; left: calc(50% + 24px);
  width: calc(100% - 24px); height: 2px;
  background: var(--sf-border);
}
.timeline-line.done { background: #10b981; }

@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,.4); } 50% { box-shadow: 0 0 0 8px rgba(124,58,237,0); } }

/* Result Grid */
.result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.result-card {
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: 16px; padding: 20px;
}
.result-card h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; margin: 0 0 16px; }
.result-card h3 svg { color: var(--sf-accent); }
.info-rows { display: flex; flex-direction: column; gap: 8px; }
.info-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--sf-text-muted); }
.info-row strong { color: var(--sf-text-primary); font-weight: 600; }
.total-row { display: flex; justify-content: space-between; font-size: 15px; padding-top: 12px; margin-top: 12px; border-top: 1px solid var(--sf-border); }
.accent { color: var(--sf-accent, #7c3aed) !important; font-weight: 800 !important; }
.mono { font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 1px; }

.badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #fff; }
.badge--pending { background: #fbbf24; color: #92400e; }
.badge--unpaid { background: #ef4444; }
.badge--paid { background: #10b981; }

/* Items */
.items-list { display: flex; flex-direction: column; gap: 8px; }
.detail-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--sf-border); }
.detail-item:last-child { border-bottom: none; }
.detail-info strong { display: block; font-size: 13px; }
.detail-meta { font-size: 12px; color: var(--sf-text-muted); }
.detail-total { font-weight: 700; font-size: 14px; color: var(--sf-accent); }

/* Bank Card */
.bank-card { border-color: rgba(124,58,237,.2); }
.bank-rows { display: flex; flex-direction: column; gap: 8px; }
.bank-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--sf-text-muted); }
.bank-row strong { color: var(--sf-text-primary); }

.qr-section { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--sf-border); }
.qr-img { width: 220px; height: auto; border-radius: 12px; background: #fff; padding: 8px; border: 1px solid var(--sf-border); }
.qr-hint { font-size: 11px; color: var(--sf-text-muted); margin-top: 8px; }
/* Shipping Card */
.shipping-card { grid-column: 1 / -1; }
.shipping-empty { text-align: center; padding: 24px; color: var(--sf-text-muted); }
.shipping-empty p { margin: 8px 0 0; font-size: 14px; }
.shipping-info { display: flex; flex-direction: column; gap: 10px; }
.shipping-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--sf-text-muted); }
.shipping-row strong { color: var(--sf-text-primary); font-weight: 600; }

.badge--ship-draft { background: #94a3b8; }
.badge--ship-picking { background: #f59e0b; color: #78350f; }
.badge--ship-picked { background: #3b82f6; }
.badge--ship-delivering { background: #8b5cf6; }
.badge--ship-delivered { background: #10b981; }
.badge--ship-returned { background: #ef4444; }
.badge--ship-cancelled { background: #6b7280; }

.ship-timeline { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--sf-border); }
.ship-timeline h4 { margin: 0 0 14px; font-size: 14px; }
.ship-timeline-list { position: relative; padding-left: 24px; }
.ship-evt { position: relative; padding-bottom: 16px; }
.ship-evt:last-child { padding-bottom: 0; }
.ship-evt::before {
  content: ''; position: absolute; left: -18px; top: 8px; bottom: -8px;
  width: 2px; background: var(--sf-border);
}
.ship-evt:last-child::before { display: none; }
.ship-evt-dot {
  position: absolute; left: -22px; top: 4px;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--sf-border); border: 2px solid var(--sf-bg-card);
}
.ship-evt-dot.first { background: var(--sf-accent); }
.ship-evt-content { display: flex; flex-direction: column; gap: 2px; }
.ship-evt-content strong { font-size: 13px; color: var(--sf-text-primary); }
.ship-evt-content span { font-size: 12px; color: var(--sf-text-muted); }
.ship-evt-content small { font-size: 11px; color: var(--sf-text-muted); opacity: 0.7; }

@media (max-width: 640px) {
  .form-row { flex-direction: column; }
  .result-grid { grid-template-columns: 1fr; }
  .status-timeline { flex-wrap: wrap; gap: 16px; }
  .timeline-line { display: none; }
}
</style>
