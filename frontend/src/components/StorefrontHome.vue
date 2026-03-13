<template>
  <div class="sf">
    <!-- Header -->
    <header class="sf-header">
      <div class="sf-header__left">
        <Store :size="20" class="sf-header__logo-icon" />
        <span class="sf-header__name">{{ storeInfo?.shop_name || 'Shop' }}</span>
      </div>
      <div class="sf-header__search">
        <Search :size="16" />
        <input v-model="search" type="text" placeholder="Tìm sản phẩm..." class="sf-search-input" @keyup.enter="loadProducts" />
      </div>
      <div class="sf-header__right">
        <button class="sf-header__btn" @click="$emit('navigate', 'cart')">
          <ShoppingCart :size="18" />
          <span class="sf-cart-count" v-if="cartCount > 0">{{ cartCount }}</span>
        </button>
        <button class="sf-header__btn" @click="$emit('navigate', 'account')">
          <User :size="18" />
        </button>
      </div>
    </header>

    <!-- Banner Slider -->
    <section class="sf-banners" v-if="banners.length > 0">
      <div class="sf-banner-track" :style="{ transform: `translateX(-${bannerIdx * 100}%)` }">
        <div v-for="b in banners" :key="b.id" class="sf-banner-slide">
          <img v-if="b.image_url || b.image" :src="b.image_url || b.image" :alt="b.title" class="sf-banner-img" />
          <div class="sf-banner-overlay">
            <h2 class="sf-banner-title">{{ b.title }}</h2>
            <p class="sf-banner-desc" v-if="b.description">{{ b.description }}</p>
          </div>
        </div>
      </div>
      <div class="sf-banner-dots">
        <button v-for="(_, i) in banners" :key="i" class="sf-dot" :class="{ active: bannerIdx === i }" @click="bannerIdx = i" />
      </div>
    </section>

    <!-- Categories -->
    <section class="sf-section" v-if="categories.length > 0">
      <h3 class="sf-section__title"><Grid :size="16" /> Danh mục</h3>
      <div class="sf-categories">
        <button v-for="cat in categories" :key="cat.id" class="sf-cat-card" :class="{ active: selectedCat === cat.id }"
          @click="selectedCat = selectedCat === cat.id ? null : cat.id; loadProducts()">
          <FolderOpen :size="20" />
          <span>{{ cat.name }}</span>
        </button>
      </div>
    </section>

    <!-- Products Grid -->
    <section class="sf-section">
      <h3 class="sf-section__title"><ShoppingBag :size="16" /> Sản phẩm
        <span class="sf-count" v-if="totalProducts">({{ totalProducts }})</span>
      </h3>
      <div class="sf-products" v-if="products.length > 0">
        <div v-for="p in products" :key="p.id" class="sf-product-card" @click="$emit('viewProduct', p.id)">
          <div class="sf-product-img-wrap">
            <img v-if="p.image_url || p.image" :src="p.image_url || p.image" :alt="p.name" class="sf-product-img" />
            <Package v-else :size="40" class="sf-product-placeholder" />
            <span class="sf-promo-badge" v-if="isOnPromotion(p)">
              -{{ Math.round((1 - p.promotion_price / p.price) * 100) }}%
            </span>
          </div>
          <div class="sf-product-info">
            <h4 class="sf-product-name">{{ p.name }}</h4>
            <div class="sf-product-prices">
              <span class="sf-price" :class="{ 'sf-price--old': isOnPromotion(p) }">{{ formatPrice(p.price) }}</span>
              <span class="sf-price sf-price--promo" v-if="isOnPromotion(p)">{{ formatPrice(p.promotion_price) }}</span>
            </div>
            <span class="sf-product-cat" v-if="p.category">{{ p.category }}</span>
          </div>
        </div>
      </div>
      <p v-else class="sf-empty">Không có sản phẩm nào</p>

      <!-- Pagination -->
      <div class="sf-pagination" v-if="totalPages > 1">
        <button class="sf-page-btn" :disabled="page <= 1" @click="page--; loadProducts()">
          <ChevronLeft :size="16" />
        </button>
        <span class="sf-page-info">{{ page }} / {{ totalPages }}</span>
        <button class="sf-page-btn" :disabled="page >= totalPages" @click="page++; loadProducts()">
          <ChevronRight :size="16" />
        </button>
      </div>
    </section>

    <!-- CMS Pages Links -->
    <section class="sf-section" v-if="pages.length > 0">
      <h3 class="sf-section__title"><FileText :size="16" /> Trang thông tin</h3>
      <div class="sf-pages">
        <button v-for="pg in pages" :key="pg.id" class="sf-page-link" @click="$emit('viewPage', pg.id)">
          <FileText :size="14" />
          {{ pg.title }}
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="sf-footer">
      <p>© {{ new Date().getFullYear() }} {{ storeInfo?.shop_name || 'Shop' }}. Powered by KAC company</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Store, Search, ShoppingCart, User, Grid, FolderOpen, ShoppingBag, Package, FileText, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { API_BASE } from '../config.js'

const props = defineProps({
  storeId: { type: [String, Number], required: true },
  cartCount: { type: Number, default: 0 },
})
const emit = defineEmits(['viewProduct', 'viewPage', 'navigate'])

const storeInfo = ref(null)
const banners = ref([])
const categories = ref([])
const products = ref([])
const pages = ref([])
const search = ref('')
const selectedCat = ref(null)
const page = ref(1)
const totalProducts = ref(0)
const totalPages = ref(1)
const bannerIdx = ref(0)

let bannerTimer = null

async function sfApiFetch(path) {
  const res = await fetch(`${API_BASE}/storefront${path}`, {
    headers: { 'Accept': 'application/json' },
  })
  const json = await res.json()
  // Unwrap API envelope
  if (json && typeof json === 'object' && 'data' in json && json.type) return json.data
  return json
}

async function loadStoreInfo() {
  try { storeInfo.value = await sfApiFetch('/info') } catch { /* ignore */ }
}

async function loadBanners() {
  try { banners.value = await sfApiFetch('/banners') } catch { banners.value = [] }
}

async function loadCategories() {
  try { categories.value = await sfApiFetch('/categories') } catch { categories.value = [] }
}

async function loadProducts() {
  try {
    const params = new URLSearchParams()
    params.set('page', page.value)
    params.set('limit', '12')
    if (search.value) params.set('search', search.value)
    if (selectedCat.value) params.set('category', selectedCat.value)
    const data = await sfApiFetch(`/products?${params}`)
    products.value = data.data || data
    totalProducts.value = data.meta?.total || products.value.length
    totalPages.value = data.meta?.lastPage || data.meta?.last_page || 1
  } catch { products.value = [] }
}

async function loadPages() {
  try { pages.value = await sfApiFetch('/pages') } catch { pages.value = [] }
}

function isOnPromotion(p) {
  if (!p.promotion_price || p.promotion_price >= p.price) return false
  const now = Date.now()
  if (p.promotion_start && new Date(p.promotion_start).getTime() > now) return false
  if (p.promotion_end && new Date(p.promotion_end).getTime() < now) return false
  return true
}

function formatPrice(v) {
  return Number(v || 0).toLocaleString('vi-VN') + 'đ'
}

function startBannerAuto() {
  if (bannerTimer) clearInterval(bannerTimer)
  bannerTimer = setInterval(() => {
    if (banners.value.length > 1) {
      bannerIdx.value = (bannerIdx.value + 1) % banners.value.length
    }
  }, 5000)
}

onMounted(async () => {
  await Promise.all([loadStoreInfo(), loadBanners(), loadCategories(), loadProducts(), loadPages()])
  startBannerAuto()
})

watch(() => props.storeId, async () => {
  page.value = 1; search.value = ''; selectedCat.value = null
  await Promise.all([loadStoreInfo(), loadBanners(), loadCategories(), loadProducts(), loadPages()])
})
</script>

<style scoped>
.sf { min-height: 100vh; background: var(--color-bg-primary); color: var(--color-text-primary); }

/* ── Header ── */
.sf-header {
  display: flex; align-items: center; gap: 16px; padding: 12px 24px;
  background: var(--color-header-bg); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 50;
}
.sf-header__left { display: flex; align-items: center; gap: 8px; }
.sf-header__logo-icon { color: var(--color-accent-primary); }
.sf-header__name { font-size: 18px; font-weight: 800; background: linear-gradient(135deg, var(--color-accent-primary), #ff8c42); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.sf-header__search {
  flex: 1; max-width: 480px; margin: 0 auto; display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 12px; background: var(--color-bg-card);
  border: 1px solid var(--color-border); transition: border-color 0.2s;
}
.sf-header__search:focus-within { border-color: var(--color-accent-primary); }
.sf-header__search svg { color: var(--color-text-muted); flex-shrink: 0; }
.sf-search-input { flex: 1; border: none; background: transparent; color: var(--color-text-primary); font-size: 14px; outline: none; }
.sf-header__right { display: flex; align-items: center; gap: 8px; }
.sf-header__btn {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--color-border);
  background: transparent; color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s;
}
.sf-header__btn:hover { color: var(--color-accent-primary); border-color: var(--color-accent-primary); background: rgba(124,58,237,0.08); }
.sf-cart-count {
  position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px;
  border-radius: 9px; background: var(--color-accent-hot); color: #fff;
  font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
}

/* ── Banners ── */
.sf-banners {
  position: relative; overflow: hidden; border-radius: 16px; margin: 20px 24px;
  aspect-ratio: 21/9; background: var(--color-bg-card);
}
.sf-banner-track { display: flex; transition: transform 0.6s cubic-bezier(.4,0,.2,1); height: 100%; }
.sf-banner-slide { min-width: 100%; position: relative; }
.sf-banner-img { width: 100%; height: 100%; object-fit: cover; }
.sf-banner-overlay {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 32px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
}
.sf-banner-title { font-size: 24px; font-weight: 800; color: #fff; margin: 0 0 4px; }
.sf-banner-desc { font-size: 14px; color: rgba(255,255,255,0.85); margin: 0; }
.sf-banner-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.sf-dot {
  width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.6);
  background: transparent; cursor: pointer; transition: all 0.2s;
}
.sf-dot.active { background: #fff; border-color: #fff; transform: scale(1.2); }

/* ── Sections ── */
.sf-section { padding: 24px; }
.sf-section__title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; margin: 0 0 16px; color: var(--color-text-primary); }
.sf-count { font-size: 14px; font-weight: 500; color: var(--color-text-muted); }

/* ── Categories ── */
.sf-categories { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
.sf-cat-card {
  display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px;
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.25s; white-space: nowrap; flex-shrink: 0;
}
.sf-cat-card:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); background: rgba(124,58,237,0.06); }
.sf-cat-card.active { border-color: var(--color-accent-primary); color: #fff; background: var(--color-accent-primary); }

/* ── Products Grid ── */
.sf-products {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.sf-product-card {
  border-radius: 14px; overflow: hidden; background: var(--color-bg-card);
  border: 1px solid var(--color-border); cursor: pointer; transition: all 0.3s;
}
.sf-product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.15); border-color: var(--color-accent-primary); }
.sf-product-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--color-bg-card-hover); display: flex; align-items: center; justify-content: center; }
.sf-product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.sf-product-card:hover .sf-product-img { transform: scale(1.05); }
.sf-product-placeholder { color: var(--color-text-muted); }
.sf-promo-badge {
  position: absolute; top: 8px; right: 8px; padding: 4px 10px; border-radius: 8px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
  font-size: 12px; font-weight: 700;
}
.sf-product-info { padding: 12px 14px; }
.sf-product-name { font-size: 14px; font-weight: 600; margin: 0 0 6px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sf-product-prices { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.sf-price { font-size: 15px; font-weight: 700; color: var(--color-accent-primary); }
.sf-price--old { text-decoration: line-through; color: var(--color-text-muted); font-size: 12px; font-weight: 500; }
.sf-price--promo { color: var(--color-accent-hot); }
.sf-product-cat { font-size: 11px; color: var(--color-text-muted); }

/* ── Pagination ── */
.sf-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 24px; }
.sf-page-btn {
  display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;
  border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s;
}
.sf-page-btn:hover:not(:disabled) { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.sf-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.sf-page-info { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); }

/* ── Pages ── */
.sf-pages { display: flex; flex-wrap: wrap; gap: 8px; }
.sf-page-link {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px;
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
}
.sf-page-link:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

/* ── Footer ── */
.sf-footer {
  text-align: center; padding: 24px; font-size: 12px; color: var(--color-text-muted);
  border-top: 1px solid var(--color-border); margin-top: 40px;
}

.sf-empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 14px; }

@media (max-width: 768px) {
  .sf-header { padding: 10px 16px; gap: 10px; }
  .sf-banners { margin: 12px 16px; }
  .sf-section { padding: 16px; }
  .sf-products { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
</style>
