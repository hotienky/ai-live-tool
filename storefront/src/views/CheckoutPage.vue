<template>
  <div class="checkout-page container">
    <!-- Success State -->
    <div v-if="orderSuccess" class="checkout-success">
      <!-- Progress Steps -->
      <div class="success-steps">
        <div class="step done"><span class="step-num">1</span><span class="step-label">Giỏ hàng</span></div>
        <div class="step-line done"></div>
        <div class="step done"><span class="step-num">2</span><span class="step-label">Thanh toán</span></div>
        <div class="step-line done"></div>
        <div class="step done current"><span class="step-num">✓</span><span class="step-label">Hoàn tất</span></div>
      </div>

      <div class="success-content">
        <!-- Success Header -->
        <div class="success-header">
          <div class="success-icon-wrap">
            <CheckCircle :size="56" />
            <div class="success-ring"></div>
          </div>
          <h2>Đặt hàng thành công!</h2>
          <p class="success-order-code">Mã đơn hàng: <strong>#{{ orderData.id }}</strong></p>
        </div>

        <div class="success-grid">
          <!-- Order Info Card -->
          <div class="success-card">
            <h3><Package :size="16" /> Thông tin đơn hàng</h3>
            <div class="info-rows">
              <div class="info-row">
                <span class="info-label">Khách hàng</span>
                <span class="info-value">{{ orderData.customer_name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Điện thoại</span>
                <span class="info-value">{{ orderData.customer_phone }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Địa chỉ</span>
                <span class="info-value">{{ orderData.customer_address }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phương thức</span>
                <span class="info-value">{{ orderData.payment_method === 'bank' ? 'Chuyển khoản' : 'COD' }}</span>
              </div>
              <div class="info-row info-row--total">
                <span class="info-label">Tổng thanh toán</span>
                <span class="info-value info-value--accent">{{ formatPrice(orderData.total_amount) }}</span>
              </div>
            </div>
          </div>

          <!-- Bank Transfer Info (only shown for bank payment) -->
          <div v-if="orderData.payment_method === 'bank' && orderData.bank_info" class="success-card bank-card">
            <h3><Building :size="16" /> Thông tin chuyển khoản</h3>
            <div class="bank-warning">
              <AlertTriangle :size="14" />
              <span>Vui lòng chuyển khoản trong vòng <strong>24 giờ</strong> để đơn hàng được xử lý</span>
            </div>
            <div class="bank-fields">
              <div class="bank-field">
                <span class="bank-field__label">Ngân hàng</span>
                <div class="bank-field__row">
                  <span class="bank-field__value">{{ orderData.bank_info.bank_name }}</span>
                </div>
              </div>
              <div class="bank-field">
                <span class="bank-field__label">Chi nhánh</span>
                <div class="bank-field__row">
                  <span class="bank-field__value">{{ orderData.bank_info.branch }}</span>
                </div>
              </div>
              <div class="bank-field">
                <span class="bank-field__label">Chủ tài khoản</span>
                <div class="bank-field__row">
                  <span class="bank-field__value highlight">{{ orderData.bank_info.account_name }}</span>
                  <button class="copy-btn" @click="copyText(orderData.bank_info.account_name)" title="Sao chép">
                    <Copy :size="13" />
                  </button>
                </div>
              </div>
              <div class="bank-field">
                <span class="bank-field__label">Số tài khoản</span>
                <div class="bank-field__row">
                  <span class="bank-field__value highlight mono">{{ orderData.bank_info.account_number }}</span>
                  <button class="copy-btn" @click="copyText(orderData.bank_info.account_number)" title="Sao chép">
                    <Copy :size="13" />
                  </button>
                </div>
              </div>
              <div class="bank-field">
                <span class="bank-field__label">Số tiền</span>
                <div class="bank-field__row">
                  <span class="bank-field__value highlight accent">{{ formatPrice(orderData.total_amount) }}</span>
                  <button class="copy-btn" @click="copyText(String(orderData.total_amount))" title="Sao chép">
                    <Copy :size="13" />
                  </button>
                </div>
              </div>
              <div class="bank-field">
                <span class="bank-field__label">Nội dung chuyển khoản</span>
                <div class="bank-field__row">
                  <span class="bank-field__value highlight mono">{{ orderData.bank_info.note }}</span>
                  <button class="copy-btn" @click="copyText(orderData.bank_info.note)" title="Sao chép">
                    <Copy :size="13" />
                  </button>
                </div>
              </div>
            </div>

            <!-- QR Code -->
            <div class="bank-qr" v-if="vietQrUrl">
              <div class="bank-qr__divider"></div>
              <p class="bank-qr__label"><QrCode :size="14" /> Quét mã QR để chuyển khoản</p>
              <div class="bank-qr__wrap">
                <img :src="vietQrUrl" alt="QR Code chuyển khoản" class="bank-qr__img" />
              </div>
              <p class="bank-qr__hint">Mở app ngân hàng → Quét QR → Số tiền & nội dung đã được điền sẵn</p>
            </div>
          </div>

          <!-- COD Confirmation -->
          <div v-else class="success-card cod-card">
            <h3><Truck :size="16" /> Thanh toán khi nhận hàng</h3>
            <div class="cod-message">
              <div class="cod-icon"><Wallet :size="32" /></div>
              <p>Bạn sẽ thanh toán <strong>{{ formatPrice(orderData.total_amount) }}</strong> khi nhận hàng.</p>
              <p class="cod-sub">Chúng tôi sẽ liên hệ xác nhận đơn hàng trong thời gian sớm nhất.</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="success-actions">
          <router-link to="/products" class="btn btn--primary">
            <ShoppingBag :size="16" /> Tiếp tục mua sắm
          </router-link>
          <router-link to="/order-tracking" class="btn btn--outline">
            <Package :size="16" /> Theo dõi đơn hàng
          </router-link>
        </div>
      </div>
    </div>

    <!-- Checkout Form -->
    <template v-else>
      <h1 class="page-title"><CreditCard :size="24" /> Thanh toán</h1>

      <div v-if="cartItems.length === 0" class="checkout-empty">
        <p>Giỏ hàng trống. <router-link to="/products">Thêm sản phẩm</router-link></p>
      </div>

      <div v-else class="checkout-grid">
        <!-- Form -->
        <div class="checkout-form">
          <div class="form-section">
            <h3><User :size="16" /> Thông tin giao hàng</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Họ tên *</label>
                <input v-model="form.customerName" placeholder="Nguyễn Văn A" required />
              </div>
              <div class="form-group">
                <label>Số điện thoại *</label>
                <input v-model="form.customerPhone" placeholder="0901234567" required />
              </div>
            </div>
            <div class="form-group">
              <label>Địa chỉ giao hàng *</label>
              <input v-model="form.customerAddress" placeholder="123 Đường ABC, Phường X, Quận Y, TP.HCM" required />
            </div>
          </div>

          <div class="form-section">
            <h3><Wallet :size="16" /> Phương thức thanh toán</h3>
            <div class="payment-options">
              <label v-for="m in paymentMethodsList" :key="m.code"
                class="payment-option" :class="{ active: form.paymentMethod === m.code }">
                <input type="radio" v-model="form.paymentMethod" :value="m.code" />
                <Truck v-if="m.code === 'cod'" :size="20" />
                <CreditCard v-else :size="20" />
                <div>
                  <strong>{{ m.name }}</strong>
                  <span>{{ m.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <div class="form-section">
            <h3><FileText :size="16" /> Ghi chú</h3>
            <textarea v-model="form.notes" rows="3" placeholder="Ghi chú thêm cho đơn hàng (không bắt buộc)"></textarea>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="checkout-summary">
          <div class="summary-card">
            <h3>Đơn hàng ({{ cartCount }} sản phẩm)</h3>
            <div class="summary-items">
              <div class="summary-item" v-for="item in cartItems" :key="item.key || item.id">
                <div class="summary-item__img">
                  <img v-if="item.image" :src="item.image" :alt="item.name" />
                  <Package v-else :size="16" />
                </div>
                <div class="summary-item__info">
                  <span class="summary-item__name">{{ item.name }}</span>
                  <span class="summary-item__meta">{{ item.qty }} x {{ formatPrice(item.price) }}</span>
                </div>
                <span class="summary-item__total">{{ formatPrice(item.price * item.qty) }}</span>
              </div>
            </div>

            <div class="summary-totals">
              <div class="total-row"><span>Tạm tính</span><span>{{ formatPrice(cartTotal) }}</span></div>
              <div class="total-row"><span>Phí giao hàng</span><span class="free">Miễn phí</span></div>
              <div class="total-row total-row--grand">
                <span>Tổng thanh toán</span>
                <span>{{ formatPrice(cartTotal) }}</span>
              </div>
            </div>

            <button class="btn btn--primary btn--block btn--lg" @click="placeOrder" :disabled="submitting || !isValid">
              <template v-if="submitting">Đang xử lý...</template>
              <template v-else><ShoppingCart :size="16" /> Đặt hàng — {{ formatPrice(cartTotal) }}</template>
            </button>

            <p v-if="error" class="order-error">{{ error }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CreditCard, User, Truck, FileText, Package, ShoppingCart,
  CheckCircle, ShoppingBag, Home, Wallet, Copy, AlertTriangle, Building, QrCode
} from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'
import { apiFetch, apiPost } from '../api.js'

const route = useRoute()
const router = useRouter()
const { cartItems, cartCount, cartTotal, clearCart } = useCart()

const form = ref({
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  paymentMethod: 'cod',
  notes: '',
})

const submitting = ref(false)
const error = ref('')
const orderSuccess = ref(false)
const orderData = ref({})
const loadingOrder = ref(false)
const paymentMethodsList = ref([
  { code: 'cod', name: 'Thanh toán khi nhận hàng (COD)', description: 'Trả tiền mặt khi nhận hàng' },
  { code: 'bank', name: 'Chuyển khoản ngân hàng', description: 'Thanh toán qua tài khoản ngân hàng' },
])

onMounted(async () => {
  // Check if returning to a completed order (e.g. page reload)
  const orderId = route.query.order_id
  if (orderId) {
    loadingOrder.value = true
    try {
      const data = await apiFetch(`/orders/${orderId}`)
      if (data && data.id) {
        orderData.value = data
        orderSuccess.value = true
      }
    } catch { /* order not found, show form */ }
    loadingOrder.value = false
  }

  // Load payment methods for the form
  try {
    const methods = await apiFetch('/payment-methods')
    if (Array.isArray(methods) && methods.length) {
      paymentMethodsList.value = methods
      form.value.paymentMethod = methods[0].code
    }
  } catch { /* fallback to defaults */ }
})

const isValid = computed(() => {
  return form.value.customerName.trim() && form.value.customerPhone.trim() && form.value.customerAddress.trim()
})

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

function copyText(text) {
  navigator.clipboard.writeText(text)
}

const vietQrUrl = computed(() => {
  const d = orderData.value
  if (!d?.bank_info?.bank_bin || !d?.bank_info?.account_number) return ''
  const bin = d.bank_info.bank_bin
  const acct = d.bank_info.account_number
  const amount = Math.round(Number(d.total_amount) || 0)
  const note = encodeURIComponent(d.bank_info.note || '')
  return `https://img.vietqr.io/image/${bin}-${acct}-compact2.png?amount=${amount}&addInfo=${note}&accountName=${encodeURIComponent(d.bank_info.account_name || '')}`
})

async function placeOrder() {
  if (!isValid.value) { error.value = 'Vui lòng điền đầy đủ thông tin'; return }
  submitting.value = true
  error.value = ''
  try {
    const result = await apiPost('/checkout', {
      customer_name: form.value.customerName,
      customer_phone: form.value.customerPhone,
      customer_address: form.value.customerAddress,
      payment_method: form.value.paymentMethod,
      notes: form.value.notes,
      items: cartItems.value.map(i => ({
        product_id: i.productId,
        variant_id: i.variantId || null,
        name: i.name,
        price: i.price,
        qty: i.qty,
        sku: i.sku,
      })),
    })
    orderData.value = result
    orderSuccess.value = true
    clearCart()
    // Persist order_id in URL so page reload restores success state
    router.replace({ query: { order_id: result.id } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    error.value = 'Đặt hàng thất bại: ' + (err.message || 'Lỗi không xác định')
  }
  submitting.value = false
}
</script>

<style scoped>
.checkout-page { padding-top: 24px; padding-bottom: 80px; }
.page-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 24px; font-weight: 900; margin-bottom: 28px;
}

.checkout-empty { text-align: center; padding: 60px; color: var(--sf-text-muted); }
.checkout-empty a { color: var(--sf-accent-light); }

.checkout-grid { display: grid; grid-template-columns: 1fr 400px; gap: 28px; align-items: start; }

/* Form */
.checkout-form { display: flex; flex-direction: column; gap: 24px; }
.form-section {
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg); padding: 24px;
}
.form-section h3 {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 800; margin: 0 0 20px 0;
}
.form-row { display: flex; gap: 14px; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: 14px; }
.form-group label {
  display: block; font-size: 12px; font-weight: 700;
  color: var(--sf-text-secondary); margin-bottom: 6px;
}
.form-group input, textarea {
  width: 100%; background: var(--sf-bg-secondary);
  border: 1px solid var(--sf-border); color: var(--sf-text-primary);
  padding: 12px 16px; border-radius: var(--sf-radius-sm); font-size: 14px;
  font-family: inherit; outline: none; transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-group input:focus, textarea:focus { border-color: var(--sf-accent); }

/* Payment options */
.payment-options { display: flex; flex-direction: column; gap: 10px; }
.payment-option {
  display: flex; align-items: center; gap: 14px;
  padding: 16px; border-radius: var(--sf-radius-md);
  border: 1px solid var(--sf-border); cursor: pointer;
  transition: all 0.2s; background: var(--sf-bg-secondary);
}
.payment-option:hover { border-color: var(--sf-accent); }
.payment-option.active {
  border-color: var(--sf-accent); background: var(--sf-accent-glow);
}
.payment-option input { display: none; }
.payment-option svg { color: var(--sf-accent-light); flex-shrink: 0; }
.payment-option div { display: flex; flex-direction: column; }
.payment-option strong { font-size: 14px; font-weight: 700; }
.payment-option span { font-size: 12px; color: var(--sf-text-muted); margin-top: 2px; }

/* Summary */
.summary-card {
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg); padding: 24px;
  position: sticky; top: calc(var(--sf-header-height) + 24px);
}
.summary-card h3 { margin: 0 0 16px 0; font-size: 17px; font-weight: 800; }

.summary-items { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.summary-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid var(--sf-border);
}
.summary-item__img {
  width: 44px; height: 44px; border-radius: 8px; overflow: hidden;
  background: var(--sf-bg-secondary); display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  color: var(--sf-text-muted);
}
.summary-item__img img { width: 100%; height: 100%; object-fit: cover; }
.summary-item__info { flex: 1; }
.summary-item__name { display: block; font-size: 13px; font-weight: 600; }
.summary-item__meta { display: block; font-size: 12px; color: var(--sf-text-muted); }
.summary-item__total { font-weight: 800; font-size: 14px; color: var(--sf-accent-light); }

.summary-totals { margin-bottom: 16px; }
.total-row {
  display: flex; justify-content: space-between; padding: 8px 0;
  font-size: 14px; color: var(--sf-text-secondary);
  border-bottom: 1px solid var(--sf-border);
}
.total-row .free { color: #10b981; font-weight: 600; }
.total-row--grand {
  border-bottom: none; margin-top: 8px;
  font-size: 20px; font-weight: 900; color: var(--sf-text-primary);
}
.total-row--grand span:last-child { color: var(--sf-accent-light); }

.btn--block {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 16px; font-size: 16px;
}
.btn--lg:disabled { opacity: 0.5; cursor: not-allowed; }

.order-error {
  color: #ef4444; font-size: 13px; text-align: center; margin-top: 12px;
}

/* ======== SUCCESS STATE ======== */
.checkout-success {
  padding: 32px 0 80px;
}

/* Step Progress */
.success-steps {
  display: flex; align-items: center; justify-content: center;
  gap: 0; margin-bottom: 40px;
}
.step {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  position: relative; z-index: 1;
}
.step-num {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800;
  background: var(--sf-bg-secondary); color: var(--sf-text-muted);
  border: 2px solid var(--sf-border); transition: all 0.3s;
}
.step.done .step-num {
  background: var(--sf-accent); color: #fff;
  border-color: var(--sf-accent); box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}
.step.current .step-num {
  background: #10b981; border-color: #10b981;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.4);
  animation: pulseGreen 2s ease-in-out infinite;
}
.step-label { font-size: 12px; font-weight: 600; color: var(--sf-text-muted); }
.step.done .step-label { color: var(--sf-text-primary); }
.step-line {
  width: 80px; height: 3px; background: var(--sf-border);
  margin: 0 -4px 18px; border-radius: 2px;
}
.step-line.done { background: var(--sf-accent); }

@keyframes pulseGreen {
  0%, 100% { box-shadow: 0 2px 12px rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 2px 20px rgba(16, 185, 129, 0.7); }
}

/* Success Header */
.success-content { max-width: 800px; margin: 0 auto; }
.success-header {
  text-align: center; margin-bottom: 32px;
}
.success-icon-wrap {
  position: relative; display: inline-flex;
  align-items: center; justify-content: center;
  margin-bottom: 16px;
}
.success-icon-wrap svg { color: #10b981; z-index: 1; }
.success-ring {
  position: absolute; inset: -12px; border-radius: 50%;
  border: 3px solid rgba(16, 185, 129, 0.15);
  animation: ringExpand 1.5s ease-out forwards;
}
@keyframes ringExpand {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
.success-header h2 {
  font-size: 28px; font-weight: 900; margin: 0 0 6px 0;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.success-order-code {
  font-size: 15px; color: var(--sf-text-secondary); margin: 0;
}
.success-order-code strong {
  color: var(--sf-accent-light); font-size: 18px;
  -webkit-text-fill-color: var(--sf-accent-light);
}

/* Success Grid */
.success-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
  margin-bottom: 32px;
}

/* Success Card */
.success-card {
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg); padding: 24px;
}
.success-card h3 {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 800; margin: 0 0 16px 0;
  color: var(--sf-text-primary);
}
.success-card h3 svg { color: var(--sf-accent-light); }

/* Info Rows */
.info-rows { display: flex; flex-direction: column; }
.info-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 10px 0; border-bottom: 1px solid var(--sf-border);
  font-size: 13px; gap: 12px;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--sf-text-muted); flex-shrink: 0; }
.info-value { color: var(--sf-text-primary); font-weight: 600; text-align: right; }
.info-row--total { margin-top: 4px; padding-top: 14px; border-top: 2px solid var(--sf-border); }
.info-row--total .info-label { font-size: 15px; font-weight: 800; color: var(--sf-text-primary); }
.info-value--accent { font-size: 18px; font-weight: 900; color: var(--sf-accent-light); }

/* Bank Card */
.bank-card { border-color: rgba(124, 58, 237, 0.3); }
.bank-warning {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 14px; border-radius: 8px;
  background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2);
  color: #d97706; font-size: 12px; line-height: 1.5;
  margin-bottom: 16px;
}
.bank-warning svg { flex-shrink: 0; margin-top: 1px; }
.bank-fields { display: flex; flex-direction: column; gap: 10px; }
.bank-field { }
.bank-field__label {
  font-size: 11px; font-weight: 700; color: var(--sf-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;
}
.bank-field__row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  background: var(--sf-bg-secondary); border: 1px solid var(--sf-border);
}
.bank-field__value {
  flex: 1; font-size: 14px; font-weight: 700; color: var(--sf-text-primary);
}
.bank-field__value.highlight { font-weight: 800; }
.bank-field__value.mono { font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 1px; }
.bank-field__value.accent { color: var(--sf-accent-light); font-size: 16px; }
.copy-btn {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 6px;
  background: var(--sf-accent-glow); border: 1px solid rgba(124, 58, 237, 0.2);
  color: var(--sf-accent-light); cursor: pointer; transition: all 0.2s;
  flex-shrink: 0;
}
.copy-btn:hover {
  background: var(--sf-accent); color: #fff;
  transform: scale(1.05);
}
.copy-btn:active { transform: scale(0.95); }

/* QR Code */
.bank-qr { padding: 0 0 4px; }
.bank-qr__divider {
  height: 1px; background: var(--sf-border); margin: 16px 0 12px;
}
.bank-qr__label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: var(--sf-text-primary);
  margin: 0 0 12px;
}
.bank-qr__label svg { color: var(--sf-accent-light); }
.bank-qr__wrap {
  display: flex; justify-content: center;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--sf-border);
}
.bank-qr__img {
  width: 260px; height: auto;
  border-radius: 8px;
}
.bank-qr__hint {
  font-size: 11px; color: var(--sf-text-muted);
  text-align: center; margin: 10px 0 0;
  line-height: 1.5;
}

/* COD Card */
.cod-card { border-color: rgba(16, 185, 129, 0.3); }
.cod-message {
  text-align: center; padding: 20px 0;
}
.cod-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(16, 185, 129, 0.08);
  color: #10b981; margin-bottom: 12px;
}
.cod-message p { margin: 0 0 6px; font-size: 15px; color: var(--sf-text-secondary); }
.cod-message p strong { color: var(--sf-accent-light); }
.cod-sub { font-size: 13px !important; color: var(--sf-text-muted) !important; }

/* Success Actions */
.success-actions {
  display: flex; gap: 14px; justify-content: center;
}

@media (max-width: 768px) {
  .checkout-grid { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; }
  .success-grid { grid-template-columns: 1fr; }
  .success-steps { gap: 0; }
  .step-line { width: 40px; }
  .success-actions { flex-direction: column; }
  .bank-qr__img { width: 200px; }
}
</style>
