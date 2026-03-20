<template>
  <div class="sp">
    <!-- Back button -->
    <button class="sp-back" @click="$emit('back')">
      <ArrowLeft :size="16" /> Quay lại
    </button>

    <div class="sp-content" v-if="product">
      <div class="sp-grid">
        <!-- Left: Image Gallery -->
        <div class="sp-gallery">
          <div class="sp-main-img">
            <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="sp-img" />
            <Package v-else :size="80" class="sp-img-placeholder" />
            <span class="sp-promo-badge" v-if="isOnPromotion">
              -{{ Math.round((1 - product.promotion_price / product.price) * 100) }}%
            </span>
          </div>
        </div>

        <!-- Right: Product Info -->
        <div class="sp-info">
          <span class="sp-brand" v-if="product.brand">{{ product.brand }}</span>
          <h1 class="sp-name">{{ product.name }}</h1>

          <div class="sp-prices">
            <span class="sp-price" :class="{ 'sp-price--old': isOnPromotion }">
              {{ formatPrice(product.price) }}
            </span>
            <span class="sp-price sp-price--sale" v-if="isOnPromotion">
              {{ formatPrice(product.promotion_price) }}
            </span>
          </div>

          <div class="sp-meta">
            <div class="sp-meta-item" v-if="product.sku">
              <span class="sp-meta-label">SKU</span>
              <span class="sp-meta-value">{{ product.sku }}</span>
            </div>
            <div class="sp-meta-item" v-if="product.category">
              <span class="sp-meta-label">{{ t('admin.msg_53d8de58', 'Danh mục') }}</span>
              <span class="sp-meta-value">{{ product.category }}</span>
            </div>
            <div class="sp-meta-item">
              <span class="sp-meta-label">{{ t('admin.msg_d841d3ec', 'Tình trạng') }}</span>
              <span class="sp-meta-value" :class="product.stock > 0 ? 'in-stock' : 'out-stock'">
                {{ product.stock > 0 ? `Còn hàng (${product.stock})` : t('admin.msg_c95536d3', 'Hết hàng') }}
              </span>
            </div>
          </div>

          <!-- Quantity -->
          <div class="sp-qty">
            <label>{{ t('admin.msg_61012ba9', 'Số lượng') }}</label>
            <div class="sp-qty-ctrl">
              <button @click="qty = Math.max(1, qty - 1)"><Minus :size="14" /></button>
              <input v-model.number="qty" type="number" min="1" :max="product.stock || 99" />
              <button @click="qty++"><Plus :size="14" /></button>
            </div>
          </div>

          <!-- Actions -->
          <div class="sp-actions">
            <button class="sp-btn sp-btn--cart" @click="$emit('addToCart', { productId: product.id, quantity: qty })"
              :disabled="product.stock <= 0">
              <ShoppingCart :size="16" />
              Thêm vào giỏ
            </button>
            <button class="sp-btn sp-btn--buy" @click="$emit('buyNow', { productId: product.id, quantity: qty })"
              :disabled="product.stock <= 0">
              Mua ngay
            </button>
          </div>

          <!-- Description -->
          <div class="sp-desc" v-if="product.description">
            <h3>{{ t('admin.msg_168e3133', 'Mô tả sản phẩm') }}</h3>
            <div class="sp-desc-content" v-html="product.description"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="sp-loading" v-else-if="loading">
      <Loader2 :size="24" class="spin" /> Đang tải...
    </div>
    <div class="sp-error" v-else>
      <PackageX :size="40" />
      <p>{{ t('admin.msg_5e1cab5b', 'Không tìm thấy sản phẩm') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowLeft, Package, Minus, Plus, ShoppingCart, Loader2, PackageX } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'


const props = defineProps({
  storeId: { type: [String, Number], required: true },
  productId: { type: [String, Number], required: true },
})
const emit = defineEmits(['back', 'addToCart', 'buyNow'])

const product = ref(null)
const loading = ref(true)
const qty = ref(1)

const isOnPromotion = computed(() => {
  const p = product.value
  if (!p || !p.promotion_price || p.promotion_price >= p.price) return false
  const now = Date.now()
  if (p.promotion_start && new Date(p.promotion_start).getTime() > now) return false
  if (p.promotion_end && new Date(p.promotion_end).getTime() < now) return false
  return true
})

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

async function loadProduct() {
  loading.value = true
  try {
    const data = await apiFetch(`/storefront/products/${props.productId}`)
    product.value = await data.json()
  } catch { product.value = null }
  loading.value = false
}

onMounted(() => loadProduct())
watch(() => props.productId, () => { qty.value = 1; loadProduct() })
</script>

<style scoped>
.sp { min-height: 100vh; background: var(--color-bg-primary); color: var(--color-text-primary); padding: 20px 24px; }
.sp-back {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px;
  border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; margin-bottom: 20px;
}
.sp-back:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.sp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }

/* Gallery */
.sp-gallery {}
.sp-main-img {
  position: relative; border-radius: 16px; overflow: hidden; background: var(--color-bg-card);
  border: 1px solid var(--color-border); aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
}
.sp-img { width: 100%; height: 100%; object-fit: cover; }
.sp-img-placeholder { color: var(--color-text-muted); }
.sp-promo-badge {
  position: absolute; top: 12px; right: 12px; padding: 6px 14px; border-radius: 10px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
  font-size: 14px; font-weight: 800;
}

/* Info */
.sp-info { display: flex; flex-direction: column; gap: 16px; }
.sp-brand { font-size: 13px; font-weight: 600; color: var(--color-accent-primary); text-transform: uppercase; letter-spacing: 1px; }
.sp-name { font-size: 28px; font-weight: 800; line-height: 1.2; margin: 0; }
.sp-prices { display: flex; align-items: baseline; gap: 12px; }
.sp-price { font-size: 28px; font-weight: 800; color: var(--color-accent-primary); }
.sp-price--old { text-decoration: line-through; color: var(--color-text-muted); font-size: 18px; font-weight: 500; }
.sp-price--sale { color: var(--color-accent-hot); }

.sp-meta { display: flex; gap: 20px; flex-wrap: wrap; padding: 16px 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
.sp-meta-item { display: flex; flex-direction: column; gap: 2px; }
.sp-meta-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }
.sp-meta-value { font-size: 14px; font-weight: 600; }
.in-stock { color: #10b981; }
.out-stock { color: #ef4444; }

.sp-qty { display: flex; align-items: center; gap: 12px; }
.sp-qty label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.sp-qty-ctrl {
  display: flex; align-items: center; border: 1px solid var(--color-border);
  border-radius: 10px; overflow: hidden;
}
.sp-qty-ctrl button {
  display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;
  border: none; background: var(--color-bg-card); color: var(--color-text-secondary);
  cursor: pointer; transition: background 0.15s;
}
.sp-qty-ctrl button:hover { background: var(--color-bg-card-hover); color: var(--color-accent-primary); }
.sp-qty-ctrl input {
  width: 50px; text-align: center; border: none; border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); font-size: 14px; font-weight: 600;
  outline: none; -moz-appearance: textfield;
}
.sp-qty-ctrl input::-webkit-outer-spin-button,
.sp-qty-ctrl input::-webkit-inner-spin-button { -webkit-appearance: none; }

.sp-actions { display: flex; gap: 12px; }
.sp-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px;
  border-radius: 12px; border: none; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.25s;
}
.sp-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.sp-btn--cart { background: var(--color-bg-card); border: 2px solid var(--color-accent-primary); color: var(--color-accent-primary); }
.sp-btn--cart:hover:not(:disabled) { background: var(--color-accent-glow); }
.sp-btn--buy { background: var(--color-accent-primary); color: #fff; }
.sp-btn--buy:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: var(--accent-shadow); }

.sp-desc h3 { font-size: 16px; font-weight: 700; margin: 0 0 8px; }
.sp-desc-content { font-size: 14px; line-height: 1.7; color: var(--color-text-secondary); }

.sp-loading, .sp-error { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 80px; color: var(--color-text-muted); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .sp-grid { grid-template-columns: 1fr; gap: 24px; }
  .sp-name { font-size: 22px; }
  .sp-price { font-size: 22px; }
}
</style>
