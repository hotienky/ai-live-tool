<template>
  <div class="pm">
    <div class="pm-header">
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
    <div class="pm-table-wrap" v-if="products.length">
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
              <span class="status-dot" :class="p.status === 1 || p.status === undefined ? 'active' : 'inactive'"
                @click="toggleStatus(p)">
                {{ p.status === 1 || p.status === undefined ? 'Active' : 'Ẩn' }}
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
    <p v-else class="empty">Chưa có sản phẩm nào</p>

    <!-- Pagination -->
    <div class="pm-pagination" v-if="pagination.lastPage > 1">
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

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal modal--wide">
        <h3>{{ isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h3>

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

        <div class="form-row">
          <div class="form-group form-group--flex">
            <label>Danh mục</label>
            <select v-model="form.category">
              <option value="">-- Chọn danh mục --</option>
              <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group form-group--flex">
            <label>Thương hiệu</label>
            <select v-model="form.brand">
              <option value="">-- Chọn thương hiệu --</option>
              <option v-for="b in brands" :key="b.id" :value="b.name">{{ b.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Keywords (phân cách bằng dấu phẩy)</label>
          <input v-model="form.keywords" placeholder="keyword1, keyword2, ..." />
        </div>

        <div class="form-group">
          <label>Hình ảnh (URL)</label>
          <input v-model="form.image" placeholder="https://..." />
        </div>
        <div class="form-group" v-if="form.image">
          <div class="image-preview">
            <img :src="form.image" alt="Preview" @error="$event.target.style.display='none'" />
          </div>
        </div>

        <div class="form-group">
          <label>Mô tả</label>
          <textarea v-model="form.description" rows="4" placeholder="Mô tả sản phẩm..."></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Ngưỡng cảnh báo hết hàng</label>
            <input v-model.number="form.low_stock_threshold" type="number" placeholder="5" />
          </div>
          <div class="form-group">
            <label>Trạng thái</label>
            <select v-model="form.status">
              <option :value="1">Active</option>
              <option :value="0">Ẩn</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-save" @click="handleSave" :disabled="!form.name || !form.price">
            {{ isEditing ? 'Cập nhật' : 'Tạo sản phẩm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { ShoppingBag, Search, Package, Minus, Plus, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import CurrencyInput from './CurrencyInput.vue'

const { showToast } = useToast()
const props = defineProps({ /* tenant-scoped */ })

const products = ref([])
const categories = ref([])
const brands = ref([])
const loading = ref(false)
const searchQuery = ref('')
const pagination = ref({ page: 1, lastPage: 1, total: 0, perPage: 15 })

const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref(defaultForm())

function defaultForm() {
  return { name: '', sku: '', price: '', promotion_price: '', stock: 0, category: '', brand: '',
    keywords: '', image: '', description: '', low_stock_threshold: 5, status: 1 }
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
  showModal.value = true
}

function openEdit(p) {
  form.value = {
    name: p.name || '', sku: p.sku || '', price: p.price || 0,
    promotion_price: p.promotion_price || '', stock: p.stock || 0,
    category: p.category || '', brand: p.brand || '',
    keywords: Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.keywords || ''),
    image: p.image || '', description: p.description || '',
    low_stock_threshold: p.low_stock_threshold || p.lowStockThreshold || 5,
    status: p.status ?? 1,
  }
  isEditing.value = true
  editId.value = p.id
  showModal.value = true
}

async function handleSave() {
  if (!form.value.name || !form.value.price) return
  try {
    const body = { ...form.value }
    if (isEditing.value) {
      await apiFetch(`/products/${editId.value}`, { method: 'PUT', body: JSON.stringify(body) })
      showToast('Đã cập nhật sản phẩm', 'success')
    } else {
      await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) })
      showToast('Đã thêm sản phẩm', 'success')
    }
    showModal.value = false
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
    await apiFetch(`/products/${p.id}`, { method: 'PUT', body: JSON.stringify({ status: p.status === 1 ? 0 : 1 }) })
    p.status = p.status === 1 ? 0 : 1
    showToast(p.status === 1 ? 'Đã kích hoạt' : 'Đã ẩn', 'success')
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

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 16px; padding: 24px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,0.3);
}
.modal--wide { width: 640px; max-width: 95vw; }
.modal h3 { font-size: 17px; font-weight: 700; margin: 0 0 20px; }

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

.image-preview { text-align: center; }
.image-preview img { max-height: 120px; border-radius: 8px; border: 1px solid var(--color-border); }

.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); }
.btn-cancel {
  padding: 8px 16px; border-radius: 8px; border: 1px solid var(--color-border);
  background: transparent; color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-save {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 14px; }
</style>
