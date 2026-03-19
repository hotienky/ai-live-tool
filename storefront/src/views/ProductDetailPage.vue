<template>
  <div class="detail-page container">
    <!-- Mobile back button (hidden on desktop, shown on mobile) -->
    <button class="mobile-back-btn" @click="$router.back()">
      <ArrowLeft :size="16" />
      <span>{{ t('storefront.back') || 'Quay lại' }}</span>
    </button>

    <!-- Breadcrumb -->
    <nav v-if="detailConfig.showBreadcrumb" class="breadcrumb">
      <router-link :to="'/'">{{ t('storefront.home') || 'Trang chủ' }}</router-link>
      <ChevronRight :size="12" />
      <router-link :to="'/products'">{{ t('storefront.products') || 'Sản phẩm' }}</router-link>
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
      <div class="detail-grid" :class="'ratio--' + detailConfig.layoutRatio">
        <!-- Image Gallery -->
        <div class="detail-gallery" :class="'gallery--' + detailConfig.galleryStyle">
          <div class="detail-main-img"
            @mousemove="onImageZoom"
            @mouseleave="zoomActive = false"
            @mouseenter="zoomActive = true"
          >
            <img
              v-if="activeImage"
              :src="activeImage"
              :alt="product.name"
              class="detail-main-img__photo"
              :class="{ 'zoomed': zoomActive }"
              :style="zoomActive ? { transformOrigin: zoomOrigin } : {}"
            />
            <div v-else class="detail-placeholder">
              <Package :size="80" />
            </div>
            <span v-if="discountPercent" class="detail-badge">-{{ discountPercent }}%</span>
            <div v-if="zoomActive" class="zoom-hint">🔍 {{ t('storefront.zoom_hint') || 'Di chuột để zoom' }}</div>
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
              {{ t('storefront.save') || 'Tiết kiệm' }} {{ formatPrice(displayPrice - displayPromoPrice) }}
            </span>
            <span v-if="taxConfig.enabled" class="detail-tax-label">
              {{ taxConfig.display_mode === 'inclusive' ? (t('storefront.tax_inclusive', 'Đã gồm') + ' ' + (taxConfig.label || 'VAT')) : ('+ ' + (taxConfig.label || 'VAT')) }}
            </span>
          </div>

          <div class="detail-social-proof" v-if="product">
            <span class="social-proof__viewers">
              <Eye :size="14" /> {{ viewerCount }} {{ t('storefront.viewing') || 'người đang xem' }}
            </span>
            <span v-if="product.sold_count" class="social-proof__sold">
              {{ t('storefront.sold') || 'Đã bán' }} {{ formatSoldCount(product.sold_count) }}
            </span>
          </div>

          <!-- Variant Selector -->
          <div class="variant-selector" v-if="variants.length">
            <label class="variant-label">{{ t('storefront.variant') || 'Phân loại:' }}</label>
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
              <span class="detail-meta__label">{{ t('storefront.category') || 'Danh mục' }}</span>
              <span class="detail-meta__value">{{ product.category }}</span>
            </div>
            <div class="detail-meta">
              <span class="detail-meta__label">{{ t('storefront.status') || 'Tình trạng' }}</span>
              <span class="detail-meta__value" :class="displayStock > 0 ? 'in-stock' : 'out-stock'">
                {{ displayStock > 0 ? `${t('storefront.in_stock') || 'Còn hàng'} (${displayStock})` : t('storefront.out_of_stock') || 'Hết hàng' }}
              </span>
            </div>
          </div>

          <!-- Shipping Estimate -->
          <div class="shipping-estimate">
            <label class="shipping-estimate__label">
              <Truck :size="14" /> {{ t('storefront.shipping_estimate') || 'Ước tính phí vận chuyển' }}
            </label>
            <div class="shipping-estimate__row">
              <select v-model="estimateProvince" @change="fetchShippingEstimate" class="shipping-estimate__select">
                <option value="">{{ t('storefront.select_province') || 'Chọn tỉnh/thành' }}</option>
                <option v-for="p in estimateProvinces" :key="p.code" :value="p.code">{{ p.name }}</option>
              </select>
              <span v-if="estimateLoading" class="shipping-estimate__loading">{{ t('storefront.calculating') || 'Đang tính...' }}</span>
            </div>
            <div v-if="estimateResult" class="shipping-estimate__result">
              <span class="shipping-estimate__fee">
                {{ estimateResult.fee === 0 ? (t('storefront.free') || 'Miễn phí') : formatPrice(estimateResult.fee) }}
              </span>
              <span v-if="estimateResult.time" class="shipping-estimate__time">
                {{ estimateResult.time }}
              </span>
            </div>
          </div>

          <!-- Quantity -->
          <div class="detail-qty">
            <label>{{ t('storefront.quantity') || 'Số lượng' }}</label>
            <div class="detail-qty__ctrl">
              <button @click="qty = Math.max(1, qty - 1)"><Minus :size="14" /></button>
              <input v-model.number="qty" type="number" min="1" />
              <button @click="qty++"><Plus :size="14" /></button>
            </div>
          </div>

          <div class="detail-actions">
            <button class="btn btn--primary btn--lg" :disabled="displayStock <= 0" @click="handleAddToCart">
              <ShoppingCart :size="18" />
              {{ t('storefront.add_to_cart') || 'Thêm vào giỏ hàng' }}
            </button>
            <button
              class="btn btn--outline wl-btn"
              :class="{ 'wl-btn--active': isLiked(product.id) }"
              @click="toggleWishlist(product)"
              :title="isLiked(product.id) ? (t('storefront.remove_wishlist') || 'Bỏ yêu thích') : (t('storefront.add_wishlist') || 'Thêm vào yêu thích')"
            >
              <Heart :size="18" :fill="isLiked(product.id) ? 'currentColor' : 'none'" />
            </button>
          </div>

          <!-- Share -->
          <div class="detail-share">
            <span>{{ t('storefront.share') || 'Chia sẻ:' }}</span>
            <button class="detail-share__btn" @click="shareToFacebook" title="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
            <button class="detail-share__btn" @click="shareToZalo" title="Zalo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16a1.07 1.07 0 01-.373.736c-.128.104-.29.186-.48.242l-4.146 1.22 4.348 5.09c.207.243.26.556.14.84a.82.82 0 01-.712.476h-1.594a.867.867 0 01-.66-.305l-3.54-4.147v3.662a.793.793 0 01-.79.79H8.89a.793.793 0 01-.79-.79V8.026a.793.793 0 01.79-.79h.87a.793.793 0 01.79.79v3.04l4.488-3.616a.87.87 0 01.546-.19h1.42c.344 0 .623.177.746.465a.82.82 0 01-.18.906l.002-.47z"/></svg>
            </button>
            <button class="detail-share__btn" @click="copyLink" :title="t('storefront.copy_link') || 'Sao chép link'">
              <Link :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="detail-description" v-if="product.description">
        <h2 class="section-title">
          <FileText :size="20" class="section-title__accent" />
          {{ t('storefront.product_description') || 'Mô tả sản phẩm' }}
        </h2>
        <div class="detail-desc-content" v-html="product.description"></div>
      </div>

      <!-- Related Products -->
      <div class="related-section" v-if="detailConfig.showRelatedProducts && relatedProducts.length > 0">
        <h2 class="section-title">
          <Package :size="20" class="section-title__accent" />
          {{ t('storefront.related_products') || 'Sản phẩm liên quan' }}
        </h2>
        <div class="related-grid">
          <ProductCard v-for="p in relatedProducts" :key="p.id" :product="p" />
        </div>
      </div>

      <!-- Recently Viewed -->
      <div class="related-section" v-if="recentlyViewed.length > 1">
        <h2 class="section-title">
          <Clock :size="20" class="section-title__accent" />
          {{ t('storefront.recently_viewed') || 'Sản phẩm đã xem gần đây' }}
        </h2>
        <div class="related-grid">
          <ProductCard v-for="p in recentlyViewed.filter(rv => rv.id !== product?.id).slice(0, 6)" :key="'rv-' + p.id" :product="p" />
        </div>
      </div>

      <!-- Reviews Section -->
      <div v-if="detailConfig.showReviews" class="reviews-section" id="reviews">
        <h2 class="section-title">
          <Star :size="20" class="section-title__accent" />
          {{ t('storefront.reviews_title') || 'Đánh giá sản phẩm' }}
          <span v-if="reviewStats.total_reviews" class="review-count">({{ reviewStats.total_reviews }})</span>
        </h2>

        <!-- Rating Summary -->
        <div class="review-summary" v-if="reviewStats.total_reviews">
          <div class="review-avg">
            <span class="avg-number">{{ reviewStats.average_rating }}</span>
            <div class="avg-stars">
              <Star v-for="i in 5" :key="i" :size="18"
                :class="i <= Math.round(reviewStats.average_rating) ? 'star-filled' : 'star-empty'" />
            </div>
            <span class="avg-count">{{ reviewStats.total_reviews }} {{ t('storefront.reviews') || 'đánh giá' }}</span>
          </div>
          <div class="review-bars">
            <div v-for="n in [5,4,3,2,1]" :key="n" class="bar-row">
              <span class="bar-label">{{ n }} <Star :size="10" class="star-filled" /></span>
              <div class="bar-track"><div class="bar-fill" :style="{width: barPct(n)}"></div></div>
              <span class="bar-count">{{ reviewStats.rating_distribution?.[n] || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Review Form -->
        <div class="review-form-card" v-if="isLoggedIn">
          <h3><template v-if="existingReview"><RefreshCw :size="14" /> {{ t('storefront.update_review') || 'Cập nhật đánh giá' }}</template><template v-else><PenLine :size="14" /> {{ t('storefront.write_review') || 'Viết đánh giá' }}</template></h3>
          <div class="review-stars-input">
            <button v-for="i in 5" :key="i" @click="reviewForm.rating = i" class="star-btn">
              <Star :size="24" :class="i <= reviewForm.rating ? 'star-filled' : 'star-empty'" />
            </button>
          </div>
          <textarea v-model="reviewForm.comment" :placeholder="t('storefront.review_placeholder') || 'Chia sẻ cảm nhận của bạn về sản phẩm...'" rows="3"></textarea>
          <button class="btn btn--primary" @click="submitReview" :disabled="reviewSubmitting || !reviewForm.rating">
            {{ reviewSubmitting ? (t('storefront.submitting') || 'Đang gửi...') : (existingReview ? (t('storefront.update') || 'Cập nhật') : (t('storefront.submit_review') || 'Gửi đánh giá')) }}
          </button>
          <p v-if="reviewMsg" class="review-msg" :class="reviewMsgType">{{ reviewMsg }}</p>
        </div>
        <div v-else class="review-login-hint">
          <p><Lock :size="14" /> <router-link to="/auth">{{ t('storefront.login') || 'Đăng nhập' }}</router-link> {{ t('storefront.to_write_review') || 'để viết đánh giá' }}</p>
        </div>

        <!-- Reviews List -->
        <div v-if="reviewsLoading" class="reviews-loading"><Loader :size="14" class="spin" /> {{ t('storefront.loading_reviews') || 'Đang tải đánh giá...' }}</div>
        <div v-else-if="reviews.length" class="reviews-list">
          <div v-for="r in reviews" :key="r.id" class="review-card">
            <div class="review-header">
              <div class="review-avatar">{{ (r.customer_name || 'K')[0] }}</div>
              <div>
                <strong>{{ r.customer_name || t('storefront.customer') || 'Khách hàng' }}</strong>
                <div class="review-stars">
                  <Star v-for="i in 5" :key="i" :size="12"
                    :class="i <= r.rating ? 'star-filled' : 'star-empty'" />
                </div>
              </div>
              <small class="review-date">{{ formatReviewDate(r.created_at) }}</small>
            </div>
            <p class="review-comment" v-if="r.comment">{{ r.comment }}</p>
          </div>
        </div>
        <div v-else class="reviews-empty">
          <Star :size="32" class="star-empty" />
          <p>{{ t('storefront.no_reviews') || 'Chưa có đánh giá nào. Hãy là người đầu tiên!' }}</p>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="detail-404">
      <PackageX :size="64" />
      <h2>{{ t('storefront.product_not_found_title') || 'Không tìm thấy sản phẩm' }}</h2>
      <p>{{ t('storefront.product_not_found_desc') || 'Sản phẩm này không tồn tại hoặc đã bị ẩn' }}</p>
      <router-link :to="'/products'" class="btn btn--primary">
        <ArrowLeft :size="16" /> {{ t('storefront.back_to_shop') || 'Quay lại cửa hàng' }}
      </router-link>
    </div>

    <!-- Sticky Mobile Add-to-Cart Bar -->
    <transition name="slide-up">
      <div v-if="product && showStickyBar" class="sticky-cart-bar">
        <div class="sticky-cart-bar__price">
          <span v-if="isOnSale" class="price price--original">{{ formatPrice(product.price) }}</span>
          <span class="price price--sale">{{ formatPrice(isOnSale ? product.promotion_price : product.price) }}</span>
        </div>
        <button class="sticky-cart-bar__btn" :disabled="displayStock <= 0" @click="handleAddToCart">
          <ShoppingCart :size="16" /> {{ t('storefront.add_to_cart_short') || 'Thêm vào giỏ' }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { apiFetch, apiAuthPost } from '../api.js'
import {
  ChevronRight, Package, PackageX, Minus, Plus, ShoppingCart,
  Heart, Link, FileText, ArrowLeft, Star, Lock, PenLine, RefreshCw, Loader, Clock, Eye, Truck
} from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'
import { useAuth } from '../composables/useAuth.js'
import { useSeo } from '../composables/useSeo.js'
import { useWishlist } from '../composables/useWishlist.js'
import { useToast } from '../composables/useToast.js'
import { useRecentlyViewed } from '../composables/useRecentlyViewed.js'
import { useI18n } from '../composables/useI18n.js'
import ProductCard from '../components/ProductCard.vue'

const { t, currentLang } = useI18n()
const { addToCart } = useCart()
const { recentlyViewed, addProduct: addToRecentlyViewed } = useRecentlyViewed()
const { isLoggedIn, token: authToken } = useAuth()

// Shipping estimate on PDP
const estimateProvinces = ref([])
const estimateProvince = ref('')
const estimateLoading = ref(false)
const estimateResult = ref(null)

async function loadEstimateProvinces() {
  try {
    const data = await apiFetch('/shipping/provinces')
    estimateProvinces.value = Array.isArray(data) ? data : []
  } catch {}
}

async function fetchShippingEstimate() {
  if (!estimateProvince.value) { estimateResult.value = null; return }
  estimateLoading.value = true
  estimateResult.value = null
  try {
    const prov = estimateProvinces.value.find(p => p.code == estimateProvince.value)
    const wards = await apiFetch(`/shipping/wards/${estimateProvince.value}`)
    const firstWard = Array.isArray(wards) && wards.length ? wards[0] : null
    const params = new URLSearchParams({
      province: prov?.name || '',
      ward: firstWard?.name || '',
      weight: '500',
    })
    const res = await apiFetch(`/shipping/rates?${params}`)
    const rates = Array.isArray(res) ? res : []
    if (rates.length > 0) {
      const cheapest = rates.reduce((a, b) => (a.fee || 0) < (b.fee || 0) ? a : b)
      estimateResult.value = {
        fee: cheapest.fee || 0,
        time: cheapest.estimated_days || '',
      }
    }
  } catch {}
  estimateLoading.value = false
}
const { setProductSeo, setBreadcrumbs } = useSeo()
const { isLiked, toggleWishlist } = useWishlist()
const { showToast } = useToast()

const layoutConfig = inject('layoutConfig', ref(null))
const detailConfig = computed(() => {
  const defaults = { galleryStyle: 'thumbnails', layoutRatio: '50-50', showBreadcrumb: true, showRelatedProducts: true, relatedCount: 6, showReviews: true, pageTitle: '', pageDescription: '', translations: {} }
  const dc = layoutConfig.value?.pageConfigs?.productDetail
  const merged = dc ? { ...defaults, ...dc } : defaults
  const lang = currentLang.value
  if (lang && lang !== 'vi' && merged.translations?.[lang]) {
    if (merged.translations[lang].pageTitle) merged.pageTitle = merged.translations[lang].pageTitle
    if (merged.translations[lang].pageDescription) merged.pageDescription = merged.translations[lang].pageDescription
  }
  return merged
})

const props = defineProps({
  slug: { type: String, required: true },
})

const product = ref(null)
const loading = ref(true)
const qty = ref(1)
const activeImage = ref(null)
const selectedVariant = ref(null)
const taxConfig = ref({ enabled: false, display_mode: 'exclusive', label: 'Thuế' })

// Parse variants from product data (prefer variants_list from API, fallback to variants jsonb)
const variants = computed(() => {
  if (!product.value) return []
  const v = product.value.variants_list || product.value.variants
  if (!v) return []
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
    try {
      const arr = Array.isArray(extra) ? extra : (typeof extra === 'string' ? JSON.parse(extra) : [])
      arr.forEach(i => imgs.add(i))
    } catch { /* malformed JSON — skip */ }
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
  if (selectedVariant.value !== null) {
    const v = variants.value[selectedVariant.value]
    return Number(v?.promotion_price || 0)
  }
  return Number(product.value?.promotion_price || 0)
})

const displayOnSale = computed(() => {
  const promoPrice = displayPromoPrice.value
  const basePrice = displayPrice.value
  if (!promoPrice || promoPrice >= basePrice) return false
  // Check date range only for product-level (variant inherits validity)
  const p = product.value
  if (!p) return false
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
  showToast(t('storefront.link_copied') || 'Đã sao chép link!')
}

function shareToFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')
}

function shareToZalo() {
  window.open(`https://zalo.me/share?url=${encodeURIComponent(window.location.href)}`, '_blank')
}

// Sticky mobile cart bar
const showStickyBar = ref(false)
const zoomActive = ref(false)
const zoomOrigin = ref('50% 50%')

function onImageZoom(e) {
  if (window.innerWidth <= 768) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  zoomOrigin.value = `${x}% ${y}%`
}

// Social proof — simulated viewer count
const viewerCount = ref(0)
function generateViewerCount() {
  viewerCount.value = Math.floor(Math.random() * 15) + 3
}

function formatSoldCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n
}

function onScroll() {
  if (window.innerWidth > 768) { showStickyBar.value = false; return }
  showStickyBar.value = window.scrollY > 500
}
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  generateViewerCount()
  loadEstimateProvinces()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

async function loadProduct() {
  loading.value = true
  let attempts = 0
  const maxAttempts = 3
  while (attempts < maxAttempts) {
    try {
      product.value = await apiFetch(`/products/${props.slug}`)
      if (product.value?.name) {
        addToRecentlyViewed(product.value)
        setProductSeo(product.value, reviewStats.value)
        // Breadcrumb JSON-LD
        const base = window.location.origin
        const crumbs = [{ name: t('storefront.home', 'Trang chủ'), url: base + '/' }]
        if (product.value.category_name) {
          crumbs.push({ name: product.value.category_name, url: base + '/products?category=' + encodeURIComponent(product.value.category_name) })
        }
        crumbs.push({ name: product.value.name, url: window.location.href })
        setBreadcrumbs(crumbs)
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

onMounted(() => {
  loadProduct().then(() => { loadReviews(); loadRelated() })
  // Load tenant tax config
  apiFetch('/tax/config').then(d => {
    if (d) {
      taxConfig.value = {
        enabled: d.enabled === true || d.enabled === 'true',
        display_mode: d.display_mode || 'exclusive',
        label: d.label || 'VAT',
      }
    }
  }).catch(() => {})
})
watch(() => props.slug, () => { qty.value = 1; selectedVariant.value = null; loadProduct() })

const addedToCart = ref(false)
function handleAddToCart() {
  if (!product.value) return
  const v = selectedVariant.value !== null ? variants.value[selectedVariant.value] : null
  addToCart(product.value, qty.value, v)
  addedToCart.value = true
  setTimeout(() => { addedToCart.value = false }, 2000)
  const name = v ? `${product.value.name} — ${v.name}` : product.value.name
  showToast(` ✓ ${t('storefront.added_to_cart', 'Đã thêm')} "${name}" ${t('storefront.to_cart', 'vào giỏ hàng')}`, 'success')
}

// ── Related Products ──
const relatedProducts = ref([])
async function loadRelated() {
  if (!product.value || !detailConfig.value.showRelatedProducts) return
  try {
    const data = await apiFetch('/products', {
      per_page: detailConfig.value.relatedCount,
      category: product.value.category_id || null,
    })
    const items = data?.data || (Array.isArray(data) ? data : [])
    relatedProducts.value = items.filter(p => p.id !== product.value.id).slice(0, detailConfig.value.relatedCount)
  } catch { relatedProducts.value = [] }
}

// ── Reviews ──
const reviews = ref([])
const reviewStats = ref({ average_rating: 0, total_reviews: 0, rating_distribution: {} })
const reviewsLoading = ref(false)
const reviewForm = ref({ rating: 0, comment: '' })
const reviewSubmitting = ref(false)
const reviewMsg = ref('')
const reviewMsgType = ref('')
const existingReview = ref(null)

async function loadReviews() {
  if (!product.value) return
  reviewsLoading.value = true
  try {
    const data = await apiFetch(`/products/${product.value.id}/reviews`)
    reviews.value = data.reviews || []
    reviewStats.value = {
      average_rating: data.average_rating || 0,
      total_reviews: data.total_reviews || 0,
      rating_distribution: data.rating_distribution || {},
    }
    // Check if current user has reviewed
    if (isLoggedIn.value) {
      // Detect from customer_id match is server-side; check by looking for existing
      // For simplicity, we'll let the backend handle upsert
    }
  } catch { /* ignore */ }
  reviewsLoading.value = false
  // Update Product JSON-LD with AggregateRating (C15/C18)
  if (product.value && reviewStats.value.total_reviews > 0) {
    setProductSeo(product.value, reviewStats.value)
  }
}

async function submitReview() {
  if (!product.value || !reviewForm.value.rating) return
  if (!isLoggedIn.value) {
    reviewMsg.value = t('storefront.login_to_review', 'Vui lòng đăng nhập để gửi đánh giá')
    reviewMsgType.value = 'error'
    return
  }
  reviewSubmitting.value = true
  reviewMsg.value = ''
  try {
    await apiAuthPost(`/products/${product.value.id}/reviews`, {
      rating: reviewForm.value.rating,
      comment: reviewForm.value.comment,
    })
    reviewMsg.value = t('storefront.review_submitted', 'Đánh giá của bạn đã được gửi!')
    reviewMsgType.value = 'success'
    reviewForm.value = { rating: 0, comment: '' }
    await loadReviews()
  } catch (err) {
    reviewMsg.value = t('storefront.error', 'Lỗi') + ': ' + (err.message || t('storefront.cannot_submit_review', 'Không thể gửi đánh giá'))
    reviewMsgType.value = 'error'
  }
  reviewSubmitting.value = false
}

function barPct(n) {
  const total = reviewStats.value.total_reviews || 1
  const count = reviewStats.value.rating_distribution?.[n] || 0
  return Math.round((count / total) * 100) + '%'
}

function formatReviewDate(d) {
  return d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
}

watch(() => product.value?.id, () => { if (product.value) loadReviews() })
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

/* Shipping Estimate */
.shipping-estimate {
  padding: 14px 16px;
  border-radius: var(--sf-radius-md, 10px);
  border: 1px solid var(--sf-border);
  background: var(--sf-bg-card);
}
.shipping-estimate__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sf-text-primary);
  margin-bottom: 10px;
}
.shipping-estimate__label svg { color: #10b981; }
.shipping-estimate__row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.shipping-estimate__select {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--sf-border);
  background: var(--sf-input-bg, var(--sf-bg-card-hover, #f9fafb));
  color: var(--sf-text-primary);
  font-size: 13px;
  appearance: auto;
}
.shipping-estimate__loading {
  font-size: 12px;
  color: var(--sf-text-muted);
}
.shipping-estimate__result {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f0fdf4;
}
.shipping-estimate__fee {
  font-size: 14px;
  font-weight: 800;
  color: #10b981;
}
.shipping-estimate__time {
  font-size: 12px;
  color: var(--sf-text-secondary);
}

/* Mobile back button — hidden on desktop */
.mobile-back-btn {
  display: none;
}

/* Skeleton */
.detail-skeleton { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.detail-skeleton__info { display: flex; flex-direction: column; }

/* Grid */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px; }
.detail-grid.ratio--60-40 { grid-template-columns: 3fr 2fr; }
.detail-grid.ratio--40-60 { grid-template-columns: 2fr 3fr; }

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
.detail-thumb.active { border-color: var(--sf-accent-light); box-shadow: 0 0 0 2px var(--sf-accent-glow); }
.detail-thumb img { width: 100%; height: 100%; object-fit: cover; }

/* Info */
.detail-info { display: flex; flex-direction: column; gap: 16px; }
.detail-brand {
  font-size: 13px; font-weight: 700; color: var(--sf-accent-light);
  text-transform: uppercase; letter-spacing: 1.5px;
}
.detail-name { font-size: 30px; font-weight: 900; line-height: 1.2; margin: 0; }

.detail-prices {
  padding: 12px 0 10px; display: flex; flex-wrap: wrap; align-items: baseline; gap: 12px;
}
.detail-tax-label {
  font-size: 11px; font-weight: 700; color: var(--accent-primary, #7c3aed);
  background: rgba(124, 58, 237, 0.08); padding: 2px 8px; border-radius: 4px;
  letter-spacing: 0.3px;
}
.detail-save {
  font-size: 12px; font-weight: 700; color: #10b981;
  background: rgba(16, 185, 129, 0.1); padding: 4px 12px; border-radius: 100px;
}

/* Image Zoom */
.detail-main-img__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.detail-main-img__photo.zoomed {
  transform: scale(2);
  cursor: crosshair;
}
.zoom-hint {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 11px;
  pointer-events: none;
  opacity: 0.7;
}

/* Social Proof */
.detail-social-proof {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--sf-bg-card-hover, #f9fafb);
  font-size: 13px;
  color: var(--sf-text-secondary);
}
.social-proof__viewers {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #10b981;
  font-weight: 600;
}
.social-proof__sold {
  color: var(--sf-text-muted);
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
  background: var(--sf-accent-glow);
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
.detail-desc-content :deep(img) { border-radius: var(--sf-radius-md); margin: 16px 0; max-width: 100%; height: auto; }
.detail-desc-content :deep(h1),
.detail-desc-content :deep(h2),
.detail-desc-content :deep(h3) {
  color: var(--sf-text-primary); font-weight: 800; margin: 20px 0 8px; line-height: 1.3;
}
.detail-desc-content :deep(h1) { font-size: 22px; }
.detail-desc-content :deep(h2) { font-size: 18px; }
.detail-desc-content :deep(h3) { font-size: 16px; }
.detail-desc-content :deep(p) { margin: 0 0 12px; }
.detail-desc-content :deep(ul),
.detail-desc-content :deep(ol) {
  margin: 8px 0 16px; padding-left: 20px;
}
.detail-desc-content :deep(li) { margin-bottom: 6px; }
.detail-desc-content :deep(strong) { color: var(--sf-text-primary); font-weight: 700; }
.detail-desc-content :deep(a) { color: var(--sf-accent-light); text-decoration: underline; }
.detail-desc-content :deep(blockquote) {
  margin: 12px 0; padding: 12px 16px;
  border-left: 3px solid var(--sf-accent-light);
  background: var(--sf-bg-secondary, rgba(0,0,0,0.02));
  border-radius: 0 var(--sf-radius-sm) var(--sf-radius-sm) 0;
  font-style: italic;
}
.detail-desc-content :deep(table) {
  width: 100%; border-collapse: collapse; margin: 12px 0;
}
.detail-desc-content :deep(th),
.detail-desc-content :deep(td) {
  padding: 8px 12px; border: 1px solid var(--sf-border); text-align: left; font-size: 14px;
}
.detail-desc-content :deep(th) {
  background: var(--sf-bg-secondary, rgba(0,0,0,0.03)); font-weight: 700; color: var(--sf-text-primary);
}

/* 404 */
.detail-404 {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 100px; color: var(--sf-text-muted); text-align: center;
}
.detail-404 h2 { font-size: 22px; color: var(--sf-text-primary); }
.detail-404 a { text-decoration: none; }

/* Reviews */
.reviews-section {
  margin-top: 32px; padding: 32px; border-radius: var(--sf-radius-lg);
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
}
.review-count { font-weight: 400; font-size: 16px; color: var(--sf-text-muted); }

.star-filled { color: #f59e0b; fill: #f59e0b; }
.star-empty { color: var(--sf-border); }

.review-summary {
  display: flex; gap: 32px; margin-top: 20px; padding: 20px;
  background: var(--sf-bg-secondary, #fafafa); border-radius: 12px;
}
.review-avg { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 100px; }
.avg-number { font-size: 40px; font-weight: 900; color: var(--sf-text-primary); line-height: 1; }
.avg-stars { display: flex; gap: 2px; }
.avg-count { font-size: 12px; color: var(--sf-text-muted); }

.review-bars { flex: 1; display: flex; flex-direction: column; gap: 6px; justify-content: center; }
.bar-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.bar-label { display: flex; align-items: center; gap: 2px; width: 36px; color: var(--sf-text-muted); font-weight: 600; }
.bar-track { flex: 1; height: 8px; background: var(--sf-border); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: #f59e0b; border-radius: 4px; transition: width 0.3s; }
.bar-count { width: 24px; text-align: right; font-weight: 600; color: var(--sf-text-muted); }

.review-form-card {
  margin-top: 24px; padding: 20px; border-radius: 12px;
  border: 1px solid var(--sf-border); background: var(--sf-bg-primary);
}
.review-form-card h3 { margin: 0 0 12px; font-size: 15px; }
.review-stars-input { display: flex; gap: 4px; margin-bottom: 12px; }
.star-btn { background: none; border: none; cursor: pointer; padding: 2px; transition: transform 0.15s; }
.star-btn:hover { transform: scale(1.2); }
.review-form-card textarea {
  width: 100%; box-sizing: border-box; padding: 12px; border-radius: 10px;
  border: 1px solid var(--sf-border); background: var(--sf-bg-secondary);
  color: var(--sf-text-primary); font-size: 14px; resize: vertical;
  outline: none; margin-bottom: 12px; font-family: inherit;
}
.review-form-card textarea:focus { border-color: var(--sf-accent); }
.review-msg { margin-top: 8px; font-size: 13px; }
.review-msg.success { color: #10b981; }
.review-msg.error { color: #ef4444; }

.review-login-hint {
  margin-top: 20px; padding: 16px; text-align: center;
  background: var(--sf-bg-secondary); border-radius: 10px;
  font-size: 14px; color: var(--sf-text-muted);
}
.review-login-hint a { color: var(--sf-accent-light); font-weight: 700; }

.reviews-loading { text-align: center; padding: 24px; color: var(--sf-text-muted); font-size: 14px; }
.reviews-list { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; }
.review-card { padding: 16px; border-radius: 12px; border: 1px solid var(--sf-border); }
.review-header { display: flex; align-items: center; gap: 10px; }
.review-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--sf-accent), #a855f7);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px;
}
.review-header strong { font-size: 14px; }
.review-stars { display: flex; gap: 1px; margin-top: 2px; }
.review-date { margin-left: auto; font-size: 11px; color: var(--sf-text-muted); }
.review-comment { margin: 10px 0 0 46px; font-size: 14px; line-height: 1.6; color: var(--sf-text-secondary); }
.reviews-empty {
  text-align: center; padding: 32px; color: var(--sf-text-muted); margin-top: 20px;
}
.reviews-empty p { margin: 8px 0 0; font-size: 14px; }

/* Gallery grid style */
.gallery--grid .detail-main-img { aspect-ratio: auto; }
.gallery--grid .detail-thumbs {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px;
  overflow-x: visible;
}
.gallery--grid .detail-thumb {
  width: 100%; height: auto; aspect-ratio: 1;
}

/* Related Products */
.related-section {
  margin-top: 32px; padding: 32px; border-radius: var(--sf-radius-lg);
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px; margin-top: 20px;
}

/* ── Tablet (≤1024px) ─────────────────────────────────── */
@media (max-width: 1024px) {
  .detail-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
  .detail-name { font-size: 26px; }
  .btn--lg { padding: 12px 24px; font-size: 14px; }
  .related-grid { grid-template-columns: repeat(3, 1fr); }
  .detail-description { padding: 24px; }
  .reviews-section { padding: 24px; }
  .related-section { padding: 24px; }
}

/* ── Mobile (≤768px) ──────────────────────────────────── */
@media (max-width: 768px) {
  .detail-page { padding-top: 12px; padding-bottom: 40px; }

  /* Mobile back button */
  .mobile-back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    color: var(--sf-accent-light); font-size: 14px; font-weight: 600;
    padding: 0; margin-bottom: 14px;
    transition: opacity 0.2s;
  }
  .mobile-back-btn:hover { opacity: 0.75; }

  /* Stack gallery above info — override all ratio classes */
  .detail-grid,
  .detail-grid.ratio--60-40,
  .detail-grid.ratio--40-60 {
    grid-template-columns: 1fr; gap: 16px; margin-bottom: 20px;
  }
  .detail-skeleton { grid-template-columns: 1fr; }

  /* Gallery — compact on mobile */
  .detail-gallery { position: relative; }
  .detail-main-img {
    border-radius: 12px; aspect-ratio: 4/5; max-height: 44vh;
  }
  .detail-main-img img { object-fit: cover; }
  .detail-thumbs {
    display: flex; flex-direction: row; overflow-x: auto;
    gap: 6px; padding: 4px 0;
    scrollbar-width: none;
  }
  .detail-thumbs::-webkit-scrollbar { display: none; }
  .detail-thumb { width: 52px; height: 52px; flex-shrink: 0; border-radius: 8px; }

  /* Info section — tighter spacing */
  .detail-info { gap: 10px; }

  /* Typography */
  .detail-name { font-size: 20px; line-height: 1.3; }
  .detail-brand { font-size: 11px; }

  /* Price — compact */
  .detail-prices { padding: 8px 0; gap: 8px; }
  .detail-prices .price--original { font-size: 14px !important; }
  .detail-prices .price--sale,
  .detail-prices .price--current { font-size: 22px !important; }
  .detail-save { font-size: 11px; padding: 3px 8px; }

  /* Variant options — wrap, smaller */
  .variant-selector { padding: 10px 0; }
  .variant-options { flex-wrap: wrap; gap: 6px; }
  .variant-option { padding: 6px 12px; font-size: 12px; border-radius: 8px; }
  .variant-option__img { width: 24px; height: 24px; }

  /* Meta — inline compact */
  .detail-metas { gap: 12px; padding: 10px 0; flex-direction: row; }
  .detail-meta__label { font-size: 10px; }
  .detail-meta__value { font-size: 13px; }

  /* Qty — compact */
  .detail-qty { padding: 10px 0; gap: 10px; }
  .detail-qty label { font-size: 12px; }
  .detail-qty__ctrl button { width: 34px; height: 34px; }
  .detail-qty__ctrl input { width: 44px; font-size: 14px; }

  /* Actions — row */
  .detail-actions { gap: 8px; padding-top: 4px; }
  .btn--lg { flex: 1; padding: 12px 14px; font-size: 13px; justify-content: center; }

  /* Share */
  .detail-share { font-size: 12px; }

  /* Description */
  .detail-description { padding: 16px; margin-top: 4px; }
  .detail-desc-content { font-size: 14px; line-height: 1.7; }
  .detail-desc-content :deep(h1) { font-size: 18px; }
  .detail-desc-content :deep(h2) { font-size: 16px; }
  .detail-desc-content :deep(h3) { font-size: 15px; }
  .detail-desc-content :deep(ul),
  .detail-desc-content :deep(ol) { padding-left: 16px; }
  .detail-desc-content :deep(th),
  .detail-desc-content :deep(td) { padding: 6px 8px; font-size: 13px; }

  /* Reviews */
  .reviews-section { padding: 20px; }
  .review-summary { flex-direction: column; gap: 16px; }
  .review-comment { margin-left: 0; }
  .review-form-card textarea { min-height: 100px; }

  /* Related */
  .related-section { padding: 20px; }
  .related-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 14px; }

  /* Badge */
  .detail-badge { top: 10px; left: 10px; right: auto; padding: 5px 12px; font-size: 13px; font-weight: 800; }

  /* 404 state */
  .detail-404 { padding: 60px 20px; }
}

/* ── Small Mobile (≤480px) ────────────────────────────── */
@media (max-width: 480px) {
  .detail-page { padding-top: 8px; }
  .breadcrumb { font-size: 11px; gap: 4px; overflow-x: auto; white-space: nowrap; scrollbar-width: none; margin-bottom: 16px; }
  .breadcrumb::-webkit-scrollbar { display: none; }

  .detail-main-img { max-height: 40vh; border-radius: 10px; aspect-ratio: 4/5; }
  .detail-thumb { width: 46px; height: 46px; }

  .detail-name { font-size: 18px; }
  .detail-prices .price--sale,
  .detail-prices .price--current { font-size: 20px !important; }

  /* Variant — 2-column grid when many items */
  .variant-options { gap: 5px; }
  .variant-option { padding: 5px 10px; font-size: 11px; }

  /* Meta — stack on very small */
  .detail-metas { flex-direction: column; gap: 6px; }

  /* Actions stack vertical */
  .detail-actions { flex-direction: column; gap: 8px; }
  .btn--lg { width: 100%; padding: 11px 14px; }
  .wl-btn { width: 100%; justify-content: center; }

  /* Sections padding */
  .detail-description { padding: 16px; }
  .reviews-section { padding: 16px; }
  .related-section { padding: 16px; }
  .related-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .review-form-card { padding: 14px; }
  .review-summary { padding: 14px; }
  .avg-number { font-size: 32px; }
}
/* Wishlist heart button */
.wl-btn { color: var(--sf-text-muted); transition: all 0.25s; }
.wl-btn:hover { color: #ef4444; border-color: rgba(239,68,68,0.4); }
.wl-btn--active {
  color: #ef4444;
  border-color: rgba(239,68,68,0.5);
  background: rgba(239,68,68,0.06);
}

/* Sticky Mobile Cart Bar */
.sticky-cart-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 800;
  padding: 12px 16px;
  background: var(--sf-bg-card, #fff);
  border-top: 1px solid var(--sf-border);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sticky-cart-bar__price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.sticky-cart-bar__price .price--original {
  font-size: 12px;
  color: var(--sf-text-muted);
  text-decoration: line-through;
}
.sticky-cart-bar__price .price--sale {
  font-size: 18px;
  font-weight: 900;
  color: var(--sf-accent-light, var(--sf-accent));
}
.sticky-cart-bar__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--sf-radius-md, 10px);
  background: var(--sf-accent);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.sticky-cart-bar__btn:hover { opacity: 0.9; }
.sticky-cart-bar__btn:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 768px) {
  .sticky-cart-bar { display: flex; }
}

.slide-up-enter-active { animation: slideUpIn 0.3s ease; }
.slide-up-leave-active { animation: slideUpIn 0.2s ease reverse; }
@keyframes slideUpIn {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
