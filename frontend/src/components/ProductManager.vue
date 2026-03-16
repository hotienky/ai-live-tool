<template>
  <div class="pm">
    <div class="pm-header" v-show="!showForm">
      <h3><ShoppingBag :size="16" /> Quản lý sản phẩm <span class="pm-count">({{ pagination.total }})</span></h3>
      <div class="pm-header__actions">
        <div class="pm-search">
          <Search :size="14" />
          <input v-model="searchQuery" type="text" placeholder="Tìm sản phẩm..." @input="debouncedSearch" />
        </div>
        <button class="btn-add" @click="openCreate">+ Thêm sản phẩm</button>
      </div>
    </div>

    <!-- Products Table -->
    <div class="pm-table-wrap" v-if="products.length && !showForm">
      <table class="pm-table">
        <thead>
          <tr>
            <th class="th-img">Ảnh</th>
            <th>Tên sản phẩm</th>
            <th>SKU</th>
            <th>Giá</th>
            <th>Kho</th>
            <th>Danh mục</th>
            <th class="th-status">Trạng thái</th>
            <th class="th-actions">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id" class="pm-row">
            <td class="td-img">
              <img v-if="p.image" :src="p.image" :alt="p.name" class="pm-thumb" />
              <Package v-else :size="24" class="pm-thumb-placeholder" />
            </td>
            <td>
              <div class="pm-name">{{ p.name }}</div>
              <div class="pm-kw" v-if="p.keywords">{{ Array.isArray(p.keywords) ? p.keywords.join(', ') : p.keywords }}</div>
            </td>
            <td class="td-sku">{{ p.sku || '—' }}</td>
            <td class="td-price">
              <span class="pm-price">{{ formatPrice(p.price) }}</span>
              <span class="pm-promo" v-if="p.promotion_price && p.promotion_price < p.price">
                {{ formatPrice(p.promotion_price) }}
              </span>
            </td>
            <td class="td-stock">
              <div class="pm-stock-cell">
                <button class="stock-btn" @click="adjustStock(p.id, 'deduct', 1)"><Minus :size="12" /></button>
                <span class="pm-stock-val" :class="{ low: (p.stock || 0) <= (p.low_stock_threshold || 5) }">
                  {{ p.stock ?? 0 }}
                </span>
                <button class="stock-btn" @click="adjustStock(p.id, 'add', 1)"><Plus :size="12" /></button>
              </div>
            </td>
            <td class="td-cat">{{ p.category || '—' }}</td>
            <td class="td-status">
              <span class="status-dot" :class="p.is_active !== false ? 'active' : 'inactive'"
                @click="toggleStatus(p)">
                {{ p.is_active !== false ? 'Active' : 'Ẩn' }}
              </span>
            </td>
            <td class="td-actions">
              <button class="btn-sm btn-edit" @click="openEdit(p)"><Edit3 :size="13" /></button>
              <button class="btn-sm btn-del" @click="handleDelete(p)"><Trash2 :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="!showForm" class="empty">Chưa có sản phẩm nào</p>

    <!-- Pagination -->
    <div class="pm-pagination" v-if="pagination.lastPage > 1 && !showForm">
      <button class="pg-btn" :disabled="pagination.page <= 1" @click="goPage(pagination.page - 1)">
        <ChevronLeft :size="14" />
      </button>
      <template v-for="pg in pageNumbers" :key="pg">
        <button v-if="pg === '...'" class="pg-btn pg-ellipsis" disabled>...</button>
        <button v-else class="pg-btn" :class="{ active: pg === pagination.page }" @click="goPage(pg)">{{ pg }}</button>
      </template>
      <button class="pg-btn" :disabled="pagination.page >= pagination.lastPage" @click="goPage(pagination.page + 1)">
        <ChevronRight :size="14" />
      </button>
      <span class="pg-info">{{ pagination.total }} sản phẩm</span>
    </div>

    <!-- Create/Edit Full Page -->
    <div class="product-form-page" v-if="showForm">
      <div class="form-page-header">
        <button class="btn-back" @click="showForm = false"><ChevronLeft :size="16" /> Quay lại</button>
        <h3>{{ isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h3>
        <button class="btn-save" @click="handleSave" :disabled="!form.name || !form.price">
          {{ isEditing ? 'Cập nhật' : 'Tạo sản phẩm' }}
        </button>
      </div>

      <div class="form-page-body">
        <!-- Left Column: Basic Info -->
        <div class="form-col form-col--main">
          <div class="form-card">
            <h4>Thông tin cơ bản</h4>
            <div class="form-row">
              <div class="form-group form-group--flex">
                <label>Tên sản phẩm *</label>
                <input v-model="form.name" placeholder="Tên sản phẩm" />
              </div>
              <div class="form-group">
                <label>SKU</label>
                <input v-model="form.sku" placeholder="Mã SKU" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Giá *</label>
                <CurrencyInput v-model="form.price" placeholder="0" input-class="form-input" />
              </div>
              <div class="form-group">
                <label>Giá khuyến mãi</label>
                <CurrencyInput v-model="form.promotion_price" placeholder="0" input-class="form-input" />
              </div>
              <div class="form-group">
                <label>Số lượng tồn</label>
                <input v-model.number="form.stock" type="number" placeholder="0" />
              </div>
            </div>

            <div class="form-row" v-if="form.promotion_price">
              <div class="form-group">
                <label>Bắt đầu KM</label>
                <input v-model="form.promotion_start" type="datetime-local" />
              </div>
              <div class="form-group">
                <label>Kết thúc KM</label>
                <input v-model="form.promotion_end" type="datetime-local" />
              </div>
            </div>

            <div class="form-group">
              <label>Mô tả</label>
              <textarea v-model="form.description" rows="5" placeholder="Mô tả sản phẩm..."></textarea>
            </div>
          </div>

          <!-- SEO Section -->
          <div class="form-card">
            <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 700">🔍 SEO</h4>
            <div class="form-group">
              <label>Meta Title</label>
              <input v-model="form.meta_title" placeholder="Tiêu đề SEO (tự động nếu để trống)" />
            </div>
            <div class="form-group">
              <label>Meta Description</label>
              <textarea v-model="form.meta_description" rows="2" placeholder="Mô tả SEO (tự động nếu để trống)"></textarea>
            </div>
            <div class="form-group">
              <label>Meta Keywords</label>
              <input v-model="form.meta_keywords" placeholder="keyword1, keyword2, ..." />
            </div>
          </div>

          <!-- Variants Section -->
          <div class="form-card">
            <div class="variants-header">
              <h4><Layers :size="14" /> Biến thể sản phẩm ({{ form.variants.length }})</h4>
              <button type="button" class="btn-add-variant" @click="addVariant">+ Thêm biến thể</button>
            </div>

            <!-- Smart sale toggle -->
            <div class="variant-sale-toggle" v-if="form.variants.length > 0 && form.promotion_price">
              <label class="toggle-label">
                <input type="checkbox" v-model="applyPromoToAll" @change="onPromoToggle" />
                <span>Áp dụng KM cho tất cả biến thể</span>
              </label>
              <span class="toggle-hint" v-if="applyPromoToAll && form.price && form.promotion_price">
                Giảm {{ Math.round((1 - form.promotion_price / form.price) * 100) }}% — tự động tính cho mỗi biến thể
              </span>
            </div>

            <div class="variant-list" v-if="form.variants.length">
              <div class="variant-card" v-for="(v, vi) in form.variants" :key="vi">
                <div class="variant-row">
                  <div class="form-group form-group--flex">
                    <label>Tên biến thể</label>
                    <input v-model="v.name" placeholder="VD: Đỏ - Size M" />
                  </div>
                  <div class="form-group">
                    <label>SKU</label>
                    <input v-model="v.sku" placeholder="SKU biến thể" />
                  </div>
                  <button class="btn-sm btn-del variant-del" @click="form.variants.splice(vi, 1)" type="button">
                    <Trash2 :size="13" />
                  </button>
                </div>
                <div class="variant-row">
                  <div class="form-group">
                    <label>Giá</label>
                    <CurrencyInput v-model="v.price" placeholder="0" input-class="form-input" />
                  </div>
                  <div class="form-group">
                    <label>Giá KM</label>
                    <CurrencyInput
                      v-model="v.promotion_price"
                      placeholder="0"
                      input-class="form-input"
                      :disabled="applyPromoToAll"
                    />
                    <span class="form-hint variant-promo-hint" v-if="applyPromoToAll && v.price && form.price && form.promotion_price">
                      = {{ formatPrice(Math.round(v.price * form.promotion_price / form.price)) }}
                    </span>
                  </div>
                  <div class="form-group">
                    <label>Tồn kho</label>
                    <input v-model.number="v.stock" type="number" placeholder="0" />
                  </div>
                  <div class="form-group form-group--flex">
                    <label>Ảnh (URL)</label>
                    <input v-model="v.image" placeholder="URL ảnh biến thể" />
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="form-hint">Không có biến thể. Sản phẩm đơn giản sẽ dùng giá/tồn kho ở trên.</p>
          </div>
        </div>

        <!-- Right Column: Metadata -->
        <div class="form-col form-col--side">
          <div class="form-card">
            <h4>Phân loại</h4>
            <div class="form-group">
              <label>Danh mục</label>
              <select v-model="form.category">
                <option value="">-- Chọn danh mục --</option>
                <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Thương hiệu</label>
              <select v-model="form.brand">
                <option value="">-- Chọn thương hiệu --</option>
                <option v-for="b in brands" :key="b.id" :value="b.name">{{ b.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Keywords</label>
              <input v-model="form.keywords" placeholder="keyword1, keyword2, ..." />
            </div>
          </div>

          <div class="form-card">
            <h4>Hình ảnh sản phẩm</h4>
            <div class="images-gallery">
              <div class="img-item" v-for="(img, idx) in form.images" :key="idx">
                <img :src="img" alt="" @error="$event.target.style.display='none'" />
                <button class="img-remove" @click="form.images.splice(idx, 1)" type="button">&times;</button>
                <span class="img-main-badge" v-if="idx === 0">Chính</span>
              </div>
              <div class="img-add">
                <input v-model="newImageUrl" placeholder="Nhập URL ảnh..." @keyup.enter="addImage" />
                <button type="button" @click="addImage" :disabled="!newImageUrl.trim()">+</button>
              </div>
            </div>
            <p class="form-hint" v-if="form.images.length">Ảnh đầu tiên = ảnh chính.</p>
          </div>

          <div class="form-card">
            <h4>Cài đặt</h4>
            <div class="form-group">
              <label>Ngưỡng cảnh báo hết hàng</label>
              <input v-model.number="form.low_stock_threshold" type="number" placeholder="5" />
            </div>
            <div class="form-group">
              <label>Trạng thái</label>
              <select v-model="form.is_active">
                <option :value="true">Active</option>
                <option :value="false">Ẩn</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { ShoppingBag, Search, Package, Minus, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, Layers } from 'lucide-vue-next'
import CurrencyInput from './CurrencyInput.vue'

const { showToast } = useToast()
const props = defineProps({ /* tenant-scoped */ })

const products = ref([])
const categories = ref([])
const brands = ref([])
const loading = ref(false)
const searchQuery = ref('')
const pagination = ref({ page: 1, lastPage: 1, total: 0, perPage: 15 })

const showForm = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref(defaultForm())
const newImageUrl = ref('')

function defaultForm() {
  return {
    name: '', sku: '', price: '', promotion_price: '', promotion_start: '', promotion_end: '', stock: 0, category: '', brand: '',
    keywords: '', description: '', low_stock_threshold: 5, is_active: true,
    meta_title: '', meta_description: '', meta_keywords: '',
    images: [],
    variants: [],
  }
}

function addImage() {
  const url = newImageUrl.value.trim()
  if (url && !form.value.images.includes(url)) {
    form.value.images.push(url)
    newImageUrl.value = ''
  }
}

function addVariant() {
  form.value.variants.push({ name: '', sku: '', price: '', promotion_price: '', stock: 0, image: '' })
}

const applyPromoToAll = ref(true)

function onPromoToggle() {
  if (applyPromoToAll.value && form.value.price && form.value.promotion_price) {
    // Auto-calc promo for each variant based on product-level % discount
    const ratio = form.value.promotion_price / form.value.price
    form.value.variants.forEach(v => {
      if (v.price) v.promotion_price = Math.round(v.price * ratio)
    })
  }
}

// Pagination page numbers with ellipsis
const pageNumbers = computed(() => {
  const last = pagination.value.lastPage
  const cur = pagination.value.page
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(last - 1, cur + 1); i++) pages.push(i)
  if (cur < last - 2) pages.push('...')
  pages.push(last)
  return pages
})

let searchTimer = null
function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { pagination.value.page = 1; fetchProducts() }, 300)
}

async function fetchProducts() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: pagination.value.page, limit: pagination.value.perPage })
    if (searchQuery.value) params.set('search', searchQuery.value)
    const res = await apiFetch(`/products?${params}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      products.value = data
      pagination.value.total = data.length
      pagination.value.lastPage = 1
    } else {
      products.value = data.data || []
      pagination.value.total = data.meta?.total || 0
      pagination.value.lastPage = data.meta?.lastPage || data.meta?.last_page || 1
    }
  } catch { products.value = [] }
  loading.value = false
}

function goPage(pg) {
  pagination.value.page = pg
  fetchProducts()
}

async function fetchCategories() {
  try {
    const res = await apiFetch('/categories')
    const data = await res.json()
    categories.value = Array.isArray(data) ? data : (data.data || [])
  } catch { categories.value = [] }
}

async function fetchBrands() {
  try {
    const res = await apiFetch('/brands')
    const data = await res.json()
    brands.value = Array.isArray(data) ? data : (data.data || [])
  } catch { brands.value = [] }
}

function openCreate() {
  form.value = defaultForm()
  isEditing.value = false
  editId.value = null
  showForm.value = true
}

function openEdit(p) {
  const imgs = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : []
  const vars = p.variants ? (typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants) : []
  // If no images array but has image, add it
  if (imgs.length === 0 && (p.image || p.image_url)) imgs.push(p.image || p.image_url)

  form.value = {
    name: p.name || '', sku: p.sku || '', price: p.price || 0,
    promotion_price: p.promotion_price || '', promotion_start: p.promotion_start || '', promotion_end: p.promotion_end || '', stock: p.stock || 0,
    category: p.category || '', brand: p.brand || '',
    keywords: Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.keywords || ''),
    description: p.description || '',
    low_stock_threshold: p.low_stock_threshold || p.lowStockThreshold || 5,
    is_active: p.is_active ?? (p.status === 1 ? true : (p.status === 0 ? false : true)),
    meta_title: p.meta_title || '', meta_description: p.meta_description || '', meta_keywords: p.meta_keywords || '',
    images: imgs,
    variants: vars.map(v => ({
      ...v,
      promotion_price: v.promotion_price || '',
    })),
  }

  // Detect if variants have custom promo prices (different ratios) vs uniform
  if (vars.length > 0 && p.promotion_price && p.price) {
    const productRatio = p.promotion_price / p.price
    const allSameRatio = vars.every(v => {
      if (!v.promotion_price || !v.price) return true
      const vRatio = v.promotion_price / v.price
      return Math.abs(vRatio - productRatio) < 0.02
    })
    applyPromoToAll.value = allSameRatio
  } else {
    applyPromoToAll.value = true
  }
  isEditing.value = true
  editId.value = p.id
  showForm.value = true
}

async function handleSave() {
  if (!form.value.name || !form.value.price) return
  try {
    // Pre-process: compute variant promo prices if applyPromoToAll is ON
    if (applyPromoToAll.value && form.value.price && form.value.promotion_price) {
      const ratio = form.value.promotion_price / form.value.price
      form.value.variants.forEach(v => {
        if (v.price) v.promotion_price = Math.round(v.price * ratio)
      })
    }

    const body = {
      ...form.value,
      image: form.value.images.length > 0 ? form.value.images[0] : '',
    }
    if (isEditing.value) {
      await apiFetch(`/products/${editId.value}`, { method: 'PUT', body: JSON.stringify(body) })
      showToast('Đã cập nhật sản phẩm', 'success')
    } else {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) })
      showToast('Đã thêm sản phẩm', 'success')
    }
    showForm.value = false
    await fetchProducts()
  } catch (e) {
    showToast('Lỗi: ' + (e.message || 'Unknown'), 'error')
  }
}

async function handleDelete(p) {
  if (!confirm(`Xóa "${p.name}"?`)) return
  try {
    await apiFetch(`/products/${p.id}`, { method: 'DELETE' })
    showToast('Đã xóa sản phẩm', 'success')
    await fetchProducts()
  } catch (e) {
    showToast('Lỗi: ' + (e.message || 'Unknown'), 'error')
  }
}

async function toggleStatus(p) {
  try {
    const newActive = !p.is_active
    await apiFetch(`/products/${p.id}`, { method: 'PUT', body: JSON.stringify({ is_active: newActive }) })
    p.is_active = newActive
    showToast(newActive ? 'Đã kích hoạt' : 'Đã ẩn', 'success')
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
}

async function adjustStock(productId, action, quantity) {
  try {
    const res = await apiFetch(`/products/${productId}/adjust-stock`, {
      method: 'POST', body: JSON.stringify({ action, quantity })
    })
    const updated = await res.json()
    const idx = products.value.findIndex(p => p.id === productId)
    if (idx !== -1 && updated) products.value[idx].stock = updated.stock
    showToast(action === 'add' ? `+${quantity} tồn kho` : `-${quantity} tồn kho`, 'success')
  } catch (e) {
    showToast(e.message || 'Lỗi', 'error')
  }
}

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

onMounted(() => {
  fetchProducts()
  fetchCategories()
  fetchBrands()
})
</script>

<style scoped>
.pm { display: flex; flex-direction: column; gap: 16px; }

.pm-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.pm-header h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin: 0; }
.pm-count { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.pm-header__actions { display: flex; align-items: center; gap: 10px; }
.pm-search {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px;
  background: var(--color-bg-primary); border: 1px solid var(--color-border); transition: border-color 0.2s;
}
.pm-search:focus-within { border-color: var(--color-accent-primary); }
.pm-search svg { color: var(--color-text-muted); }
.pm-search input {
  border: none; background: transparent; color: var(--color-text-primary);
  font-size: 13px; outline: none; width: 180px;
}

.btn-add {
  padding: 7px 16px; border-radius: 8px; border: none;
  background: var(--color-accent-primary); color: #fff; font-size: 13px;
  font-weight: 600; cursor: pointer; transition: opacity 0.2s;
}
.btn-add:hover { opacity: 0.85; }

/* ── Table ── */
.pm-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--color-border); }
.pm-table { width: 100%; border-collapse: collapse; }
.pm-table th {
  padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted);
  background: var(--color-bg-card); border-bottom: 1px solid var(--color-border);
}
.pm-table td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.pm-row { transition: background 0.15s; }
.pm-row:hover { background: var(--color-bg-card-hover); }
.th-img { width: 56px; }
.th-status { width: 80px; }
.th-actions { width: 80px; }

.pm-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 8px; border: 1px solid var(--color-border); }
.pm-thumb-placeholder { color: var(--color-text-muted); }
.pm-name { font-weight: 600; line-height: 1.3; }
.pm-kw { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
.td-sku { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
.td-price { white-space: nowrap; }
.pm-price { font-weight: 700; color: var(--color-accent-primary); }
.pm-promo { display: block; font-size: 11px; color: var(--color-accent-hot); font-weight: 600; }

.pm-stock-cell { display: flex; align-items: center; gap: 6px; }
.stock-btn {
  display: flex; align-items: center; justify-content: center; width: 22px; height: 22px;
  border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.stock-btn:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.pm-stock-val { font-weight: 600; min-width: 28px; text-align: center; }
.pm-stock-val.low { color: var(--color-accent-hot); }

.status-dot {
  display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.status-dot.active { background: rgba(16,185,129,0.15); color: #10b981; }
.status-dot.inactive { background: rgba(107,114,128,0.15); color: #6b7280; }

.btn-sm {
  display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;
  border-radius: 6px; border: 1px solid var(--color-border); background: transparent;
  color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.btn-edit:hover { color: #3b82f6; border-color: #3b82f6; }
.btn-del:hover { color: #ef4444; border-color: #ef4444; }
.td-actions { display: flex; gap: 4px; }

/* ── Pagination ── */
.pm-pagination {
  display: flex; align-items: center; justify-content: center; gap: 4px; padding: 12px 0;
}
.pg-btn {
  display: flex; align-items: center; justify-content: center; min-width: 32px; height: 32px;
  padding: 0 8px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-card); color: var(--color-text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.pg-btn:hover:not(:disabled):not(.active) { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.pg-btn.active { background: var(--color-accent-primary); color: #fff; border-color: var(--color-accent-primary); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-ellipsis { border: none; background: transparent; }
.pg-info { margin-left: 12px; font-size: 12px; color: var(--color-text-muted); }

/* ── Full Page Form ── */
.product-form-page {
  animation: slideIn 0.25s ease;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.form-page-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 0; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);
}
.form-page-header h3 { margin: 0; font-size: 17px; font-weight: 700; flex: 1; text-align: center; }
.btn-back {
  display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.btn-back:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.form-page-body {
  display: flex; gap: 20px; align-items: flex-start;
}
.form-col--main { flex: 7; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.form-col--side { flex: 3; min-width: 240px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px; }

.form-card {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 20px;
}
.form-card h4 {
  font-size: 14px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 6px;
  color: var(--color-text-primary);
}

.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); outline: none; transition: border-color 0.2s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--color-accent-primary); }
.form-group--flex { flex: 1; }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }

/* ── Images Gallery ── */
.images-gallery { display: flex; flex-wrap: wrap; gap: 8px; }
.img-item {
  position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden;
  border: 1px solid var(--color-border);
}
.img-item img { width: 100%; height: 100%; object-fit: cover; }
.img-remove {
  position: absolute; top: 2px; right: 2px; width: 18px; height: 18px;
  border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff;
  font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.img-main-badge {
  position: absolute; bottom: 2px; left: 2px; font-size: 9px; font-weight: 700;
  background: var(--color-accent-primary); color: #fff; padding: 1px 6px; border-radius: 4px;
}
.img-add {
  display: flex; align-items: center; gap: 4px; width: 100%;
}
.img-add input { flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 12px; outline: none; }
.img-add button {
  padding: 6px 12px; border-radius: 6px; border: none; background: var(--color-accent-primary);
  color: #fff; font-weight: 700; font-size: 14px; cursor: pointer;
}
.img-add button:disabled { opacity: 0.4; cursor: not-allowed; }
.form-hint { font-size: 11px; color: var(--color-text-muted); margin: 4px 0 0; }

/* ── Variants Section ── */
.variants-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.btn-add-variant {
  padding: 4px 12px; border-radius: 6px; border: 1px dashed var(--color-accent-primary);
  background: transparent; color: var(--color-accent-primary); font-size: 12px; font-weight: 600; cursor: pointer;
}
.btn-add-variant:hover { background: rgba(124,58,237,0.08); }
.variant-list { display: flex; flex-direction: column; gap: 10px; }
.variant-card {
  padding: 12px; border-radius: 10px; background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
}
.variant-row { display: flex; gap: 8px; align-items: flex-end; }
.variant-row .form-group { margin-bottom: 6px; }
.variant-del { flex-shrink: 0; margin-bottom: 6px; }

/* Variant sale toggle */
.variant-sale-toggle {
  padding: 10px 14px; border-radius: 8px; margin-bottom: 12px;
  background: rgba(124, 58, 237, 0.06); border: 1px solid rgba(124, 58, 237, 0.15);
}
.toggle-label {
  display: flex; align-items: center; gap: 8px; font-size: 13px;
  font-weight: 600; color: var(--color-text-primary); cursor: pointer;
}
.toggle-label input[type="checkbox"] { accent-color: var(--color-accent-primary); width: 16px; height: 16px; cursor: pointer; }
.toggle-hint { display: block; font-size: 11px; color: var(--color-accent-primary); margin-top: 4px; font-weight: 500; }
.variant-promo-hint { color: var(--color-accent-primary); font-weight: 600; }

.btn-save {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 14px; }

@media (max-width: 768px) {
  .form-page-body { flex-direction: column; }
  .form-col--side { position: static; }
}
</style>
