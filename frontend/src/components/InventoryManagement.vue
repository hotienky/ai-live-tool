<template>
  <div class="inventory-management">
    <StockAdjustForm v-if="viewMode === 'adjust'" :product-id="selectedProductId" @back="viewMode = 'list'" @updated="onStockUpdated" />

    <div v-else class="inventory-list">
      <div class="inv-header">
        <h2><Package :size="20" style="vertical-align:middle" /> {{ t('admin.msg_d35d3aa5', 'Quản Lý Kho') }}</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" :placeholder="t('admin.msg_a1f893', 'Tìm tên, SKU, barcode...')" @input="debouncedSearch" />
        <select v-model="filterCategory" class="filter-select">
          <option value="">{{ t('admin.msg_006d83c6', 'Tất cả danh mục') }}</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <select v-model="filterStock" class="filter-select">
          <option value="">{{ t('admin.msg_6869b8d8', 'Tất cả TT') }}</option>
          <option value="in_stock">{{ t('admin.msg_127ae1b3', 'Còn hàng') }}</option>
          <option value="low_stock">{{ t('admin.msg_5b0d7341', 'Sắp hết') }}</option>
          <option value="out_of_stock">{{ t('admin.msg_c95536d3', 'Hết hàng') }}</option>
        </select>
        <button class="btn-secondary" @click="exportProducts"><Download :size="14" /> {{ t('admin.msg_47bfce15', 'Xuất CSV') }}</button>
        <button class="btn-secondary" @click="showImportModal = true"><Upload :size="14" /> {{ t('admin.msg_47e6c73d', 'Nhập CSV') }}</button>
        <button class="btn-add" @click="openCreateModal"><Plus :size="14" /> {{ t('admin.msg_dc69084f', 'Thêm SP') }}</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="inv-stats">
      <div class="stat-card">
        <div class="stat-icon stat-icon--total"><Package :size="22" /></div>
        <div class="stat-value">{{ invStats.totalProducts }}</div>
        <div class="stat-label">{{ t('admin.msg_2b7a813f', 'Tổng sản phẩm') }}</div>
      </div>
      <div class="stat-card revenue">
        <div class="stat-icon stat-icon--value"><DollarSign :size="22" /></div>
        <div class="stat-value">{{ formatCurrency(invStats.totalStockValue) }}</div>
        <div class="stat-label">{{ t('admin.msg_ba2a45b1', 'Giá trị kho') }}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon stat-icon--low"><AlertTriangle :size="22" /></div>
        <div class="stat-value">{{ invStats.lowStockCount }}</div>
        <div class="stat-label">{{ t('admin.msg_0e487209', 'Sắp hết hàng') }}</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon stat-icon--out"><XCircle :size="22" /></div>
        <div class="stat-value">{{ invStats.outOfStockCount }}</div>
        <div class="stat-label">{{ t('admin.msg_c95536d3', 'Hết hàng') }}</div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="inv-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{{ t('admin.product_name', 'Tên sản phẩm') }}</th>
            <th>SKU</th>
            <th>{{ t('admin.msg_53d8de58', 'Danh mục') }}</th>
            <th>{{ t('admin.selling_price', 'Giá bán') }}</th>
            <th>{{ t('admin.msg_0ffdf67d', 'Giá nhập') }}</th>
            <th>{{ t('admin.stock', 'Tồn kho') }}</th>
            <th>{{ t('admin.status', 'Trạng thái') }}</th>
            <th>{{ t('admin.actions', 'Hành động') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(product, idx) in filteredProducts" :key="product.id">
            <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
            <td class="product-name">
              <img v-if="product.imageUrl" :src="product.imageUrl" class="product-thumb" />
              <div class="product-thumb-placeholder" v-else><Package :size="14" /></div>
              <span>{{ product.name }}</span>
            </td>
            <td class="sku">{{ product.sku || '—' }}</td>
            <td><span class="category-badge" v-if="product.category">{{ product.category }}</span><span v-else>—</span></td>
            <td class="price">{{ formatCurrency(product.price) }}</td>
            <td class="cost">{{ product.costPrice ? formatCurrency(product.costPrice) : '—' }}</td>
            <td class="stock-cell">
              <span class="stock-num" :class="stockClass(product)">{{ product.stock }}</span>
              <span class="stock-unit">{{ product.unit || t('admin.msg_50c7e101', 'cái') }}</span>
            </td>
            <td>
              <span class="stock-badge" :class="stockClass(product)">{{ stockLabel(product) }}</span>
            </td>
            <td>
              <div class="action-btns">
                <button class="act-btn act-edit" @click="openEditModal(product)"><Edit :size="13" /> {{ t('admin.edit', 'Sửa') }}</button>
                <button class="act-btn act-confirm" @click="openAdjustModal(product)"><BarChart3 :size="13" /> {{ t('admin.msg_6a48ef4e', 'Điều chỉnh') }}</button>
                <button class="act-btn act-view" @click="openHistoryModal(product)"><History :size="13" /> {{ t('admin.msg_3061f544', 'Lịch sử') }}</button>
                <button class="act-btn act-cancel" @click="deleteProduct(product)"><Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}</button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredProducts.length === 0">
            <td colspan="9" class="empty">
              <div class="empty-state">
                <Package :size="40" class="empty-state__icon" />
                <p class="empty-state__title">{{ t('admin.msg_3ea51b61', 'Chưa có sản phẩm') }}</p>
                <p class="empty-state__sub">{{ t('admin.msg_6a1bb1ba', 'Thêm sản phẩm hoặc nhập từ CSV') }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage <= 1" class="page-btn">
        <ChevronLeft :size="14" />
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage >= totalPages" class="page-btn">
        <ChevronRight :size="14" />
      </button>
    </div>

    <!-- Create/Edit Product Modal -->
    <div class="modal-overlay" v-if="showProductModal" @click.self="showProductModal = false">
      <div class="modal modal--wide">
        <h3><Edit :size="16" style="vertical-align:middle" /> {{ editingProduct ? t('admin.msg_0e0e4b4a', 'Sửa sản phẩm') : t('admin.msg_98b9f1c4', 'Thêm sản phẩm') }}</h3>
        <div class="form-grid">
          <div class="form-group span-2">
            <label>{{ t('admin.msg_57ba303e', 'Tên sản phẩm *') }}</label>
            <input v-model="productForm.name" :placeholder="t('admin.msg_8c827efe', 'Áo thun nam')" />
          </div>
          <div class="form-group">
            <label>SKU</label>
            <input v-model="productForm.sku" placeholder="AT-001" />
          </div>
          <div class="form-group">
            <label>Barcode</label>
            <input v-model="productForm.barcode" placeholder="8901234567890" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_37d50113', 'Giá bán (VNĐ)') }}</label>
            <CurrencyInput v-model="productForm.price" placeholder="0" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_8f639df5', 'Giá nhập (VNĐ)') }}</label>
            <CurrencyInput v-model="productForm.costPrice" placeholder="0" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.stock', 'Tồn kho') }}</label>
            <input type="number" v-model.number="productForm.stock" placeholder="0" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_e3d62f65', 'Ngưỡng cảnh báo') }}</label>
            <input type="number" v-model.number="productForm.lowStockThreshold" placeholder="5" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_53d8de58', 'Danh mục') }}</label>
            <input v-model="productForm.category" :placeholder="t('admin.msg_2e384758', 'Áo')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.unit', 'Đơn vị') }}</label>
            <input v-model="productForm.unit" :placeholder="t('admin.msg_50c7e1', 'cái')" />
          </div>
          <div class="form-group span-2">
            <label>{{ t('admin.image', 'Hình ảnh') }}</label>
            <MediaPicker v-model="productForm.imageUrl" :placeholder="t('admin.msg_2204d8', 'Chọn hoặc nhập URL hình ảnh...')" accept="image/*" />
          </div>
          <div class="form-group span-2">
            <label>Keywords</label>
            <input v-model="productForm.keywords" :placeholder="t('admin.msg_c4c013', 'mua, áo, thun')" />
          </div>
        </div>

        <!-- Variants Section (only when editing) -->
        <div v-if="editingProduct" class="variants-section">
          <div class="variants-header" @click="showVariants = !showVariants" style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:10px 0;border-top:1px solid var(--glass-border);margin-top:12px">
            <Layers :size="16" />
            <strong>Biến thể ({{ variants.length }})</strong>
            <ChevronRight :size="14" :style="{ transform: showVariants ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }" />
          </div>
          <div v-if="showVariants" style="margin-bottom:12px">
            <div v-for="(v, i) in variants" :key="v.id || i" class="variant-row" style="display:grid;grid-template-columns:1fr 100px 100px 80px 40px;gap:8px;align-items:center;margin-bottom:6px">
              <input v-model="v.name" :placeholder="t('admin.msg_e8ea3a', 'Tên (VD: Đỏ - XL)')" style="padding:6px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--color-input-bg, transparent);color:inherit;font-size:13px" />
              <input v-model="v.sku" placeholder="SKU" style="padding:6px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--color-input-bg, transparent);color:inherit;font-size:13px" />
              <CurrencyInput v-model="v.price" :placeholder="t('admin.msg_072c1a', 'Giá')" suffix="" />
              <input v-model.number="v.stock" type="number" placeholder="Kho" style="padding:6px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--color-input-bg, transparent);color:inherit;font-size:13px" />
              <button @click="deleteVariant(v, i)" style="background:rgba(239,68,68,0.1);border:none;color:#ef4444;border-radius:6px;padding:6px;cursor:pointer" :title="t('admin.delete', 'Xóa')"><Trash2 :size="14" /></button>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button @click="addVariantRow" style="flex:1;padding:8px;border:1px dashed var(--glass-border);background:transparent;color:var(--color-text-muted);border-radius:8px;cursor:pointer;font-size:13px">{{ t('admin.msg_0f39aa4f', '+ Thêm biến thể') }}</button>
              <button @click="saveVariants" style="padding:8px 16px;background:var(--accent-gradient);border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px">{{ t('admin.msg_49fac1fe', 'Lưu') }}</button>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showProductModal = false">{{ t('admin.cancel', 'Hủy') }}</button>
          <button class="btn-create" @click="saveProduct">{{ editingProduct ? t('admin.msg_49fac1fe', 'Lưu') : t('admin.msg_d9cb420e', 'Thêm') }}</button>
        </div>
      </div>
    </div>

    <!-- Removed Stock Adjust & History Modals -->

    <!-- Import CSV Modal -->
    <div class="modal-overlay" v-if="showImportModal" @click.self="showImportModal = false">
      <div class="modal modal--wide">
        <h3><Upload :size="16" style="vertical-align:middle" /> {{ t('admin.msg_117b4675', 'Nhập sản phẩm từ CSV') }}</h3>
        <div class="import-zone" @dragover.prevent @drop.prevent="handleDrop">
          <input type="file" accept=".csv" @change="handleFileSelect" ref="fileInput" style="display:none" />
          <div class="drop-area" @click="$refs.fileInput.click()">
            <Upload :size="32" />
            <p>{{ t('admin.msg_d104d19d', 'Kéo thả file CSV hoặc nhấn để chọn') }}</p>
            <small>{{ t('admin.msg_724ea47b', 'Cần có cột: name, sku, price, stock') }}</small>
          </div>
        </div>
        <div v-if="importPreview.length > 0" class="import-preview">
          <p style="font-weight:700; margin-bottom:8px">Xem trước ({{ importPreview.length }} sản phẩm):</p>
          <table class="preview-table">
            <thead>
              <tr>
                <th>{{ t('admin.name', 'Tên') }}</th><th>SKU</th><th>{{ t('admin.msg_072c1a4b', 'Giá') }}</th><th>{{ t('admin.stock', 'Tồn kho') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in importPreview.slice(0, 10)" :key="i">
                <td>{{ row.name }}</td>
                <td>{{ row.sku || '—' }}</td>
                <td>{{ row.price || 0 }}</td>
                <td>{{ row.stock || 0 }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="importPreview.length > 10" style="color: var(--color-text-muted); font-size: 12px">...và {{ importPreview.length - 10 }} sản phẩm khác</p>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showImportModal = false; importPreview = []">{{ t('admin.cancel', 'Hủy') }}</button>
          <button class="btn-create" @click="submitImport" :disabled="importPreview.length === 0">Nhập {{ importPreview.length }} sản phẩm</button>
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
import { useUrlParam } from '../composables/useUrlFilter.js'
import {
  Package, Plus, Minus, Edit, Trash2, BarChart3, History,
  AlertTriangle, XCircle, DollarSign, Download, Upload,
  ChevronLeft, ChevronRight, Layers
} from 'lucide-vue-next'
import CurrencyInput from './CurrencyInput.vue'
import StockAdjustForm from './StockAdjustForm.vue'
import MediaPicker from './MediaPicker.vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()

const props = defineProps({ /* tenant-scoped */ })

const products = ref([])
const invStats = ref({ totalProducts: 0, totalStockValue: 0, totalCostValue: 0, lowStockCount: 0, outOfStockCount: 0, inStockCount: 0 })
const searchTerm = useUrlParam('inv_search', '')
const filterCategory = useUrlParam('inv_cat', '')
const filterStock = useUrlParam('inv_stock', '')
const currentPage = ref(1)
const pageSize = 25

// Modals
const showProductModal = ref(false)
const showImportModal = ref(false)
const editingProduct = ref(null)
const viewMode = ref('list')
const selectedProductId = ref(null)

// Variants
const showVariants = ref(false)
const variants = ref([])
const importPreview = ref([])
const fileInput = ref(null)

const defaultForm = () => ({
  name: '', sku: '', barcode: '', price: 0, costPrice: 0,
  stock: 0, lowStockThreshold: 5, category: '', unit: t('admin.msg_50c7e101', 'cái'), keywords: '', imageUrl: '',
})
const productForm = ref(defaultForm())

const actionLabels = {
  add: t('admin.msg_94e97353', 'Nhập kho'),
  deduct: t('admin.msg_25af27c7', 'Xuất kho'),
  adjust: t('admin.msg_6a48ef4e', 'Điều chỉnh'),
  order_confirmed: t('admin.msg_f5e439b9', 'Đơn xác nhận'),
  order_cancelled: t('admin.msg_e978b912', 'Đơn hủy'),
}

const categories = computed(() => {
  const cats = new Set(products.value.map(p => p.category).filter(Boolean))
  return [...cats].sort()
})

const filteredProducts = computed(() => {
  let list = products.value
  if (searchTerm.value) {
    const s = searchTerm.value.toLowerCase()
    list = list.filter(p =>
      (p.name || '').toLowerCase().includes(s) ||
      (p.sku || '').toLowerCase().includes(s) ||
      (p.barcode || '').toLowerCase().includes(s)
    )
  }
  if (filterCategory.value) {
    list = list.filter(p => p.category === filterCategory.value)
  }
  if (filterStock.value === 'in_stock') list = list.filter(p => p.stock > p.lowStockThreshold)
  if (filterStock.value === 'low_stock') list = list.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold)
  if (filterStock.value === 'out_of_stock') list = list.filter(p => p.stock <= 0)
  // Pagination
  const start = (currentPage.value - 1) * pageSize
  return list.slice(start, start + pageSize)
})

const totalPages = computed(() => {
  let list = products.value
  if (searchTerm.value) {
    const s = searchTerm.value.toLowerCase()
    list = list.filter(p => (p.name || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s) || (p.barcode || '').toLowerCase().includes(s))
  }
  if (filterCategory.value) list = list.filter(p => p.category === filterCategory.value)
  if (filterStock.value === 'in_stock') list = list.filter(p => p.stock > p.lowStockThreshold)
  if (filterStock.value === 'low_stock') list = list.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold)
  if (filterStock.value === 'out_of_stock') list = list.filter(p => p.stock <= 0)
  return Math.max(1, Math.ceil(list.length / pageSize))
})

let searchTimer = null
function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1 }, 300)
}

function stockClass(p) {
  if (p.stock <= 0) return 'out'
  if (p.stock <= p.lowStockThreshold) return 'low'
  return 'ok'
}
function stockLabel(p) {
  if (p.stock <= 0) return t('admin.msg_c95536d3', 'Hết hàng')
  if (p.stock <= p.lowStockThreshold) return t('admin.msg_5b0d7341', 'Sắp hết')
  return t('admin.msg_127ae1b3', 'Còn hàng')
}

onMounted(() => { fetchProducts(); fetchStats() })
watch([filterCategory, filterStock], () => { currentPage.value = 1 })

async function fetchProducts() {
  try {
    let url = `/products?`
    if (searchTerm.value) url += `search=${searchTerm.value}&`
    const res = await apiFetch(url)
    products.value = await res.json()
  } catch { products.value = [] }
}

async function fetchStats() {
  try {
    let url = `/inventory/stats`
    const res = await apiFetch(url)
    invStats.value = await res.json()
  } catch { /* silent */ }
}

function openCreateModal() {
  editingProduct.value = null
  productForm.value = defaultForm()
  showProductModal.value = true
}

function openEditModal(product) {
  editingProduct.value = product
  productForm.value = {
    name: product.name, sku: product.sku || '', barcode: product.barcode || '',
    price: product.price || 0, costPrice: product.costPrice || 0,
    stock: product.stock, lowStockThreshold: product.lowStockThreshold || 5,
    category: product.category || '', unit: product.unit || t('admin.msg_50c7e101', 'cái'),
    keywords: product.keywords || '', imageUrl: product.imageUrl || '',
  }
  showProductModal.value = true
  showVariants.value = false
  fetchVariants(product.id)
}

async function fetchVariants(productId) {
  try {
    const res = await apiFetch(`/products/${productId}/variants`)
    variants.value = await res.json()
  } catch { variants.value = [] }
}

function addVariantRow() {
  variants.value.push({ name: '', sku: '', price: null, stock: 0, _new: true })
}

async function saveVariants() {
  if (!editingProduct.value) return
  const pid = editingProduct.value.id
  try {
    for (const v of variants.value) {
      if (v._new) {
        if (!v.name) continue
        const res = await apiFetch(`/products/${pid}/variants`, {
          method: 'POST',
          body: JSON.stringify({ name: v.name, sku: v.sku, price: v.price, stock: v.stock }),
        })
        const saved = await res.json()
        v.id = saved.id
        delete v._new
      } else if (v.id) {
        await apiFetch(`/products/${pid}/variants/${v.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: v.name, sku: v.sku, price: v.price, stock: v.stock }),
        })
      }
    }
    showToast(t('admin.msg_9a6831', 'Đã lưu biến thể'), 'success')
  } catch (e) { showToast('Lỗi lưu biến thể: ' + e.message, 'error') }
}

async function deleteVariant(v, idx) {
  if (v.id && editingProduct.value) {
    try {
      await apiFetch(`/products/${editingProduct.value.id}/variants/${v.id}`, { method: 'DELETE' })
    } catch { /* silent */ }
  }
  variants.value.splice(idx, 1)
}

async function saveProduct() {
  if (!productForm.value.name) return showToast(t('admin.msg_73e410', 'Tên sản phẩm là bắt buộc'), 'error')
  try {
    if (editingProduct.value) {
      await apiFetch(`/products/${editingProduct.value.id}`, {
        method: 'PUT',
        body: JSON.stringify(productForm.value),
      })
      showToast(t('admin.msg_287b0f', 'Đã cập nhật sản phẩm'), 'success')
    } else {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({ ...productForm.value }),
      })
      showToast(t('admin.msg_7a810a', 'Đã thêm sản phẩm'), 'success')
    }
    showProductModal.value = false
    fetchProducts()
    fetchStats()
  } catch (err) { showToast('Lỗi: ' + err.message, 'error') }
}

async function deleteProduct(product) {
  if (!confirm(`Xóa "${product.name}"?`)) return
  try {
    await apiFetch(`/products/${product.id}`, { method: 'DELETE' })
    showToast(t('admin.msg_e2ef8d', 'Đã xóa sản phẩm'), 'success')
    fetchProducts()
    fetchStats()
  } catch { showToast(t('admin.msg_b2efb4', 'Lỗi xóa sản phẩm'), 'error') }
}

function openAdjustModal(product) {
  selectedProductId.value = product.id
  viewMode.value = 'adjust'
}

function openHistoryModal(product) {
  selectedProductId.value = product.id
  viewMode.value = 'adjust'
}

function onStockUpdated() {
  viewMode.value = 'list'
  fetchProducts()
  fetchStats()
}

async function exportProducts() {
  try {
    let url = `/products/export`
    const res = await apiFetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `products_${Date.now()}.csv`
    a.click()
    showToast(t('admin.msg_94a655', 'Đã xuất CSV'), 'success')
  } catch { showToast(t('admin.msg_b10c7d', 'Lỗi xuất CSV'), 'error') }
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) parseCsv(file)
}
function handleDrop(e) {
  const file = e.dataTransfer.files[0]
  if (file) parseCsv(file)
}
function parseCsv(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const lines = e.target.result.split('\n').filter(l => l.trim())
    if (lines.length < 2) return showToast(t('admin.msg_35f707', 'File CSV trống'), 'error')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj = {}
      headers.forEach((h, i) => {
        const key = h === 'cost_price' ? 'costPrice'
          : h === 'low_stock_threshold' ? 'lowStockThreshold'
          : h
        obj[key] = vals[i] || ''
      })
      return obj
    })
    importPreview.value = rows
  }
  reader.readAsText(file)
}

async function submitImport() {
  try {
    const res = await apiFetch('/products/import', {
      method: 'POST',
      body: JSON.stringify({ products: importPreview.value }),
    })
    const result = await res.json()
    showToast(t('admin.msg_imported', 'Đã nhập') + ` ${result.created} ` + t('admin.msg_products', 'sản phẩm') + ` (${result.errors} ` + t('admin.msg_errors', 'lỗi') + ')', result.errors > 0 ? 'warning' : 'success')
    showImportModal.value = false
    importPreview.value = []
    fetchProducts()
    fetchStats()
  } catch (err) { showToast('Lỗi nhập: ' + err.message, 'error') }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.inventory-management { padding: 24px; overflow-y: auto; height: 100%; }
.inv-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.inv-header h2 { margin: 0; font-size: 20px; font-weight: 800; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.search-input {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px;
  font-size: 13px; min-width: 200px; outline: none; transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--color-accent-primary); }
.search-input::placeholder { color: var(--color-text-muted); }
.filter-select {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px;
  font-size: 13px; outline: none; transition: border-color 0.2s;
}
.filter-select:focus { border-color: var(--color-accent-primary); }
.filter-select option { background: var(--color-bg-card-solid); color: var(--color-text-primary); }
.btn-add {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.25s; box-shadow: var(--accent-shadow);
}
.btn-add:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }
.btn-secondary {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); padding: 10px 14px; border-radius: 10px;
  font-weight: 600; cursor: pointer; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.btn-secondary:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }

/* Stats */
.inv-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px; margin-bottom: 24px;
}
.stat-card {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 14px; padding: 20px; text-align: center;
  position: relative; overflow: hidden; transition: all 0.3s;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px; opacity: 0.6;
}
.stat-card:hover {
  transform: translateY(-2px); border-color: var(--color-border-hover);
  box-shadow: var(--shadow-card);
}
.stat-value { font-size: 26px; font-weight: 800; color: var(--color-text-primary); }
.stat-label { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; font-weight: 600; letter-spacing: 0.3px; }
.stat-card.revenue .stat-value { color: #34d399; }
.stat-card.revenue::before { background: linear-gradient(90deg, transparent, #34d399, transparent); }
.stat-card.warning .stat-value { color: #fbbf24; }
.stat-card.warning::before { background: linear-gradient(90deg, transparent, #fbbf24, transparent); }
.stat-card.danger .stat-value { color: #f87171; }
.stat-card.danger::before { background: linear-gradient(90deg, transparent, #f87171, transparent); }

.stat-icon {
  width: 44px; height: 44px; border-radius: 12px; display: flex;
  align-items: center; justify-content: center; margin: 0 auto 10px;
}
.stat-icon--total { background: var(--color-accent-glow); color: var(--accent-light); }
.stat-icon--value { background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--low { background: rgba(251,191,36,0.12); color: #fbbf24; }
.stat-icon--out { background: rgba(248,113,113,0.12); color: #f87171; }

/* Table */
.inv-table { overflow-x: auto; }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead { background: var(--color-bg-elevated); }
th {
  padding: 12px 14px; text-align: left; color: var(--color-text-muted);
  font-weight: 700; font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border);
}
td { padding: 12px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
tr:hover { background: var(--color-accent-glow); }

.product-name { display: flex; align-items: center; gap: 10px; font-weight: 600; }
.product-thumb { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1px solid var(--glass-border); }
.product-thumb-placeholder {
  width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--glass-border);
  display: flex; align-items: center; justify-content: center;
  background: var(--glass-bg); color: var(--color-text-muted); flex-shrink: 0;
}
.sku { font-family: 'SF Mono', monospace; font-size: 12px; color: var(--color-text-muted); }
.price { font-weight: 700; color: #34d399; }
.cost { color: var(--color-text-muted); }
.category-badge {
  padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
  background: var(--color-accent-glow); color: var(--accent-light);
}
.stock-cell { font-weight: 800; }
.stock-unit { font-size: 11px; color: var(--color-text-muted); margin-left: 2px; }
.stock-num.ok { color: #34d399; }
.stock-num.low { color: #fbbf24; }
.stock-num.out { color: #f87171; }

.stock-badge {
  padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
}
.stock-badge.ok { background: rgba(52,211,153,0.1); color: #34d399; }
.stock-badge.low { background: rgba(251,191,36,0.1); color: #fbbf24; }
.stock-badge.out { background: rgba(248,113,113,0.1); color: #f87171; }

.action-btns { display: flex; gap: 4px; flex-wrap: wrap; }

.empty { text-align: center; color: var(--color-text-muted); padding: 40px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state__icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-state__title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.empty-state__sub { font-size: 13px; color: var(--color-text-muted); margin: 0; }

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 16px; margin-top: 8px;
}
.page-btn {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); border-radius: 8px; padding: 6px 10px;
  cursor: pointer; transition: all 0.2s; display: flex; align-items: center;
}
.page-btn:hover:not(:disabled) { border-color: var(--color-accent-primary); background: var(--color-accent-glow); }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--color-text-secondary); font-weight: 600; }

/* Modals */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.7); display: flex; align-items: center;
  justify-content: center; z-index: 1000; backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
  border-radius: 16px; padding: 28px; width: 440px; max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: slideUp 0.3s ease-out;
  max-height: 85vh; overflow-y: auto;
}
/* Removed local modal wide */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.modal h3 { margin: 0 0 20px 0; font-weight: 800; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 0; }
.form-group.span-2 { grid-column: span 2; }
.form-group label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; font-weight: 700; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%; background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px;
  font-family: inherit; box-sizing: border-box; outline: none; transition: border-color 0.2s;
}
.form-group input:focus, .form-group textarea:focus { border-color: var(--color-accent-primary); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel {
  background: var(--color-bg-card-solid); color: var(--color-text-secondary); border: 1px solid var(--color-border);
  padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
.btn-create {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.25s; box-shadow: var(--accent-shadow);
}
.btn-create:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }
.btn-create:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }



/* Import */
.import-zone { margin-bottom: 16px; }
.drop-area {
  border: 2px dashed var(--color-border); border-radius: 14px;
  padding: 40px; text-align: center; cursor: pointer;
  color: var(--color-text-muted); transition: all 0.2s;
}
.drop-area:hover { border-color: var(--color-accent-primary); color: var(--color-text-primary); }
.drop-area p { margin: 8px 0 0; font-weight: 600; }
.drop-area small { font-size: 11px; opacity: 0.7; }
.preview-table { width: 100%; font-size: 12px; }
.preview-table th { padding: 8px; text-align: left; background: var(--color-bg-elevated); }
.preview-table td { padding: 8px; }
</style>
