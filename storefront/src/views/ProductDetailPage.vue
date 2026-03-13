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
        <!-- Image Gallery -->
        <div class="detail-gallery">
          <div class="detail-main-img">
            <img v-if="activeImage" :src="activeImage" :alt="product.name" />
            <div v-else class="detail-placeholder">
              <Package :size="80" />
            </div>
            <span v-if="discountPercent" class="detail-badge">-{{ discountPercent }}%</span>
          </div>
          <!-- Thumbnails -->
          <div class="detail-thumbs" v-if="allImages.length > 1">
            <button
              v-for="(img, idx) in allImages"
              :key="idx"
              class="detail-thumb"
              :class="{ active: activeImage === img }"
              @click="activeImage = img"
            >
              <img :src="img" :alt="`${product.name} - ${idx + 1}`" />
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="detail-info">
          <span class="detail-brand" v-if="product.brand">{{ product.brand }}</span>
          <h1 class="detail-name">{{ product.name }}</h1>

          <!-- Prices -->
          <div class="detail-prices">
            <span v-if="displayOnSale" class="price price--original" style="font-size:16px">
              {{ formatPrice(displayPrice) }}
            </span>
            <span :class="['price', displayOnSale ? 'price--sale' : 'price--current']" style="font-size:28px">
              {{ formatPrice(displayOnSale ? displayPromoPrice : displayPrice) }}
            </span>
            <span v-if="displayOnSale" class="detail-save">
              Tiết kiệm {{ formatPrice(displayPrice - displayPromoPrice) }}
            </span>
          </div>

          <!-- Variant Selector -->
          <div class="variant-selector" v-if="variants.length">
            <label class="variant-label">Phân loại:</label>
            <div class="variant-options">
              <button
                v-for="(v, vi) in variants"
                :key="vi"
                class="variant-option"
                :class="{ active: selectedVariant === vi }"
                @click="selectVariant(vi)"
              >
                <img v-if="v.image" :src="v.image" class="variant-option__img" />
                <span>{{ v.name }}</span>
              </button>
            </div>
          </div>

          <!-- Meta info -->
          <div class="detail-metas">
            <div v-if="displaySku" class="detail-meta">
              <span class="detail-meta__label">SKU</span>
              <span class="detail-meta__value">{{ displaySku }}</span>
            </div>
            <div v-if="product.category" class="detail-meta">
              <span class="detail-meta__label">Danh mục</span>
              <span class="detail-meta__value">{{ product.category }}</span>
            </div>
            <div class="detail-meta">
              <span class="detail-meta__label">Tình trạng</span>
              <span class="detail-meta__value" :class="displayStock > 0 ? 'in-stock' : 'out-stock'">
                {{ displayStock > 0 ? `Còn hàng (${displayStock})` : 'Hết hàng' }}
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
            <button class="btn btn--primary btn--lg" :disabled="displayStock <= 0" @click="handleAddToCart">
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
  slug: { type: String, required: true },
})

const product = ref(null)
const loading = ref(true)
const qty = ref(1)
const activeImage = ref(null)
const selectedVariant = ref(null)

// Parse variants from product data
const variants = computed(() => {
  if (!product.value?.variants) return []
  const v = product.value.variants
  return Array.isArray(v) ? v : (typeof v === 'string' ? JSON.parse(v) : [])
})

// Build all images array (main image + additional images + variant images)
const allImages = computed(() => {
  if (!product.value) return []
  const imgs = new Set()
  // Main image
  if (product.value.image_url) imgs.add(product.value.image_url)
  // Additional images
  const extra = product.value.images
  if (extra) {
    const arr = Array.isArray(extra) ? extra : (typeof extra === 'string' ? JSON.parse(extra) : [])
    arr.forEach(i => imgs.add(i))
  }
  // Variant images
  variants.value.forEach(v => { if (v.image) imgs.add(v.image) })
  return [...imgs]
})

// Display values (based on selected variant or base product)
const displayPrice = computed(() => {
  if (selectedVariant.value !== null && variants.value[selectedVariant.value]?.price) {
    return Number(variants.value[selectedVariant.value].price)
  }
  return Number(product.value?.price || 0)
})

const displayPromoPrice = computed(() => {
  return Number(product.value?.promotion_price || 0)
})

const displayOnSale = computed(() => {
  if (selectedVariant.value !== null) return false // Variants don't have promo prices
  const p = product.value
  if (!p || !p.promotion_price || p.promotion_price >= p.price) return false
  const now = Date.now()
  if (p.promotion_start && new Date(p.promotion_start).getTime() > now) return false
  if (p.promotion_end && new Date(p.promotion_end).getTime() < now) return false
  return true
})

const displayStock = computed(() => {
  if (selectedVariant.value !== null && variants.value[selectedVariant.value]?.stock !== undefined) {
    return Number(variants.value[selectedVariant.value].stock)
  }
  return Number(product.value?.stock || 0)
})

const displaySku = computed(() => {
  if (selectedVariant.value !== null && variants.value[selectedVariant.value]?.sku) {
    return variants.value[selectedVariant.value].sku
  }
  return product.value?.sku || ''
})

const discountPercent = computed(() => {
  if (!displayOnSale.value) return 0
  return Math.round((1 - displayPromoPrice.value / displayPrice.value) * 100)
})

function selectVariant(idx) {
  selectedVariant.value = selectedVariant.value === idx ? null : idx
  const v = variants.value[idx]
  if (v?.image) {
    activeImage.value = v.image
  }
}

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
}

async function loadProduct() {
  loading.value = true
  let attempts = 0
  const maxAttempts = 3
  while (attempts < maxAttempts) {
    try {
      product.value = await apiFetch(`/products/${props.slug}`)
      if (product.value?.name) {
        document.title = `${product.value.name} — Cửa hàng`
      }
      // Set initial active image
      if (product.value) {
        const imgs = allImages.value
        activeImage.value = imgs.length > 0 ? imgs[0] : null
      }
      break
    } catch (e) {
      attempts++
      if (attempts >= maxAttempts) {
        product.value = null
      } else {
        await new Promise(r => setTimeout(r, 500))
      }
    }
  }
  loading.value = false
}

onMounted(() => loadProduct())
watch(() => props.slug, () => { qty.value = 1; selectedVariant.value = null; loadProduct() })

const addedToCart = ref(false)
function handleAddToCart() {
  if (!product.value) return
  const cartItem = { ...product.value }
  if (selectedVariant.value !== null) {
    const v = variants.value[selectedVariant.value]
    cartItem.name = `${product.value.name} - ${v.name}`
    if (v.price) cartItem.price = v.price
    if (v.sku) cartItem.sku = v.sku
    if (v.image) cartItem.image = v.image
  }
  addToCart(cartItem, qty.value)
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
.detail-gallery { display: flex; flex-direction: column; gap: 12px; }
.detail-main-img {
  position: relative; border-radius: var(--sf-radius-xl); overflow: hidden;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border); aspect-ratio: 1;
}
.detail-main-img img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; }
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

/* Thumbnails */
.detail-thumbs {
  display: flex; gap: 8px; overflow-x: auto; padding: 4px 0;
}
.detail-thumb {
  width: 64px; height: 64px; flex-shrink: 0; border-radius: 10px; overflow: hidden;
  border: 2px solid transparent; cursor: pointer; background: var(--sf-bg-card);
  padding: 0; transition: all 0.2s;
}
.detail-thumb:hover { border-color: var(--sf-accent); opacity: 0.85; }
.detail-thumb.active { border-color: var(--sf-accent-light); box-shadow: 0 0 0 2px rgba(124,58,237,0.3); }
.detail-thumb img { width: 100%; height: 100%; object-fit: cover; }

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

/* Variant Selector */
.variant-selector {
  padding: 16px 0; border-bottom: 1px solid var(--sf-border);
}
.variant-label {
  display: block; font-size: 13px; font-weight: 700;
  color: var(--sf-text-secondary); margin-bottom: 10px;
}
.variant-options { display: flex; flex-wrap: wrap; gap: 8px; }
.variant-option {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 10px;
  border: 2px solid var(--sf-border); background: var(--sf-bg-card);
  color: var(--sf-text-primary); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.variant-option:hover { border-color: var(--sf-accent); }
.variant-option.active {
  border-color: var(--sf-accent-light);
  background: rgba(124, 58, 237, 0.08);
  color: var(--sf-accent-light);
}
.variant-option__img {
  width: 28px; height: 28px; border-radius: 6px; object-fit: cover;
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
  -moz-appearance: textfield; -webkit-appearance: none; appearance: none;
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
  .variant-options { gap: 6px; }
  .variant-option { padding: 6px 12px; font-size: 12px; }
}
</style>
