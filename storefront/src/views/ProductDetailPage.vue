<template>
  <div class="detail-page container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link :to="'/'">Trang chủ</router-link>
      <ChevronRight :size="12" />
      <router-link :to="'/products'">Sản phẩm</router-link>
      <ChevronRight :size="12" />
      <span>{{ product?.name || '...' }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="detail-loading">
      <div class="detail-skeleton">
        <div class="skeleton" style="aspect-ratio:1; border-radius:16px"></div>
        <div class="detail-skeleton__info">
          <div class="skeleton" style="height:16px; width:30%"></div>
          <div class="skeleton" style="height:32px; width:80%; margin-top:8px"></div>
          <div class="skeleton" style="height:28px; width:40%; margin-top:16px"></div>
          <div class="skeleton" style="height:100px; width:100%; margin-top:24px"></div>
        </div>
      </div>
    </div>

    <!-- Product Detail -->
    <div v-else-if="product" class="detail-content">
      <div class="detail-grid">
        <!-- Image -->
        <div class="detail-gallery">
          <div class="detail-main-img">
            <img v-if="product.image" :src="product.image" :alt="product.name" />
            <div v-else class="detail-placeholder">
              <Package :size="80" />
            </div>
            <span v-if="discountPercent" class="detail-badge">-{{ discountPercent }}%</span>
          </div>
        </div>

        <!-- Info -->
        <div class="detail-info">
          <span class="detail-brand" v-if="product.brand">{{ product.brand }}</span>
          <h1 class="detail-name">{{ product.name }}</h1>

          <!-- Prices -->
          <div class="detail-prices">
            <span v-if="isOnSale" class="price price--original" style="font-size:16px">
              {{ formatPrice(product.price) }}
            </span>
            <span :class="['price', isOnSale ? 'price--sale' : 'price--current']" style="font-size:28px">
              {{ formatPrice(isOnSale ? product.promotion_price : product.price) }}
            </span>
            <span v-if="isOnSale" class="detail-save">
              Tiết kiệm {{ formatPrice(product.price - product.promotion_price) }}
            </span>
          </div>

          <!-- Meta info -->
          <div class="detail-metas">
            <div v-if="product.sku" class="detail-meta">
              <span class="detail-meta__label">SKU</span>
              <span class="detail-meta__value">{{ product.sku }}</span>
            </div>
            <div v-if="product.category" class="detail-meta">
              <span class="detail-meta__label">Danh mục</span>
              <span class="detail-meta__value">{{ product.category }}</span>
            </div>
            <div class="detail-meta">
              <span class="detail-meta__label">Tình trạng</span>
              <span class="detail-meta__value" :class="product.stock > 0 ? 'in-stock' : 'out-stock'">
                {{ product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng' }}
              </span>
            </div>
          </div>

          <!-- Quantity -->
          <div class="detail-qty">
            <label>Số lượng</label>
            <div class="detail-qty__ctrl">
              <button @click="qty = Math.max(1, qty - 1)"><Minus :size="14" /></button>
              <input v-model.number="qty" type="number" min="1" />
              <button @click="qty++"><Plus :size="14" /></button>
            </div>
          </div>

          <!-- Actions -->
          <div class="detail-actions">
            <button class="btn btn--primary btn--lg" :disabled="product.stock <= 0" @click="handleAddToCart">
              <ShoppingCart :size="18" />
              Thêm vào giỏ hàng
            </button>
            <button class="btn btn--outline">
              <Heart :size="18" />
            </button>
          </div>

          <!-- Share -->
          <div class="detail-share">
            <span>Chia sẻ:</span>
            <button class="detail-share__btn" @click="copyLink" title="Sao chép link">
              <Link :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="detail-description" v-if="product.description">
        <h2 class="section-title">
          <FileText :size="20" class="section-title__accent" />
          Mô tả sản phẩm
        </h2>
        <div class="detail-desc-content" v-html="product.description"></div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="detail-404">
      <PackageX :size="64" />
      <h2>Không tìm thấy sản phẩm</h2>
      <p>Sản phẩm này không tồn tại hoặc đã bị ẩn</p>
      <router-link :to="'/products'" class="btn btn--primary">
        <ArrowLeft :size="16" /> Quay lại cửa hàng
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiFetch } from '../api.js'
import {
  ChevronRight, Package, PackageX, Minus, Plus, ShoppingCart,
  Heart, Link, FileText, ArrowLeft
} from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'

const { addToCart } = useCart()

const props = defineProps({
  
  productId: { type: String, required: true },
})

const product = ref(null)
const loading = ref(true)
const qty = ref(1)

const isOnSale = computed(() => {
  const p = product.value
  if (!p || !p.promotion_price || p.promotion_price >= p.price) return false
  const now = Date.now()
  if (p.promotion_start && new Date(p.promotion_start).getTime() > now) return false
  if (p.promotion_end && new Date(p.promotion_end).getTime() < now) return false
  return true
})

const discountPercent = computed(() => {
  if (!isOnSale.value) return 0
  return Math.round((1 - product.value.promotion_price / product.value.price) * 100)
})

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
}

async function loadProduct() {
  loading.value = true
  try {
    product.value = await apiFetch(`/products/${props.productId}`)
    if (product.value?.name) {
      document.title = `${product.value.name} — Cửa hàng`
    }
  } catch {
    product.value = null
  }
  loading.value = false
}

onMounted(() => loadProduct())
watch(() => props.productId, () => { qty.value = 1; loadProduct() })

const addedToCart = ref(false)
function handleAddToCart() {
  if (!product.value) return
  addToCart(product.value, qty.value)
  addedToCart.value = true
  setTimeout(() => { addedToCart.value = false }, 2000)
}
</script>

<style scoped>
.detail-page { padding-top: 24px; padding-bottom: 60px; }

/* Breadcrumb */
.breadcrumb {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--sf-text-muted); margin-bottom: 24px;
}
.breadcrumb a { color: var(--sf-text-secondary); text-decoration: none; transition: color 0.2s; }
.breadcrumb a:hover { color: var(--sf-accent-light); }
.breadcrumb span { color: var(--sf-text-primary); font-weight: 600; }

/* Skeleton */
.detail-skeleton { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.detail-skeleton__info { display: flex; flex-direction: column; }

/* Grid */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px; }

/* Gallery */
.detail-main-img {
  position: relative; border-radius: var(--sf-radius-xl); overflow: hidden;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border); aspect-ratio: 1;
}
.detail-main-img img { width: 100%; height: 100%; object-fit: cover; }
.detail-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--sf-text-muted);
}
.detail-badge {
  position: absolute; top: 16px; right: 16px; padding: 8px 18px;
  border-radius: var(--sf-radius-md);
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff; font-size: 16px; font-weight: 900;
}

/* Info */
.detail-info { display: flex; flex-direction: column; gap: 16px; }
.detail-brand {
  font-size: 13px; font-weight: 700; color: var(--sf-accent-light);
  text-transform: uppercase; letter-spacing: 1.5px;
}
.detail-name { font-size: 30px; font-weight: 900; line-height: 1.2; margin: 0; }

.detail-prices {
  display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
  padding: 16px 0; border-bottom: 1px solid var(--sf-border);
}
.detail-save {
  font-size: 12px; font-weight: 700; color: #10b981;
  background: rgba(16, 185, 129, 0.1); padding: 4px 12px; border-radius: 100px;
}

.detail-metas {
  display: flex; gap: 24px; flex-wrap: wrap;
  padding: 16px 0; border-bottom: 1px solid var(--sf-border);
}
.detail-meta { display: flex; flex-direction: column; gap: 2px; }
.detail-meta__label { font-size: 11px; font-weight: 700; color: var(--sf-text-muted); text-transform: uppercase; }
.detail-meta__value { font-size: 14px; font-weight: 700; }
.in-stock { color: #10b981; }
.out-stock { color: #ef4444; }

.detail-qty {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 0; border-bottom: 1px solid var(--sf-border);
}
.detail-qty label { font-size: 13px; font-weight: 700; color: var(--sf-text-secondary); }
.detail-qty__ctrl {
  display: flex; border: 1px solid var(--sf-border); border-radius: var(--sf-radius-sm); overflow: hidden;
}
.detail-qty__ctrl button {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border: none; background: var(--sf-bg-card);
  color: var(--sf-text-secondary); cursor: pointer; transition: all 0.15s;
}
.detail-qty__ctrl button:hover { background: var(--sf-bg-card-hover); color: var(--sf-accent-light); }
.detail-qty__ctrl input {
  width: 56px; text-align: center; border: none;
  border-left: 1px solid var(--sf-border); border-right: 1px solid var(--sf-border);
  background: var(--sf-bg-primary); color: var(--sf-text-primary);
  font-size: 15px; font-weight: 700; outline: none;
  -moz-appearance: textfield;
}
.detail-qty__ctrl input::-webkit-outer-spin-button,
.detail-qty__ctrl input::-webkit-inner-spin-button { -webkit-appearance: none; }

.detail-actions { display: flex; gap: 12px; padding-top: 8px; }
.btn--lg { padding: 14px 32px; font-size: 15px; }
.btn--lg:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.detail-share {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: var(--sf-text-muted);
}
.detail-share__btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid var(--sf-border); background: transparent;
  color: var(--sf-text-secondary); cursor: pointer; transition: all 0.2s;
}
.detail-share__btn:hover { border-color: var(--sf-accent); color: var(--sf-accent-light); }

/* Description */
.detail-description {
  padding: 32px; border-radius: var(--sf-radius-lg);
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
}
.detail-desc-content { font-size: 15px; line-height: 1.8; color: var(--sf-text-secondary); margin-top: 16px; }
.detail-desc-content :deep(img) { border-radius: var(--sf-radius-md); margin: 16px 0; }

/* 404 */
.detail-404 {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 100px; color: var(--sf-text-muted); text-align: center;
}
.detail-404 h2 { font-size: 22px; color: var(--sf-text-primary); }
.detail-404 a { text-decoration: none; }

@media (max-width: 768px) {
  .detail-grid { grid-template-columns: 1fr; gap: 24px; }
  .detail-skeleton { grid-template-columns: 1fr; }
  .detail-name { font-size: 22px; }
  .detail-actions { flex-direction: column; }
  .btn--lg { width: 100%; justify-content: center; }
}
</style>
