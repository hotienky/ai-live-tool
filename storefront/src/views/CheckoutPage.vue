<template>
  <div class="checkout-page container">
    <!-- Success State -->
    <div v-if="orderSuccess" class="checkout-success">
      <div class="success-card">
        <div class="success-icon"><CheckCircle :size="64" /></div>
        <h2>Đặt hàng thành công!</h2>
        <p>Mã đơn hàng: <strong>#{{ orderId }}</strong></p>
        <p class="success-note">Chúng tôi sẽ liên hệ xác nhận đơn hàng của bạn sớm nhất</p>
        <div class="success-actions">
          <router-link to="/products" class="btn btn--primary">
            <ShoppingBag :size="16" /> Tiếp tục mua sắm
          </router-link>
          <router-link to="/" class="btn btn--outline">
            <Home :size="16" /> Về trang chủ
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
              <label class="payment-option" :class="{ active: form.paymentMethod === 'cod' }">
                <input type="radio" v-model="form.paymentMethod" value="cod" />
                <Truck :size="20" />
                <div>
                  <strong>Thanh toán khi nhận hàng (COD)</strong>
                  <span>Trả tiền mặt khi nhận hàng</span>
                </div>
              </label>
              <label class="payment-option" :class="{ active: form.paymentMethod === 'bank' }">
                <input type="radio" v-model="form.paymentMethod" value="bank" />
                <CreditCard :size="20" />
                <div>
                  <strong>Chuyển khoản ngân hàng</strong>
                  <span>Thanh toán qua tài khoản ngân hàng</span>
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
              <div class="summary-item" v-for="item in cartItems" :key="item.id">
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
import { ref, computed } from 'vue'
import {
  CreditCard, User, Truck, FileText, Package, ShoppingCart,
  CheckCircle, ShoppingBag, Home, Wallet
} from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'
import { apiPost } from '../api.js'

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
const orderId = ref('')

const isValid = computed(() => {
  return form.value.customerName.trim() && form.value.customerPhone.trim() && form.value.customerAddress.trim()
})

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

async function placeOrder() {
  if (!isValid.value) { error.value = 'Vui lòng điền đầy đủ thông tin'; return }
  submitting.value = true
  error.value = ''
  try {
    const result = await apiPost('/checkout', {
      ...form.value,
      items: cartItems.value.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        sku: i.sku,
      })),
      totalAmount: cartTotal.value,
    })
    orderId.value = result.id
    orderSuccess.value = true
    clearCart()
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

/* Success */
.checkout-success {
  display: flex; justify-content: center; padding: 60px 20px;
}
.success-card {
  text-align: center; padding: 48px; max-width: 480px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-xl);
}
.success-icon { color: #34d399; margin-bottom: 16px; }
.success-card h2 { font-size: 24px; font-weight: 900; margin: 0 0 8px 0; }
.success-card p { color: var(--sf-text-secondary); margin: 4px 0; }
.success-note { font-size: 14px; color: var(--sf-text-muted); margin-top: 16px !important; }
.success-actions { display: flex; gap: 12px; justify-content: center; margin-top: 28px; }

@media (max-width: 768px) {
  .checkout-grid { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; }
  .success-actions { flex-direction: column; }
}
</style>
