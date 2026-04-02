<template>
  <div class="sp-content">
    <div class="sp-grid">
      <!-- Left: Image Gallery -->
      <div class="sp-gallery">
        <div class="sp-main-img">
          <img v-if="product?.image_url" :src="product.image_url" :alt="product.name" class="sp-img" />
          <Package v-else :size="80" class="sp-img-placeholder" />
          <span class="sp-promo-badge" v-if="isOnPromotion">
            -{{ Math.round((1 - product.promotion_price / product.price) * 100) }}%
          </span>
        </div>
      </div>

      <!-- Right: Product Info -->
      <div class="sp-info">
        <span class="sp-brand" v-if="product?.brand">{{ product.brand }}</span>
        <h1 class="sp-name">{{ product?.name || 'Tên sản phẩm mẫu' }}</h1>

        <div class="sp-prices" v-if="product">
          <span class="sp-price" :class="{ 'sp-price--old': isOnPromotion }">
            {{ formatPrice(product.price) }}
          </span>
          <span class="sp-price sp-price--sale" v-if="isOnPromotion">
            {{ formatPrice(product.promotion_price) }}
          </span>
        </div>
        <div class="sp-prices" v-else>
          <span class="sp-price">999.000đ</span>
        </div>

        <div class="sp-meta">
          <div class="sp-meta-item" v-if="product?.sku">
            <span class="sp-meta-label">SKU</span>
            <span class="sp-meta-value">{{ product.sku }}</span>
          </div>
          <div class="sp-meta-item" v-if="product?.category">
            <span class="sp-meta-label">Danh mục</span>
            <span class="sp-meta-value">{{ product.category }}</span>
          </div>
          <div class="sp-meta-item">
            <span class="sp-meta-label">Tình trạng</span>
            <span class="sp-meta-value" :class="(product?.stock || 10) > 0 ? 'in-stock' : 'out-stock'">
              {{ (product?.stock || 10) > 0 ? `Còn hàng (${product?.stock || 10})` : 'Hết hàng' }}
            </span>
          </div>
        </div>

        <!-- Quantity -->
        <div class="sp-qty">
          <label>Số lượng</label>
          <div class="sp-qty-ctrl">
            <button @click="localQty = Math.max(1, localQty - 1)"><Minus :size="14" /></button>
            <input v-model.number="localQty" type="number" min="1" :max="product?.stock || 99" />
            <button @click="localQty++"><Plus :size="14" /></button>
          </div>
        </div>

        <!-- Actions -->
        <div class="sp-actions">
          <button class="sp-btn sp-btn--cart" @click="$emit('addToCart', { productId: product?.id, quantity: localQty })"
            :disabled="(product?.stock || 10) <= 0">
            <ShoppingCart :size="16" />
            Thêm vào giỏ
          </button>
          <button class="sp-btn sp-btn--buy" @click="$emit('buyNow', { productId: product?.id, quantity: localQty })"
            :disabled="(product?.stock || 10) <= 0">
            Mua ngay
          </button>
        </div>

        <!-- Description -->
        <div class="sp-desc" v-if="product?.description">
          <h3>Mô tả sản phẩm</h3>
          <div class="sp-desc-content" v-html="product.description"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Package, Minus, Plus, ShoppingCart } from 'lucide-vue-next'

const props = defineProps({
  product: { type: Object, default: null },
  qty: { type: Number, default: 1 },
  config: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['addToCart', 'buyNow', 'update:qty'])

const localQty = ref(props.qty)
watch(() => props.qty, (val) => localQty.value = val)
watch(localQty, (val) => emit('update:qty', val))

const isOnPromotion = computed(() => {
  const p = props.product
  if (!p || !p.promotion_price || p.promotion_price >= p.price) return false
  const now = Date.now()
  if (p.promotion_start && new Date(p.promotion_start).getTime() > now) return false
  if (p.promotion_end && new Date(p.promotion_end).getTime() < now) return false
  return true
})

function formatCurrency(amount) {
  if (!amount) return '0đ'
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'
}
function formatPrice(v) { return formatCurrency(v || 0) }
</script>

<style scoped>
.sp-content {
  background: var(--color-bg-card, #fff);
  border-radius: 16px;
  padding: 24px;
  margin: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.sp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.sp-main-img {
  position: relative; border-radius: 16px; overflow: hidden; background: var(--color-bg-primary, #f5f6fa);
  border: 1px solid var(--color-border, #e5e7eb); aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
}
.sp-img { width: 100%; height: 100%; object-fit: cover; }
.sp-img-placeholder { color: var(--color-text-muted, #94a3b8); }
.sp-promo-badge {
  position: absolute; top: 12px; right: 12px; padding: 6px 14px; border-radius: 10px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
  font-size: 14px; font-weight: 800;
}
.sp-info { display: flex; flex-direction: column; gap: 16px; }
.sp-brand { font-size: 13px; font-weight: 600; color: var(--sf-accent, #7c3aed); text-transform: uppercase; letter-spacing: 1px; }
.sp-name { font-size: 28px; font-weight: 800; line-height: 1.2; margin: 0; color: var(--color-text-primary, #1e293b); }
.sp-prices { display: flex; align-items: baseline; gap: 12px; }
.sp-price { font-size: 28px; font-weight: 800; color: var(--sf-accent, #7c3aed); }
.sp-price--old { text-decoration: line-through; color: var(--color-text-muted, #64748b); font-size: 18px; font-weight: 500; }
.sp-price--sale { color: #ef4444; }
.sp-meta { display: flex; gap: 20px; flex-wrap: wrap; padding: 16px 0; border-top: 1px solid var(--color-border, #e5e7eb); border-bottom: 1px solid var(--color-border, #e5e7eb); }
.sp-meta-item { display: flex; flex-direction: column; gap: 2px; }
.sp-meta-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted, #64748b); text-transform: uppercase; }
.sp-meta-value { font-size: 14px; font-weight: 600; color: var(--color-text-primary, #1e293b); }
.in-stock { color: #10b981; }
.out-stock { color: #ef4444; }
.sp-qty { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.sp-qty label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary, #475569); }
.sp-qty-ctrl { display: flex; align-items: center; border: 1px solid var(--color-border, #e5e7eb); border-radius: 10px; overflow: hidden; }
.sp-qty-ctrl button { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: #f8fafc; color: #475569; cursor: pointer; transition: background 0.15s; }
.sp-qty-ctrl button:hover { background: #f1f5f9; color: var(--sf-accent, #7c3aed); }
.sp-qty-ctrl input { width: 50px; text-align: center; border: none; border-left: 1px solid var(--color-border, #e5e7eb); border-right: 1px solid var(--color-border, #e5e7eb); background: #fff; color: #1e293b; font-size: 14px; font-weight: 600; outline: none; -moz-appearance: textfield; appearance: textfield; }
.sp-qty-ctrl input::-webkit-outer-spin-button, .sp-qty-ctrl input::-webkit-inner-spin-button { -webkit-appearance: none; appearance: none; }
.sp-actions { display: flex; gap: 12px; margin-top: 8px; }
.sp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; border-radius: 12px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.25s; }
.sp-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.sp-btn--cart { background: transparent; border: 2px solid var(--sf-accent, #7c3aed); color: var(--sf-accent, #7c3aed); }
.sp-btn--cart:hover:not(:disabled) { background: rgba(124, 58, 237, 0.05); }
.sp-btn--buy { background: var(--sf-accent, #7c3aed); color: #fff; }
.sp-btn--buy:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2); }
.sp-desc h3 { font-size: 16px; font-weight: 700; margin: 0 0 8px; color: var(--color-text-primary, #1e293b); }
.sp-desc-content { font-size: 14px; line-height: 1.7; color: var(--color-text-secondary, #475569); }
@media (max-width: 768px) {
  .sp-grid { grid-template-columns: 1fr; gap: 24px; }
  .sp-name { font-size: 22px; }
  .sp-price { font-size: 22px; }
}
</style>
