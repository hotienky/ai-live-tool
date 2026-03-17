<template>
  <div class="inventory-management">
    <div class="inv-header">
      <h2><Package :size="20" style="vertical-align:middle" /> Quản Lý Kho</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" placeholder="Tìm tên, SKU, barcode..." @input="debouncedSearch" />
        <select v-model="filterCategory" class="filter-select">
          <option value="">Tất cả danh mục</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <select v-model="filterStock" class="filter-select">
          <option value="">Tất cả TT</option>
          <option value="in_stock">Còn hàng</option>
          <option value="low_stock">Sắp hết</option>
          <option value="out_of_stock">Hết hàng</option>
        </select>
        <button class="btn-secondary" @click="exportProducts"><Download :size="14" /> Xuất CSV</button>
        <button class="btn-secondary" @click="showImportModal = true"><Upload :size="14" /> Nhập CSV</button>
        <button class="btn-add" @click="openCreateModal"><Plus :size="14" /> Thêm SP</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="inv-stats">
      <div class="stat-card">
        <div class="stat-icon stat-icon--total"><Package :size="22" /></div>
        <div class="stat-value">{{ invStats.totalProducts }}</div>
        <div class="stat-label">Tổng sản phẩm</div>
      </div>
      <div class="stat-card revenue">
        <div class="stat-icon stat-icon--value"><DollarSign :size="22" /></div>
        <div class="stat-value">{{ formatCurrency(invStats.totalStockValue) }}</div>
        <div class="stat-label">Giá trị kho</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon stat-icon--low"><AlertTriangle :size="22" /></div>
        <div class="stat-value">{{ invStats.lowStockCount }}</div>
        <div class="stat-label">Sắp hết hàng</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon stat-icon--out"><XCircle :size="22" /></div>
        <div class="stat-value">{{ invStats.outOfStockCount }}</div>
        <div class="stat-label">Hết hàng</div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="inv-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên sản phẩm</th>
            <th>SKU</th>
            <th>Danh mục</th>
            <th>Giá bán</th>
            <th>Giá nhập</th>
            <th>Tồn kho</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
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
              <span class="stock-unit">{{ product.unit || 'cái' }}</span>
            </td>
            <td>
              <span class="stock-badge" :class="stockClass(product)">{{ stockLabel(product) }}</span>
            </td>
            <td>
              <div class="action-btns">
                <button @click="openEditModal(product)" title="Sửa"><Edit :size="14" /></button>
                <button @click="openAdjustModal(product)" title="Điều chỉnh kho"><BarChart3 :size="14" /></button>
                <button @click="openHistoryModal(product)" title="Lịch sử kho"><History :size="14" /></button>
                <button @click="deleteProduct(product)" title="Xóa" class="btn-danger"><Trash2 :size="14" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredProducts.length === 0">
            <td colspan="9" class="empty">
              <div class="empty-state">
                <Package :size="40" class="empty-state__icon" />
                <p class="empty-state__title">Chưa có sản phẩm</p>
                <p class="empty-state__sub">Thêm sản phẩm hoặc nhập từ CSV</p>
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
        <h3><Edit :size="16" style="vertical-align:middle" /> {{ editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm' }}</h3>
        <div class="form-grid">
          <div class="form-group span-2">
            <label>Tên sản phẩm *</label>
            <input v-model="productForm.name" placeholder="Áo thun nam" />
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
            <label>Giá bán (VNĐ)</label>
            <CurrencyInput v-model="productForm.price" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Giá nhập (VNĐ)</label>
            <CurrencyInput v-model="productForm.costPrice" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Tồn kho</label>
            <input type="number" v-model.number="productForm.stock" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Ngưỡng cảnh báo</label>
            <input type="number" v-model.number="productForm.lowStockThreshold" placeholder="5" />
          </div>
          <div class="form-group">
            <label>Danh mục</label>
            <input v-model="productForm.category" placeholder="Áo" />
          </div>
          <div class="form-group">
            <label>Đơn vị</label>
            <input v-model="productForm.unit" placeholder="cái" />
          </div>
          <div class="form-group span-2">
            <label>Hình ảnh (URL)</label>
            <input v-model="productForm.imageUrl" placeholder="https://..." />
          </div>
          <div class="form-group span-2">
            <label>Keywords</label>
            <input v-model="productForm.keywords" placeholder="mua, áo, thun" />
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
              <input v-model="v.name" placeholder="Tên (VD: Đỏ - XL)" style="padding:6px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--color-input-bg, transparent);color:inherit;font-size:13px" />
              <input v-model="v.sku" placeholder="SKU" style="padding:6px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--color-input-bg, transparent);color:inherit;font-size:13px" />
              <CurrencyInput v-model="v.price" placeholder="Giá" suffix="" />
              <input v-model.number="v.stock" type="number" placeholder="Kho" style="padding:6px 10px;border-radius:6px;border:1px solid var(--glass-border);background:var(--color-input-bg, transparent);color:inherit;font-size:13px" />
              <button @click="deleteVariant(v, i)" style="background:rgba(239,68,68,0.1);border:none;color:#ef4444;border-radius:6px;padding:6px;cursor:pointer" title="Xóa"><Trash2 :size="14" /></button>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button @click="addVariantRow" style="flex:1;padding:8px;border:1px dashed var(--glass-border);background:transparent;color:var(--color-text-muted);border-radius:8px;cursor:pointer;font-size:13px">+ Thêm biến thể</button>
              <button @click="saveVariants" style="padding:8px 16px;background:var(--accent-gradient);border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px">Lưu</button>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showProductModal = false">Hủy</button>
          <button class="btn-create" @click="saveProduct">{{ editingProduct ? 'Lưu' : 'Thêm' }}</button>
        </div>
      </div>
    </div>

    <!-- Stock Adjust Modal (Enhanced with +/- mode) -->
    <div class="modal-overlay" v-if="showAdjustModal" @click.self="showAdjustModal = false">
      <div class="modal">
        <h3><BarChart3 :size="16" style="vertical-align:middle" /> Điều chỉnh kho — {{ adjustProduct?.name }}</h3>
        <!-- Mode selector -->
        <div class="adjust-mode">
          <button :class="{ active: adjustMode === 'add' }" @click="adjustMode = 'add'; adjustQty = 0">
            <Plus :size="14" /> Nhập kho
          </button>
          <button :class="{ active: adjustMode === 'deduct' }" @click="adjustMode = 'deduct'; adjustQty = 0">
            <Minus :size="14" /> Xuất kho
          </button>
          <button :class="{ active: adjustMode === 'set' }" @click="adjustMode = 'set'; adjustQty = adjustProduct?.stock || 0">
            <Edit :size="14" /> Đặt giá trị
          </button>
        </div>
        <div class="adjust-preview">
          <div class="adjust-current">Hiện tại: <strong>{{ adjustProduct?.stock }}</strong></div>
          <div class="adjust-arrow">→</div>
          <div class="adjust-new" :class="{ positive: adjustFinalStock > adjustProduct?.stock, negative: adjustFinalStock < adjustProduct?.stock }">
            Sau: <strong>{{ adjustFinalStock }}</strong>
          </div>
        </div>
        <div class="form-group">
          <label>{{ adjustMode === 'set' ? 'Số lượng mới' : 'Số lượng' }}</label>
          <input type="number" v-model.number="adjustQty" min="0" />
        </div>
        <div class="form-group">
          <label>Lý do *</label>
          <input v-model="adjustReason" placeholder="Nhập hàng / Kiểm kê / Hàng lỗi..." />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showAdjustModal = false">Hủy</button>
          <button class="btn-create" @click="submitAdjust" :disabled="!adjustReason">Xác nhận</button>
        </div>
      </div>
    </div>

    <!-- Stock History Modal -->
    <div class="modal-overlay" v-if="showHistoryModal" @click.self="showHistoryModal = false">
      <div class="modal modal--wide">
        <h3><History :size="16" style="vertical-align:middle" /> Lịch sử kho — {{ historyProduct?.name }}</h3>
        <div class="history-timeline" v-if="stockHistoryData.length > 0">
          <div v-for="entry in stockHistoryData" :key="entry.id" class="history-item">
            <div class="history-dot" :class="entry.action"></div>
            <div class="history-content">
              <div class="history-action">
                <span class="history-badge" :class="entry.action">{{ actionLabels[entry.action] || entry.action }}</span>
                <span class="history-change" :class="{ positive: entry.quantityChange > 0, negative: entry.quantityChange < 0 }">
                  {{ entry.quantityChange > 0 ? '+' : '' }}{{ entry.quantityChange }}
                </span>
              </div>
              <div class="history-detail">{{ entry.stockBefore }} → {{ entry.stockAfter }}</div>
              <div class="history-reason" v-if="entry.reason">{{ entry.reason }}</div>
              <div class="history-time">{{ formatDate(entry.createdAt) }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state" style="padding:30px 0">
          <History :size="32" class="empty-state__icon" />
          <p class="empty-state__title">Chưa có lịch sử</p>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showHistoryModal = false">Đóng</button>
        </div>
      </div>
    </div>

    <!-- Import CSV Modal -->
    <div class="modal-overlay" v-if="showImportModal" @click.self="showImportModal = false">
      <div class="modal modal--wide">
        <h3><Upload :size="16" style="vertical-align:middle" /> Nhập sản phẩm từ CSV</h3>
        <div class="import-zone" @dragover.prevent @drop.prevent="handleDrop">
          <input type="file" accept=".csv" @change="handleFileSelect" ref="fileInput" style="display:none" />
          <div class="drop-area" @click="$refs.fileInput.click()">
            <Upload :size="32" />
            <p>Kéo thả file CSV hoặc nhấn để chọn</p>
            <small>Cần có cột: name, sku, price, stock</small>
          </div>
        </div>
        <div v-if="importPreview.length > 0" class="import-preview">
          <p style="font-weight:700; margin-bottom:8px">Xem trước ({{ importPreview.length }} sản phẩm):</p>
          <table class="preview-table">
            <thead>
              <tr>
                <th>Tên</th><th>SKU</th><th>Giá</th><th>Tồn kho</th>
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
          <button class="btn-cancel" @click="showImportModal = false; importPreview = []">Hủy</button>
          <button class="btn-create" @click="submitImport" :disabled="importPreview.length === 0">Nhập {{ importPreview.length }} sản phẩm</button>
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
const showAdjustModal = ref(false)
const showHistoryModal = ref(false)
const showImportModal = ref(false)
const editingProduct = ref(null)
const adjustProduct = ref(null)
const adjustMode = ref('add') // 'add' | 'deduct' | 'set'
const adjustQty = ref(0)

// Variants
const showVariants = ref(false)
const variants = ref([])
const adjustReason = ref('')
const historyProduct = ref(null)
const stockHistoryData = ref([])
const importPreview = ref([])
const fileInput = ref(null)

const defaultForm = () => ({
  name: '', sku: '', barcode: '', price: 0, costPrice: 0,
  stock: 0, lowStockThreshold: 5, category: '', unit: 'cái', keywords: '', imageUrl: '',
})
const productForm = ref(defaultForm())

const actionLabels = {
  add: 'Nhập kho',
  deduct: 'Xuất kho',
  adjust: 'Điều chỉnh',
  order_confirmed: 'Đơn xác nhận',
  order_cancelled: 'Đơn hủy',
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

const adjustFinalStock = computed(() => {
  const current = adjustProduct.value?.stock || 0
  if (adjustMode.value === 'add') return current + (adjustQty.value || 0)
  if (adjustMode.value === 'deduct') return Math.max(0, current - (adjustQty.value || 0))
  return adjustQty.value || 0
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
  if (p.stock <= 0) return 'Hết hàng'
  if (p.stock <= p.lowStockThreshold) return 'Sắp hết'
  return 'Còn hàng'
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
    category: product.category || '', unit: product.unit || 'cái',
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
    showToast('Đã lưu biến thể', 'success')
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
  if (!productForm.value.name) return showToast('Tên sản phẩm là bắt buộc', 'error')
  try {
    if (editingProduct.value) {
      await apiFetch(`/products/${editingProduct.value.id}`, {
        method: 'PUT',
        body: JSON.stringify(productForm.value),
      })
      showToast('Đã cập nhật sản phẩm', 'success')
    } else {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({ ...productForm.value }),
      })
      showToast('Đã thêm sản phẩm', 'success')
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
    showToast('Đã xóa sản phẩm', 'success')
    fetchProducts()
    fetchStats()
  } catch { showToast('Lỗi xóa sản phẩm', 'error') }
}

function openAdjustModal(product) {
  adjustProduct.value = product
  adjustMode.value = 'add'
  adjustQty.value = 0
  adjustReason.value = ''
  showAdjustModal.value = true
}

async function submitAdjust() {
  if (!adjustReason.value) return showToast('Vui lòng nhập lý do', 'error')
  try {
    await apiFetch(`/products/${adjustProduct.value.id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ newStock: adjustFinalStock.value, reason: adjustReason.value }),
    })
    showToast(`Đã điều chỉnh kho: ${adjustProduct.value.name}`, 'success')
    showAdjustModal.value = false
    fetchProducts()
    fetchStats()
  } catch (err) { showToast('Lỗi: ' + err.message, 'error') }
}

async function openHistoryModal(product) {
  historyProduct.value = product
  showHistoryModal.value = true
  try {
    const res = await apiFetch(`/products/${product.id}/stock-history`)
    const data = await res.json()
    stockHistoryData.value = data.data || data || []
  } catch { stockHistoryData.value = [] }
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
    showToast('Đã xuất CSV', 'success')
  } catch { showToast('Lỗi xuất CSV', 'error') }
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
    if (lines.length < 2) return showToast('File CSV trống', 'error')
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
    showToast(`Đã nhập ${result.created} sản phẩm (${result.errors} lỗi)`, result.errors > 0 ? 'warning' : 'success')
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

.action-btns { display: flex; gap: 4px; }
.action-btns button {
  background: none; border: none; cursor: pointer; padding: 5px;
  color: var(--color-text-muted); opacity: 0.6; transition: all 0.2s; border-radius: 6px;
}
.action-btns button:hover { opacity: 1; transform: scale(1.1); color: var(--color-text-primary); background: var(--color-accent-glow); }
.action-btns .btn-danger:hover { color: #f87171; background: rgba(248,113,113,0.06); }

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

/* Stock adjust mode selector */
.adjust-mode {
  display: flex; gap: 6px; margin-bottom: 16px;
}
.adjust-mode button {
  flex: 1; padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 700;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
  color: var(--color-text-muted); cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.adjust-mode button.active {
  background: var(--accent-gradient); color: #fff;
  border-color: transparent; box-shadow: var(--accent-shadow);
}

/* Adjust preview */
.adjust-preview {
  display: flex; align-items: center; gap: 16px; justify-content: center;
  margin-bottom: 20px; padding: 16px; border-radius: 12px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
}
.adjust-current, .adjust-new { font-size: 16px; }
.adjust-current strong { color: var(--color-text-primary); font-size: 22px; }
.adjust-arrow { font-size: 24px; color: var(--color-text-muted); }
.adjust-new strong { font-size: 22px; }
.adjust-new.positive strong { color: #34d399; }
.adjust-new.negative strong { color: #f87171; }

/* History Timeline */
.history-timeline { max-height: 400px; overflow-y: auto; }
.history-item {
  display: flex; gap: 14px; padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.history-dot {
  width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0;
}
.history-dot.add, .history-dot.order_cancelled { background: #34d399; }
.history-dot.deduct, .history-dot.order_confirmed { background: #f87171; }
.history-dot.adjust { background: #fbbf24; }
.history-content { flex: 1; min-width: 0; }
.history-action { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.history-badge {
  padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.history-badge.add, .history-badge.order_cancelled { background: rgba(52,211,153,0.1); color: #34d399; }
.history-badge.deduct, .history-badge.order_confirmed { background: rgba(248,113,113,0.1); color: #f87171; }
.history-badge.adjust { background: rgba(251,191,36,0.1); color: #fbbf24; }
.history-change { font-weight: 800; font-size: 14px; }
.history-change.positive { color: #34d399; }
.history-change.negative { color: #f87171; }
.history-detail { font-size: 12px; color: var(--color-text-muted); }
.history-reason { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
.history-time { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }

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
