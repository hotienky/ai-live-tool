<template>
  <div class="cart-page container">
    <h1 class="page-title"><ShoppingCart :size="24" /> Giỏ hàng ({{ cartCount }})</h1>

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
          <div class="summary-row">
            <span>Phí vận chuyển</span>
            <span class="free">Miễn phí</span>
          </div>
          <div class="summary-row summary-row--total">
            <span>Tổng cộng</span>
            <span>{{ formatPrice(cartTotal) }}</span>
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
import { ShoppingCart, ShoppingBag, Package, Minus, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'

const { cartItems, cartCount, cartTotal, updateQty, removeFromCart } = useCart()

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }
</script>

<style scoped>
.cart-page { padding-top: 24px; padding-bottom: 80px; }
.page-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 24px; font-weight: 900; margin-bottom: 28px;
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
.summary-row--total {
  border-bottom: none; padding-top: 14px; margin-top: 4px;
  font-size: 18px; font-weight: 900; color: var(--sf-text-primary);
}
.summary-row--total span:last-child { color: var(--sf-accent-light); }

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
