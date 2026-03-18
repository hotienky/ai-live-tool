<template>
  <div class="products-page container">
    <div class="products-layout" :class="'layout--sidebar-' + pageConfig.sidebarPosition">
      <!-- Sidebar Filters -->
      <aside v-if="pageConfig.sidebarPosition !== 'hidden'" class="products-sidebar">
        <h3 class="sidebar-title"><SlidersHorizontal :size="16" /> Bộ lọc</h3>

        <!-- Categories -->
        <div class="filter-group" v-if="categories.length > 0 && pageConfig.showFilters.category">
          <label class="filter-label">Danh mục</label>
          <button
            v-for="c in categories"
            :key="c.id"
            class="filter-btn"
            :class="{ active: selectedCategory == c.id }"
            @click="toggleFilter('category', c.id)"
          >
            <FolderOpen :size="14" /> {{ c.name }}
          </button>
        </div>

        <!-- Brands -->
        <div class="filter-group" v-if="brands.length > 0 && pageConfig.showFilters.brand">
          <label class="filter-label">Thương hiệu</label>
          <button
            v-for="b in brands"
            :key="b.id"
            class="filter-btn"
            :class="{ active: selectedBrand == b.id }"
            @click="toggleFilter('brand', b.id)"
          >
            <Award :size="14" /> {{ b.name }}
          </button>
        </div>

        <!-- Price Filter -->
        <div class="filter-group" v-if="pageConfig.showFilters.price">
          <label class="filter-label">Khoảng giá</label>
          <div class="price-presets">
            <button v-for="p in pricePresets" :key="p.label" class="filter-btn price-preset"
              :class="{ active: activePricePreset === p.label }"
              @click="applyPricePreset(p)">
              {{ p.label }}
            </button>
          </div>
          <div class="price-inputs">
            <input v-model.number="priceMin" type="number" placeholder="Từ" class="price-input" @change="onPriceChange" />
            <span class="price-sep">—</span>
            <input v-model.number="priceMax" type="number" placeholder="Đến" class="price-input" @change="onPriceChange" />
          </div>
        </div>

        <!-- Sort -->
        <div class="filter-group">
          <label class="filter-label">Sắp xếp</label>
          <select v-model="sortBy" @change="reload()" class="filter-select">
            <option value="created_at:desc">Mới nhất</option>
            <option value="price:asc">Giá thấp → cao</option>
            <option value="price:desc">Giá cao → thấp</option>
            <option value="name:asc">Tên A → Z</option>
          </select>
        </div>

        <button v-if="hasFilters" class="filter-clear" @click="clearFilters">
          <X :size="13" /> Xóa bộ lọc
        </button>
      </aside>

      <!-- Main Content -->
      <div class="products-main">
        <!-- Header with search and count -->
        <div class="products-main__header">
          <h1 class="products-main__title">
            {{ pageTitle }}
            <span class="products-main__count" v-if="total">({{ total }})</span>
          </h1>
          <div class="products-main__search">
            <Search :size="15" />
            <input v-model="search" placeholder="Tìm sản phẩm..." @input="debouncedReload" />
          </div>
        </div>

        <!-- Mobile filter toggle -->
        <button class="mobile-filter-btn" @click="showMobileFilter = !showMobileFilter">
          <SlidersHorizontal :size="14" /> Bộ lọc
          <span v-if="hasFilters" class="mobile-filter-dot"></span>
        </button>

        <!-- Mobile Filter Drawer -->
        <transition name="slide">
          <div v-if="showMobileFilter" class="mobile-filter-drawer">
            <div class="filter-group" v-if="categories.length > 0">
              <label class="filter-label">Danh mục</label>
              <div class="filter-chips">
                <button v-for="c in categories" :key="c.id" class="filter-chip" :class="{ active: selectedCategory == c.id }" @click="toggleFilter('category', c.id)">{{ c.name }}</button>
              </div>
            </div>
            <div class="filter-group" v-if="brands.length > 0">
              <label class="filter-label">Thương hiệu</label>
              <div class="filter-chips">
                <button v-for="b in brands" :key="b.id" class="filter-chip" :class="{ active: selectedBrand == b.id }" @click="toggleFilter('brand', b.id)">{{ b.name }}</button>
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-label">Khoảng giá</label>
              <div class="filter-chips">
                <button v-for="p in pricePresets" :key="p.label" class="filter-chip" :class="{ active: activePricePreset === p.label }" @click="applyPricePreset(p)">{{ p.label }}</button>
              </div>
            </div>
          </div>
        </transition>

        <!-- Loading -->
        <div v-if="loading" class="product-skeleton-grid" :class="'grid-cols--' + pageConfig.gridColumns">
          <div v-for="i in 12" :key="i" class="product-skeleton">
            <div class="skeleton" style="aspect-ratio:1"></div>
            <div class="skeleton" style="height:14px;width:70%;margin-top:12px"></div>
            <div class="skeleton" style="height:18px;width:40%;margin-top:8px"></div>
          </div>
        </div>

        <!-- Products Grid -->
        <div v-else-if="products.length > 0" class="product-grid" :class="'grid-cols--' + pageConfig.gridColumns">
          <ProductCard v-for="p in products" :key="p.id" :product="p" />
        </div>

        <!-- Empty -->
        <div v-else class="products-empty">
          <SearchX :size="48" />
          <p>Không tìm thấy sản phẩm nào</p>
          <button v-if="hasFilters" class="btn btn--outline" @click="clearFilters">Xóa bộ lọc</button>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="lastPage > 1">
          <button class="pagination__btn" :disabled="page <= 1" @click="page--; reload()">
            <ChevronLeft :size="16" />
          </button>
          <button
            v-for="pg in visiblePages"
            :key="pg"
            class="pagination__num"
            :class="{ active: page === pg }"
            @click="page = pg; reload()"
          >
            {{ pg }}
          </button>
          <button class="pagination__btn" :disabled="page >= lastPage" @click="page++; reload()">
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../api.js'
import ProductCard from '../components/ProductCard.vue'
import { useSeo } from '../composables/useSeo.js'
import { SlidersHorizontal, FolderOpen, Award, X, Search, SearchX, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { setPageSeo } = useSeo()

const layoutConfig = inject('layoutConfig', ref(null))
const pageConfig = computed(() => {
  const defaults = { sidebarPosition: 'left', gridColumns: 4, itemsPerPage: 12, showFilters: { category: true, brand: true, price: true } }
  const pc = layoutConfig.value?.pageConfigs?.products
  return pc ? { ...defaults, ...pc, showFilters: { ...defaults.showFilters, ...(pc.showFilters || {}) } } : defaults
})

const props = defineProps({
  slug: { type: String, default: null },
})

const route = useRoute()
const products = ref([])
const categories = ref([])
const brands = ref([])
const loading = ref(true)
const search = ref(route.query.q || '')
const selectedCategory = ref(props.slug || null)
const selectedBrand = ref(null)
const sortBy = ref('created_at:desc')
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)
const showMobileFilter = ref(false)
const priceMin = ref(null)
const priceMax = ref(null)
const activePricePreset = ref(null)

const pricePresets = [
  { label: 'Dưới 200K', min: null, max: 200000 },
  { label: '200K - 500K', min: 200000, max: 500000 },
  { label: '500K - 1 triệu', min: 500000, max: 1000000 },
  { label: 'Trên 1 triệu', min: 1000000, max: null },
]

function applyPricePreset(p) {
  if (activePricePreset.value === p.label) {
    activePricePreset.value = null
    priceMin.value = null
    priceMax.value = null
  } else {
    activePricePreset.value = p.label
    priceMin.value = p.min
    priceMax.value = p.max
  }
  page.value = 1
  reload()
}

function onPriceChange() {
  activePricePreset.value = null
  page.value = 1
  reload()
}

const hasFilters = computed(() => !!(selectedCategory.value || selectedBrand.value || search.value || priceMin.value || priceMax.value))

const pageTitle = computed(() => {
  if (selectedCategory.value) {
    const c = categories.value.find(x => x.id == selectedCategory.value)
    return c ? c.name : 'Sản phẩm'
  }
  return 'Tất cả sản phẩm'
})


const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, page.value - 2)
  const end = Math.min(lastPage.value, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function toggleFilter(type, id) {
  if (type === 'category') {
    selectedCategory.value = selectedCategory.value == id ? null : id
  } else {
    selectedBrand.value = selectedBrand.value == id ? null : id
  }
  page.value = 1
  reload()
}

function clearFilters() {
  selectedCategory.value = null
  selectedBrand.value = null
  search.value = ''
  priceMin.value = null
  priceMax.value = null
  activePricePreset.value = null
  page.value = 1
  reload()
}

let debounceTimer = null
let abortController = null
function debouncedReload() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; reload() }, 350)
}

async function loadFilters() {
  try { categories.value = await apiFetch('/categories') } catch { categories.value = [] }
  try { brands.value = await apiFetch('/brands') } catch { brands.value = [] }
}

async function reload() {
  loading.value = true
  // Cancel any in-flight request to prevent race conditions (B27)
  if (abortController) abortController.abort()
  abortController = new AbortController()
  const [sort, order] = sortBy.value.split(':')
  try {
    const data = await apiFetch('/products', {
      page: page.value,
      per_page: pageConfig.value.itemsPerPage,
      sort,
      order,
      search: search.value || null,
      category: selectedCategory.value,
      brand: selectedBrand.value,
      price_min: priceMin.value || null,
      price_max: priceMax.value || null,
    })
    // Handle both paginated {data:[], meta:{}} and flat array responses
    if (data && data.data && Array.isArray(data.data)) {
      products.value = data.data
      total.value = data.meta?.total || data.data.length
      lastPage.value = data.meta?.last_page || data.meta?.lastPage || 1
    } else {
      products.value = Array.isArray(data) ? data : []
      total.value = products.value.length
      lastPage.value = 1
    }
  } catch (err) {
    if (err.name === 'AbortError') return // Ignore cancelled requests
    products.value = []
  }
  loading.value = false

  // SEO — set page meta tags (C1)
  setPageSeo({
    title: `${pageTitle.value} (${total.value}) — Cửa hàng`,
    description: `Xem ${total.value} sản phẩm${search.value ? ' cho "' + search.value + '"' : ''}. Lọc theo danh mục, thương hiệu, giá.`,
  })
}

watch(() => props.slug, (v) => { selectedCategory.value = v; page.value = 1; reload() })
onMounted(async () => { await loadFilters(); await reload() })
</script>

<style scoped>
.products-page { padding-top: 24px; padding-bottom: 60px; }

.products-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
}

/* Sidebar position variants */
.layout--sidebar-right {
  grid-template-columns: 1fr 240px;
}
.layout--sidebar-right .products-sidebar { order: 2; }
.layout--sidebar-right .products-main { order: 1; }

.layout--sidebar-hidden {
  grid-template-columns: 1fr;
}

/* Sidebar */
.products-sidebar {
  display: flex; flex-direction: column; gap: 20px;
  position: sticky; top: calc(var(--sf-header-height) + 24px); align-self: start;
}

.sidebar-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 800; margin: 0;
  color: var(--sf-text-primary);
}

.filter-group { display: flex; flex-direction: column; gap: 4px; }

.filter-label {
  font-size: 11px; font-weight: 700; color: var(--sf-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
}

.filter-btn {
  display: flex; align-items: center; gap: 8px;
  text-align: left; padding: 9px 14px; border-radius: var(--sf-radius-sm);
  border: 1px solid var(--sf-border); background: var(--sf-bg-card);
  color: var(--sf-text-secondary); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all var(--sf-transition);
}
.filter-btn:hover { border-color: var(--sf-accent); color: var(--sf-accent-light); }
.filter-btn.active { background: var(--sf-accent); color: #fff; border-color: var(--sf-accent); }

.filter-select {
  padding: 9px 14px; border-radius: var(--sf-radius-sm);
  border: 1px solid var(--sf-border); background: var(--sf-bg-card);
  color: var(--sf-text-primary); font-size: 13px; cursor: pointer; outline: none;
}
.filter-select option { background: var(--sf-bg-card); color: var(--sf-text-primary); }

.filter-clear {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 14px; border-radius: var(--sf-radius-sm);
  border: 1px solid var(--sf-border); background: transparent;
  color: var(--sf-text-muted); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.filter-clear:hover { color: var(--sf-sale); border-color: var(--sf-sale); }

/* Price Filter */
.price-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px; }
.price-preset { font-size: 12px !important; padding: 7px 10px !important; text-align: center; justify-content: center; }
.price-inputs { display: flex; align-items: center; gap: 6px; }
.price-input {
  flex: 1; padding: 8px 10px; border-radius: var(--sf-radius-sm);
  border: 1px solid var(--sf-border); background: var(--sf-bg-card);
  color: var(--sf-text-primary); font-size: 12px; outline: none;
  width: 0; /* let flex handle it */
}
.price-input:focus { border-color: var(--sf-accent); }
.price-input::placeholder { color: var(--sf-text-muted); }
.price-sep { color: var(--sf-text-muted); font-size: 12px; flex-shrink: 0; }

/* Main */
.products-main__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}

.products-main__title { font-size: 24px; font-weight: 800; margin: 0; }
.products-main__count { font-size: 16px; color: var(--sf-text-muted); font-weight: 500; }

.products-main__search {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 100px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  transition: border-color 0.2s;
}
.products-main__search:focus-within { border-color: var(--sf-accent); }
.products-main__search svg { color: var(--sf-text-muted); flex-shrink: 0; }
.products-main__search input {
  border: none; background: transparent; color: var(--sf-text-primary);
  font-size: 13px; outline: none; width: 180px;
}
.products-main__search input::placeholder { color: var(--sf-text-muted); }

/* Product grid */
.product-grid,
.product-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
/* Grid column overrides from config */
.grid-cols--2 { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.grid-cols--3 { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.grid-cols--4 { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.grid-cols--5 { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }

.product-skeleton {
  padding: 16px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
}

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 32px;
}

.pagination__btn, .pagination__num {
  display: flex; align-items: center; justify-content: center;
  min-width: 36px; height: 36px; border-radius: var(--sf-radius-sm);
  border: 1px solid var(--sf-border); background: var(--sf-bg-card);
  color: var(--sf-text-secondary); font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}

.pagination__btn:hover:not(:disabled), .pagination__num:hover:not(.active) {
  border-color: var(--sf-accent); color: var(--sf-accent-light);
}

.pagination__num.active {
  background: var(--sf-accent); color: #fff; border-color: var(--sf-accent);
}

.pagination__btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Empty */
.products-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 80px; color: var(--sf-text-muted); text-align: center;
}
.products-empty p { font-size: 16px; font-weight: 600; }

/* Mobile */
.mobile-filter-btn {
  display: none; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: var(--sf-radius-sm);
  border: 1px solid var(--sf-border); background: var(--sf-bg-card);
  color: var(--sf-text-secondary); font-size: 13px; font-weight: 600;
  cursor: pointer; margin-bottom: 16px; position: relative;
}
.mobile-filter-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--sf-accent);
  position: absolute; top: 6px; right: 6px;
}

.mobile-filter-drawer {
  padding: 16px; margin-bottom: 16px; border-radius: var(--sf-radius-md);
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  display: flex; flex-direction: column; gap: 12px;
}

.filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.filter-chip {
  padding: 6px 14px; border-radius: 100px;
  border: 1px solid var(--sf-border); background: transparent;
  color: var(--sf-text-secondary); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.filter-chip.active { background: var(--sf-accent); color: #fff; border-color: var(--sf-accent); }

.slide-enter-active { animation: slideDown 0.3s ease; }
.slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

/* Tablet */
@media (max-width: 1024px) {
  .products-layout { grid-template-columns: 200px 1fr; gap: 24px; }
  .layout--sidebar-right { grid-template-columns: 1fr 200px; }
  .product-grid, .product-skeleton-grid { gap: 14px; }
  .grid-cols--4 { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
  .grid-cols--5 { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
}

/* Mobile */
@media (max-width: 768px) {
  .products-layout { grid-template-columns: 1fr; }
  .products-sidebar { display: none; }
  .mobile-filter-btn { display: flex; }
  /* Force 2 columns on mobile — override all grid-cols-- classes */
  .product-grid, .product-skeleton-grid,
  .product-grid.grid-cols--2, .product-grid.grid-cols--3,
  .product-grid.grid-cols--4, .product-grid.grid-cols--5,
  .product-skeleton-grid.grid-cols--2, .product-skeleton-grid.grid-cols--3,
  .product-skeleton-grid.grid-cols--4, .product-skeleton-grid.grid-cols--5 {
    grid-template-columns: repeat(2, 1fr); gap: 10px;
  }
  .products-main__title { font-size: 20px; }
  .products-main__search input { width: 140px; }
}

@media (max-width: 380px) {
  /* Very small screens: still 2 columns but tighter */
  .product-grid, .product-skeleton-grid,
  .product-grid[class*="grid-cols--"],
  .product-skeleton-grid[class*="grid-cols--"] {
    grid-template-columns: repeat(2, 1fr); gap: 8px;
  }
}
</style>
