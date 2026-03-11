<template>
  <div class="products-page container">
    <div class="products-layout">
      <!-- Sidebar Filters -->
      <aside class="products-sidebar">
        <h3 class="sidebar-title"><SlidersHorizontal :size="16" /> Bộ lọc</h3>

        <!-- Categories -->
        <div class="filter-group" v-if="categories.length > 0">
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
        <div class="filter-group" v-if="brands.length > 0">
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
          </div>
        </transition>

        <!-- Loading -->
        <div v-if="loading" class="product-skeleton-grid">
          <div v-for="i in 12" :key="i" class="product-skeleton">
            <div class="skeleton" style="aspect-ratio:1"></div>
            <div class="skeleton" style="height:14px;width:70%;margin-top:12px"></div>
            <div class="skeleton" style="height:18px;width:40%;margin-top:8px"></div>
          </div>
        </div>

        <!-- Products Grid -->
        <div v-else-if="products.length > 0" class="product-grid">
          <ProductCard v-for="p in products" :key="p.id" :product="p" :storeId="storeId" />
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../api.js'
import ProductCard from '../components/ProductCard.vue'
import { SlidersHorizontal, FolderOpen, Award, X, Search, SearchX, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  storeId: { type: String, required: true },
  categoryId: { type: String, default: null },
})

const route = useRoute()
const products = ref([])
const categories = ref([])
const brands = ref([])
const loading = ref(true)
const search = ref(route.query.q || '')
const selectedCategory = ref(props.categoryId || null)
const selectedBrand = ref(null)
const sortBy = ref('created_at:desc')
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)
const showMobileFilter = ref(false)

const hasFilters = computed(() => !!(selectedCategory.value || selectedBrand.value || search.value))

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
  page.value = 1
  reload()
}

let debounceTimer = null
function debouncedReload() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; reload() }, 350)
}

async function loadFilters() {
  try { categories.value = await apiFetch(props.storeId, '/categories') } catch { categories.value = [] }
  try { brands.value = await apiFetch(props.storeId, '/brands') } catch { brands.value = [] }
}

async function reload() {
  loading.value = true
  const [sort, order] = sortBy.value.split(':')
  try {
    const data = await apiFetch(props.storeId, '/products', {
      page: page.value,
      limit: 12,
      sort,
      order,
      search: search.value || null,
      category: selectedCategory.value,
      brand: selectedBrand.value,
    })
    products.value = data.data || data
    total.value = data.meta?.total || products.value.length
    lastPage.value = data.meta?.lastPage || data.meta?.last_page || 1
  } catch {
    products.value = []
  }
  loading.value = false
}

watch(() => props.categoryId, (v) => { selectedCategory.value = v; page.value = 1; reload() })
onMounted(async () => { await loadFilters(); await reload() })
</script>

<style scoped>
.products-page { padding-top: 24px; padding-bottom: 60px; }

.products-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
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
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.product-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

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

@media (max-width: 768px) {
  .products-layout { grid-template-columns: 1fr; }
  .products-sidebar { display: none; }
  .mobile-filter-btn { display: flex; }
  .product-grid, .product-skeleton-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
</style>
