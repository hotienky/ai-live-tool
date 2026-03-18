<template>
  <div class="cart-page container">
    <h1 class="page-title"><ShoppingCart :size="24" /> Giỏ hàng ({{ cartCount }})</h1>

    <!-- Free Shipping Progress Bar -->
    <div v-if="cartItems.length > 0" class="free-ship-bar">
      <div class="free-ship-bar__info">
        <Truck :size="16" />
        <span v-if="cartTotal >= freeShipThreshold">
          🎉 Bạn đã được <strong>miễn phí vận chuyển!</strong>
        </span>
        <span v-else>
          Thêm <strong>{{ formatPrice(freeShipThreshold - cartTotal) }}</strong> để được <strong>miễn phí vận chuyển</strong>
        </span>
      </div>
      <div class="free-ship-bar__track">
        <div class="free-ship-bar__fill" :style="{ width: freeShipPercent + '%' }"></div>
      </div>
    </div>

    <!-- Empty Cart -->
    <div v-if="cartItems.length === 0" class="cart-empty">
      <ShoppingBag :size="64" class="cart-empty__icon" />
      <h2>Giỏ hàng trống</h2>
      <p>Thêm sản phẩm để bắt đầu mua sắm</p>
      <router-link to="/products" class="btn btn--primary">
        <ArrowLeft :size="16" /> Tiếp tục mua sắm
      </router-link>
    </div>

    <!-- Cart Items -->
    <div v-else class="cart-content">
      <div class="cart-items">
        <div class="cart-item" v-for="item in cartItems" :key="item.key || item.id">
          <div class="cart-item__img">
            <img v-if="item.image" :src="item.image" :alt="item.name" />
            <Package v-else :size="32" />
          </div>
          <div class="cart-item__info">
            <h3>{{ item.name }}</h3>
            <div v-if="item.selectedOptions && Object.keys(item.selectedOptions).length" class="cart-item__variants">
              <span v-for="(val, key) in item.selectedOptions" :key="key" class="cart-item__variant-tag">
                {{ key }}: {{ val }}
              </span>
            </div>
            <span v-if="item.sku" class="cart-item__sku">SKU: {{ item.sku }}</span>
            <span class="cart-item__price">{{ formatPrice(item.price) }}/{{ item.unit }}</span>
          </div>
          <div class="cart-item__qty">
            <button @click="updateQty(item.key || item.id, item.qty - 1)" :disabled="item.qty <= 1">
              <Minus :size="14" />
            </button>
            <input v-model.number="item.qty" type="number" min="1" @change="updateQty(item.key || item.id, item.qty)" />
            <button @click="updateQty(item.key || item.id, item.qty + 1)">
              <Plus :size="14" />
            </button>
          </div>
          <div class="cart-item__total">{{ formatPrice(item.price * item.qty) }}</div>
          <button class="cart-item__remove" @click="removeFromCart(item.key || item.id)">
            <Trash2 :size="16" />
          </button>
        </div>
      </div>

      <!-- Cart Summary -->
      <div class="cart-summary">
        <div class="cart-summary__card">
          <h3>Tóm tắt đơn hàng</h3>
          <div class="summary-row">
            <span>Tạm tính ({{ cartCount }} sản phẩm)</span>
            <span>{{ formatPrice(cartTotal) }}</span>
          </div>

          <!-- Voucher -->
          <div class="cart-voucher">
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
                <template v-if="couponLoading">...</template>
                <template v-else>Áp dụng</template>
              </button>
              <button
                v-else
                class="btn btn--outline voucher-remove-btn"
                @click="removeCoupon"
              >
                <X :size="14" />
              </button>
            </div>
            <div v-if="couponError" class="voucher-msg voucher-msg--error">
              <AlertTriangle :size="12" /> {{ couponError }}
            </div>
            <div v-if="couponApplied" class="voucher-msg voucher-msg--success">
              <CheckCircle :size="12" /> Giảm <strong>{{ formatPrice(couponDiscount) }}</strong>
            </div>
          </div>

          <div v-if="couponDiscount > 0" class="summary-row summary-row--discount">
            <span>Giảm giá</span>
            <span>-{{ formatPrice(couponDiscount) }}</span>
          </div>
          <div class="summary-row summary-row--total">
            <span>Tổng cộng</span>
            <span>{{ formatPrice(finalTotal) }}</span>
          </div>
          <router-link to="/checkout" class="btn btn--primary btn--block">
            Thanh toán <ArrowRight :size="16" />
          </router-link>
          <router-link to="/products" class="btn btn--outline btn--block">
            <ArrowLeft :size="14" /> Tiếp tục mua sắm
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import {
  ShoppingCart, ShoppingBag, Package, Minus, Plus, Trash2, ArrowLeft, ArrowRight,
  X, AlertTriangle, CheckCircle, Truck
} from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'
import { useCoupon } from '../composables/useCoupon.js'

const { cartItems, cartCount, cartTotal, updateQty, removeFromCart } = useCart()
const {
  couponCode, couponDiscount, couponApplied, couponError, couponLoading,
  applyCoupon: applyRaw, removeCoupon, revalidateCoupon,
} = useCoupon()

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

const finalTotal = computed(() => Math.max(0, cartTotal.value - couponDiscount.value))

const freeShipThreshold = 500000
const freeShipPercent = computed(() => Math.min(100, (cartTotal.value / freeShipThreshold) * 100))

function applyCoupon() { applyRaw(cartTotal.value) }

// Re-validate saved coupon on mount (cart total may have changed)
onMounted(() => { revalidateCoupon(cartTotal.value) })
</script>

<style scoped>
.cart-page { padding-top: 24px; padding-bottom: 80px; }
.page-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 24px; font-weight: 900; margin-bottom: 28px;
}

/* Free Shipping Progress Bar */
.free-ship-bar {
  padding: 14px 18px;
  border-radius: var(--sf-radius-md, 12px);
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
  margin-bottom: 20px;
}
.free-ship-bar__info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--sf-text-secondary);
  margin-bottom: 10px;
}
.free-ship-bar__info svg { color: #10b981; flex-shrink: 0; }
.free-ship-bar__info strong { color: var(--sf-text-primary); }
.free-ship-bar__track {
  height: 6px;
  border-radius: 3px;
  background: var(--sf-bg-card-hover, #f3f4f6);
  overflow: hidden;
}
.free-ship-bar__fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
  transition: width 0.5s ease;
}

.cart-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 20px; text-align: center; gap: 12px;
}
.cart-empty__icon { color: var(--sf-text-muted); opacity: 0.4; }
.cart-empty h2 { font-size: 20px; margin: 0; color: var(--sf-text-primary); }
.cart-empty p { color: var(--sf-text-muted); font-size: 14px; margin: 0; }

.cart-content { display: grid; grid-template-columns: 1fr 360px; gap: 28px; align-items: start; }

.cart-items { display: flex; flex-direction: column; gap: 12px; }
.cart-item {
  display: flex; align-items: center; gap: 16px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg); padding: 16px;
  transition: border-color 0.2s;
}
.cart-item:hover { border-color: var(--sf-accent); }

.cart-item__img {
  width: 80px; height: 80px; border-radius: var(--sf-radius-md);
  overflow: hidden; background: var(--sf-bg-secondary);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--sf-text-muted);
}
.cart-item__img img { width: 100%; height: 100%; object-fit: cover; }

.cart-item__info { flex: 1; }
.cart-item__info h3 { margin: 0; font-size: 15px; font-weight: 700; }
.cart-item__variants {
  display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;
}
.cart-item__variant-tag {
  display: inline-block; font-size: 11px; color: var(--sf-text-secondary);
  background: var(--sf-bg-card-hover, #f3f4f6); padding: 2px 8px; border-radius: 4px;
  border: 1px solid var(--sf-border);
}
.cart-item__sku {
  display: inline-block; font-size: 11px; color: var(--sf-accent-light);
  background: var(--sf-accent-glow); padding: 2px 8px; border-radius: 4px;
  margin-top: 4px;
}
.cart-item__price {
  display: block; font-size: 13px; color: var(--sf-text-secondary);
  margin-top: 4px;
}

.cart-item__qty {
  display: flex; border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-sm); overflow: hidden;
}
.cart-item__qty button {
  width: 36px; height: 36px; border: none;
  background: var(--sf-bg-secondary); color: var(--sf-text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.cart-item__qty button:hover { color: var(--sf-accent-light); background: var(--sf-bg-card); }
.cart-item__qty button:disabled { opacity: 0.4; cursor: not-allowed; }
.cart-item__qty input {
  width: 48px; text-align: center; border: none;
  border-left: 1px solid var(--sf-border); border-right: 1px solid var(--sf-border);
  background: var(--sf-bg-primary); color: var(--sf-text-primary);
  font-weight: 700; outline: none; -moz-appearance: textfield;
}
.cart-item__qty input::-webkit-outer-spin-button,
.cart-item__qty input::-webkit-inner-spin-button { -webkit-appearance: none; }

.cart-item__total {
  font-size: 16px; font-weight: 800; color: var(--sf-accent-light);
  min-width: 100px; text-align: right;
}

.cart-item__remove {
  background: none; border: none; color: var(--sf-text-muted);
  cursor: pointer; padding: 6px; transition: color 0.2s;
}
.cart-item__remove:hover { color: #ef4444; }

/* Summary */
.cart-summary__card {
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg); padding: 24px;
  position: sticky; top: calc(var(--sf-header-height) + 24px);
}
.cart-summary__card h3 { margin: 0 0 20px 0; font-size: 17px; font-weight: 800; }

.summary-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; font-size: 14px; color: var(--sf-text-secondary);
  border-bottom: 1px solid var(--sf-border);
}
.summary-row .free { color: #10b981; font-weight: 600; }
.summary-row--discount span { color: #16a34a; font-weight: 600; }
.summary-row--total {
  border-bottom: none; padding-top: 14px; margin-top: 4px;
  font-size: 18px; font-weight: 900; color: var(--sf-text-primary);
}
.summary-row--total span:last-child { color: var(--sf-accent-light); }

/* Voucher in Cart */
.cart-voucher {
  padding: 12px 0; border-bottom: 1px solid var(--sf-border);
}
.voucher-input-row {
  display: flex; gap: 6px; align-items: center;
}
.voucher-input {
  flex: 1; padding: 8px 10px; border: 1.5px dashed var(--sf-border);
  border-radius: 6px; font-size: 13px; text-transform: uppercase;
  letter-spacing: 0.5px; background: var(--sf-bg);
  transition: border-color 0.2s; min-width: 0;
}
.voucher-input:focus { border-color: var(--sf-accent); outline: none; }
.voucher-input:disabled { opacity: 0.6; }
.voucher-apply-btn {
  white-space: nowrap; padding: 8px 14px;
  background: var(--sf-accent); color: #fff;
  border: none; border-radius: 6px; font-weight: 700; font-size: 13px;
  cursor: pointer; transition: background 0.2s;
}
.voucher-apply-btn:hover:not(:disabled) { background: var(--sf-accent); }
.voucher-apply-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.voucher-remove-btn {
  padding: 8px 10px; border: 1px solid var(--sf-border);
  border-radius: 6px; background: transparent; color: var(--sf-text-muted);
  cursor: pointer; transition: all 0.2s; display: flex; align-items: center;
}
.voucher-remove-btn:hover { color: #ef4444; border-color: #ef4444; }
.voucher-msg {
  display: flex; align-items: center; gap: 4px;
  margin-top: 6px; padding: 5px 8px; border-radius: 4px;
  font-size: 12px; font-weight: 500;
}
.voucher-msg--error { background: #fef2f2; color: #dc2626; }
.voucher-msg--success { background: #f0fdf4; color: #16a34a; }

.btn--block {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; margin-top: 12px; padding: 14px; font-size: 15px;
}

@media (max-width: 768px) {
  .cart-content { grid-template-columns: 1fr; }
  .cart-item { flex-wrap: wrap; }
  .cart-item__total { min-width: auto; }
}
</style>
