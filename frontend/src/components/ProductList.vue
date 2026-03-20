<template>
  <div class="pm">
    <div class="pm-header">
      <h3><ShoppingBag :size="16" /> {{ t('admin.msg_332c1caa', 'Quản lý sản phẩm') }} <span class="pm-count">({{ pagination.total }})</span></h3>
      <div class="pm-header__actions">
        <div class="pm-search">
          <Search :size="14" />
          <input v-model="searchQuery" type="text" :placeholder="t('admin.search_products', 'Tìm sản phẩm...')" @input="debouncedSearch" />
        </div>
        <button class="btn-add" @click="$emit('create')">{{ t('admin.msg_68d6598c', '+ Thêm sản phẩm') }}</button>
      </div>
    </div>

    <!-- Products Table -->
    <div class="pm-table-wrap" v-if="products.length">
      <table class="pm-table">
        <thead>
          <tr>
            <th class="th-img">{{ t('admin.msg_3c6f3361', 'Ảnh') }}</th>
            <th>{{ t('admin.product_name', 'Tên sản phẩm') }}</th>
            <th>SKU</th>
            <th>{{ t('admin.msg_072c1a4b', 'Giá') }}</th>
            <th>Kho</th>
            <th>{{ t('admin.msg_53d8de58', 'Danh mục') }}</th>
            <th class="th-status">{{ t('admin.status', 'Trạng thái') }}</th>
            <th class="th-actions">{{ t('admin.msg_71d52075', 'Thao tác') }}</th>
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
                {{ p.is_active !== false ? 'Active' : t('admin.msg_f7bc96f2', 'Ẩn') }}
              </span>
            </td>
            <td class="td-actions">
              <button class="act-btn act-edit" @click="$emit('edit', p)"><Edit3 :size="13" /> {{ t('admin.edit', 'Sửa') }}</button>
              <button class="act-btn act-cancel" @click="handleDelete(p)"><Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty">{{ t('admin.no_products', 'Chưa có sản phẩm nào') }}</p>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { ShoppingBag, Search, Package, Minus, Plus, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()

const emit = defineEmits(['create', 'edit'])

const products = ref([])
const loading = ref(false)
const searchQuery = ref('')
const pagination = ref({ page: 1, lastPage: 1, total: 0, perPage: 15 })

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
    const raw = await res.json()
    // Unwrap API envelope: { type, data: ... } → inner
    const data = raw?.data ?? raw
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

async function handleDelete(p) {
  if (!confirm(`Xóa "${p.name}"?`)) return
  try {
    await apiFetch(`/products/${p.id}`, { method: 'DELETE' })
    showToast(t('admin.msg_e2ef8d', 'Đã xóa sản phẩm'), 'success')
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
    showToast(newActive ? t('admin.msg_35776a2b', 'Đã kích hoạt') : t('admin.msg_b0f5126e', 'Đã ẩn'), 'success')
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
}

async function adjustStock(productId, action, quantity) {
  try {
    const signedQty = action === 'deduct' ? -quantity : quantity
    const res = await apiFetch(`/products/${productId}/adjust-stock`, {
      method: 'POST', body: JSON.stringify({ quantity: signedQty })
    })
    const updated = await res.json()
    const idx = products.value.findIndex(p => p.id === productId)
    if (idx !== -1 && updated) products.value[idx].stock = updated.stock
    showToast(action === 'add' ? `+${quantity} tồn kho` : `-${quantity} tồn kho`, 'success')
  } catch (e) {
    showToast(e.message || t('admin.msg_aaf377aa', 'Lỗi'), 'error')
  }
}

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

onMounted(() => {
  fetchProducts()
})

// Expose reload function so parent can call it if needed
defineExpose({ fetchProducts })
</script>

<style scoped>
.pm { display: flex; flex-direction: column; gap: 16px; }

.pm-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.pm-header h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin: 0; }
.pm-count { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.pm-header__actions { display: flex; align-items: center; gap: 10px; }
.pm-search { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; background: var(--color-bg-primary); border: 1px solid var(--color-border); transition: border-color 0.2s; }
.pm-search:focus-within { border-color: var(--color-accent-primary); }
.pm-search svg { color: var(--color-text-muted); }
.pm-search input { border: none; background: transparent; color: var(--color-text-primary); font-size: 13px; outline: none; width: 180px; }

.btn-add { padding: 7px 16px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.btn-add:hover { opacity: 0.85; }

/* Table */
.pm-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--color-border); }
.pm-table { width: 100%; border-collapse: collapse; }
.pm-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); background: var(--color-bg-card); border-bottom: 1px solid var(--color-border); }
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
.stock-btn { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; }
.stock-btn:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.pm-stock-val { font-weight: 600; min-width: 28px; text-align: center; }
.pm-stock-val.low { color: var(--color-accent-hot); }

.status-dot { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.status-dot.active { background: rgba(16,185,129,0.15); color: #10b981; }
.status-dot.inactive { background: rgba(107,114,128,0.15); color: #6b7280; }

.btn-sm { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; }
.btn-edit:hover, .act-edit:hover { color: #3b82f6; border-color: #3b82f6; }
.btn-del:hover, .act-cancel:hover { color: #ef4444; border-color: #ef4444; }
.td-actions { display: flex; gap: 4px; }
.act-btn { padding: 4px 8px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-primary); cursor: pointer; font-size: 11px; color: var(--color-text-muted); }

/* Pagination */
.pm-pagination { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 12px 0; }
.pg-btn { display: flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 8px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(:disabled):not(.active) { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.pg-btn.active { background: var(--color-accent-primary); color: #fff; border-color: var(--color-accent-primary); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-ellipsis { border: none; background: transparent; }
.pg-info { margin-left: 12px; font-size: 12px; color: var(--color-text-muted); }

.empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 14px; }
</style>
