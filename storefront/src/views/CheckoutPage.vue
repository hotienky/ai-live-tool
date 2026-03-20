<template>
  <div class="checkout-page container">
    <!-- Success State -->
    <div v-if="orderSuccess" class="checkout-success">
      <!-- Progress Steps -->
      <div class="success-steps" v-if="checkoutConfig.showSteps">
        <div class="step done"><span class="step-num">1</span><span class="step-label">{{ t('storefront.cart', 'Giỏ hàng') }}</span></div>
        <div class="step-line done"></div>
        <div class="step done"><span class="step-num">2</span><span class="step-label">{{ t('storefront.checkout', 'Thanh toán') }}</span></div>
        <div class="step-line done"></div>
        <div class="step done current"><span class="step-num"><Check :size="14" /></span><span class="step-label">{{ t('storefront.completed', 'Hoàn tất') }}</span></div>
      </div>

      <div class="success-content">
        <!-- Success Hero -->
        <div class="success-hero">
          <div class="success-hero__bg"></div>
          <div class="success-hero__icon">
            <CheckCircle :size="64" />
            <div class="success-ring"></div>
            <div class="success-ring success-ring--2"></div>
          </div>
          <h2 class="success-hero__title">{{ t('storefront.order_success', 'Đặt hàng thành công!') }}</h2>
          <div class="success-hero__badge">
            <Package :size="14" />
            <span>{{ t('storefront.order_code', 'Mã đơn hàng') }}</span>
            <strong>#{{ orderData.id }}</strong>
          </div>
          <p class="success-hero__sub">{{ t('storefront.order_success_desc', 'Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.') }}</p>
        </div>

        <!-- Order Details Section -->
        <div class="success-details">
          <div class="success-section">
            <div class="success-section__header">
              <User :size="18" />
              <h3>{{ t('storefront.shipping_info', 'Thông tin giao hàng') }}</h3>
            </div>
            <div class="detail-grid-2col">
              <div class="detail-item">
                <span class="detail-item__label">{{ t('storefront.customer', 'Khách hàng') }}</span>
                <span class="detail-item__value">{{ orderData.customer_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-item__label">{{ t('storefront.phone', 'Điện thoại') }}</span>
                <span class="detail-item__value">{{ orderData.customer_phone }}</span>
              </div>
              <div class="detail-item detail-item--full">
                <span class="detail-item__label">{{ t('storefront.shipping_address', 'Địa chỉ giao hàng') }}</span>
                <span class="detail-item__value">{{ orderData.customer_address }}</span>
              </div>
            </div>
          </div>

          <div class="success-divider"></div>

          <div class="success-section">
            <div class="success-section__header">
              <CreditCard :size="18" />
              <h3>{{ t('storefront.payment_details', 'Chi tiết thanh toán') }}</h3>
            </div>
            <div class="payment-summary">
              <div class="payment-summary__row">
                <span>{{ t('storefront.payment_method', 'Phương thức') }}</span>
                <span class="payment-summary__badge" :class="orderData.payment_method === 'bank' ? 'badge--bank' : 'badge--cod'">
                  <Truck v-if="orderData.payment_method !== 'bank'" :size="12" />
                  <Building v-else :size="12" />
                  {{ orderData.payment_method === 'bank' ? t('storefront.bank_transfer', 'Chuyển khoản') : t('storefront.cod', 'Thanh toán khi nhận hàng') }}
                </span>
              </div>
              <div v-if="orderData.coupon_code" class="payment-summary__row">
                <span>{{ t('storefront.coupon_code', 'Mã giảm giá') }}</span>
                <span class="payment-summary__discount">
                  <Tag :size="12" />
                  {{ orderData.coupon_code }} (−{{ formatPrice(orderData.discount_amount) }})
                </span>
              </div>
              <div v-if="orderData.shipping_fee > 0" class="payment-summary__row">
                <span>{{ t('storefront.shipping_fee', 'Phí vận chuyển') }}</span>
                <span>{{ formatPrice(orderData.shipping_fee) }}</span>
              </div>
              <div v-if="orderData.tax_amount > 0" class="payment-summary__row">
                <span>VAT</span>
                <span>{{ formatPrice(orderData.tax_amount) }}</span>
              </div>
              <div class="payment-summary__total">
                <span>{{ t('storefront.total', 'Tổng thanh toán') }}</span>
                <span>{{ formatPrice(orderData.total_amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bank Transfer Info -->
        <div v-if="orderData.payment_method === 'bank' && orderData.bank_info" class="success-bank">
          <div class="success-section__header">
            <Building :size="18" />
            <h3>{{ t('storefront.bank_info', 'Thông tin chuyển khoản') }}</h3>
          </div>
          <div class="bank-warning">
            <AlertTriangle :size="14" />
            <span>{{ t('storefront.bank_transfer_warning', 'Vui lòng chuyển khoản trong vòng') }} <strong>24h</strong> {{ t('storefront.bank_transfer_warning2', 'để đơn hàng được xử lý') }}</span>
          </div>
          <div class="bank-fields">
            <div class="bank-field">
              <span class="bank-field__label">{{ t('storefront.bank_name', 'Ngân hàng') }}</span>
              <div class="bank-field__row">
                <span class="bank-field__value">{{ orderData.bank_info.bank_name }}</span>
              </div>
            </div>
            <div class="bank-field">
              <span class="bank-field__label">{{ t('storefront.bank_branch', 'Chi nhánh') }}</span>
              <div class="bank-field__row">
                <span class="bank-field__value">{{ orderData.bank_info.branch }}</span>
              </div>
            </div>
            <div class="bank-fields-row">
              <div class="bank-field">
                <span class="bank-field__label">{{ t('storefront.account_holder', 'Chủ tài khoản') }}</span>
                <div class="bank-field__row">
                  <span class="bank-field__value highlight">{{ orderData.bank_info.account_name }}</span>
                  <button class="copy-btn" @click="copyText(orderData.bank_info.account_name)" :title="t('storefront.copy', 'Sao chép')">
                    <Copy :size="13" />
                  </button>
                </div>
              </div>
              <div class="bank-field">
                <span class="bank-field__label">{{ t('storefront.account_number', 'Số tài khoản') }}</span>
                <div class="bank-field__row">
                  <span class="bank-field__value highlight mono">{{ orderData.bank_info.account_number }}</span>
                  <button class="copy-btn" @click="copyText(orderData.bank_info.account_number)" :title="t('storefront.copy', 'Sao chép')">
                    <Copy :size="13" />
                  </button>
                </div>
              </div>
            </div>
            <div class="bank-fields-row">
              <div class="bank-field">
                <span class="bank-field__label">{{ t('storefront.amount', 'Số tiền') }}</span>
                <div class="bank-field__row">
                  <span class="bank-field__value highlight accent">{{ formatPrice(orderData.total_amount) }}</span>
                  <button class="copy-btn" @click="copyText(String(orderData.total_amount))" :title="t('storefront.copy', 'Sao chép')">
                    <Copy :size="13" />
                  </button>
                </div>
              </div>
              <div class="bank-field">
                <span class="bank-field__label">{{ t('storefront.transfer_note', 'Nội dung chuyển khoản') }}</span>
                <div class="bank-field__row">
                  <span class="bank-field__value highlight mono">{{ orderData.bank_info.note }}</span>
                  <button class="copy-btn" @click="copyText(orderData.bank_info.note)" :title="t('storefront.copy', 'Sao chép')">
                    <Copy :size="13" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- QR Code -->
          <div class="bank-qr" v-if="vietQrUrl">
            <div class="bank-qr__divider"></div>
            <p class="bank-qr__label"><QrCode :size="14" /> {{ t('storefront.scan_qr', 'Quét mã QR để chuyển khoản') }}</p>
            <div class="bank-qr__wrap">
              <img :src="vietQrUrl" :alt="t('storefront.qr_code', 'QR Code chuyển khoản')" class="bank-qr__img" />
            </div>
            <p class="bank-qr__hint">{{ t('storefront.scan_qr_hint', 'Mở app ngân hàng → Quét QR → Số tiền & nội dung đã được điền sẵn') }}</p>
          </div>
        </div>

        <!-- COD Confirmation -->
        <div v-else class="success-cod">
          <div class="cod-content">
            <div class="cod-icon"><Wallet :size="24" /></div>
            <div class="cod-text">
              <p>{{ t('storefront.cod_message', 'Bạn sẽ thanh toán') }} <strong>{{ formatPrice(orderData.total_amount) }}</strong> {{ t('storefront.cod_on_delivery', 'khi nhận hàng.') }}</p>
              <p class="cod-sub">{{ t('storefront.cod_confirm', 'Chúng tôi sẽ liên hệ xác nhận đơn hàng trong thời gian sớm nhất.') }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="success-actions">
          <router-link to="/products" class="btn btn--primary btn--success">
            <ShoppingBag :size="16" /> {{ t('storefront.continue_shopping', 'Tiếp tục mua sắm') }}
          </router-link>
          <router-link to="/order-tracking" class="btn btn--outline btn--success">
            <Package :size="16" /> {{ t('storefront.track_order', 'Theo dõi đơn hàng') }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Checkout Form -->
    <template v-else>
      <h1 class="page-title"><CreditCard :size="24" /> {{ t('storefront.checkout_title') || 'Thanh toán' }}</h1>

      <div v-if="cartItems.length === 0" class="checkout-empty">
        <p>{{ t('storefront.empty_cart', 'Giỏ hàng trống.') }} <router-link to="/products">{{ t('storefront.add_products', 'Thêm sản phẩm') }}</router-link></p>
      </div>

      <div v-else class="checkout-grid" :class="{ 'checkout-grid--single': checkoutConfig.layout === 'single-column' }">
        <!-- Form -->
        <div class="checkout-form">
          <div class="form-section">
            <h3><User :size="16" /> {{ t('storefront.shipping_info') || 'Thông tin giao hàng' }}</h3>

            <!-- Saved Addresses Dropdown -->
            <div v-if="isLoggedIn && savedAddresses.length > 0" class="saved-addresses">
              <label class="saved-addresses__label">
                <MapPin :size="14" /> {{ t('storefront.select_saved_address', 'Chọn địa chỉ đã lưu') }}
              </label>
              <div class="saved-addresses__list">
                <button
                  v-for="addr in savedAddresses" :key="addr.id"
                  class="saved-addr-card"
                  :class="{ active: selectedSavedAddr === addr.id }"
                  @click="applySavedAddress(addr)"
                >
                  <div class="saved-addr-card__name">
                    {{ addr.name || t('storefront.unnamed', 'Không tên') }}
                    <span v-if="addr.is_default" class="saved-addr-badge">★ {{ t('storefront.default', 'Mặc định') }}</span>
                  </div>
                  <div class="saved-addr-card__detail">{{ addr.phone }}</div>
                  <div class="saved-addr-card__detail">{{ addr.address }}</div>
                </button>
                <button class="saved-addr-card saved-addr-card--new" @click="selectedSavedAddr = null">
                  + {{ t('storefront.new_address', 'Nhập địa chỉ mới') }}
                </button>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('storefront.full_name', 'Họ tên') }} *</label>
                <input v-model="form.customerName" :placeholder="t('storefront.name_placeholder', 'Nguyễn Văn A')" required />
              </div>
              <div class="form-group">
                <label>{{ t('storefront.phone', 'Số điện thoại') }} *</label>
                <input v-model="form.customerPhone" placeholder="0901234567" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('storefront.email_confirm', 'Email (nhận xác nhận đơn)') }}</label>
                <input v-model="form.customerEmail" type="email" placeholder="email@example.com" />
              </div>
            </div>
            <!-- Address Selector (2-level: Province → Ward) -->
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('storefront.province', 'Tỉnh/Thành phố') }} *</label>
                <select @change="e => onProvinceChange(e.target.value)" :value="selectedProvince || ''">
                  <option value="" disabled>{{ loadingProvinces ? t('storefront.loading', 'Đang tải...') : t('storefront.select_province', 'Chọn tỉnh/thành') }}</option>
                  <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('storefront.ward', 'Phường/Xã') }} *</label>
                <select @change="e => onWardChange(e.target.value)" :value="selectedWard || ''" :disabled="!selectedProvince">
                  <option value="" disabled>{{ loadingWards ? t('storefront.loading', 'Đang tải...') : t('storefront.select_ward', 'Chọn phường/xã') }}</option>
                  <option v-for="w in wards" :key="w.code" :value="w.code">{{ w.name }}</option>
                </select>
              </div>
            </div>
            <div class="form-group address-autocomplete-wrapper">
              <label>{{ t('storefront.detail_address', 'Địa chỉ chi tiết') }} *</label>
              <input
                v-model="form.customerAddress"
                :placeholder="t('storefront.address_placeholder', 'Số nhà, tên đường...')"
                required
                @input="e => searchAddress(e.target.value)"
                @blur="() => setTimeout(() => clearSuggestions(), 200)"
                autocomplete="off"
              />
              <div v-if="loadingSuggestions" class="address-loading">{{ t('storefront.searching', 'Đang tìm...') }}</div>
              <ul v-if="addressSuggestions.length" class="address-suggestions">
                <li v-for="(s, i) in addressSuggestions" :key="i" @mousedown.prevent="handleSelectSuggestion(s)">
                  {{ s.display }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Shipping Options -->
          <div class="form-section shipping-section" v-if="selectedProvince">
            <h3><Truck :size="16" /> {{ t('storefront.shipping_provider') || 'Đơn vị vận chuyển' }}</h3>
            <div v-if="loadingShipping" class="shipping-loading">
              <span class="spinner"></span> {{ t('storefront.calculating_shipping', 'Đang tính phí vận chuyển...') }}
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
                  <span class="shipping-option__time">
                    <Truck :size="12" /> {{ opt.estimated_days }}
                  </span>
                  <span v-if="estimatedDeliveryDate(opt)" class="shipping-option__delivery">
                    📅 {{ t('storefront.estimated_delivery', 'Nhận hàng dự kiến:') }} <strong>{{ estimatedDeliveryDate(opt) }}</strong>
                  </span>
                </div>
                <span class="shipping-option__fee">{{ formatPrice(opt.fee) }}</span>
              </label>
            </div>
            <div v-else class="shipping-empty">
              <p>{{ t('storefront.select_address_for_shipping', 'Vui lòng chọn đầy đủ địa chỉ để tính phí vận chuyển') }}</p>
            </div>
          </div>

          <!-- Voucher / Coupon -->
          <div class="form-section voucher-section" v-if="checkoutConfig.showCoupon">
            <h3><Tag :size="16" /> {{ t('storefront.coupon_code') || 'Mã giảm giá' }}</h3>
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
              {{ t('storefront.coupon_applied', 'Mã') }} <strong>{{ couponCode.toUpperCase() }}</strong> — {{ t('storefront.discount', 'Giảm') }} <strong>{{ formatPrice(couponDiscount) }}</strong>
            </div>
          </div>

          <!-- Order Notes -->
          <div class="form-section">
            <h3><PenLine :size="16" /> {{ t('storefront.order_notes') || 'Ghi chú đơn hàng' }}</h3>
            <textarea
              v-model="form.notes"
              class="order-notes"
              :placeholder="t('storefront.order_notes_placeholder', 'Ghi chú cho shop (ví dụ: giao giờ hành chính, gọi trước khi giao...)')"
              rows="3"
              maxlength="500"
            ></textarea>
          </div>

          <div class="form-section">
            <h3><Wallet :size="16" /> {{ t('storefront.payment_method') || 'Phương thức thanh toán' }}</h3>
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
            <h3><FileText :size="16" /> {{ t('storefront.notes', 'Ghi chú') }}</h3>
            <textarea v-model="form.notes" rows="3" :placeholder="t('storefront.notes_placeholder', 'Ghi chú thêm cho đơn hàng (không bắt buộc)')"></textarea>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="checkout-summary">
          <div class="summary-card">
            <h3>{{ t('storefront.order_summary') || 'Đơn hàng' }} ({{ cartCount }} SP)</h3>
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
              <div class="total-row"><span>{{ t('storefront.subtotal', 'Tạm tính') }}</span><span>{{ formatPrice(cartTotal) }}</span></div>
              <div v-if="couponDiscount > 0" class="total-row total-row--discount">
                <span>{{ t('storefront.discount', 'Giảm giá') }} ({{ couponCode.toUpperCase() }})</span>
                <span>-{{ formatPrice(couponDiscount) }}</span>
              </div>
              <div class="total-row">
                <span>{{ t('storefront.shipping_fee', 'Phí giao hàng') }}</span>
                <span v-if="shippingFee > 0">{{ formatPrice(shippingFee) }}</span>
                <span v-else class="free">{{ selectedProvince ? t('storefront.select_shipping', 'Chọn đơn vị vận chuyển') : t('storefront.select_address_first', 'Chọn địa chỉ trước') }}</span>
              </div>
              <div v-if="taxEnabled && taxAmount > 0" class="total-row">
                <span>{{ taxLabel }} <span v-if="taxDetails.length" style="font-size:11px;opacity:0.7">({{ taxDetails.map(d => d.name).join(', ') }})</span><span v-if="taxInclusive" style="font-size:11px;opacity:0.7;margin-left:4px">(đã gồm trong giá)</span></span>
                <span>{{ formatPrice(taxAmount) }}</span>
              </div>
              <div class="total-row total-row--grand">
                <span>{{ t('storefront.total', 'Tổng thanh toán') }}</span>
                <span>{{ formatPrice(finalTotal) }}</span>
              </div>
            </div>

            <button class="btn btn--primary btn--block btn--lg" @click="placeOrder" :disabled="submitting || !isValid">
              <template v-if="submitting">{{ t('storefront.processing') || 'Đang xử lý...' }}</template>
              <template v-else><ShoppingCart :size="16" /> {{ t('storefront.place_order') || 'Đặt hàng' }} — {{ formatPrice(finalTotal) }}</template>
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
  Tag, X, MapPin, PenLine
} from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'
import { useAuth } from '../composables/useAuth.js'
import { useShipping } from '../composables/useShipping.js'
import { useI18n } from '../composables/useI18n.js'
import { apiFetch, apiPost } from '../api.js'

const { t, currentLang, defaultLangCode } = useI18n()
const layoutConfig = inject('layoutConfig', ref(null))
const checkoutConfig = computed(() => {
  const defaults = { showCoupon: true, showNotes: true, showSteps: true, layout: 'two-column', pageTitle: '', pageDescription: '', translations: {} }
  const cc = layoutConfig.value?.pageConfigs?.checkout
  const merged = cc ? { ...defaults, ...cc } : defaults
  const lang = currentLang.value
  if (lang && lang !== defaultLangCode.value && merged.translations?.[lang]) {
    if (merged.translations[lang].pageTitle) merged.pageTitle = merged.translations[lang].pageTitle
    if (merged.translations[lang].pageDescription) merged.pageDescription = merged.translations[lang].pageDescription
  }
  return merged
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

// Saved addresses
const savedAddresses = ref([])
const selectedSavedAddr = ref(null)

function applySavedAddress(addr) {
  selectedSavedAddr.value = addr.id
  form.value.customerName = addr.name || ''
  form.value.customerPhone = addr.phone || ''
  form.value.customerAddress = addr.address || ''
  if (addr.email) form.value.customerEmail = addr.email
}

// Estimated delivery date helper
function estimatedDeliveryDate(opt) {
  if (!opt.estimated_days) return null
  const match = opt.estimated_days.match(/(\d+)/g)
  if (!match) return null
  const today = new Date()
  const minDays = parseInt(match[0])
  const maxDays = match[1] ? parseInt(match[1]) : minDays
  const minDate = new Date(today.getTime() + minDays * 86400000)
  const maxDate = new Date(today.getTime() + maxDays * 86400000)
  const fmt = d => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  return minDays === maxDays ? fmt(minDate) : `${fmt(minDate)} - ${fmt(maxDate)}`
}

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
      savedAddresses.value = list
      const defaultAddr = list.find(a => a.is_default) || list[0]
      if (defaultAddr) {
        applySavedAddress(defaultAddr)
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
  if (!isValid.value) { error.value = t('storefront.fill_required', 'Vui lòng điền đầy đủ thông tin'); return }
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
    error.value = t('storefront.order_failed', 'Đặt hàng thất bại') + ': ' + (err.message || t('storefront.unknown_error', 'Lỗi không xác định'))
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

/* Success Content */
.success-content { max-width: 680px; margin: 0 auto; }

/* ── Success Hero ── */
.success-hero {
  text-align: center; padding: 48px 32px 40px;
  position: relative; overflow: hidden;
  border-radius: var(--sf-radius-xl) var(--sf-radius-xl) 0 0;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-bottom: none;
}
.success-hero__bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(5, 150, 105, 0.08) 50%, rgba(16, 185, 129, 0.02) 100%);
  pointer-events: none;
}
.success-hero__bg::before {
  content: ''; position: absolute; top: -60%; left: -30%; right: -30%; bottom: 60%;
  background: radial-gradient(ellipse, rgba(16, 185, 129, 0.1), transparent 70%);
  animation: heroGlow 4s ease-in-out infinite;
}
@keyframes heroGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}
.success-hero__icon {
  position: relative; display: inline-flex;
  align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.success-hero__icon svg { color: #10b981; z-index: 1; }
.success-ring {
  position: absolute; inset: -16px; border-radius: 50%;
  border: 3px solid rgba(16, 185, 129, 0.2);
  animation: ringPulse 2s ease-out infinite;
}
.success-ring--2 {
  inset: -28px;
  border: 2px solid rgba(16, 185, 129, 0.1);
  animation-delay: 0.4s;
}
@keyframes ringPulse {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}
.success-hero__title {
  font-size: 32px; font-weight: 900; margin: 0 0 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.success-hero__badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 20px; border-radius: 100px;
  background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2);
  font-size: 14px; color: var(--sf-text-secondary);
}
.success-hero__badge svg { color: #10b981; }
.success-hero__badge strong {
  color: #10b981; font-size: 16px; font-weight: 900;
  -webkit-text-fill-color: #10b981;
}
.success-hero__sub {
  margin: 16px 0 0; font-size: 14px; color: var(--sf-text-muted); line-height: 1.6;
}

/* ── Order Details Section ── */
.success-details {
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-top: none; padding: 0 32px 32px;
}
.success-section { padding: 0; }
.success-section__header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px; padding-bottom: 12px;
  border-bottom: 2px solid var(--sf-border);
}
.success-section__header svg { color: var(--sf-accent-light); flex-shrink: 0; }
.success-section__header h3 {
  font-size: 15px; font-weight: 800; margin: 0;
  color: var(--sf-text-primary);
}
.success-divider {
  height: 1px; background: var(--sf-border); margin: 24px 0;
}

/* Detail Grid */
.detail-grid-2col {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item--full { grid-column: 1 / -1; }
.detail-item__label {
  font-size: 11px; font-weight: 700; color: var(--sf-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px;
}
.detail-item__value {
  font-size: 14px; font-weight: 600; color: var(--sf-text-primary);
  line-height: 1.5;
}

/* Payment Summary */
.payment-summary { display: flex; flex-direction: column; gap: 0; }
.payment-summary__row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; font-size: 14px; color: var(--sf-text-secondary);
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.payment-summary__row:last-child { border-bottom: none; }
.payment-summary__badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 100px;
  font-size: 12px; font-weight: 700;
}
.badge--cod {
  background: rgba(16, 185, 129, 0.08); color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.badge--bank {
  background: rgba(59, 130, 246, 0.08); color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.payment-summary__discount {
  display: inline-flex; align-items: center; gap: 4px;
  color: #16a34a; font-weight: 700; font-size: 13px;
}
.payment-summary__total {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0 0; margin-top: 4px;
  border-top: 2px solid var(--sf-border);
  font-size: 16px; font-weight: 900; color: var(--sf-text-primary);
}
.payment-summary__total span:last-child {
  font-size: 22px; color: var(--sf-accent-light);
}

/* ── Bank Transfer Card ── */
.success-bank {
  margin-top: 16px; padding: 28px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg);
  border-left: 4px solid var(--sf-accent);
}
.bank-warning {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 14px; border-radius: 8px;
  background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2);
  color: #d97706; font-size: 12px; line-height: 1.5;
  margin-bottom: 16px;
}
.bank-warning svg { flex-shrink: 0; margin-top: 1px; }
.bank-fields { display: flex; flex-direction: column; gap: 10px; }
.bank-fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
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

/* ── COD Confirmation ── */
.success-cod {
  margin-top: 16px; padding: 20px 28px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg);
  border-left: 4px solid #10b981;
}
.cod-content {
  display: flex; align-items: center; gap: 16px;
}
.cod-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
}
.cod-text p { margin: 0 0 4px; font-size: 14px; color: var(--sf-text-secondary); line-height: 1.5; }
.cod-text p strong { color: var(--sf-accent-light); }
.cod-sub { font-size: 12px !important; color: var(--sf-text-muted) !important; margin: 0 !important; }

/* ── Success Actions ── */
.success-actions {
  display: flex; gap: 14px; justify-content: center;
  margin-top: 32px;
}
.btn--success {
  padding: 14px 32px; font-size: 15px; font-weight: 700;
  border-radius: var(--sf-radius-md);
  transition: all 0.25s;
}
.btn--success:hover { transform: translateY(-2px); box-shadow: var(--sf-shadow-lg); }
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

/* Order Notes */
.order-notes {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--sf-border);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  background: var(--sf-bg);
  color: var(--sf-text-primary);
  resize: vertical;
  min-height: 70px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.order-notes:focus { border-color: var(--sf-accent); outline: none; }
.order-notes::placeholder { color: var(--sf-text-muted); }
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
  .detail-grid-2col { grid-template-columns: 1fr; }
  .bank-fields-row { grid-template-columns: 1fr; }
  .success-hero { padding: 36px 20px 32px; }
  .success-details { padding: 0 20px 24px; }
  .success-bank { padding: 20px; }
  .success-cod { padding: 16px 20px; }
  .cod-content { flex-direction: column; text-align: center; }
  .success-steps { gap: 0; }
  .step-line { width: 40px; }
  .success-actions { flex-direction: column; }
  .btn--success { width: 100%; justify-content: center; }
  .bank-qr__img { width: 200px; }
  .voucher-input-row { flex-direction: column; }
  .voucher-apply-btn, .voucher-remove-btn { width: 100%; justify-content: center; }
  .saved-addresses__list { flex-direction: column; }
}

/* Saved Addresses */
.saved-addresses {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--sf-border);
}
.saved-addresses__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sf-text-secondary);
  margin-bottom: 10px;
}
.saved-addresses__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.saved-addr-card {
  flex: 1;
  min-width: 180px;
  max-width: 280px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 2px solid var(--sf-border);
  background: var(--sf-bg-card);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.saved-addr-card:hover {
  border-color: var(--sf-accent);
}
.saved-addr-card.active {
  border-color: var(--sf-accent-light);
  background: var(--sf-accent-glow, rgba(99,102,241,0.06));
}
.saved-addr-card__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sf-text-primary);
  margin-bottom: 4px;
}
.saved-addr-badge {
  font-size: 10px;
  font-weight: 800;
  color: #f59e0b;
  background: rgba(245,158,11,0.12);
  padding: 1px 6px;
  border-radius: 4px;
}
.saved-addr-card__detail {
  font-size: 12px;
  color: var(--sf-text-muted);
  line-height: 1.4;
}
.saved-addr-card--new {
  display: flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  color: var(--sf-text-muted);
  font-size: 13px;
  font-weight: 600;
}
.saved-addr-card--new:hover { color: var(--sf-accent); border-color: var(--sf-accent); }

/* Estimated Delivery Date */
.shipping-option__delivery {
  display: block;
  font-size: 11px;
  color: #10b981;
  margin-top: 2px;
}
</style>

