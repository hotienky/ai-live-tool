<template>
  <div class="checkout-page container">
    <!-- Success State -->
    <div v-if="orderSuccess" class="checkout-success">
      <!-- Progress Steps -->
      <div class="success-steps" v-if="checkoutConfig.showSteps">
        <div class="step done"><span class="step-num">1</span><span class="step-label">Giỏ hàng</span></div>
        <div class="step-line done"></div>
        <div class="step done"><span class="step-num">2</span><span class="step-label">Thanh toán</span></div>
        <div class="step-line done"></div>
        <div class="step done current"><span class="step-num"><Check :size="14" /></span><span class="step-label">Hoàn tất</span></div>
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
              <div v-if="orderData.coupon_code" class="info-row">
                <span class="info-label">Mã giảm giá</span>
                <span class="info-value" style="color:#16a34a;font-weight:700">{{ orderData.coupon_code }} (−{{ formatPrice(orderData.discount_amount) }})</span>
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

      <div v-else class="checkout-grid" :class="{ 'checkout-grid--single': checkoutConfig.layout === 'single-column' }">
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
            <div class="form-row">
              <div class="form-group">
                <label>Email (nhận xác nhận đơn)</label>
                <input v-model="form.customerEmail" type="email" placeholder="email@example.com" />
              </div>
            </div>
            <!-- Address Selector (2-level: Province → Ward) -->
            <div class="form-row">
              <div class="form-group">
                <label>Tỉnh/Thành phố *</label>
                <select @change="e => onProvinceChange(e.target.value)" :value="selectedProvince || ''">
                  <option value="" disabled>{{ loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành' }}</option>
                  <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Phường/Xã *</label>
                <select @change="e => onWardChange(e.target.value)" :value="selectedWard || ''" :disabled="!selectedProvince">
                  <option value="" disabled>{{ loadingWards ? 'Đang tải...' : 'Chọn phường/xã' }}</option>
                  <option v-for="w in wards" :key="w.code" :value="w.code">{{ w.name }}</option>
                </select>
              </div>
            </div>
            <div class="form-group address-autocomplete-wrapper">
              <label>Địa chỉ chi tiết *</label>
              <input
                v-model="form.customerAddress"
                placeholder="Số nhà, tên đường..."
                required
                @input="e => searchAddress(e.target.value)"
                @blur="() => setTimeout(() => clearSuggestions(), 200)"
                autocomplete="off"
              />
              <div v-if="loadingSuggestions" class="address-loading">Đang tìm...</div>
              <ul v-if="addressSuggestions.length" class="address-suggestions">
                <li v-for="(s, i) in addressSuggestions" :key="i" @mousedown.prevent="handleSelectSuggestion(s)">
                  {{ s.display }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Shipping Options -->
          <div class="form-section shipping-section" v-if="selectedProvince">
            <h3><Truck :size="16" /> Đơn vị vận chuyển</h3>
            <div v-if="loadingShipping" class="shipping-loading">
              <span class="spinner"></span> Đang tính phí vận chuyển...
            </div>
            <div v-else-if="shippingError" class="shipping-error">
              <AlertTriangle :size="14" /> {{ shippingError }}
            </div>
            <div v-else-if="shippingOptions.length > 0" class="shipping-options">
              <label
                v-for="opt in shippingOptions" :key="opt.provider + '_' + opt.service_code"
                class="shipping-option"
                :class="{ active: selectedShipping?.provider === opt.provider && selectedShipping?.service_code === opt.service_code }"
              >
                <input
                  type="radio" name="shipping"
                  :checked="selectedShipping?.provider === opt.provider && selectedShipping?.service_code === opt.service_code"
                  @change="selectShipping(opt)"
                />
                <div class="shipping-option__info">
                  <strong>{{ opt.provider_name }}</strong>
                  <span class="shipping-option__service">{{ opt.service_name }}</span>
                  <span class="shipping-option__time">{{ opt.estimated_days }}</span>
                </div>
                <span class="shipping-option__fee">{{ formatPrice(opt.fee) }}</span>
              </label>
            </div>
            <div v-else class="shipping-empty">
              <p>Vui lòng chọn đầy đủ địa chỉ để tính phí vận chuyển</p>
            </div>
          </div>

          <!-- Voucher / Coupon -->
          <div class="form-section voucher-section" v-if="checkoutConfig.showCoupon">
            <h3><Tag :size="16" /> Mã giảm giá</h3>
            <div class="voucher-input-row">
              <input
                v-model="couponCode"
                placeholder="Nhập mã giảm giá"
                :disabled="couponApplied || couponLoading"
                class="voucher-input"
                @keyup.enter="applyCoupon"
              />
              <button
                v-if="!couponApplied"
                class="btn btn--accent voucher-apply-btn"
                :disabled="!couponCode.trim() || couponLoading"
                @click="applyCoupon"
              >
                <template v-if="couponLoading">Đang kiểm tra...</template>
                <template v-else>Áp dụng</template>
              </button>
              <button
                v-else
                class="btn btn--outline voucher-remove-btn"
                @click="removeCoupon"
              >
                <X :size="14" /> Xóa
              </button>
            </div>
            <div v-if="couponError" class="voucher-msg voucher-msg--error">
              <AlertTriangle :size="14" /> {{ couponError }}
            </div>
            <div v-if="couponApplied" class="voucher-msg voucher-msg--success">
              <CheckCircle :size="14" />
              Mã <strong>{{ couponCode.toUpperCase() }}</strong> — Giảm <strong>{{ formatPrice(couponDiscount) }}</strong>
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

          <div class="form-section" v-if="checkoutConfig.showNotes">
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
              <div v-if="couponDiscount > 0" class="total-row total-row--discount">
                <span>Giảm giá ({{ couponCode.toUpperCase() }})</span>
                <span>-{{ formatPrice(couponDiscount) }}</span>
              </div>
              <div class="total-row">
                <span>Phí giao hàng</span>
                <span v-if="shippingFee > 0">{{ formatPrice(shippingFee) }}</span>
                <span v-else class="free">{{ selectedProvince ? 'Chọn đơn vị vận chuyển' : 'Chọn địa chỉ trước' }}</span>
              </div>
              <div v-if="taxEnabled && taxAmount > 0" class="total-row">
                <span>{{ taxLabel }} <span v-if="taxDetails.length" style="font-size:11px;opacity:0.7">({{ taxDetails.map(d => d.name).join(', ') }})</span><span v-if="taxInclusive" style="font-size:11px;opacity:0.7;margin-left:4px">(đã gồm trong giá)</span></span>
                <span>{{ formatPrice(taxAmount) }}</span>
              </div>
              <div class="total-row total-row--grand">
                <span>Tổng thanh toán</span>
                <span>{{ formatPrice(finalTotal) }}</span>
              </div>
            </div>

            <button class="btn btn--primary btn--block btn--lg" @click="placeOrder" :disabled="submitting || !isValid">
              <template v-if="submitting">Đang xử lý...</template>
              <template v-else><ShoppingCart :size="16" /> Đặt hàng — {{ formatPrice(finalTotal) }}</template>
            </button>

            <p v-if="error" class="order-error">{{ error }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CreditCard, User, Truck, FileText, Package, ShoppingCart, Check,
  CheckCircle, ShoppingBag, Home, Wallet, Copy, AlertTriangle, Building, QrCode,
  Tag, X, MapPin
} from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'
import { useAuth } from '../composables/useAuth.js'
import { useShipping } from '../composables/useShipping.js'
import { apiFetch, apiPost } from '../api.js'

const layoutConfig = inject('layoutConfig', ref(null))
const checkoutConfig = computed(() => {
  const defaults = { showCoupon: true, showNotes: true, showSteps: true, layout: 'two-column' }
  const cc = layoutConfig.value?.pageConfigs?.checkout
  return cc ? { ...defaults, ...cc } : defaults
})

const route = useRoute()
const router = useRouter()
const { cartItems, cartCount, cartTotal, clearCart } = useCart()
const { customer, isLoggedIn, authFetch } = useAuth()

const form = ref({
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  paymentMethod: 'cod',
  notes: '',
})

const submitting = ref(false)
const error = ref('')
const orderSuccess = ref(false)
const orderData = ref({})
const loadingOrder = ref(false)

// Voucher/Coupon state — shared with CartPage via composable
import { useCoupon } from '../composables/useCoupon.js'
const {
  couponCode, couponDiscount, couponApplied, couponError, couponLoading,
  applyCoupon: applyRaw, removeCoupon, revalidateCoupon,
} = useCoupon()

// Shipping
const {
  provinces, wards,
  loadingProvinces, loadingWards,
  selectedProvince, selectedWard,
  selectedProvinceName, selectedWardName,
  addressSuggestions, loadingSuggestions,
  shippingOptions, selectedShipping, shippingFee,
  loadingShipping, shippingError, fullAddress,
  fetchProvinces, onProvinceChange, onWardChange,
  searchAddress, clearSuggestions, selectSuggestion,
  calculateShipping, selectShipping,
} = useShipping()

function handleSelectSuggestion(s) {
  selectSuggestion(s, form)
}

const taxEnabled = ref(false)
const taxLabel = ref('VAT')
const taxAmount = ref(0)
const taxDetails = ref([])
const taxInclusive = ref(false)

// When tax is inclusive (đã gồm trong giá), don't add tax to total — it's informational only
const finalTotal = computed(() => {
  const tax = taxInclusive.value ? 0 : taxAmount.value
  return Math.max(0, cartTotal.value - couponDiscount.value + shippingFee.value + tax)
})

function applyCoupon() { applyRaw(cartTotal.value) }

const paymentMethodsList = ref([
  { code: 'cod', name: 'Thanh toán khi nhận hàng (COD)', description: 'Trả tiền mặt khi nhận hàng' },
  { code: 'bank', name: 'Chuyển khoản ngân hàng', description: 'Thanh toán qua tài khoản ngân hàng' },
])

async function previewTax() {
  if (!taxEnabled.value || cartItems.value.length === 0) {
    taxAmount.value = 0
    taxDetails.value = []
    return
  }
  try {
    const result = await apiPost('/tax/preview', {
      items: cartItems.value.map(i => ({
        product_id: i.productId,
        price: i.price,
        qty: i.qty,
        category_id: i.categoryId || null,
      })),
      province_id: selectedProvince.value ? parseInt(selectedProvince.value) : null,
    })
    taxAmount.value = result?.tax_amount || 0
    taxDetails.value = result?.tax_details || []
    if (result?.price_includes_tax !== undefined) taxInclusive.value = !!result.price_includes_tax
  } catch {
    taxAmount.value = 0
    taxDetails.value = []
  }
}

// Auto-update tax when cart or province changes
watch([cartTotal, selectedProvince], () => {
  if (taxEnabled.value) previewTax()
})

onMounted(async () => {
  // Fetch address data
  fetchProvinces()

  // Re-validate saved coupon on mount
  revalidateCoupon(cartTotal.value)

  // Load tax config
  try {
    const taxCfg = await apiFetch('/tax/config')
    if (taxCfg) {
      taxEnabled.value = taxCfg.enabled === true || taxCfg.enabled === 'true'
      taxLabel.value = taxCfg.label || 'VAT'
      taxInclusive.value = taxCfg.price_includes_tax === true || taxCfg.price_includes_tax === 'true'
    }
  } catch { /* tax not available — skip */ }

  // Initial tax preview
  if (taxEnabled.value && cartItems.value.length > 0) {
    await previewTax()
  }

  // Check if returning to a completed order (e.g. page reload)
  const orderId = route.query.order_id
  if (orderId) {
    loadingOrder.value = true
    try {
      let data
      if (isLoggedIn.value) {
        data = await authFetch(`/orders/${orderId}`).catch(() => null)
      }
      if (!data) {
        data = await apiFetch(`/orders/${orderId}`)
      }
      if (data && data.id) {
        orderData.value = data
        orderSuccess.value = true
      }
    } catch { /* order not found, show form */ }
    loadingOrder.value = false
  }

  // Auto-fill checkout form from logged-in customer
  if (isLoggedIn.value && customer.value) {
    const c = customer.value
    form.value.customerName = [c.first_name, c.last_name].filter(Boolean).join(' ') || form.value.customerName
    form.value.customerPhone = c.phone || form.value.customerPhone
    form.value.customerEmail = c.email || form.value.customerEmail
    try {
      const addrs = await authFetch('/addresses')
      const list = Array.isArray(addrs) ? addrs : []
      const defaultAddr = list.find(a => a.is_default) || list[0]
      if (defaultAddr) {
        form.value.customerAddress = defaultAddr.address || ''
        if (!form.value.customerName) form.value.customerName = defaultAddr.name || ''
        if (!form.value.customerPhone) form.value.customerPhone = defaultAddr.phone || ''
      }
    } catch (err) { console.warn('[Checkout] Address load failed:', err?.message || err) }
  }

  // Load payment methods
  try {
    const methods = await apiFetch('/payment-methods')
    if (Array.isArray(methods) && methods.length) {
      paymentMethodsList.value = methods
      form.value.paymentMethod = methods[0].code
    }
  } catch { /* fallback to defaults */ }
})

const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const formError = ref('')

const isValid = computed(() => {
  const f = form.value
  if (!f.customerName.trim() || !f.customerPhone.trim() || !f.customerAddress.trim()) return false
  if (!phoneRegex.test(f.customerPhone.replace(/[\s\-]/g, ''))) return false
  if (f.customerEmail && !emailRegex.test(f.customerEmail)) return false
  return true
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
    // Build full address from selectors + detail
    const addressParts = [form.value.customerAddress]
    if (selectedWardName.value) addressParts.push(selectedWardName.value)
    if (selectedProvinceName.value) addressParts.push(selectedProvinceName.value)
    const fullAddr = addressParts.filter(Boolean).join(', ')

    const payload = {
      customer_name: form.value.customerName,
      customer_phone: form.value.customerPhone,
      customer_email: form.value.customerEmail || undefined,
      customer_address: fullAddr,
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
      // Shipping
      shipping_provider: selectedShipping.value?.provider || null,
      shipping_service: selectedShipping.value?.service_code || null,
      shipping_fee: shippingFee.value,
      to_province_code: selectedProvince.value || null,
      to_ward_code: selectedWard.value || null,
    }
    // Include coupon if applied
    if (couponApplied.value && couponCode.value.trim()) {
      payload.coupon_code = couponCode.value.trim()
    }
    // Include province for tax calculation
    if (selectedProvince.value) {
      payload.to_province_id = selectedProvince.value
    }
    const result = await apiPost('/checkout', payload)
    orderData.value = result
    orderSuccess.value = true
    clearCart()
    removeCoupon() // Clear coupon after successful order
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
.checkout-grid--single { grid-template-columns: 1fr; max-width: 700px; margin: 0 auto; }

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

/* Address selector */
.address-autocomplete-wrapper { position: relative; }
.address-suggestions {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
  background: var(--sf-bg-secondary); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-sm); margin-top: 4px;
  max-height: 220px; overflow-y: auto; list-style: none; padding: 0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.address-suggestions li {
  padding: 10px 14px; font-size: 13px; color: var(--sf-text-primary);
  cursor: pointer; border-bottom: 1px solid var(--sf-border);
  transition: background 0.15s;
}
.address-suggestions li:last-child { border-bottom: none; }
.address-suggestions li:hover { background: var(--sf-accent); color: #fff; }
.form-group select {
  width: 100%; background: var(--sf-bg-secondary);
  border: 1px solid var(--sf-border); color: var(--sf-text-primary);
  padding: 12px 16px; border-radius: var(--sf-radius-sm); font-size: 14px;
  font-family: inherit; outline: none; transition: border-color 0.2s;
  box-sizing: border-box; cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center;
}
.form-group select:focus { border-color: var(--sf-accent); }
.form-group select:disabled { opacity: 0.5; cursor: not-allowed; }

/* Shipping section */
.shipping-loading {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; color: var(--sf-text-muted); padding: 16px 0;
}
.shipping-error {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #ef4444; padding: 12px;
  background: rgba(239,68,68,0.06); border-radius: var(--sf-radius-sm);
}
.shipping-empty { padding: 16px 0; font-size: 14px; color: var(--sf-text-muted); }
.shipping-options { display: flex; flex-direction: column; gap: 10px; }
.shipping-option {
  display: flex; align-items: center; gap: 14px;
  padding: 16px; border-radius: var(--sf-radius-md);
  border: 1px solid var(--sf-border); cursor: pointer;
  transition: all 0.2s; background: var(--sf-bg-secondary);
}
.shipping-option:hover { border-color: var(--sf-accent); }
.shipping-option.active {
  border-color: var(--sf-accent); background: var(--sf-accent-glow);
}
.shipping-option input { display: none; }
.shipping-option__info { display: flex; flex-direction: column; flex: 1; }
.shipping-option__info strong { font-size: 14px; font-weight: 700; }
.shipping-option__service { font-size: 13px; color: var(--sf-text-secondary); margin-top: 2px; }
.shipping-option__time { font-size: 11px; color: var(--sf-text-muted); margin-top: 2px; }
.shipping-option__fee {
  font-size: 15px; font-weight: 800; color: var(--sf-accent-light);
  white-space: nowrap;
}
.spinner {
  width: 16px; height: 16px; border: 2px solid var(--sf-border);
  border-top-color: var(--sf-accent); border-radius: 50%;
  animation: spin 0.6s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

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
  border-color: var(--sf-accent); box-shadow: var(--sf-shadow-accent);
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
.bank-card { border-color: var(--sf-accent); }
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
  background: var(--sf-accent-glow); border: 1px solid var(--sf-accent);
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
/* Voucher */
.voucher-section { background: var(--sf-accent-glow); }
.voucher-input-row {
  display: flex; gap: 8px; align-items: center;
}
.voucher-input {
  flex: 1; padding: 10px 14px; border: 1.5px dashed var(--sf-border);
  border-radius: 8px; font-size: 14px; text-transform: uppercase;
  letter-spacing: 1px; background: var(--sf-bg);
  transition: border-color 0.2s;
}
.voucher-input:focus { border-color: var(--sf-accent); outline: none; }
.voucher-input:disabled { opacity: 0.6; }
.voucher-apply-btn {
  white-space: nowrap; padding: 10px 20px;
  background: var(--sf-accent); color: #fff;
  border: none; border-radius: 8px; font-weight: 700;
  cursor: pointer; transition: background 0.2s;
}
.voucher-apply-btn:hover:not(:disabled) { background: var(--sf-accent); }
.voucher-apply-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.voucher-remove-btn {
  white-space: nowrap; display: flex; align-items: center; gap: 4px;
  padding: 10px 16px; border: 1px solid var(--sf-border);
  border-radius: 8px; background: transparent; color: var(--sf-text-muted);
  cursor: pointer; transition: all 0.2s;
}
.voucher-remove-btn:hover { color: #ef4444; border-color: #ef4444; }
.voucher-msg {
  display: flex; align-items: center; gap: 6px;
  margin-top: 8px; padding: 8px 12px; border-radius: 6px;
  font-size: 13px; font-weight: 500;
}
.voucher-msg--error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.voucher-msg--success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.total-row--discount span { color: #16a34a; font-weight: 600; }

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
  .voucher-input-row { flex-direction: column; }
  .voucher-apply-btn, .voucher-remove-btn { width: 100%; justify-content: center; }
}
</style>

