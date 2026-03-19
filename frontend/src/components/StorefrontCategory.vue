<template>
  <div class="sc">
    <button class="sc-back" @click="$emit('back')">
      <ArrowLeft :size="16" /> Quay lại
    </button>

    <div class="sc-layout">
      <!-- Sidebar Filters -->
      <aside class="sc-sidebar">
        <h3 class="sc-sidebar__title"><SlidersHorizontal :size="14" /> Bộ lọc</h3>

        <!-- Categories -->
        <div class="sc-filter-group" v-if="categories.length">
          <label class="sc-filter-label">Danh mục</label>
          <button v-for="c in categories" :key="c.id" class="sc-filter-btn"
            :class="{ active: selectedCat === c.id }"
            @click="selectedCat = selectedCat === c.id ? null : c.id; reload()">
            {{ c.name }}
          </button>
        </div>

        <!-- Brands -->
        <div class="sc-filter-group" v-if="brands.length">
          <label class="sc-filter-label">Thương hiệu</label>
          <button v-for="b in brands" :key="b.id" class="sc-filter-btn"
            :class="{ active: selectedBrand === b.id }"
            @click="selectedBrand = selectedBrand === b.id ? null : b.id; reload()">
            {{ b.name }}
          </button>
        </div>

        <!-- Sort -->
        <div class="sc-filter-group">
          <label class="sc-filter-label">{{ t('admin.sort', 'Sắp xếp') }}</label>
          <select v-model="sortBy" @change="reload()" class="sc-select">
            <option value="created_at:desc">{{ t('admin.newest', 'Mới nhất') }}</option>
            <option value="price:asc">Giá thấp → cao</option>
            <option value="price:desc">Giá cao → thấp</option>
            <option value="name:asc">{{ t('admin.name_az', 'Tên A-Z') }}</option>
          </select>
        </div>

        <button class="sc-clear" @click="clearFilters" v-if="selectedCat || selectedBrand">
          <X :size="12" /> Xoá bộ lọc
        </button>
      </aside>

      <!-- Products Grid -->
      <div class="sc-main">
        <div class="sc-main-header">
          <h2>{{ headerTitle }} <span class="sc-count">({{ total }})</span></h2>
          <div class="sc-search">
            <Search :size="14" />
            <input v-model="search" type="text" placeholder="Tìm sản phẩm..." @input="debouncedSearch" />
          </div>
        </div>

        <div class="sc-products" v-if="products.length">
          <div v-for="p in products" :key="p.id" class="sc-card" @click="$emit('viewProduct', p.id)">
            <div class="sc-card__img">
              <img v-if="p.image_url || p.image" :src="p.image_url || p.image" :alt="p.name" />
              <Package v-else :size="36" class="sc-card__placeholder" />
              <span class="sc-badge" v-if="hasPromo(p)">
                -{{ Math.round((1 - p.promotion_price / p.price) * 100) }}%
              </span>
            </div>
            <div class="sc-card__info">
              <h4>{{ p.name }}</h4>
              <div class="sc-card__prices">
                <span class="sc-price" :class="{ old: hasPromo(p) }">{{ fmt(p.price) }}</span>
                <span class="sc-price sale" v-if="hasPromo(p)">{{ fmt(p.promotion_price) }}</span>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="sc-empty">Không tìm thấy sản phẩm</p>

        <div class="sc-pagination" v-if="lastPage > 1">
          <button :disabled="page <= 1" @click="page--; reload()"><ChevronLeft :size="14" /></button>
          <span>{{ page }} / {{ lastPage }}</span>
          <button :disabled="page >= lastPage" @click="page++; reload()"><ChevronRight :size="14" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowLeft, SlidersHorizontal, Search, Package, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { API_BASE } from '../config.js'


const props = defineProps({
  storeId: { type: [String, Number], required: true },
  categoryId: { type: [String, Number], default: null },
})
const emit = defineEmits(['back', 'viewProduct'])

const products = ref([])
const categories = ref([])
const brands = ref([])
const selectedCat = ref(props.categoryId)
const selectedBrand = ref(null)
const search = ref('')
const sortBy = ref('created_at:desc')
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)

const headerTitle = computed(() => {
  if (selectedCat.value) {
    const c = categories.value.find(x => x.id === selectedCat.value)
    return c ? c.name : 'Sản phẩm'
  }
  return 'Tất cả sản phẩm'
})

async function api(path) {
  const res = await fetch(`${API_BASE}/storefront${path}`, { headers: { 'Accept': 'application/json' } })
  const json = await res.json()
  if (json && typeof json === 'object' && 'data' in json && json.type) return json.data
  return json
}

async function loadFilters() {
  try { categories.value = await api('/categories') } catch { categories.value = [] }
  try { brands.value = await api('/brands') } catch { brands.value = [] }
}

async function reload() {
  const [sort, order] = sortBy.value.split(':')
  const params = new URLSearchParams({ page: page.value, limit: 12, sort, order })
  if (search.value) params.set('search', search.value)
  if (selectedCat.value) params.set('category', selectedCat.value)
  if (selectedBrand.value) params.set('brand', selectedBrand.value)
  try {
    const data = await api(`/products?${params}`)
    products.value = data.data || data
    total.value = data.meta?.total || products.value.length
    lastPage.value = data.meta?.lastPage || data.meta?.last_page || 1
  } catch { products.value = [] }
}

function clearFilters() { selectedCat.value = null; selectedBrand.value = null; search.value = ''; page.value = 1; reload() }
let timer = null
function debouncedSearch() { clearTimeout(timer); timer = setTimeout(() => { page.value = 1; reload() }, 300) }

function hasPromo(p) {
  if (!p.promotion_price || p.promotion_price >= p.price) return false
  const now = Date.now()
  if (p.promotion_start && new Date(p.promotion_start).getTime() > now) return false
  if (p.promotion_end && new Date(p.promotion_end).getTime() < now) return false
  return true
}
function fmt(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

onMounted(async () => { await loadFilters(); await reload() })
watch(() => props.categoryId, (v) => { selectedCat.value = v; page.value = 1; reload() })
</script>

<style scoped>
.sc { min-height: 100vh; background: var(--color-bg-primary); color: var(--color-text-primary); padding: 20px 24px; }
.sc-back { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 20px; transition: all 0.2s; }
.sc-back:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.sc-layout { display: grid; grid-template-columns: 220px 1fr; gap: 24px; }

/* Sidebar */
.sc-sidebar { display: flex; flex-direction: column; gap: 16px; }
.sc-sidebar__title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; margin: 0; }
.sc-filter-group { display: flex; flex-direction: column; gap: 4px; }
.sc-filter-label { font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.sc-filter-btn { text-align: left; padding: 7px 12px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; cursor: pointer; transition: all 0.2s; }
.sc-filter-btn:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.sc-filter-btn.active { background: var(--color-accent-primary); color: #fff; border-color: var(--color-accent-primary); }
.sc-select { padding: 7px 12px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-primary); font-size: 13px; outline: none; }
.sc-clear { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); font-size: 12px; cursor: pointer; }
.sc-clear:hover { color: var(--color-accent-hot); border-color: var(--color-accent-hot); }

/* Main */
.sc-main-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.sc-main-header h2 { font-size: 20px; font-weight: 800; margin: 0; }
.sc-count { font-size: 14px; font-weight: 500; color: var(--color-text-muted); }
.sc-search { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 10px; background: var(--color-bg-card); border: 1px solid var(--color-border); }
.sc-search:focus-within { border-color: var(--color-accent-primary); }
.sc-search svg { color: var(--color-text-muted); }
.sc-search input { border: none; background: transparent; color: var(--color-text-primary); font-size: 13px; outline: none; width: 160px; }

.sc-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.sc-card { border-radius: 14px; overflow: hidden; background: var(--color-bg-card); border: 1px solid var(--color-border); cursor: pointer; transition: all 0.3s; }
.sc-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.12); border-color: var(--color-accent-primary); }
.sc-card__img { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--color-bg-card-hover); display: flex; align-items: center; justify-content: center; }
.sc-card__img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.sc-card:hover .sc-card__img img { transform: scale(1.05); }
.sc-card__placeholder { color: var(--color-text-muted); }
.sc-badge { position: absolute; top: 8px; right: 8px; padding: 3px 8px; border-radius: 6px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 700; }
.sc-card__info { padding: 10px 12px; }
.sc-card__info h4 { font-size: 13px; font-weight: 600; margin: 0 0 4px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sc-card__prices { display: flex; gap: 6px; align-items: center; }
.sc-price { font-size: 14px; font-weight: 700; color: var(--color-accent-primary); }
.sc-price.old { text-decoration: line-through; color: var(--color-text-muted); font-size: 11px; font-weight: 500; }
.sc-price.sale { color: var(--color-accent-hot); }

.sc-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 24px; }
.sc-pagination button { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); cursor: pointer; }
.sc-pagination button:hover:not(:disabled) { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.sc-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.sc-pagination span { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }

.sc-empty { text-align: center; padding: 60px; color: var(--color-text-muted); }

@media (max-width: 768px) {
  .sc-layout { grid-template-columns: 1fr; }
  .sc-sidebar { flex-direction: row; flex-wrap: wrap; gap: 8px; }
  .sc-products { grid-template-columns: repeat(2, 1fr); }
}
</style>
